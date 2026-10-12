/**
 * YETKAZ PRO — Dispatcher & Admin Panel Logic
 * Real-time order synchronization, filtering, approval,
 * Client management, Courier creation with plate number and credentials.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check Admin Authentication
    if (typeof Auth !== 'undefined' && !Auth.isAdminLoggedIn()) {
        const session = Auth.getSession();
        if (session && session.role === 'client') {
            alert("⚠️ RUXSAT BERILMAGAN!\nSiz hozir MIJOZ (" + (session.user?.name || '') + ") hisobidasiz.\nAdmin boshqaruv paneliga faqat dispetcher-admin kirishi mumkin.");
        } else if (session && session.role === 'courier') {
            alert("⚠️ RUXSAT BERILMAGAN!\nSiz hozir KURYER (" + (session.courier?.name || '') + ") hisobidasiz.\nAdmin boshqaruv paneliga faqat dispetcher-admin kirishi mumkin.");
        } else {
            alert("⚠️ Diqqat! Admin panelga faqat vakolatli dispetcher kirishi mumkin.\nIltimos, avval tizimga admin login-paroli bilan kiring.");
        }
        window.location.href = 'index.html';
        return;
    }

    initAdminDashboard();
});

let currentFilterStatus = 'all';
let currentFilterDept = 'all';
let currentSearchQuery = '';
let activeSelectedOrderId = null;
let soundEnabled = true;

function initAdminDashboard() {
    renderDashboard();
    renderClientsTable();
    renderCouriersTable();
    updateTabBadges();

    setupViewTabs();
    setupAddCourier();
    setupEventListeners();
    setupAdminSettings();
    setupStorageSync();
}

// ===================================================================
// 1. VIEW TABS SWITCHING & BADGES
// ===================================================================

function setupViewTabs() {
    const tabBtns = document.querySelectorAll('.admin-view-tab-btn');
    const viewPanes = {
        orders: document.getElementById('viewOrdersPane'),
        clients: document.getElementById('viewClientsPane'),
        couriers: document.getElementById('viewCouriersPane')
    };

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            Object.keys(viewPanes).forEach(k => {
                if (viewPanes[k]) {
                    if (k === view) {
                        viewPanes[k].classList.add('active');
                    } else {
                        viewPanes[k].classList.remove('active');
                    }
                }
            });

            if (view === 'orders') renderDashboard();
            else if (view === 'clients') renderClientsTable();
            else if (view === 'couriers') renderCouriersTable();
        });
    });
}

function updateTabBadges() {
    const orders = OrderStore.getAll();
    const clients = Auth.getClients();
    const couriers = CourierStore.getAll();

    const navOrdersBadge = document.getElementById('navOrdersBadge');
    const navClientsBadge = document.getElementById('navClientsBadge');
    const navCouriersBadge = document.getElementById('navCouriersBadge');

    if (navOrdersBadge) navOrdersBadge.textContent = orders.length;
    if (navClientsBadge) navClientsBadge.textContent = clients.length;
    if (navCouriersBadge) navCouriersBadge.textContent = couriers.length;
}

// ===================================================================
// 2. DASHBOARD RENDERING & FILTERING (ORDERS)
// ===================================================================

function renderDashboard() {
    const orders = OrderStore.getAll();

    // 1. Update Metrics
    updateKPIs(orders);
    updateTabBadges();

    // 2. Filter Orders
    let filtered = orders.filter(order => {
        // Status filter
        if (currentFilterStatus !== 'all' && order.status !== currentFilterStatus) {
            return false;
        }

        // Dept filter
        if (currentFilterDept !== 'all' && order.dept !== currentFilterDept) {
            return false;
        }

        // Search query
        if (currentSearchQuery.trim() !== '') {
            const q = currentSearchQuery.toLowerCase().trim();
            const idMatch = (order.id || '').toLowerCase().includes(q);
            const nameMatch = (order.clientName || '').toLowerCase().includes(q);
            const phoneMatch = (order.clientPhone || '').toLowerCase().includes(q);
            const itemMatch = (order.itemDescription || '').toLowerCase().includes(q);
            if (!idMatch && !nameMatch && !phoneMatch && !itemMatch) {
                return false;
            }
        }

        return true;
    });

    // 3. Render Table
    renderOrdersTable(filtered);
}

function updateKPIs(orders) {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const inTransit = orders.filter(o => o.status === 'in_transit').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const confirmed = orders.filter(o => o.status === 'confirmed').length;

    const totalRevenue = orders.reduce((sum, o) => sum + (parseInt(o.priceSoM) || 0), 0);

    // Update Elements
    const elTotal = document.getElementById('metricTotalOrders');
    const elPending = document.getElementById('metricPendingOrders');
    const elInTransit = document.getElementById('metricInTransitOrders');
    const elDelivered = document.getElementById('metricDeliveredOrders');
    const elRevenue = document.getElementById('metricTotalRevenue');

    if (elTotal) elTotal.textContent = total;
    if (elPending) elPending.textContent = pending;
    if (elInTransit) elInTransit.textContent = inTransit;
    if (elDelivered) elDelivered.textContent = delivered;
    if (elRevenue) elRevenue.textContent = totalRevenue.toLocaleString('uz-UZ') + " so'm";

    // Tab counts
    const cAll = document.getElementById('countAll');
    const cPend = document.getElementById('countPending');
    const cConf = document.getElementById('countConfirmed');
    const cTran = document.getElementById('countInTransit');
    const cDeliv = document.getElementById('countDelivered');

    if (cAll) cAll.textContent = total;
    if (cPend) cPend.textContent = pending;
    if (cConf) cConf.textContent = confirmed;
    if (cTran) cTran.textContent = inTransit;
    if (cDeliv) cDeliv.textContent = delivered;

    // Pending Alert Badge
    const alertBadge = document.getElementById('pendingAlertBadge');
    if (alertBadge) {
        if (pending > 0) {
            alertBadge.style.display = 'block';
            alertBadge.textContent = `${pending} ta yangi!`;
        } else {
            alertBadge.style.display = 'none';
        }
    }
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTableBody');
    const emptyState = document.getElementById('tableEmptyState');

    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = orders.map(order => {
        const deptPillClass = `dept-pill-${order.dept}`;
        const statusBadgeClass = `status-badge-${order.status}`;
        
        // Status display text
        let statusLabel = order.statusText || 'Yangi';
        if (order.status === 'pending') statusLabel = "Kutilmoqda";
        else if (order.status === 'confirmed') statusLabel = "Tasdiqlangan";
        else if (order.status === 'in_transit') statusLabel = "Yo'lda";
        else if (order.status === 'delivered') statusLabel = "Yetkazildi";
        else if (order.status === 'cancelled') statusLabel = "Bekor";

        // Quick action buttons
        let quickActionHtml = '';
        if (order.status === 'pending') {
            quickActionHtml = `
                <button class="btn-action btn-confirm" onclick="quickConfirmOrder('${order.id}', event)">
                    <i class="fa-solid fa-check"></i> <span>Tasdiqlash</span>
                </button>
            `;
        } else if (order.status === 'confirmed') {
            quickActionHtml = `
                <button class="btn-action btn-confirm" onclick="quickShipOrder('${order.id}', event)">
                    <i class="fa-solid fa-truck-fast"></i> <span>Yo'lga chiqarish</span>
                </button>
            `;
        } else if (order.status === 'in_transit') {
            quickActionHtml = `
                <button class="btn-action btn-confirm" style="background: linear-gradient(135deg, #10b981, #059669);" onclick="quickDeliverOrder('${order.id}', event)">
                    <i class="fa-solid fa-box-check"></i> <span>Yetkazildi</span>
                </button>
            `;
        } else if (order.status === 'delivered') {
            quickActionHtml = `
                <span class="action-done-badge">
                    <i class="fa-solid fa-check-double"></i> <span>Yetkazilgan</span>
                </span>
            `;
        } else if (order.status === 'cancelled') {
            quickActionHtml = `
                <span class="action-cancelled-badge">
                    <i class="fa-solid fa-ban"></i> <span>Bekor</span>
                </span>
            `;
        }

        return `
            <tr>
                <td>
                    <span class="track-id-badge" onclick="openOrderDetails('${order.id}')">
                        #${order.id}
                    </span>
                </td>
                <td>
                    <div class="client-cell">
                        <span class="client-name">${escapeHtml(order.clientName)}</span>
                        <span class="client-phone">${escapeHtml(order.clientPhone)}</span>
                    </div>
                </td>
                <td>
                    <span class="dept-pill ${deptPillClass}">${escapeHtml(order.deptName)}</span>
                    <div class="item-desc-text" title="${escapeHtml(order.itemDescription)}">${escapeHtml(order.itemDescription)}</div>
                </td>
                <td>
                    <strong>${escapeHtml(order.weight)}</strong><br>
                    <small style="color: var(--text-secondary);">${escapeHtml(order.vehicleName)}</small>
                </td>
                <td>
                    <div style="font-size: 0.8rem; max-width: 180px; line-height: 1.3;">
                        <span style="color: var(--accent-cyan);"><i class="fa-solid fa-circle-dot"></i></span> ${(order.pickupAddress || '').slice(0, 25)}...<br>
                        <span style="color: var(--accent-rose);"><i class="fa-solid fa-location-dot"></i></span> ${(order.deliveryAddress || '').slice(0, 25)}...
                    </div>
                </td>
                <td>
                    <span class="price-text">${(order.priceSoM || 0).toLocaleString('uz-UZ')} so'm</span>
                </td>
                <td>
                    <span class="status-badge ${statusBadgeClass}">
                        <span class="status-dot dot-${order.status}"></span>
                        ${statusLabel}
                    </span>
                </td>
                <td>
                    <div class="action-btns-group">
                        ${quickActionHtml}
                        <button class="btn-action btn-view" onclick="openOrderDetails('${order.id}')" title="Boshqarish">
                            <i class="fa-solid fa-pen-to-square"></i> <span>Batafsil</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ===================================================================
// 3. MIJOZLAR (CLIENTS / FOYDALANUVCHILAR) MANAGEMENT
// ===================================================================

function renderClientsTable(clientsList = null) {
    const clients = clientsList || Auth.getClients();
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;

    const orders = OrderStore.getAll();

    if (clients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fa-solid fa-users-slash" style="font-size: 2rem; margin-bottom: 12px; display: block; color: var(--border-glass);"></i>
                    Hech qanday mijoz topilmadi.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = clients.map(client => {
        // Calculate total orders placed by this client
        const clientOrders = orders.filter(o => 
            (o.clientPhone && client.phone && o.clientPhone.replace(/\s+/g, '') === client.phone.replace(/\s+/g, '')) ||
            (o.clientName && client.name && o.clientName.trim().toLowerCase() === client.name.trim().toLowerCase())
        );
        const orderCount = clientOrders.length;

        // Formatted created date
        let dateStr = "Yaqinda";
        if (client.createdAt) {
            try {
                const d = new Date(client.createdAt);
                dateStr = d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' }) + 
                          ' ' + d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                dateStr = client.createdAt;
            }
        }

        return `
            <tr>
                <td>
                    <span class="track-id-badge">#${client.id || 'CLI-000'}</span>
                </td>
                <td>
                    <div class="client-cell">
                        <span class="client-name" style="font-size: 0.95rem; font-weight: 700;">${escapeHtml(client.name)}</span>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">Ro'yxatdan o'tgan buyurtmachi</span>
                    </div>
                </td>
                <td>
                    <a href="tel:${client.phone}" style="color: var(--accent-cyan); font-weight: 600; font-family: monospace; text-decoration: none;">
                        <i class="fa-solid fa-phone" style="font-size: 0.8rem; margin-right: 4px;"></i>${escapeHtml(client.phone)}
                    </a>
                </td>
                <td>
                    <span style="color: var(--text-secondary); font-size: 0.85rem;">
                        <i class="fa-regular fa-calendar-check" style="margin-right: 4px;"></i>${dateStr}
                    </span>
                </td>
                <td>
                    <span class="status-badge status-badge-confirmed" style="background: rgba(2, 132, 199, 0.15); border-color: rgba(56, 189, 248, 0.3); color: var(--accent-cyan); font-weight: 700;">
                        <i class="fa-solid fa-box-open" style="margin-right: 4px;"></i>${orderCount} ta buyurtma
                    </span>
                </td>
                <td>
                    <span class="status-badge status-badge-delivered">
                        <span class="status-dot dot-delivered"></span>
                        Faol Mijoz
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// ===================================================================
// 4. YUK YETKAZIB BERUVCHILAR (COURIERS & DRIVERS) MANAGEMENT
// ===================================================================

function getVehicleIcon(vehicleType) {
    switch (vehicleType) {
        case 'bike': return 'fa-person-biking';
        case 'car': return 'fa-truck-pickup';
        case 'isuzu': return 'fa-truck-moving';
        case 'fura': return 'fa-trailer';
        default: return 'fa-truck';
    }
}

function renderCouriersTable(couriersList = null) {
    const couriers = couriersList || CourierStore.getAll();
    const tbody = document.getElementById('couriersTableBody');
    if (!tbody) return;

    if (couriers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fa-solid fa-motorcycle" style="font-size: 2rem; margin-bottom: 12px; display: block; color: var(--border-glass);"></i>
                    Hech qanday yetkazib beruvchi (kuryer) topilmadi.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = couriers.map(courier => {
        const iconClass = getVehicleIcon(courier.vehicleType);
        const isBusy = courier.status === 'on_delivery';

        return `
            <tr>
                <td>
                    <span class="track-id-badge">#${courier.id || 'KUR-000'}</span>
                </td>
                <td>
                    <div class="client-cell">
                        <span class="client-name" style="font-size: 0.95rem; font-weight: 700;">${escapeHtml(courier.name)}</span>
                        <span style="font-size: 0.75rem; color: var(--accent-cyan);">Haydovchi-Kuryer</span>
                    </div>
                </td>
                <td>
                    <a href="tel:${courier.phone}" style="color: var(--text-white); font-weight: 600; font-family: monospace; text-decoration: none;">
                        <i class="fa-solid fa-phone" style="font-size: 0.8rem; margin-right: 4px; color: var(--accent-emerald);"></i>${escapeHtml(courier.phone)}
                    </a>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(56, 189, 248, 0.12); display: flex; align-items: center; justify-content: center; color: var(--accent-cyan);">
                            <i class="fa-solid ${iconClass}"></i>
                        </div>
                        <div>
                            <strong style="color: var(--text-white); font-size: 0.88rem;">${escapeHtml(courier.vehicleName || 'Transport')}</strong>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="courier-plate-badge">${escapeHtml(courier.plateNumber || 'Raqamsiz')}</span>
                </td>
                <td>
                    <div class="courier-creds-box">
                        <div class="creds-line">
                            <i class="fa-solid fa-user-lock" style="font-size: 0.75rem;"></i>
                            <span>Login: <strong>${escapeHtml(courier.username)}</strong></span>
                        </div>
                        <div class="creds-line">
                            <i class="fa-solid fa-key" style="font-size: 0.75rem;"></i>
                            <span>Parol: <strong>${escapeHtml(courier.password)}</strong></span>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${isBusy ? 'status-badge-in_transit' : 'status-badge-delivered'}">
                        <span class="status-dot ${isBusy ? 'dot-in_transit' : 'dot-delivered'}"></span>
                        ${courier.statusText || (isBusy ? "Yo'lda" : "Bo'sh (Tayyor)")}
                    </span>
                </td>
                <td style="text-align: right;">
                    <button class="btn-action" style="color: var(--accent-rose); border: 1px solid rgba(244,63,94,0.3); background: rgba(244,63,94,0.1); width: 34px; height: 34px; border-radius: 6px;" onclick="deleteCourierRow('${courier.id}', event)" title="Kuryerni o'chirish">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function setupAddCourier() {
    const openBtn = document.getElementById('openAddCourierModalBtn');
    const closeBtn = document.getElementById('closeAddCourierModalBtn');
    const modal = document.getElementById('addCourierModal');
    const form = document.getElementById('addCourierForm');
    const helperMsg = document.getElementById('courierHelperMsg');

    if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
            if (helperMsg) helperMsg.style.display = 'none';
            modal.classList.add('open');
        });
    }

    const cancelBtn = document.getElementById('cancelAddCourierBtn');
    if (cancelBtn && modal) {
        cancelBtn.addEventListener('click', () => modal.classList.remove('open'));
    }

    const courierPhoneInput = document.getElementById('courierPhone');
    if (window.setupPhoneMask && courierPhoneInput) {
        window.setupPhoneMask(courierPhoneInput, false);
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('open');
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.getElementById('courierFullName').value.trim();
            const phone = document.getElementById('courierPhone').value.trim();
            const vehType = document.getElementById('courierVehType').value;
            const vehName = document.getElementById('courierVehName').value.trim();
            const plateNumber = document.getElementById('courierPlateNumber').value.trim();
            const login = document.getElementById('courierLogin').value.trim();
            const pass = document.getElementById('courierPassword').value.trim();

            const res = CourierStore.add({
                name: fullName,
                phone: phone,
                vehicleType: vehType,
                vehicleName: vehName,
                plateNumber: plateNumber,
                username: login,
                password: pass
            });

            if (!res.success) {
                if (helperMsg) {
                    helperMsg.className = 'auth-helper-msg error';
                    helperMsg.textContent = res.message;
                    helperMsg.style.display = 'block';
                }
                return;
            }

            form.reset();
            if (helperMsg) helperMsg.style.display = 'none';
            if (modal) modal.classList.remove('open');

            showAdminToast(`Kuryer "${fullName}" muvaffaqiyatli qo'shildi! Login va parol berildi.`);
            renderCouriersTable();
            updateTabBadges();
        });
    }
}

window.deleteCourierRow = function(courierId, event) {
    if (event) event.stopPropagation();
    const couriers = CourierStore.getAll();
    const target = couriers.find(k => k.id === courierId);
    const name = target ? target.name : courierId;

    if (confirm(`Haqiqatan ham kuryer "${name}"ni tizimdan o'chirmoqchimisiz?`)) {
        CourierStore.delete(courierId);
        showAdminToast(`Kuryer "${name}" tizimdan o'chirildi.`);
        renderCouriersTable();
        updateTabBadges();
    }
};

// ===================================================================
// 5. QUICK ACTIONS & ORDER APPROVAL
// ===================================================================

window.quickConfirmOrder = function(orderId, event) {
    if (event) event.stopPropagation();
    const updated = OrderStore.updateStatus(orderId, 'confirmed');
    if (updated) {
        showAdminToast(`Buyurtma #${orderId} muvaffaqiyatli TASDIQLANDI va kuryerga biriktirildi!`);
        renderDashboard();
    }
};

window.quickShipOrder = function(orderId, event) {
    if (event) event.stopPropagation();
    const updated = OrderStore.updateStatus(orderId, 'in_transit');
    if (updated) {
        showAdminToast(`Buyurtma #${orderId} yo'lga chiqarildi (Yetkazilmoqda).`);
        renderDashboard();
    }
};

window.quickDeliverOrder = function(orderId, event) {
    if (event) event.stopPropagation();
    const updated = OrderStore.updateStatus(orderId, 'delivered');
    if (updated) {
        showAdminToast(`Buyurtma #${orderId} muvaffaqiyatli yakunlandi (Yetkazildi)!`);
        renderDashboard();
    }
};

// ===================================================================
// 6. ORDER DETAIL MODAL & MANAGEMENT
// ===================================================================

function populateCourierSelect(selectedCourierName = '') {
    const select = document.getElementById('modalRegisteredCourierSelect');
    if (!select) return;

    const couriers = CourierStore.getAll();
    let optionsHtml = `<option value="">-- Ro'yxatdagi Kuryerni Tanlash (${couriers.length} ta mavjud) --</option>`;

    couriers.forEach(k => {
        const isSel = (selectedCourierName && k.name.toLowerCase() === selectedCourierName.toLowerCase()) ? 'selected' : '';
        optionsHtml += `<option value="${k.id}" ${isSel}>${escapeHtml(k.name)} • ${escapeHtml(k.vehicleName)} [${escapeHtml(k.plateNumber)}]</option>`;
    });

    select.innerHTML = optionsHtml;
}

window.openOrderDetails = function(orderId) {
    const order = OrderStore.getById(orderId);
    if (!order) return;

    activeSelectedOrderId = orderId;

    document.getElementById('modalDetailTrackId').textContent = `#${order.id}`;
    document.getElementById('modalClientName').textContent = order.clientName;
    document.getElementById('modalClientPhone').textContent = order.clientPhone;
    document.getElementById('modalDeptName').textContent = order.deptName;
    document.getElementById('modalItemDesc').textContent = order.itemDescription;
    document.getElementById('modalWeight').textContent = order.weight;
    document.getElementById('modalDistance').textContent = `${order.distanceKm} km`;
    document.getElementById('modalPickup').textContent = order.pickupAddress;
    document.getElementById('modalDelivery').textContent = order.deliveryAddress;
    document.getElementById('modalPrice').textContent = `${(order.priceSoM || 0).toLocaleString('uz-UZ')} so'm`;

    // Status select
    const statusSelect = document.getElementById('modalStatusSelect');
    if (statusSelect) statusSelect.value = order.status;

    // Status pill
    const pill = document.getElementById('modalDetailStatusPill');
    if (pill) {
        pill.className = `status-badge status-badge-${order.status}`;
        pill.innerHTML = `<span class="status-dot dot-${order.status}"></span> ${order.statusText}`;
    }

    // Courier inputs & dropdown
    const courier = order.courier || OrderStore.getDefaultCourierForVehicle(order.vehicleType);
    const courierName = courier ? courier.name : '';
    document.getElementById('modalCourierName').value = courierName;
    document.getElementById('modalCourierPhone').value = courier ? courier.phone : '';
    document.getElementById('modalCourierVeh').value = courier ? courier.vehicle : '';

    populateCourierSelect(courierName);

    const modal = document.getElementById('adminDetailModal');
    if (modal) modal.classList.add('open');
};

// ===================================================================
// 7. EVENT LISTENERS & SEARCH FILTERS
// ===================================================================

function setupEventListeners() {
    // Orders Search input
    const searchInput = document.getElementById('adminSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value;
            if (clearBtn) clearBtn.style.display = currentSearchQuery ? 'block' : 'none';
            renderDashboard();
        });
    }

    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            currentSearchQuery = '';
            clearBtn.style.display = 'none';
            renderDashboard();
        });
    }

    // Clients Search input
    const clientSearchInput = document.getElementById('clientSearchInput');
    if (clientSearchInput) {
        clientSearchInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const allClients = Auth.getClients();
            if (!q) {
                renderClientsTable(allClients);
                return;
            }
            const filtered = allClients.filter(c => 
                (c.name && c.name.toLowerCase().includes(q)) ||
                (c.phone && c.phone.toLowerCase().includes(q)) ||
                (c.id && c.id.toLowerCase().includes(q))
            );
            renderClientsTable(filtered);
        });
    }

    // Couriers Search input
    const courierSearchInput = document.getElementById('courierSearchInput');
    if (courierSearchInput) {
        courierSearchInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const allCouriers = CourierStore.getAll();
            if (!q) {
                renderCouriersTable(allCouriers);
                return;
            }
            const filtered = allCouriers.filter(k => 
                (k.name && k.name.toLowerCase().includes(q)) ||
                (k.phone && k.phone.toLowerCase().includes(q)) ||
                (k.vehicleName && k.vehicleName.toLowerCase().includes(q)) ||
                (k.plateNumber && k.plateNumber.toLowerCase().includes(q)) ||
                (k.username && k.username.toLowerCase().includes(q)) ||
                (k.id && k.id.toLowerCase().includes(q))
            );
            renderCouriersTable(filtered);
        });
    }

    // Courier selection dropdown in dispatch modal
    const courierSelect = document.getElementById('modalRegisteredCourierSelect');
    if (courierSelect) {
        courierSelect.addEventListener('change', (e) => {
            const courierId = e.target.value;
            if (!courierId) return;
            const couriers = CourierStore.getAll();
            const found = couriers.find(k => k.id === courierId);
            if (found) {
                document.getElementById('modalCourierName').value = found.name;
                document.getElementById('modalCourierPhone').value = found.phone;
                document.getElementById('modalCourierVeh').value = `${found.vehicleName} (${found.plateNumber})`;
                showAdminToast(`Kuryer ${found.name} ma'lumotlari kiritildi.`);
            }
        });
    }

    // Dept filter dropdown
    const deptFilter = document.getElementById('adminDeptFilter');
    if (deptFilter) {
        deptFilter.addEventListener('change', (e) => {
            currentFilterDept = e.target.value;
            renderDashboard();
        });
    }

    // Status tab buttons
    const statusBtns = document.querySelectorAll('.status-tab-btn');
    statusBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            statusBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilterStatus = btn.getAttribute('data-status');
            renderDashboard();
        });
    });

    // KPI Cards click to filter
    const kpiCards = document.querySelectorAll('.kpi-card[data-filter]');
    kpiCards.forEach(card => {
        card.addEventListener('click', () => {
            const filterKey = card.getAttribute('data-filter');
            currentFilterStatus = filterKey;
            
            statusBtns.forEach(b => {
                if (b.getAttribute('data-status') === filterKey) b.classList.add('active');
                else b.classList.remove('active');
            });

            renderDashboard();
        });
    });

    // Close Detail Modal
    const closeDetailBtn = document.getElementById('closeAdminDetailBtn');
    const detailModal = document.getElementById('adminDetailModal');
    if (closeDetailBtn && detailModal) {
        closeDetailBtn.addEventListener('click', () => detailModal.classList.remove('open'));
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) detailModal.classList.remove('open');
        });
    }

    // Save Order Changes
    const saveChangesBtn = document.getElementById('saveOrderChangesBtn');
    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', () => {
            if (!activeSelectedOrderId) return;

            const newStatus = document.getElementById('modalStatusSelect').value;
            const courierName = document.getElementById('modalCourierName').value.trim();
            const courierPhone = document.getElementById('modalCourierPhone').value.trim();
            const courierVeh = document.getElementById('modalCourierVeh').value.trim();

            const courierData = {
                name: courierName || "Kuryer",
                phone: courierPhone || "+998 90 000 00 00",
                vehicle: courierVeh || "Transport",
                rating: "4.95"
            };

            OrderStore.updateStatus(activeSelectedOrderId, newStatus, courierData);
            showAdminToast(`Buyurtma #${activeSelectedOrderId} ma'lumotlari yangilandi!`);

            if (detailModal) detailModal.classList.remove('open');
            renderDashboard();
        });
    }

    // Delete Order
    const deleteBtn = document.getElementById('deleteOrderBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (!activeSelectedOrderId) return;
            if (confirm(`Haqiqatan ham #${activeSelectedOrderId} buyurtmasini o'chirmoqchimisiz?`)) {
                OrderStore.delete(activeSelectedOrderId);
                showAdminToast(`Buyurtma #${activeSelectedOrderId} o'chirildi!`);
                if (detailModal) detailModal.classList.remove('open');
                renderDashboard();
            }
        });
    }

    // Create New Order Modal
    const createModal = document.getElementById('adminCreateModal');
    const openCreateBtn = document.getElementById('adminCreateOrderBtn');
    const closeCreateBtn = document.getElementById('closeAdminCreateBtn');
    const newOrderForm = document.getElementById('adminNewOrderForm');

    const cancelCreateBtn = document.getElementById('cancelAdminCreateBtn');
    const newOrderPhoneInput = document.getElementById('newOrderPhone');

    if (window.setupPhoneMask && newOrderPhoneInput) {
        window.setupPhoneMask(newOrderPhoneInput, false);
    }

    if (openCreateBtn && createModal) {
        openCreateBtn.addEventListener('click', () => {
            if (newOrderPhoneInput && (!newOrderPhoneInput.value || newOrderPhoneInput.value.trim() === '')) {
                newOrderPhoneInput.value = '+998 ';
            }
            createModal.classList.add('open');
        });
    }

    if (closeCreateBtn && createModal) closeCreateBtn.addEventListener('click', () => createModal.classList.remove('open'));
    if (cancelCreateBtn && createModal) cancelCreateBtn.addEventListener('click', () => createModal.classList.remove('open'));

    if (createModal) {
        createModal.addEventListener('click', (e) => {
            if (e.target === createModal) createModal.classList.remove('open');
        });
    }

    if (newOrderForm) {
        newOrderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('newOrderName').value;
            const phone = document.getElementById('newOrderPhone').value;
            const dept = document.getElementById('newOrderDept').value;
            const veh = document.getElementById('newOrderVehicle').value;
            const weight = document.getElementById('newOrderWeight').value;
            const price = document.getElementById('newOrderPrice').value;
            const pickup = document.getElementById('newOrderPickup').value;
            const delivery = document.getElementById('newOrderDelivery').value;
            const desc = document.getElementById('newOrderDesc').value;

            const newOrder = OrderStore.add({
                clientName: name,
                clientPhone: phone,
                dept: dept,
                vehicleType: veh,
                weight: `${weight} kg`,
                weightKg: parseFloat(weight),
                priceSoM: parseInt(price),
                pickupAddress: pickup,
                deliveryAddress: delivery,
                itemDescription: desc || "Mijoz buyurtmasi",
                distanceKm: 12
            });

            showAdminToast(`Yangi buyurtma #${newOrder.id} muvaffaqiyatli kiritildi!`);
            newOrderForm.reset();
            if (createModal) createModal.classList.remove('open');
            renderDashboard();
        });
    }

    // Reset Data
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Barcha ma'lumotlarni (buyurtmalar va kuryerlarni) standart test holatiga qaytarmoqchimisiz?")) {
                OrderStore.resetDefaults();
                CourierStore.resetDefaults();
                showAdminToast("Ma'lumotlar qayta tiklandi!");
                renderDashboard();
                renderClientsTable();
                renderCouriersTable();
                updateTabBadges();
            }
        });
    }

    // Toggle Sound
    const soundBtn = document.getElementById('toggleSoundBtn');
    const soundIcon = document.getElementById('soundIcon');
    const soundText = document.getElementById('soundText');
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            if (soundEnabled) {
                if (soundIcon) soundIcon.className = "fa-solid fa-volume-high";
                if (soundText) soundText.textContent = "Ovoz: Yoniq";
                showAdminToast("Bildirishnoma ovozi yoqildi.");
                OrderStore.playNotificationSound();
            } else {
                if (soundIcon) soundIcon.className = "fa-solid fa-volume-xmark";
                if (soundText) soundText.textContent = "Ovoz: O'chiq";
                showAdminToast("Bildirishnoma ovozi o'chirildi.");
            }
        });
    }
}

// ===================================================================
// 8. STORAGE & REAL-TIME SYNC
// ===================================================================

function setupStorageSync() {
    // Listen to custom internal events
    window.addEventListener('yetkaz_orders_updated', () => {
        renderDashboard();
        renderClientsTable();
        updateTabBadges();
    });

    window.addEventListener('yetkaz_couriers_updated', () => {
        renderCouriersTable();
        updateTabBadges();
    });

    window.addEventListener('yetkaz_auth_changed', () => {
        renderClientsTable();
        updateTabBadges();
    });

    // Listen to cross-tab storage changes (when client creates an order in another tab)
    window.addEventListener('storage', (e) => {
        if (e.key === 'yetkazpro_orders_v2') {
            if (soundEnabled) {
                OrderStore.playNotificationSound();
            }
            showAdminToast("🔔 Yangi buyurtma kelib tushdi!");
            renderDashboard();
            renderClientsTable();
            updateTabBadges();
        } else if (e.key === 'yetkazpro_client_users_v2') {
            renderClientsTable();
            updateTabBadges();
        } else if (e.key === 'yetkazpro_couriers_v2') {
            renderCouriersTable();
            updateTabBadges();
        }
    });
}

function showAdminToast(message) {
    const container = document.getElementById('adminToastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i class="fa-solid fa-bell" style="color: var(--accent-cyan);"></i>
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

// ===================================================================
// 9. ADMIN CREDENTIALS & SETTINGS MANAGEMENT
// ===================================================================

function setupAdminSettings() {
    const settingsBtn = document.getElementById('adminCredsBtn');
    const settingsModal = document.getElementById('adminSettingsModal');
    const closeBtn = document.getElementById('closeAdminSettingsBtn');
    const settingsForm = document.getElementById('adminSettingsForm');
    const logoutBtn = document.getElementById('adminLogoutBtn');

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('open');
            const helper = document.getElementById('settingsHelperMsg');
            if (helper) helper.style.display = 'none';
        });
    }

    if (closeBtn && settingsModal) {
        closeBtn.addEventListener('click', () => settingsModal.classList.remove('open'));
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) settingsModal.classList.remove('open');
        });
    }

    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const oldPass = document.getElementById('adminOldPass').value;
            const newUsername = document.getElementById('adminNewUsername').value;
            const newPass = document.getElementById('adminNewPass').value;
            const helper = document.getElementById('settingsHelperMsg');

            const res = Auth.updateAdminCreds(oldPass, newUsername, newPass);

            if (!res.success) {
                if (helper) {
                    helper.className = "auth-helper-msg error";
                    helper.textContent = res.message;
                    helper.style.display = 'block';
                }
                return;
            }

            if (helper) {
                helper.className = "auth-helper-msg success";
                helper.textContent = res.message;
                helper.style.display = 'block';
            }

            showAdminToast("Login va parol muvaffaqiyatli almashtirildi!");
            settingsForm.reset();

            setTimeout(() => {
                if (settingsModal) settingsModal.classList.remove('open');
            }, 1500);
        });
    }

    // Admin Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm("Admin paneldan chiqmoqchimisiz?")) {
                Auth.logout();
                window.location.href = 'index.html';
            }
        });
    }
}

window.togglePasswordVisibility = function(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
};

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
