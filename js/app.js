/**
 * YETKAZ PRO — Interactive Logistics & Delivery Platform Application
 * Fully functional with live OrderStore integration, Smart Calculator,
 * Dynamic Order Placement, Real-Time Tracking, and Full Client Authentication
 * with secret Admin login routing (login: admin123, parol: admin123).
 */

// Global state for current calculator estimate
let currentCalcState = {
    dept: 'parcel',
    weight: 5,
    distance: 8,
    speed: 'standard',
    price: 25000,
    vehicleKey: 'bike',
    vehicleTitle: 'Elektro-velik / Skuter'
};

let pendingOrderAfterAuth = false;

// ===================================================================
// 1. DATA DEFINITIONS: DEPARTMENTS & FLEET DETAILS
// ===================================================================

const DEPARTMENTS_DATA = {
    food: {
        id: 'food',
        title: "Oziq-ovqat Bo'limi",
        badge: "Issiq & Sovuq Termoboks",
        iconClass: "fa-solid fa-utensils",
        themeClass: "food-theme",
        weightRange: "0 - 15 kg",
        timeRange: "15 - 40 daqiqa",
        desc: "Restoran taomlari, kafelar, oziq-ovqat do'konlari, yangi pishiriqlar hamda meva-sabzavotlarni sifatini yo'qotmagan holda yetkazish. Kuryerlarimiz maxsus izolyatsiyalangan termobokslar bilan jihozlangan, bu esa taomlarning issiqligini yoki muzqaymoq kabi sovuq mahsulotlarning erimasligini to'liq ta'minlaydi.",
        features: [
            "Maxsus germetik va gigiyenik termobokslar",
            "Shahar tirbandliklarisiz tezkor yetib borish",
            "Harorat rejimini qat'iy saqlash (Issiq / Sovuq)",
            "Buyurtmachiga SMS va kuryer qo'ng'irog'i"
        ],
        transports: [
            { icon: "fa-solid fa-bicycle", name: "Elektro-velosiped", note: "0 - 5 kg (Tirbandliksiz, 20 daq)" },
            { icon: "fa-solid fa-motorcycle", name: "Ekspress Skuter / Bike", note: "0 - 12 kg (Shahar markazi bo'ylab)" },
            { icon: "fa-solid fa-car", name: "Konditsionerli Avto", note: "Katta buyurtmalar va tortlar uchun" }
        ]
    },
    parcel: {
        id: 'parcel',
        title: "Pochta & Kichik Yuklar Bo'limi",
        badge: "100% Sug'urtalangan & Plombali",
        iconClass: "fa-solid fa-box-open",
        themeClass: "parcel-theme",
        weightRange: "0.1 - 10 kg gacha",
        timeRange: "30 - 60 daqiqa",
        desc: "Muhim hujjatlar, shartnomalar, smartfonlar (iPhone, Samsung va boshqalar), aqlli soatlar (Apple Watch, Galaxy Watch), planshetlar, zargarlik buyumlari va 10 kg gacha bo'lgan kichik qutilar. Har bir jo'natma qabul qilingan zahoti individual himoya paketi va raqamli plomba bilan muhrlanadi.",
        features: [
            "10 kg gacha bo'lgan smartfon, gadjet va qimmatbaho xatlar",
            "Bir martalik xavfsizlik raqamli plombasi",
            "Qabul qiluvchiga shaxsan topshirish (Passport / Kod bilan)",
            "Tezkor kuryerlik — 1 soat ichida topshirish"
        ],
        transports: [
            { icon: "fa-solid fa-motorcycle", name: "Niu / Honda Skuter", note: "0.1 - 5 kg (Elektronika va soatlar)" },
            { icon: "fa-solid fa-motorcycle-ammo", name: "Benzinli Moto-kuryer", note: "5 - 10 kg (Uzoq tumanlar va shahar cheti)" },
            { icon: "fa-solid fa-car-rear", name: "Sedan Avtomobil", note: "Qimmatbaho va nozik mahsulotlar uchun" }
        ]
    },
    plumbing: {
        id: 'plumbing',
        title: "Santexnika Bo'limi",
        badge: "Mahkamlangan Furgonlar",
        iconClass: "fa-solid fa-wrench",
        themeClass: "plumbing-theme",
        weightRange: "10 kg - 1 500 kg",
        timeRange: "1 - 3 soat",
        desc: "Plastik va metall quvurlar, vanna, dush kabinalari, keramik unitazlar, mikserlar, isitish radiatorlari va zamonaviy ikki konturli kombi qozonlari. Mo'rt keramik va og'ir metall santexnika buyumlari sinishdan xoli bo'lishi uchun yuk furgonlarida maxsus tasmalar bilan mahkamlanadi.",
        features: [
            "2 metrdan 4 metrgacha bo'lgan quvur va fitinglarni tashish",
            "Siniq va tirnalish xavfidan himoyalangan pufakchali qoplama",
            "Keramika va emallangan vannalar uchun amortizatsiya",
            "Kerak bo'lsa yuk ortish va tushirish ustalari xizmati"
        ],
        transports: [
            { icon: "fa-solid fa-car-side", name: "Chevrolet Damas Van", note: "10 - 450 kg (Kichik santexnika va kranlar)" },
            { icon: "fa-solid fa-truck-pickup", name: "Chevrolet Labo Bortli", note: "Up to 600 kg (Quvurlar va radiatorlar)" },
            { icon: "fa-solid fa-truck-front", name: "Isuzu / Gazel Furgon", note: "1 - 2 tonna (To'liq uy santexnika to'plami)" }
        ]
    },
    metal: {
        id: 'metal',
        title: "Metall & Og'ir Sanoat Bo'limi",
        badge: "Kran & Bog'lash Tizimi",
        iconClass: "fa-solid fa-cubes-stacked",
        themeClass: "metal-theme",
        weightRange: "500 kg - 15 tonnagacha",
        timeRange: "Shartnoma asosida",
        desc: "Armatura, kvadrat va yumaloq trubalar, metall burchakliklar (ugolnik), shvellerlar, tom qoplamalari, tunuka listlar va metall konstruksiyalar. Qurilish ob'yektlari, sexlar va omborlarga uzunligi 6 metrdan 12 metrgacha bo'lgan og'ir metallarni ochiq bortli hamda kran-manipulyatorli mashinalarda yetkazib beramiz.",
        features: [
            "6 metrdan 12 metrgacha bo'lgan uzunlikdagi metallarni sig'dirish",
            "Kran-manipulyator bilan yuklash va joyiga tushirish",
            "Po'lat zanjirli va pishiq tasmali mahkamlash standarti",
            "Yirik qurilish korxonalari uchun shartnoma va hisob-faktura"
        ],
        transports: [
            { icon: "fa-solid fa-truck-pickup", name: "Labo / Gazel Ochiq bort", note: "500 kg - 2 t (3-4 metrli profillar)" },
            { icon: "fa-solid fa-truck-moving", name: "Isuzu Bortli (6 metr)", note: "3 - 5 tonna (Armatura va shveller)" },
            { icon: "fa-solid fa-truck-ramp-box", name: "Shacman / Howo Ochiq Trak", note: "10 - 15 tonna (Katta qurilish metallari)" }
        ]
    },
    truck: {
        id: 'truck',
        title: "Katta Trak & Fura Logistika Bo'limi",
        badge: "Butun O'zbekiston & Magistral",
        iconClass: "fa-solid fa-truck-plane",
        themeClass: "truck-theme",
        weightRange: "5 000 kg - 35 000 kg",
        timeRange: "12 - 48 soat (Shaharlararo)",
        desc: "Shaharlararo (Toshkent - Samarqand - Buxoro - Urganch - Andijon - Termiz) va xalqaro magistral tashuvlar. 20 tonnadan 35 tonnagacha bo'lgan yirik yuklar uchun haqiqiy og'ir yuk traklari: MAN, Scania, DAF, Volvo. Tentli furalar, refrijeratorlar (muzlatgichli yuklar) va 40 futlik dengiz konteynerlari tashuvchi yarim tirkamalar.",
        features: [
            "20 - 35 tonna va 86 - 120 m³ ulkan yuk hajmi",
            "GPS onlayn sputnik telemetriyasi bilan 24/7 nazorat",
            "Refrijerator rejim: -20°C dan +15°C gacha doimiy harorat",
            "Malakali 1-darajali xalqaro haydovchilar guruhi"
        ],
        transports: [
            { icon: "fa-solid fa-truck", name: "MAN TGX / Scania Tent Fura", note: "20 - 24 tonna (Magistral standart fura)" },
            { icon: "fa-solid fa-snowflake", name: "Refrijerator TIR Fura", note: "20 tonna (Harorat talab qiluvchi yuklar)" },
            { icon: "fa-solid fa-trailer", name: "Konteyner Tashuvchi Trak", note: "30 - 35 tonna (20ft va 40ft konteynerlar)" }
        ]
    }
};

