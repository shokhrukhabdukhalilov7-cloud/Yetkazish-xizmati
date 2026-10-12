/**
 * YETKAZ PRO — Courier Workspace Logic
 * Real-time order dispatching, status progression (Ship / Deliver),
 * Earnings tracking, and order assignment for couriers and drivers.
 */

let activeCourier = null;
let currentTab = 'active'; // 'active', 'available', 'history'

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Guard
    if (typeof Auth === 'undefined' || !Auth.isCourierLoggedIn()) {
        const session = typeof Auth !== 'undefined' ? Auth.getSession() : null;
        if (session && session.role === 'client') {
            alert("⚠️ RUXSAT BERILMAGAN!\nSiz hozir MIJOZ (" + (session.user?.name || '') + ") hisobidasiz.\nKuryer paneliga faqat yetkazib beruvchi kuryerlar kirishi mumkin.");
        } else if (session && session.role === 'admin') {
            alert("⚠️ DIQQAT!\nSiz hozir ADMIN (Dispetcher) hisobidasiz.\nKuryer ish paneliga kuryer logini va paroli bilan kiriladi.");
        } else {
            alert("⚠️ Diqqat! Kuryer paneliga faqat ro'yxatdagi yetkazib beruvchilar kirishi mumkin.\nIltimos, avval kuryer login va parolingiz bilan kiring.");
        }
        window.location.href = 'index.html';
        return;
    }

    activeCourier = Auth.getCurrentCourier();
    if (!activeCourier) {
        window.location.href = 'index.html';
        return;
    }

    initCourierWorkspace();
});

function initCourierWorkspace() {
    renderCourierProfile();
    renderCourierOrders();
    setupCourierListeners();
    setupStorageSync();
}

// ===================================================================
// 1. PROFILE & HERO SETUP
// ===================================================================

function renderCourierProfile() {
    if (!activeCourier) return;

    // Header elements
    const headerName = document.getElementById('headerCourierName');
    const headerVeh = document.getElementById('headerCourierVeh');
    if (headerName) headerName.textContent = activeCourier.name;
    if (headerVeh) headerVeh.textContent = `${activeCourier.vehicleName || 'Transport'}`;

    // Hero elements
    const heroName = document.getElementById('heroCourierName');
    const heroPhone = document.getElementById('heroCourierPhone');
    const heroVeh = document.getElementById('heroVehName');
    const heroPlate = document.getElementById('heroPlateNumber');
    const heroVehIcon = document.getElementById('heroVehIcon');

    if (heroName) heroName.textContent = activeCourier.name;
    if (heroPhone) heroPhone.textContent = activeCourier.phone;
    if (heroVeh) heroVeh.innerHTML = `<i class="fa-solid ${getVehicleIcon(activeCourier.vehicleType)}"></i> ${activeCourier.vehicleName || 'Transport'}`;
    if (heroPlate) heroPlate.textContent = activeCourier.plateNumber || 'Raqamsiz';

    if (heroVehIcon) {
        heroVehIcon.className = `fa-solid ${getVehicleIcon(activeCourier.vehicleType)}`;
    }

    // Work status buttons
    updateWorkStatusUI(activeCourier.status || 'available');
}

function updateWorkStatusUI(status) {
    const btnAvail = document.getElementById('btnStatusAvail');
    const btnBusy = document.getElementById('btnStatusBusy');

    if (status === 'on_delivery') {
        if (btnAvail) btnAvail.classList.remove('active');
        if (btnBusy) btnBusy.classList.add('active');
    } else {
        if (btnAvail) btnAvail.classList.add('active');
        if (btnBusy) btnBusy.classList.remove('active');
    }
}

window.setCourierWorkStatus = function(status) {
    if (!activeCourier) return;
    const statusText = status === 'on_delivery' ? "Band (Yetkazmoqda)" : "Bo'sh (Buyurtmaga tayyor)";
    
    CourierStore.updateStatus(activeCourier.id, status, statusText);
    activeCourier.status = status;
    updateWorkStatusUI(status);

    showCourierToast(status === 'on_delivery' ? "Holatingiz: Band (Yo'lda)" : "Holatingiz: Bo'sh (Yangi buyurtmalarga tayyor)");
};

function getVehicleIcon(vehicleType) {
    switch (vehicleType) {
        case 'bike': return 'fa-motorcycle';
        case 'car': return 'fa-car-side';
        case 'isuzu': return 'fa-truck-pickup';
        case 'fura': return 'fa-truck-moving';
        default: return 'fa-truck';
    }
}

// ===================================================================
// 2. ORDERS RENDERING & TABS
// ===================================================================