const FLEET_DATA = {
    bikes: {
        title: "Elektro-velosiped & Ekspress Skuter Floti",
        subtitle: "0 dan 10 kg gacha: Xatlar, smartfonlar, smart-soatlar va taomlar uchun eng tezkor yechim",
        iconClass: "fa-solid fa-motorcycle",
        specs: [
            { label: "Yuk ko'tarish", val: "0 - 10 kg" },
            { label: "O'rtacha tezlik", val: "35 - 50 km/h" },
            { label: "Tirbandlik qarshiligi", val: "0% to'xtash (Ekspress)" },
            { label: "Mos yuklar", val: "Telefon, soat, xat, yegulik" }
        ],
        description: "Shahar markazidagi tirbandliklardan butunlay mustaqil bo'lgan elektro-veliklar va Niu/Honda skuterlarimiz posilkalarni 15-40 daqiqa ichida yetkazadi. 10 kg gacha bo'lgan nozik elektronika jihozlari kuryerning tebranishga qarshi yumshoq qutisida xavfsiz saqlanadi."
    },
    cars: {
        title: "Damas, Labo & Yengil Avtomobillar Floti",
        subtitle: "10 kg dan 600 kg gacha: Santexnika, maishiy texnika va o'rta posilkalar",
        iconClass: "fa-solid fa-car-side",
        specs: [
            { label: "Yuk ko'tarish", val: "10 - 600 kg" },
            { label: "Kuzov hajmi", val: "2.5 - 4.5 m³" },
            { label: "Yetkazish vaqti", val: "1 - 2 soat" },
            { label: "Mos yuklar", val: "Santexnika, kombi, maishiy texnika" }
        ],
        description: "Shahar ko'chalarida chaqqon harakatlanuvchi Chevrolet Damas va Labo avtomobillari o'rta hajmdagi buyurtmalar uchun ideal iqtisodiy yechimdir. Santexnika buyumlari, kranlar, koshinlar va maishiy texnikalar shikastlanmasligi uchun salon va bortda maxsus amortizatorlar qo'llaniladi."
    },
    vans: {
        title: "Isuzu & Gazel Furgonlar Floti",
        subtitle: "600 kg dan 5 tonnagacha: Metall konstruksiyalar, mebel va sanoat mollari",
        iconClass: "fa-solid fa-truck-pickup",
        specs: [
            { label: "Yuk ko'tarish", val: "600 kg - 5 000 kg" },
            { label: "Kuzov uzunligi", val: "4.2 m - 6.2 m" },
            { label: "Kuzov hajmi", val: "16 - 28 m³" },
            { label: "Mos yuklar", val: "Armatura, profil, santexnika partiyalari" }
        ],
        description: "5 tonnagacha yuk ko'taruvchi yapon Isuzu va Gazel furgonlari metall konstruksiyalar, 6 metrlik quvurlar, santexnika to'plamlari va ulgurji tovarlarni omborlardan do'konlarga yoki qurilish maydonlariga yetkazib berishda asosiy tayanch hisoblanadi."
    },
    traks: {
        title: "Haqiqiy Ulkan Trakt va Furalar (TIR) Floti",
        subtitle: "5 tonnadan 35 tonnagacha: Shaharlararo va xalqaro og'ir yuklar",
        iconClass: "fa-solid fa-truck-moving",
        specs: [
            { label: "Yuk ko'tarish", val: "5 t - 35 tonna" },
            { label: "Kuzov sig'imi", val: "86 m³ - 120 m³ (24-33 palet)" },
            { label: "Masofa", val: "1 500+ km gacha" },
            { label: "Kuzov turlari", val: "Tent, Refrijerator, Konteyner" }
        ],
        description: "MAN, Scania, DAF va Volvo kabi qudratli 18 g'ildirakli og'ir yuk mashinalarimiz (Furalar) metall quyish korxonalari, ulgurji importyorlar va yirik logistika zanjirlari uchun O'zbekistonning barcha viloyatlariga to'g'ridan-to'g'ri magistral qatnovlarini amalga oshiradi."
    }
};

// ===================================================================
// 2. DOM INITIALIZATION
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initFleetTabs();
    initCalculator();
    initModals();
    initLiveTracking();
    initAuthUI();
    initClientHistoryModal();

    // Load initial track demo (YKZ-88219)
    performLiveTrackSearch('YKZ-88219', false);
});

// ===================================================================
// 3. AUTHENTICATION UI & LOGIC
// ===================================================================

function initAuthUI() {
    const navAuthBtn = document.getElementById('navAuthBtn');
    const navLogoutBtn = document.getElementById('navLogoutBtn');
    const authModal = document.getElementById('authModal');
    const closeAuthBtn = document.getElementById('closeAuthModalBtn');
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authModalTitle = document.getElementById('authModalTitle');

    // Update Navbar user badge state
    updateAuthNav();

    // Listen to auth changes
    window.addEventListener('yetkaz_auth_changed', () => {
        updateAuthNav();
    });

    if (navAuthBtn) {
        navAuthBtn.addEventListener('click', () => {
            openAuthModal();
        });
    }

    if (navLogoutBtn) {
        navLogoutBtn.addEventListener('click', () => {
            Auth.logout();
            showToast("Tizimdan chiqdingiz.");
        });
    }

    if (closeAuthBtn && authModal) {
        closeAuthBtn.addEventListener('click', () => authModal.classList.remove('open'));
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) authModal.classList.remove('open');
        });
    }

    // Phone Mask (faqat ro'yxatdan o'tish uchun)
    const regPhoneInput = document.getElementById('regPhone');
    if (window.setupPhoneMask && regPhoneInput) {
        window.setupPhoneMask(regPhoneInput, false);
    }

    // Tab Switchers
    if (tabLoginBtn && tabRegisterBtn) {
        tabLoginBtn.addEventListener('click', () => {
            tabLoginBtn.classList.add('active');
            tabRegisterBtn.classList.remove('active');
            loginForm.style.display = 'flex';
            registerForm.style.display = 'none';
            authModalTitle.textContent = "Tizimga Kirish";
        });

        tabRegisterBtn.addEventListener('click', () => {
            tabRegisterBtn.classList.add('active');
            tabLoginBtn.classList.remove('active');
            registerForm.style.display = 'flex';
            loginForm.style.display = 'none';
            authModalTitle.textContent = "Ro'yxatdan O'tish";
            if (regPhoneInput && (!regPhoneInput.value || regPhoneInput.value.trim() === '')) {
                regPhoneInput.value = '+998 ';
            }
        });
    }

    // Universal Login Submit (Admin or Client)
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('loginIdentifier').value;
            const pass = document.getElementById('loginPassword').value;
            const helper = document.getElementById('authHelperMsg');

            const res = Auth.login(id, pass);
            if (!res.success) {
                helper.className = "auth-helper-msg error";
                helper.textContent = res.message;
                helper.style.display = 'block';
                return;
            }

            helper.style.display = 'none';

            // If Admin logged in: secret direct redirect to admin panel!
            if (res.role === 'admin') {
                showToast("🛡️ Siz ADMIN (Dispetcher) sifatida kirdingiz! Boshqaruv markaziga yo'naltirilmoqda...");
                authModal.classList.remove('open');
                setTimeout(() => {
                    window.location.href = res.redirect || 'admin.html';
                }, 700);
                return;
            }

            // If Courier logged in: redirect to courier workspace!
            if (res.role === 'courier') {
                showToast(`🛵 Siz KURYER sifatida kirdingiz: ${res.courier.name}! Kuryer ish stoliga yo'naltirilmoqda...`);
                authModal.classList.remove('open');
                setTimeout(() => {
                    window.location.href = res.redirect || 'courier.html';
                }, 700);
                return;
            }

            // Client logged in
            showToast(`👤 Siz MIJOZ profilidasiz: ${res.user.name}! Xush kelibsiz.`);
            authModal.classList.remove('open');
            loginForm.reset();
            updateAuthNav();

            // If user clicked "Buyurtma berish" prior to auth, proceed!
            if (pendingOrderAfterAuth) {
                pendingOrderAfterAuth = false;
                setTimeout(() => {
                    openOrderModalWithCalcState();
                }, 300);
            }
        });
    }

    // Client Register Submit
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const phone = document.getElementById('regPhone').value;
            const pass = document.getElementById('regPassword').value;
            const helper = document.getElementById('regHelperMsg');

            const res = Auth.register(name, phone, pass);
            if (!res.success) {
                helper.className = "auth-helper-msg error";
                helper.textContent = res.message;
                helper.style.display = 'block';
                return;
            }

            helper.style.display = 'none';
            showToast(res.message);
            authModal.classList.remove('open');
            registerForm.reset();

            if (pendingOrderAfterAuth) {
                pendingOrderAfterAuth = false;
                setTimeout(() => {
                    openOrderModalWithCalcState();
                }, 300);
            }
        });
    }
}

function updateAuthNav() {
    const session = Auth.getSession();
    const navAuthBtn = document.getElementById('navAuthBtn');
    const navUserBadge = document.getElementById('navUserBadge');
    const navHistoryBtn = document.getElementById('navOrderHistoryBtn');
    const clientOrdersBadge = document.getElementById('clientOrdersBadge');

    const roleBanner = document.getElementById('roleNotificationBanner');
    const bannerBadge = document.getElementById('bannerRoleBadge');
    const bannerMsg = document.getElementById('bannerRoleMessage');
    const bannerAction = document.getElementById('bannerPrimaryActionBtn');
    const bannerActionText = document.getElementById('bannerActionText');
    const bannerLogout = document.getElementById('bannerLogoutBtn');

    if (bannerLogout) {
        bannerLogout.onclick = () => {
            if (confirm("Haqiqatan ham hisobdan chiqmoqchimisiz?")) {
                Auth.logout();
                showToast("Tizimdan chiqdingiz.");
            }
        };
    }

    if (!session) {
        // Guest mode
        if (navAuthBtn) navAuthBtn.style.display = 'inline-flex';
        if (navUserBadge) navUserBadge.style.display = 'none';
        if (navHistoryBtn) navHistoryBtn.style.display = 'none';
        if (roleBanner) roleBanner.style.display = 'none';
        return;
    }

    // Role 1: ADMIN (Dispetcher)
    if (session.role === 'admin') {
        if (navAuthBtn) navAuthBtn.style.display = 'none';
        if (navHistoryBtn) navHistoryBtn.style.display = 'none';
        if (navUserBadge) {
            navUserBadge.style.display = 'inline-flex';
            navUserBadge.innerHTML = `
                <a href="admin.html" style="color: var(--accent-amber); text-decoration: none; display: flex; align-items: center; gap: 6px; font-weight: 700;">
                    <i class="fa-solid fa-shield-halved"></i>
                    <span>Admin (Dispetcher)</span>
                </a>
                <button class="btn-logout" id="navLogoutBtn" title="Chiqish" style="margin-left: 8px;">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
            `;
            const logoutBtn = document.getElementById('navLogoutBtn');
            if (logoutBtn) logoutBtn.onclick = (e) => { e.preventDefault(); Auth.logout(); showToast("Admin hisobidan chiqildi."); };
        }

        if (roleBanner) {
            roleBanner.style.display = 'block';
            if (bannerBadge) {
                bannerBadge.className = 'role-badge-pill pill-role-admin';
                bannerBadge.innerHTML = '<i class="fa-solid fa-shield-halved"></i> ADMIN (DISPETCHER)';
            }
            if (bannerMsg) bannerMsg.innerHTML = `Siz hozir <strong>ADMIN (DISPETCHER)</strong> sifatida tizimdasiz!`;
            if (bannerAction) {
                bannerAction.style.display = 'inline-flex';
                bannerAction.href = 'admin.html';
                bannerAction.onclick = null;
                if (bannerActionText) bannerActionText.textContent = "Admin Boshqaruv Paneliga O'tish";
            }
        }
    } 
    // Role 2: COURIER (Haydovchi)
    else if (session.role === 'courier') {
        const courier = session.courier;
        if (navAuthBtn) navAuthBtn.style.display = 'none';
        if (navHistoryBtn) navHistoryBtn.style.display = 'none';
        if (navUserBadge) {
            navUserBadge.style.display = 'inline-flex';
            navUserBadge.innerHTML = `
                <a href="courier.html" style="color: var(--accent-emerald); text-decoration: none; display: flex; align-items: center; gap: 6px; font-weight: 700;">
                    <i class="fa-solid fa-motorcycle"></i>
                    <span>${courier.name} (${courier.plateNumber || 'Kuryer'})</span>
                </a>
                <button class="btn-logout" id="navLogoutBtn" title="Chiqish" style="margin-left: 8px;">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
            `;
            const logoutBtn = document.getElementById('navLogoutBtn');
            if (logoutBtn) logoutBtn.onclick = (e) => { e.preventDefault(); Auth.logout(); showToast("Kuryer hisobidan chiqildi."); };
        }

        if (roleBanner) {
            roleBanner.style.display = 'block';
            if (bannerBadge) {
                bannerBadge.className = 'role-badge-pill pill-role-courier';
                bannerBadge.innerHTML = '<i class="fa-solid fa-motorcycle"></i> KURYER REJIMI';
            }
            if (bannerMsg) bannerMsg.innerHTML = `Siz <strong>KURYER</strong> sifatida tizimdasiz: <strong>${courier.name}</strong> (${courier.vehicleName} • ${courier.plateNumber || 'Raqamsiz'})`;
            if (bannerAction) {
                bannerAction.style.display = 'inline-flex';
                bannerAction.href = 'courier.html';
                bannerAction.onclick = null;
                if (bannerActionText) bannerActionText.textContent = "Kuryer Ish Paneliga O'tish";
            }
        }
    } 
    // Role 3: CLIENT (Mijoz)
    else if (session.role === 'client') {
        const user = session.user;
        const myOrders = getClientOrders(user);

        if (navAuthBtn) navAuthBtn.style.display = 'none';
        if (navUserBadge) {
            navUserBadge.style.display = 'inline-flex';
            navUserBadge.innerHTML = `
                <i class="fa-solid fa-circle-user"></i>
                <span id="navUserName">${user.name}</span>
                <button class="btn-logout" id="navLogoutBtn" title="Chiqish" style="margin-left: 8px;">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
            `;
            const logoutBtn = document.getElementById('navLogoutBtn');
            if (logoutBtn) logoutBtn.onclick = (e) => { e.preventDefault(); Auth.logout(); showToast("Tizimdan chiqdingiz."); };
        }

        if (navHistoryBtn) {
            navHistoryBtn.style.display = 'inline-flex';
            if (clientOrdersBadge) clientOrdersBadge.textContent = myOrders.length;
        }

        if (roleBanner) {
            roleBanner.style.display = 'block';
            if (bannerBadge) {
                bannerBadge.className = 'role-badge-pill pill-role-client';
                bannerBadge.innerHTML = '<i class="fa-solid fa-user-check"></i> MIJOZ PROFILI';
            }
            if (bannerMsg) bannerMsg.innerHTML = `Siz <strong>MIJOZ</strong> shaxsiy profilidasiz: <strong>${user.name}</strong> (${user.phone})`;
            if (bannerAction) {
                bannerAction.style.display = 'inline-flex';
                bannerAction.href = 'javascript:void(0)';
                bannerAction.onclick = () => openClientHistoryModal();
                if (bannerActionText) bannerActionText.textContent = `Buyurtmalarim Tarixi (${myOrders.length})`;
            }
        }
    }
}