function renderCourierOrders() {
    const allOrders = OrderStore.getAll();
    const container = document.getElementById('courierOrdersList');
    if (!container || !activeCourier) return;

    // Filter orders for this courier
    // 1. Assigned to this courier (match by name or phone)
    const myOrders = allOrders.filter(o => {
        if (!o.courier) return false;
        const nameMatch = o.courier.name && o.courier.name.toLowerCase().includes(activeCourier.name.toLowerCase());
        const phoneMatch = o.courier.phone && activeCourier.phone && 
            o.courier.phone.replace(/\s+/g, '') === activeCourier.phone.replace(/\s+/g, '');
        return nameMatch || phoneMatch;
    });

    const activeAssigned = myOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    const deliveredHistory = myOrders.filter(o => o.status === 'delivered');

    // Available open orders (unassigned and not delivered)
    const openAvailableOrders = allOrders.filter(o => !o.courier && o.status !== 'delivered' && o.status !== 'cancelled');

    // Update KPI Metrics
    const metricActive = document.getElementById('metricActiveOrders');
    const metricDelivered = document.getElementById('metricDeliveredOrders');
    const metricEarnings = document.getElementById('metricEarnings');

    if (metricActive) metricActive.textContent = activeAssigned.length;
    if (metricDelivered) metricDelivered.textContent = deliveredHistory.length;

    const totalEarned = deliveredHistory.reduce((sum, o) => sum + (parseInt(o.priceSoM) || 0), 0);
    if (metricEarnings) metricEarnings.textContent = totalEarned.toLocaleString('uz-UZ') + " so'm";

    // Determine which list to display based on current tab
    let displayList = [];
    if (currentTab === 'active') {
        displayList = activeAssigned;
    } else if (currentTab === 'available') {
        displayList = openAvailableOrders;
    } else if (currentTab === 'history') {
        displayList = deliveredHistory;
    }

    if (displayList.length === 0) {
        let emptyMsg = "Hozircha biriktirilgan faol buyurtmalar yo'q.";
        if (currentTab === 'available') emptyMsg = "Yangi ochiq buyurtmalar mavjud emas. Yangi buyurtma kelsa, shu yerda ko'rinadi.";
        if (currentTab === 'history') emptyMsg = "Hozircha yakunlangan buyurtmalar tarixi yo'q.";

        container.innerHTML = `
            <div class="c-empty-box">
                <i class="fa-solid fa-box-open"></i>
                <h4 style="color: #fff; margin-bottom: 6px;">Buyurtmalar mavjud emas</h4>
                <p>${emptyMsg}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = displayList.map(order => {
        const isAssignedToMe = currentTab !== 'available';
        const isDelivered = order.status === 'delivered';
        const isInTransit = order.status === 'in_transit';

        // Action buttons based on status
        let actionsHtml = '';
        if (isAssignedToMe) {
            if (order.status === 'pending' || order.status === 'confirmed') {
                actionsHtml = `
                    <button class="btn-c-ship" onclick="courierShipOrder('${order.id}')">
                        <i class="fa-solid fa-truck-fast"></i> Yukni oldim va yo'lga chiqdim
                    </button>
                `;
            } else if (order.status === 'in_transit') {
                actionsHtml = `
                    <button class="btn-c-deliver" onclick="courierDeliverOrder('${order.id}')">
                        <i class="fa-solid fa-circle-check"></i> Mijozga topshirdim (Yetkazildi)
                    </button>
                `;
            } else if (isDelivered) {
                actionsHtml = `
                    <span class="c-delivered-pill">
                        <i class="fa-solid fa-check-double"></i> Muvaffaqiyatli yetkazildi
                    </span>
                `;
            }
        } else {
            // Available open order action
            actionsHtml = `
                <button class="btn-c-take" onclick="courierTakeOrder('${order.id}')">
                    <i class="fa-solid fa-plus-circle"></i> Ushbu buyurtmani qabul qilish
                </button>
            `;
        }

        // Status badge
        let statusBadgeClass = `status-badge-${order.status}`;
        let statusText = order.statusText || 'Yangi';

        return `
            <div class="c-order-card">
                <div class="c-order-top">
                    <div class="c-order-id-group">
                        <span class="c-track-badge">#${order.id}</span>
                        <span class="status-badge ${statusBadgeClass}">
                            <span class="status-dot dot-${order.status}"></span>
                            ${statusText}
                        </span>
                    </div>
                    <div class="c-order-price">
                        ${(order.priceSoM || 0).toLocaleString('uz-UZ')} so'm
                    </div>
                </div>

                <div class="c-order-grid">
                    <!-- Route -->
                    <div class="c-route-box">
                        <div class="c-route-point">
                            <span class="c-point-dot dot-origin">A</span>
                            <div>
                                <small style="color: var(--text-secondary); font-size: 0.75rem;">Olish manzili:</small>
                                <p><strong>${escapeHtml(order.pickupAddress)}</strong></p>
                            </div>
                        </div>
                        <div class="c-route-point">
                            <span class="c-point-dot dot-dest">B</span>
                            <div>
                                <small style="color: var(--text-secondary); font-size: 0.75rem;">Yetkazish manzili:</small>
                                <p><strong>${escapeHtml(order.deliveryAddress)}</strong></p>
                            </div>
                        </div>
                    </div>

                    <!-- Client info -->
                    <div class="c-client-box">
                        <span class="c-box-lbl"><i class="fa-solid fa-user"></i> Mijoz</span>
                        <div class="c-client-name">${escapeHtml(order.clientName)}</div>
                        <a href="tel:${order.clientPhone}" class="c-client-phone-link">
                            <i class="fa-solid fa-phone"></i> ${escapeHtml(order.clientPhone)}
                        </a>
                    </div>

                    <!-- Item info -->
                    <div class="c-item-box">
                        <span class="c-box-lbl"><i class="fa-solid fa-box"></i> Yuk haqida</span>
                        <div class="c-item-title">${escapeHtml(order.itemDescription)}</div>
                        <div class="c-item-sub">
                            <span>Vazn: <strong>${escapeHtml(order.weight)}</strong></span> • 
                            <span>Bo'lim: <strong>${escapeHtml(order.deptName)}</strong></span>
                        </div>
                    </div>
                </div>

                <div class="c-order-actions-bar">
                    <a href="tel:${order.clientPhone}" class="btn-call-client">
                        <i class="fa-solid fa-phone-volume"></i> Mijozga qo'ng'iroq
                    </a>

                    <div class="c-action-btns-group">
                        ${actionsHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===================================================================
// 3. COURIER ACTIONS: SHIP, DELIVER, TAKE
// ===================================================================

window.courierShipOrder = function(orderId) {
    if (!activeCourier) return;

    const updated = OrderStore.updateStatus(orderId, 'in_transit');
    if (updated) {
        setCourierWorkStatus('on_delivery');
        OrderStore.playNotificationSound();
        showCourierToast(`🚀 #${orderId} buyurtmasi yo'lga chiqarildi! Mijoz va dispetcherga xabar yuborildi.`);
        renderCourierOrders();
    }
};

window.courierDeliverOrder = function(orderId) {
    if (!activeCourier) return;

    const updated = OrderStore.updateStatus(orderId, 'delivered');
    if (updated) {
        setCourierWorkStatus('available');
        OrderStore.playNotificationSound();
        showCourierToast(`🎉 Tabriklaymiz! #${orderId} buyurtmasi muvaffaqiyatli yetkazildi!`);
        renderCourierOrders();
    }
};

window.courierTakeOrder = function(orderId) {
    if (!activeCourier) return;

    const courierData = {
        name: activeCourier.name,
        phone: activeCourier.phone,
        vehicle: `${activeCourier.vehicleName || 'Transport'} (${activeCourier.plateNumber || 'Raqamsiz'})`,
        rating: "4.98"
    };

    const updated = OrderStore.updateStatus(orderId, 'confirmed', courierData);
    if (updated) {
        OrderStore.playNotificationSound();
        showCourierToast(`✅ Buyurtma #${orderId} sizga biriktirildi!`);
        currentTab = 'active';
        updateTabButtons();
        renderCourierOrders();
    }
};

window.switchCourierTab = function(tabName) {
    currentTab = tabName;
    updateTabButtons();
    renderCourierOrders();
};

function updateTabButtons() {
    const tabBtns = document.querySelectorAll('.c-tab-btn');
    tabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === currentTab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ===================================================================
// 4. LISTENERS & REAL-TIME SYNC
// ===================================================================

function setupCourierListeners() {
    const logoutBtn = document.getElementById('courierLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm("Kuryer kabinetidan chiqmoqchimisiz?")) {
                Auth.logout();
                window.location.href = 'index.html';
            }
        });
    }
}

function setupStorageSync() {
    window.addEventListener('yetkaz_orders_updated', () => {
        renderCourierOrders();
    });

    window.addEventListener('storage', (e) => {
        if (e.key === 'yetkazpro_orders_v2') {
            showCourierToast("🔔 Buyurtmalarda yangilanish yuz berdi!");
            OrderStore.playNotificationSound();
            renderCourierOrders();
        }
    });
}

function showCourierToast(message) {
    const container = document.getElementById('courierToastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i class="fa-solid fa-bell" style="color: var(--accent-emerald);"></i>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = '0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