// ===================================================================
// MIJOZ BUYURTMALAR TARIXI (CLIENT ORDER HISTORY)
// ===================================================================

function getClientOrders(user) {
    if (!user) return [];
    const allOrders = OrderStore.getAll();
    const cleanUserPhone = (user.phone || '').replace(/\s+/g, '');
    const cleanUserName = (user.name || '').trim().toLowerCase();

    return allOrders.filter(o => {
        const phoneMatch = o.clientPhone && cleanUserPhone && 
            o.clientPhone.replace(/\s+/g, '') === cleanUserPhone;
        const nameMatch = o.clientName && cleanUserName && 
            o.clientName.trim().toLowerCase() === cleanUserName;
        return phoneMatch || nameMatch;
    });
}

function initClientHistoryModal() {
    const navHistoryBtn = document.getElementById('navOrderHistoryBtn');
    const modal = document.getElementById('clientHistoryModal');
    const closeBtn = document.getElementById('closeClientHistoryBtn');

    if (navHistoryBtn) {
        navHistoryBtn.addEventListener('click', () => {
            openClientHistoryModal();
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('open');
        });
    }

    // Sync history on real-time order updates
    window.addEventListener('yetkaz_orders_updated', () => {
        updateAuthNav();
        const user = Auth.getCurrentUser();
        if (user && modal && modal.classList.contains('open')) {
            openClientHistoryModal();
        }
    });
}

window.openClientHistoryModal = function() {
    const user = Auth.getCurrentUser();
    const modal = document.getElementById('clientHistoryModal');
    const container = document.getElementById('clientHistoryContainer');
    const subtitle = document.getElementById('clientHistorySubtitle');
    if (!modal || !container) return;

    if (!user) {
        openAuthModal("Buyurtmalar tarixini ko'rish uchun avval hisobingizga kiring!");
        return;
    }

    const myOrders = getClientOrders(user);
    if (subtitle) {
        subtitle.textContent = `${user.name} hisobi orqali amalga oshirilgan barcha buyurtmalar (${myOrders.length} ta).`;
    }

    if (myOrders.length === 0) {
        container.innerHTML = `
            <div class="c-empty-box" style="padding: 40px 20px;">
                <i class="fa-solid fa-boxes-packing"></i>
                <h4 style="color: #fff; margin-bottom: 6px;">Hozircha buyurtmalar yo'q</h4>
                <p>Siz hali birorta ham buyurtma bermagansiz. "Buyurtma berish" tugmasi orqali xat, posilka yoki og'ir yuk yuborishingiz mumkin.</p>
                <button class="btn btn-primary" style="margin-top: 14px;" onclick="document.getElementById('clientHistoryModal').classList.remove('open'); openOrderModalWithCalcState();">
                    <i class="fa-solid fa-paper-plane"></i> Yangi Buyurtma Rasmiylashtirish
                </button>
            </div>
        `;
        modal.classList.add('open');
        return;
    }

    container.innerHTML = myOrders.map(order => {
        let statusBadgeClass = `status-badge-${order.status}`;
        let statusText = order.statusText || 'Kutilmoqda';

        let courierInfo = '<span style="color: var(--accent-amber);"><i class="fa-solid fa-hourglass-half"></i> Dispetcher tasdiqlashi va kuryer biriktirilishi kutilmoqda</span>';
        if (order.courier) {
            courierInfo = `
                <span style="color: var(--accent-emerald);">
                    <i class="fa-solid fa-motorcycle"></i> <strong>${escapeHtml(order.courier.name)}</strong> • ${escapeHtml(order.courier.vehicle || '')} 
                    (<a href="tel:${order.courier.phone}" style="color: var(--accent-cyan); text-decoration: none;">${escapeHtml(order.courier.phone)}</a>)
                </span>
            `;
        }

        let dateStr = "Yaqinda";
        if (order.createdAt) {
            try {
                const d = new Date(order.createdAt);
                dateStr = d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' }) + 
                          ' ' + d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                dateStr = order.createdAt;
            }
        }

        return `
            <div class="c-history-card">
                <div class="c-history-top">
                    <div>
                        <span class="c-history-id">#${order.id}</span>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); margin-left: 8px;">
                            <i class="fa-regular fa-calendar"></i> ${dateStr}
                        </span>
                    </div>
                    <span class="status-badge ${statusBadgeClass}">
                        <span class="status-dot dot-${order.status}"></span>
                        ${statusText}
                    </span>
                </div>

                <div class="c-history-grid">
                    <div class="c-history-route">
                        <div class="c-history-route-item">
                            <span style="color: var(--accent-cyan);"><i class="fa-solid fa-circle-dot"></i> A:</span>
                            <span>${escapeHtml(order.pickupAddress)}</span>
                        </div>
                        <div class="c-history-route-item">
                            <span style="color: var(--accent-rose);"><i class="fa-solid fa-location-dot"></i> B:</span>
                            <span>${escapeHtml(order.deliveryAddress)}</span>
                        </div>
                    </div>

                    <div class="c-history-meta">
                        <div><i class="fa-solid fa-box" style="color: var(--accent-cyan);"></i> Yuk: <strong>${escapeHtml(order.itemDescription)}</strong> (${escapeHtml(order.weight)})</div>
                        <div><i class="fa-solid fa-user-shield" style="color: var(--accent-purple);"></i> Kuryer: ${courierInfo}</div>
                    </div>
                </div>

                <div class="c-history-footer">
                    <div class="c-history-price">
                        ${(order.priceSoM || 0).toLocaleString('uz-UZ')} so'm
                    </div>

                    <button class="btn-track-order" onclick="trackMyOrder('${order.id}')">
                        <i class="fa-solid fa-crosshairs"></i> Xaritada Jonli Kuzatish
                    </button>
                </div>
            </div>
        `;
    }).join('');

    modal.classList.add('open');
};

window.trackMyOrder = function(orderId) {
    const historyModal = document.getElementById('clientHistoryModal');
    if (historyModal) historyModal.classList.remove('open');

    const trackInput = document.getElementById('trackingCodeInput');
    if (trackInput) trackInput.value = orderId;

    const trackSection = document.getElementById('tracking');
    if (trackSection) trackSection.scrollIntoView({ behavior: 'smooth' });

    performLiveTrackSearch(orderId, true);
    showToast(`Buyurtma #${orderId} xaritada jonli ko'rsatilmoqda!`);
};

function openAuthModal(customDesc = null) {
    const modal = document.getElementById('authModal');
    const descEl = document.getElementById('authModalDesc');
    if (customDesc && descEl) descEl.textContent = customDesc;
    else if (descEl) descEl.textContent = "Yetkazib berish xizmatidan foydalanish uchun hisobingizga kiring.";

    const loginId = document.getElementById('loginIdentifier');
    if (loginId) {
        loginId.value = '';
    }
    const regPhone = document.getElementById('regPhone');
    if (regPhone && (!regPhone.value || regPhone.value.trim() === '')) {
        regPhone.value = '+998 ';
    }

    if (modal) modal.classList.add('open');
}

window.togglePasswordVisibility = function(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
};

// ===================================================================
// 4. NAVIGATION & MOBILE MENU
// ===================================================================

function initNavigation() {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    const navbar = document.getElementById('navbar');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.right = '0';
                navLinks.style.background = 'rgba(7, 11, 20, 0.98)';
                navLinks.style.padding = '24px';
                navLinks.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
            }
        });
    }

    // Scroll Navbar effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(7, 11, 20, 0.95)';
            navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
        } else {
            navbar.style.background = 'rgba(7, 11, 20, 0.85)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Quick track button
    const quickTrackBtn = document.getElementById('quickTrackBtn');
    if (quickTrackBtn) {
        quickTrackBtn.addEventListener('click', () => {
            const trackSection = document.getElementById('tracking');
            if (trackSection) {
                trackSection.scrollIntoView({ behavior: 'smooth' });
                const codeInput = document.getElementById('trackingCodeInput');
                if (codeInput) codeInput.focus();
            }
        });
    }
}

// ===================================================================
// 5. FLEET TABS DISPLAY
// ===================================================================

function initFleetTabs() {
    const tabButtons = document.querySelectorAll('.fleet-tab-btn');
    const displayCard = document.getElementById('fleetDisplayCard');

    function renderFleet(fleetKey) {
        const item = FLEET_DATA[fleetKey];
        if (!item || !displayCard) return;

        let specsHtml = item.specs.map(s => `
            <div class="fleet-spec-box">
                <span class="fleet-spec-label">${s.label}</span>
                <span class="fleet-spec-val">${s.val}</span>
            </div>
        `).join('');

        displayCard.innerHTML = `
            <div class="fleet-info-grid">
                <div class="fleet-preview-box">
                    <i class="${item.iconClass} fleet-large-icon"></i>
                    <h3 class="fleet-title">${item.title}</h3>
                    <p class="fleet-subtitle">${item.subtitle}</p>
                    <button class="btn btn-outline" onclick="openOrderModalWithFleet('${fleetKey}')">
                        <i class="fa-solid fa-truck-arrow-right"></i> Ushbu Flotda Buyurtma
                    </button>
                </div>
                <div class="fleet-specs-pane">
                    <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 1.05rem; line-height: 1.7;">
                        ${item.description}
                    </p>
                    <div class="fleet-specs-list">
                        ${specsHtml}
                    </div>
                </div>
            </div>
        `;
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const fleetKey = btn.getAttribute('data-fleet');
            renderFleet(fleetKey);
        });
    });

    // Initial render
    renderFleet('bikes');
}

// ===================================================================
// 6. SMART CALCULATOR LOGIC
// ===================================================================

function initCalculator() {
    const weightRange = document.getElementById('weightRange');
    const distanceRange = document.getElementById('distanceRange');
    const weightValDisplay = document.getElementById('weightValDisplay');
    const distanceValDisplay = document.getElementById('distanceValDisplay');

    const sumDistance = document.getElementById('sumDistance');
    const sumWeight = document.getElementById('sumWeight');
    const sumTime = document.getElementById('sumTime');
    const totalPriceDisplay = document.getElementById('totalPriceDisplay');

    const vehIconWrapper = document.getElementById('vehIconWrapper');
    const vehTitle = document.getElementById('vehTitle');
    const vehDesc = document.getElementById('vehDesc');
    const vehFeatures = document.getElementById('vehFeatures');

    const weightChips = document.querySelectorAll('.chip-btn[data-weight]');
    const distChips = document.querySelectorAll('.chip-btn[data-dist]');
    const deptRadios = document.querySelectorAll('input[name="calcDept"]');
    const speedRadios = document.querySelectorAll('input[name="calcSpeed"]');

    function calculate() {
        const weight = parseFloat(weightRange.value) || 1;
        const distance = parseFloat(distanceRange.value) || 1;
        
        let selectedDept = 'parcel';
        deptRadios.forEach(r => { if (r.checked) selectedDept = r.value; });

        let isExpress = false;
        speedRadios.forEach(r => { if (r.checked && r.value === 'express') isExpress = true; });

        // Update displays
        if (weight >= 1000) {
            const ton = (weight / 1000).toFixed(1);
            weightValDisplay.textContent = `${ton} tonna (${weight.toLocaleString()} kg)`;
            sumWeight.textContent = `${ton} tonna`;
        } else {
            weightValDisplay.textContent = `${weight} kg`;
            sumWeight.textContent = `${weight} kg`;
        }

        distanceValDisplay.textContent = `${distance} km`;
        sumDistance.textContent = `${distance} km`;

        // Determine Vehicle Recommendation & Base Pricing
        let vehicleKey = 'bike';
        let vehicle = {
            title: "Elektro-velik / Skuter",
            icon: "fa-solid fa-motorcycle",
            desc: "10 kg gacha yuklar uchun eng tezkor va tirbandliksiz ekspress kur’yer.",
            features: [
                "Tirbandlikda to'xtamaydi (15-35 daqiqa)",
                "Xat, smartfon, soat va issiq taomlar uchun ideal",
                "Tejamkor va qulay shahar ichi yetkazish"
            ],
            baseRate: 15000,
            kmRate: 2500,
            estSpeedKmh: 35
        };

        if (weight <= 10 && distance <= 25 && (selectedDept === 'food' || selectedDept === 'parcel')) {
            vehicleKey = 'bike';
            vehicle.title = "Elektro-velik / Skuter";
            vehicle.icon = "fa-solid fa-motorcycle";
            vehicle.desc = "10 kg gacha yuklar: Xat, smartfon, smart-soatlar va taomlar uchun ideal.";
            vehicle.features = [
                "Tirbandliksiz tezkor yo'nalish",
                "10 kg gacha yengil posilkalar va hujjatlar",
                "Zarba o'tkazmaydigan termoboks"
            ];
            vehicle.baseRate = 18000;
            vehicle.kmRate = 2200;
            vehicle.estSpeedKmh = 35;
        } else if (weight <= 600 && distance <= 120 && selectedDept !== 'metal' && selectedDept !== 'truck') {
            vehicleKey = 'car';
            vehicle.title = "Damas / Labo / Yengil Avto";
            vehicle.icon = "fa-solid fa-car-side";
            vehicle.desc = "10 - 600 kg gacha yuklar: Santexnika, o'rta posilkalar va apparaturalar.";
            vehicle.features = [
                "600 kg gacha yuk ko'tarish quvvati",
                "Santexnika quvurlari va kombi qozonlari uchun qulay",
                "Yopiq va chang o'tkazmaydigan salon"
            ];
            vehicle.baseRate = 50000;
            vehicle.kmRate = 4500;
            vehicle.estSpeedKmh = 45;
        } else if (weight <= 5000 && distance <= 350 && selectedDept !== 'truck') {
            vehicleKey = 'isuzu';
            vehicle.title = "Isuzu / Gazel Furgon (5 t gacha)";
            vehicle.icon = "fa-solid fa-truck-pickup";
            vehicle.desc = "600 kg - 5 tonna: Metall armatura, og'ir santexnika partiyalari va mebellar.";
            vehicle.features = [
                "5 tonnagacha yuk ko'tarish quvvati",
                "6 metrgacha metall quvur va armaturalar uchun ochiq bort",
                "Maxsus yuk bog'lash kamarlari mavjud"
            ];
            vehicle.baseRate = 180000;
            vehicle.kmRate = 9000;
            vehicle.estSpeedKmh = 55;
        } else {
            vehicleKey = 'fura';
            vehicle.title = "Katta Fura / TIR Traki (20-35 t)";
            vehicle.icon = "fa-solid fa-truck-moving";
            vehicle.desc = "5 tonnadan 35 tonnagacha: Shaharlararo va xalqaro magistral og'ir yuklar.";
            vehicle.features = [
                "Ulkan 35 tonnagacha quvvat va 100 m³ hajm",
                "Shaharlararo viloyatlarga to'g'ridan-to'g'ri magistral qatnov",
                "Tentli, refrijerator yoki ochiq bortli furalar"
            ];
            vehicle.baseRate = 750000;
            vehicle.kmRate = 18000;
            vehicle.estSpeedKmh = 65;
        }

        // Price calculation
        let calculatedPrice = vehicle.baseRate + (distance * vehicle.kmRate);
        
        // Weight surcharge for heavy logistics
        if (weight > 1000) {
            calculatedPrice += (weight / 1000) * 15000;
        }

        // Express multiplier
        if (isExpress) {
            calculatedPrice *= 1.35;
        }

        // Round to nearest 1,000 so'm
        calculatedPrice = Math.round(calculatedPrice / 1000) * 1000;

        // Delivery time estimate
        let hours = (distance / vehicle.estSpeedKmh);
        let timeText = "";
        if (hours < 1) {
            let minutes = Math.max(15, Math.round(hours * 60) + (isExpress ? 5 : 15));
            timeText = `${minutes} - ${minutes + 15} daqiqa`;
        } else if (hours < 24) {
            let h = Math.round(hours);
            timeText = `${h} - ${h + 2} soat`;
        } else {
            let days = Math.round(hours / 24);
            timeText = `${days} - ${days + 1} kun`;
        }

        // Save into global state
        currentCalcState = {
            dept: selectedDept,
            weight: weight,
            distance: distance,
            speed: isExpress ? 'express' : 'standard',
            price: calculatedPrice,
            vehicleKey: vehicleKey,
            vehicleTitle: vehicle.title
        };

        // Render to UI
        vehIconWrapper.innerHTML = `<i class="${vehicle.icon}"></i>`;
        vehTitle.textContent = vehicle.title;
        vehDesc.textContent = vehicle.desc;
        vehFeatures.innerHTML = vehicle.features.map(f => `<div><i class="fa-solid fa-check"></i> ${f}</div>`).join('');

        sumTime.textContent = timeText;
        totalPriceDisplay.textContent = `${calculatedPrice.toLocaleString('uz-UZ')} so'm`;
    }

    // Attach listeners
    weightRange.addEventListener('input', calculate);
    distanceRange.addEventListener('input', calculate);
    deptRadios.forEach(r => r.addEventListener('change', calculate));
    speedRadios.forEach(r => r.addEventListener('change', calculate));

    // Weight quick chips
    weightChips.forEach(chip => {
        chip.addEventListener('click', () => {
            weightChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            weightRange.value = chip.getAttribute('data-weight');
            calculate();
        });
    });

    // Distance quick chips
    distChips.forEach(chip => {
        chip.addEventListener('click', () => {
            distChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            distanceRange.value = chip.getAttribute('data-dist');
            calculate();
        });
    });

    // Button from calculator to open order form prefilled
    const calcOrderBtn = document.getElementById('calcOrderBtn');
    if (calcOrderBtn) {
        calcOrderBtn.addEventListener('click', () => {
            openOrderModalWithCalcState();
        });
    }

    // Initial run
    calculate();
}

function openOrderModalWithCalcState() {
    const user = Auth.getCurrentUser();

    const orderModal = document.getElementById('orderModal');
    const orderDeptSelect = document.getElementById('orderDeptSelect');
    const orderVehicleSelect = document.getElementById('orderVehicleSelect');
    const priceDisplay = document.getElementById('orderModalPriceDisplay');
    const weightDisplay = document.getElementById('orderModalWeightDisplay');
    const hiddenPrice = document.getElementById('orderHiddenPrice');
    const hiddenWeight = document.getElementById('orderHiddenWeight');
    const hiddenDistance = document.getElementById('orderHiddenDistance');

    const clientNameInput = document.getElementById('orderClientName');
    const clientPhoneInput = document.getElementById('orderClientPhone');

    // Pre-fill user data if logged in
    if (user) {
        if (clientNameInput && user.name) clientNameInput.value = user.name;
        if (clientPhoneInput && user.phone) clientPhoneInput.value = user.phone;
    } else {
        if (clientPhoneInput && (!clientPhoneInput.value || clientPhoneInput.value.trim() === '')) {
            clientPhoneInput.value = '+998 ';
        }
    }

    if (orderDeptSelect) orderDeptSelect.value = currentCalcState.dept;
    if (orderVehicleSelect) orderVehicleSelect.value = currentCalcState.vehicleKey;

    if (priceDisplay) priceDisplay.textContent = `${currentCalcState.price.toLocaleString('uz-UZ')} so'm`;
    if (weightDisplay) {
        const w = currentCalcState.weight;
        weightDisplay.textContent = w >= 1000 ? `${(w/1000).toFixed(1)} t` : `${w} kg`;
    }

    if (hiddenPrice) hiddenPrice.value = currentCalcState.price;
    if (hiddenWeight) hiddenWeight.value = currentCalcState.weight;
    if (hiddenDistance) hiddenDistance.value = currentCalcState.distance;

    if (orderModal) orderModal.classList.add('open');
}

// ===================================================================
// 7. MODALS LOGIC (DEPARTMENT DETAILS & ORDER PLACEMENT)
// ===================================================================

function initModals() {
    const deptModal = document.getElementById('departmentModal');
    const closeDeptModalBtn = document.getElementById('closeDeptModalBtn');
    const orderModal = document.getElementById('orderModal');
    const closeOrderModalBtn = document.getElementById('closeOrderModalBtn');
    const openOrderModalBtn = document.getElementById('openOrderModalBtn');
    const successModal = document.getElementById('successModal');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const orderForm = document.getElementById('orderForm');

    const orderClientPhoneInput = document.getElementById('orderClientPhone');
    if (window.setupPhoneMask && orderClientPhoneInput) {
        window.setupPhoneMask(orderClientPhoneInput, false);
    }

    // Close on overlay click
    [deptModal, orderModal, successModal].forEach(modal => {
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('open');
            }
        });
    });

    if (closeDeptModalBtn) closeDeptModalBtn.addEventListener('click', () => deptModal.classList.remove('open'));
    if (closeOrderModalBtn) closeOrderModalBtn.addEventListener('click', () => orderModal.classList.remove('open'));
    if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', () => successModal.classList.remove('open'));
    
    if (openOrderModalBtn) {
        openOrderModalBtn.addEventListener('click', () => {
            openOrderModalWithCalcState();
        });
    }

    // Form submit -> SAVES INTO REAL ORDER STORE
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const clientName = (document.getElementById('orderClientName')?.value || '').trim();
            const clientPhone = (document.getElementById('orderClientPhone')?.value || '').trim();
            const dept = document.getElementById('orderDeptSelect')?.value || 'parcel';
            const vehicle = document.getElementById('orderVehicleSelect')?.value || 'bike';
            const pickup = (document.getElementById('orderPickupAddress')?.value || '').trim();
            const delivery = (document.getElementById('orderDeliveryAddress')?.value || '').trim();
            
            const commentEl = document.getElementById('orderComment');
            const comment = commentEl ? commentEl.value.trim() : '';

            const price = parseInt(document.getElementById('orderHiddenPrice')?.value) || 25000;
            const weightKg = parseFloat(document.getElementById('orderHiddenWeight')?.value) || 5;
            const distanceKm = parseFloat(document.getElementById('orderHiddenDistance')?.value) || 8;

            const weightStr = weightKg >= 1000 ? `${(weightKg/1000).toFixed(1)} tonna` : `${weightKg} kg`;

            // If user wasn't registered, save into client store so they appear in Admin Mijozlar list
            if (!Auth.getCurrentUser()) {
                Auth.register(clientName, clientPhone, "123456");
            }

            // Save order into OrderStore
            const newOrder = OrderStore.add({
                clientName: clientName,
                clientPhone: clientPhone,
                dept: dept,
                vehicleType: vehicle,
                pickupAddress: pickup,
                deliveryAddress: delivery,
                itemDescription: comment || "Mijoz buyurtma yuki",
                weight: weightStr,
                weightKg: weightKg,
                distanceKm: distanceKm,
                priceSoM: price,
                speed: currentCalcState.speed
            });

            const codeDisplay = document.getElementById('generatedTrackCode');
            if (codeDisplay) codeDisplay.textContent = newOrder.id;

            // Close order modal and open success modal
            if (orderModal) orderModal.classList.remove('open');
            if (successModal) successModal.classList.add('open');

            showToast(`Rahmat, ${clientName}! Buyurtmangiz tizimga kiritildi. Trek-kod: #${newOrder.id}`);
            orderForm.reset();
        });
    }

    // Copy tracking code
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', () => {
            const code = document.getElementById('generatedTrackCode').textContent;
            navigator.clipboard.writeText(code).then(() => {
                showToast(`Trek raqam nusxalandi: ${code}`);
            }).catch(() => {
                showToast(`Trek raqam: ${code}`);
            });
        });
    }

    // Track immediately from success modal
    const trackNowBtn = document.getElementById('trackNowFromSuccessBtn');
    if (trackNowBtn) {
        trackNowBtn.addEventListener('click', () => {
            const code = document.getElementById('generatedTrackCode').textContent;
            successModal.classList.remove('open');
            
            const trackInput = document.getElementById('trackingCodeInput');
            if (trackInput) trackInput.value = code;

            const trackingSection = document.getElementById('tracking');
            if (trackingSection) {
                trackingSection.scrollIntoView({ behavior: 'smooth' });
            }

            performLiveTrackSearch(code, true);
        });
    }
}

// Global function to open department detailed view
window.openDepartmentDetails = function(deptKey) {
    const data = DEPARTMENTS_DATA[deptKey];
    const modal = document.getElementById('departmentModal');
    const content = document.getElementById('deptModalDynamicContent');
    if (!data || !modal || !content) return;

    let transportsHtml = data.transports.map(t => `
        <div class="dept-veh-card">
            <i class="${t.icon}"></i>
            <h5>${t.name}</h5>
            <span>${t.note}</span>
        </div>
    `).join('');

    let featuresHtml = data.features.map(f => `
        <li style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px; color: var(--text-secondary);">
            <i class="fa-solid fa-circle-check" style="color: var(--accent-cyan); font-size: 0.85rem;"></i>
            <span>${f}</span>
        </li>
    `).join('');

    content.innerHTML = `
        <div class="dept-modal-header">
            <div class="dept-modal-icon ${data.themeClass}">
                <i class="${data.iconClass}"></i>
            </div>
            <div>
                <span class="dept-badge badge-blue">${data.badge}</span>
                <h2 class="dept-modal-title">${data.title}</h2>
                <div class="dept-modal-subtitle">Ruxsat etilgan vazn: ${data.weightRange} • Yetkazish vaqti: ${data.timeRange}</div>
            </div>
        </div>

        <div class="dept-modal-body">
            <p>${data.desc}</p>

            <h4 style="color: var(--text-white); margin-bottom: 12px; font-size: 1.05rem;">
                <i class="fa-solid fa-list-check" style="color: var(--accent-cyan);"></i> Bo'limning asosiy kafolatlari va afzalliklari:
            </h4>
            <ul style="margin-bottom: 24px; padding-left: 4px;">
                ${featuresHtml}
            </ul>

            <h4 class="dept-transports-title">
                <i class="fa-solid fa-truck-ramp-box" style="color: var(--accent-cyan);"></i> Ushbu bo'limda foydalaniladigan transport vositalari:
            </h4>
            <div class="dept-transports-grid">
                ${transportsHtml}
            </div>

            <div style="display: flex; gap: 18px; row-gap: 14px; flex-wrap: wrap; margin-top: 28px;">
                <button class="btn btn-primary btn-lg" onclick="openOrderModalWithDept('${deptKey}')">
                    <i class="fa-solid fa-paper-plane"></i> Shu Bo'limdan Buyurtma Berish
                </button>
                <button class="btn btn-outline btn-lg" onclick="preselectCalculator('${deptKey}')">
                    <i class="fa-solid fa-calculator"></i> Narxni Hisoblash
                </button>
            </div>
        </div>
    `;

    modal.classList.add('open');
};

window.openOrderModalWithDept = function(deptKey) {
    const deptModal = document.getElementById('departmentModal');
    if (deptModal) deptModal.classList.remove('open');

    currentCalcState.dept = deptKey;
    if (deptKey === 'food' || deptKey === 'parcel') currentCalcState.vehicleKey = 'bike';
    else if (deptKey === 'plumbing') currentCalcState.vehicleKey = 'car';
    else if (deptKey === 'metal') currentCalcState.vehicleKey = 'isuzu';
    else if (deptKey === 'truck') currentCalcState.vehicleKey = 'fura';

    openOrderModalWithCalcState();
};

window.openOrderModalWithFleet = function(fleetKey) {
    if (fleetKey === 'bikes') {
        currentCalcState.vehicleKey = 'bike';
        currentCalcState.dept = 'parcel';
        currentCalcState.weight = 5;
    } else if (fleetKey === 'cars') {
        currentCalcState.vehicleKey = 'car';
        currentCalcState.dept = 'plumbing';
        currentCalcState.weight = 120;
    } else if (fleetKey === 'vans') {
        currentCalcState.vehicleKey = 'isuzu';
        currentCalcState.dept = 'metal';
        currentCalcState.weight = 2500;
    } else if (fleetKey === 'traks') {
        currentCalcState.vehicleKey = 'fura';
        currentCalcState.dept = 'truck';
        currentCalcState.weight = 22000;
    }

    openOrderModalWithCalcState();
};

window.preselectCalculator = function(deptKey) {
    const deptModal = document.getElementById('departmentModal');
    if (deptModal) deptModal.classList.remove('open');

    const calcRadio = document.querySelector(`input[name="calcDept"][value="${deptKey}"]`);
    if (calcRadio) {
        calcRadio.checked = true;
        calcRadio.dispatchEvent(new Event('change'));
    }

    const calcSection = document.getElementById('calculator');
    if (calcSection) calcSection.scrollIntoView({ behavior: 'smooth' });
};

// ===================================================================
// 8. REAL-TIME LIVE TRACKING SYSTEM
// ===================================================================

function initLiveTracking() {
    const trackSearchBtn = document.getElementById('trackSearchBtn');
    const trackingCodeInput = document.getElementById('trackingCodeInput');

    if (trackSearchBtn && trackingCodeInput) {
        trackSearchBtn.addEventListener('click', () => {
            const code = trackingCodeInput.value.trim();
            if (code) {
                performLiveTrackSearch(code, true);
            } else {
                showToast("Iltimos, trek kodini kiriting!");
            }
        });

        trackingCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                trackSearchBtn.click();
            }
        });
    }
}

function performLiveTrackSearch(code, showFeedback = true) {
    if (!code) return;
    const cleanCode = code.trim().toUpperCase().replace('#', '');
    const order = OrderStore.getById(cleanCode);

    const trackIdText = document.getElementById('trackIdText');
    const movingVeh = document.getElementById('movingVehicle');
    const mapVehIcon = document.getElementById('mapVehIcon');
    const statusPill = document.querySelector('.tracking-status-header .status-pill');
    const courierCard = document.querySelector('.courier-card');
    const originPinLabel = document.querySelector('.pin-origin .pin-label');
    const destPinLabel = document.querySelector('.pin-destination .pin-label');
    const timelineContainer = document.querySelector('.track-timeline');

    if (!order) {
        if (showFeedback) {
            showToast(`❌ #${cleanCode} raqamli buyurtma topilmadi. Mavjud test kodlari: YKZ-88219, YKZ-44120...`);
        }
        return;
    }

    // 1. Update Track ID
    if (trackIdText) trackIdText.textContent = `#${order.id}`;

    // 2. Update Status Pill
    if (statusPill) {
        statusPill.className = `status-pill status-badge-${order.status}`;
        statusPill.innerHTML = `<span class="status-dot dot-${order.status}"></span> ${order.statusText}`;
    }

    // 3. Update Courier details
    if (courierCard) {
        if (order.courier) {
            courierCard.innerHTML = `
                <div class="courier-avatar">
                    <i class="fa-solid fa-user-ninja"></i>
                </div>
                <div class="courier-details">
                    <div class="courier-name">${order.courier.name}</div>
                    <div class="courier-veh"><i class="fa-solid fa-bolt"></i> ${order.courier.vehicle}</div>
                    <div class="courier-rating"><i class="fa-solid fa-star"></i> ${order.courier.rating || '5.0'}</div>
                </div>
                <a href="tel:${order.courier.phone}" class="courier-call-btn" title="Kuryerga qo'ng'iroq qilish">
                    <i class="fa-solid fa-phone"></i>
                </a>
            `;
        } else {
            courierCard.innerHTML = `
                <div class="courier-avatar" style="background: rgba(245, 158, 11, 0.2); color: var(--accent-amber);">
                    <i class="fa-solid fa-clock"></i>
                </div>
                <div class="courier-details">
                    <div class="courier-name">Dispetcher Tasdiqlashi Kutilmoqda</div>
                    <div class="courier-veh">Admin buyurtmani tasdiqlashi bilan kuryer biriktiriladi</div>
                </div>
                <div class="courier-call-btn" style="opacity: 0.5; cursor: default;">
                    <i class="fa-solid fa-hourglass-half"></i>
                </div>
            `;
        }
    }

    // 4. Update Map Pins
    if (originPinLabel) originPinLabel.textContent = order.pickupAddress;
    if (destPinLabel) destPinLabel.textContent = order.deliveryAddress;

    // 5. Update Map Vehicle Icon
    if (mapVehIcon) {
        if (order.vehicleType === 'bike') mapVehIcon.className = "fa-solid fa-motorcycle";
        else if (order.vehicleType === 'car') mapVehIcon.className = "fa-solid fa-car-side";
        else if (order.vehicleType === 'isuzu') mapVehIcon.className = "fa-solid fa-truck-pickup";
        else mapVehIcon.className = "fa-solid fa-truck-moving";
    }

    // 6. Update Timeline
    if (timelineContainer && order.timeline) {
        timelineContainer.innerHTML = order.timeline.map((step, idx) => {
            const isCompleted = step.completed;
            const isActive = isCompleted && idx === order.timeline.filter(t => t.completed).length - 1;
            const stepClass = isCompleted ? (isActive ? 'timeline-step active' : 'timeline-step completed') : 'timeline-step';

            let iconHtml = '<i class="fa-solid fa-circle"></i>';
            if (idx === 0) iconHtml = '<i class="fa-solid fa-check"></i>';
            else if (idx === 1) iconHtml = '<i class="fa-solid fa-user-check"></i>';
            else if (idx === 2) iconHtml = '<i class="fa-solid fa-truck-fast"></i>';
            else if (idx === 3) iconHtml = '<i class="fa-solid fa-house-chimney"></i>';

            return `
                <div class="${stepClass}">
                    <div class="step-icon">${iconHtml}</div>
                    <div class="step-info">
                        <h4>${step.title}</h4>
                        <p>${step.time}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 7. Restart Map Vehicle Animation
    if (movingVeh) {
        movingVeh.style.animation = 'none';
        void movingVeh.offsetWidth;
        movingVeh.style.animation = 'vehicleDrive 10s ease-in-out infinite alternate';
    }

    if (showFeedback) {
        showToast(`Buyurtma #${order.id} ma'lumotlari yangilandi! Holat: ${order.statusText}`);
    }
}

// ===================================================================
// 9. TOAST NOTIFICATION UTILITY
// ===================================================================

function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i class="fa-solid fa-bell" style="color: var(--accent-cyan);"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = '0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}
