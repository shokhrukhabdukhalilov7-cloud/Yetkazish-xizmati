/**
 * YETKAZ PRO — Authentication & Courier Management System
 * Handles Admin, Client users, and Courier (Yuk yetkazib beruvchilar) credentials.
 */

const ADMIN_CREDS_KEY = 'yetkazpro_admin_creds_v2';
const CLIENT_USERS_KEY = 'yetkazpro_client_users_v2';
const COURIERS_STORAGE_KEY = 'yetkazpro_couriers_v2';
const CURRENT_SESSION_KEY = 'yetkazpro_current_session_v2';

// Default initial admin credentials: login=admin123, parol=admin123
const DEFAULT_ADMIN_CREDS = {
    username: "admin123",
    password: "admin123"
};

// Default sample registered clients
const DEFAULT_CLIENT_USERS = [
    {
        id: "CLI-1001",
        name: "Jasur Aliyev",
        phone: "+998 90 123 45 67",
        password: "123",
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
        id: "CLI-1002",
        name: "Dilnoza Rahimova",
        phone: "+998 93 555 43 21",
        password: "123",
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
        id: "CLI-1003",
        name: "Bobur Umarov (Comfort Santex)",
        phone: "+998 97 711 00 22",
        password: "123",
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
        id: "CLI-1004",
        name: "Azizbek Karimov (Metal Stroy)",
        phone: "+998 99 888 12 34",
        password: "123",
        createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
        id: "CLI-1005",
        name: "Farrux Eshmatov (Global Logistics)",
        phone: "+998 90 999 00 11",
        password: "123",
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString()
    }
];

// Default sample couriers / drivers (Yuk yetkazib beruvchilar)
const DEFAULT_COURIERS = [
    {
        id: "KUR-101",
        name: "Jasur Aliyev",
        phone: "+998 90 772 11 00",
        vehicleType: "bike",
        vehicleName: "Niu NQi Elektro-skuter",
        plateNumber: "01 772 AAA",
        username: "jasur_skuter",
        password: "123",
        status: "on_delivery",
        statusText: "Yo'lda (Yetkazmoqda)",
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
    },
    {
        id: "KUR-102",
        name: "Rustam Qodirov",
        phone: "+998 91 333 88 99",
        vehicleType: "car",
        vehicleName: "Chevrolet Labo Bortli",
        plateNumber: "01 445 BCA",
        username: "rustam_labo",
        password: "123",
        status: "available",
        statusText: "Bo'sh (Buyurtmaga tayyor)",
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
        id: "KUR-103",
        name: "Dilshod Toshmatov",
        phone: "+998 94 222 34 56",
        vehicleType: "isuzu",
        vehicleName: "Isuzu NPR 5t Ochiq bort",
        plateNumber: "01 890 XAA",
        username: "dilshod_isuzu",
        password: "123",
        status: "available",
        statusText: "Bo'sh (Buyurtmaga tayyor)",
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
        id: "KUR-104",
        name: "Farhod Mirzayev",
        phone: "+998 93 111 22 33",
        vehicleType: "fura",
        vehicleName: "MAN TGX 18.480 TIR Fura",
        plateNumber: "01 112 TIR",
        username: "farhod_fura",
        password: "123",
        status: "on_delivery",
        statusText: "Yo'lda (M39 Magistralida)",
        createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
    }
];

// ===================================================================
// 1. AUTH MANAGEMENT (ADMIN & CLIENTS)
// ===================================================================

const Auth = {
    getAdminCreds() {
        try {
            const raw = localStorage.getItem(ADMIN_CREDS_KEY);
            if (!raw) {
                localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify(DEFAULT_ADMIN_CREDS));
                return DEFAULT_ADMIN_CREDS;
            }
            return JSON.parse(raw);
        } catch (e) {
            return DEFAULT_ADMIN_CREDS;
        }
    },

    updateAdminCreds(oldPassword, newUsername, newPassword) {
        const current = this.getAdminCreds();

        if (current.password !== oldPassword) {
            return {
                success: false,
                message: "Eski parol noto'g'ri kiritildi! Iltimos, qayta tekshiring."
            };
        }

        if (!newUsername || newUsername.trim().length < 4) {
            return {
                success: false,
                message: "Yangi login kamida 4 ta belgidan iborat bo'lishi kerak!"
            };
        }

        if (!newPassword || newPassword.trim().length < 4) {
            return {
                success: false,
                message: "Yangi parol kamida 4 ta belgidan iborat bo'lishi kerak!"
            };
        }

        const updated = {
            username: newUsername.trim(),
            password: newPassword.trim()
        };

        localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify(updated));

        // Re-authenticate session with new credentials
        this.setSession({
            role: 'admin',
            username: updated.username
        });

        return {
            success: true,
            message: "Login va parol muvaffaqiyatli almashtirildi! Eski parol bekor qilindi."
        };
    },

    getClients() {
        try {
            const raw = localStorage.getItem(CLIENT_USERS_KEY);
            if (!raw) {
                localStorage.setItem(CLIENT_USERS_KEY, JSON.stringify(DEFAULT_CLIENT_USERS));
                return DEFAULT_CLIENT_USERS;
            }
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed) || parsed.length === 0) {
                localStorage.setItem(CLIENT_USERS_KEY, JSON.stringify(DEFAULT_CLIENT_USERS));
                return DEFAULT_CLIENT_USERS;
            }
            return parsed;
        } catch (e) {
            return DEFAULT_CLIENT_USERS;
        }
    },

    register(name, phone, password) {
        if (!name || name.trim().length < 2) {
            return { success: false, message: "Iltimos, to'liq ismingizni kiriting!" };
        }
        if (!phone || phone.trim().length < 9) {
            return { success: false, message: "Iltimos, to'g'ri telefon raqam kiriting!" };
        }
        if (!password || password.trim().length < 3) {
            return { success: false, message: "Parol kamida 3 ta belgidan iborat bo'lishi kerak!" };
        }

        const clients = this.getClients();
        const cleanPhone = phone.trim();

        const existing = clients.find(c => c.phone === cleanPhone);
        if (existing) {
            return {
                success: false,
                message: "Ushbu telefon raqam allaqachon ro'yxatdan o'tgan! Kirish bo'limidan foydalaning."
            };
        }

        const newClient = {
            id: 'CLI-' + Math.floor(1000 + Math.random() * 9000),
            name: name.trim(),
            phone: cleanPhone,
            password: password.trim(),
            createdAt: new Date().toISOString()
        };

        clients.unshift(newClient);
        localStorage.setItem(CLIENT_USERS_KEY, JSON.stringify(clients));

        this.setSession({
            role: 'client',
            user: {
                id: newClient.id,
                name: newClient.name,
                phone: newClient.phone
            }
        });

        return {
            success: true,
            message: `Xush kelibsiz, ${newClient.name}! Ro'yxatdan muvaffaqiyatli o'tdingiz.`,
            user: newClient
        };
    },

    login(identifier, password) {
        const idTrim = (identifier || '').trim();
        const passTrim = (password || '').trim();

        if (!idTrim || !passTrim) {
            return { success: false, message: "Login va parolni kiriting!" };
        }

        // 1. Check Admin Credentials FIRST
        const adminCreds = this.getAdminCreds();
        if (idTrim === adminCreds.username && passTrim === adminCreds.password) {
            this.setSession({
                role: 'admin',
                username: adminCreds.username,
                roleTitle: "DISPETCHER (ADMIN)"
            });
            return {
                success: true,
                role: 'admin',
                roleTitle: "DISPETCHER (ADMIN)",
                message: "🛡️ Siz ADMIN (Dispetcher) sifatida kirdingiz! Boshqaruv markaziga yo'naltirilmoqda...",
                redirect: 'admin.html'
            };
        }

        const inputDigits = idTrim.replace(/\D/g, '');

        // 2. Check Courier Credentials
        const couriers = CourierStore.getAll();
        const foundCourier = couriers.find(k => {
            if (k.password !== passTrim) return false;
            if (k.username && k.username.toLowerCase() === idTrim.toLowerCase()) return true;
            if (k.phone === idTrim) return true;
            const kDigits = (k.phone || '').replace(/\D/g, '');
            if (inputDigits.length >= 7 && kDigits.length >= 7) {
                return kDigits.slice(-9) === inputDigits.slice(-9);
            }
            return false;
        });

        if (foundCourier) {
            this.setSession({
                role: 'courier',
                courier: foundCourier,
                roleTitle: "KURYER (HAYDOVCHI)"
            });
            return {
                success: true,
                role: 'courier',
                roleTitle: "KURYER (HAYDOVCHI)",
                message: `🛵 Siz KURYER sifatida kirdingiz: ${foundCourier.name} (${foundCourier.vehicleName})! Kuryer kabinetiga yo'naltirilmoqda...`,
                courier: foundCourier,
                redirect: 'courier.html'
            };
        }

        // 3. Check Client Users
        const clients = this.getClients();
        const found = clients.find(c => {
            if (c.password !== passTrim) return false;
            if (c.name && c.name.toLowerCase() === idTrim.toLowerCase()) return true;
            if (c.phone === idTrim) return true;
            const cDigits = (c.phone || '').replace(/\D/g, '');
            if (inputDigits.length >= 7 && cDigits.length >= 7) {
                return cDigits.slice(-9) === inputDigits.slice(-9);
            }
            return false;
        });

        if (found) {
            this.setSession({
                role: 'client',
                user: {
                    id: found.id,
                    name: found.name,
                    phone: found.phone
                },
                roleTitle: "MIJOZ (BUYURTMACHI)"
            });
            return {
                success: true,
                role: 'client',
                roleTitle: "MIJOZ (BUYURTMACHI)",
                message: `👤 Siz MIJOZ shaxsiy profilidasiz: ${found.name}! Xush kelibsiz.`,
                user: found
            };
        }

        return {
            success: false,
            message: "Login yoki parol noto'g'ri! Iltimos, tekshirib qayta kiriting."
        };
    },

    setSession(sessionData) {
        localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(sessionData));
        window.dispatchEvent(new CustomEvent('yetkaz_auth_changed', { detail: sessionData }));
    },

    getSession() {
        try {
            const raw = localStorage.getItem(CURRENT_SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    getUserRole() {
        const session = this.getSession();
        return session ? session.role : null;
    },

    getCurrentUser() {
        const session = this.getSession();
        if (session && session.role === 'client') {
            return session.user;
        }
        return null;
    },

    getCurrentCourier() {
        const session = this.getSession();
        if (session && session.role === 'courier') {
            return session.courier;
        }
        return null;
    },

    isClientLoggedIn() {
        const session = this.getSession();
        return !!(session && session.role === 'client');
    },

    isCourierLoggedIn() {
        const session = this.getSession();
        return !!(session && session.role === 'courier');
    },

    isAdminLoggedIn() {
        const session = this.getSession();
        return !!(session && session.role === 'admin');
    },

    logout() {
        localStorage.removeItem(CURRENT_SESSION_KEY);
        window.dispatchEvent(new CustomEvent('yetkaz_auth_changed', { detail: null }));
    }
};

// ===================================================================
// 2. COURIER STORE (YUK YETKAZIB BERUVCHILAR / KURYERLAR FLOTI)
// ===================================================================

const CourierStore = {
    getAll() {
        try {
            const raw = localStorage.getItem(COURIERS_STORAGE_KEY);
            if (!raw) {
                localStorage.setItem(COURIERS_STORAGE_KEY, JSON.stringify(DEFAULT_COURIERS));
                return DEFAULT_COURIERS;
            }
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed) || parsed.length === 0) {
                localStorage.setItem(COURIERS_STORAGE_KEY, JSON.stringify(DEFAULT_COURIERS));
                return DEFAULT_COURIERS;
            }
            return parsed;
        } catch (e) {
            return DEFAULT_COURIERS;
        }
    },

    saveAll(couriers) {
        localStorage.setItem(COURIERS_STORAGE_KEY, JSON.stringify(couriers));
        window.dispatchEvent(new CustomEvent('yetkaz_couriers_updated', { detail: couriers }));
    },

    add(data) {
        if (!data.name || data.name.trim().length < 2) {
            return { success: false, message: "Kuryer ism va familiyasini to'liq kiriting!" };
        }
        if (!data.phone || data.phone.trim().length < 7) {
            return { success: false, message: "Telefon raqamini kiriting!" };
        }
        if (!data.username || data.username.trim().length < 3) {
            return { success: false, message: "Kuryer uchun login kiriting!" };
        }
        if (!data.password || data.password.trim().length < 3) {
            return { success: false, message: "Kuryer uchun parol kiriting!" };
        }

        const couriers = this.getAll();
        const existing = couriers.find(k => k.username === data.username.trim());
        if (existing) {
            return { success: false, message: "Ushbu login band! Boshqa login tanlang." };
        }

        const newCourier = {
            id: 'KUR-' + Math.floor(100 + Math.random() * 900),
            name: data.name.trim(),
            phone: data.phone.trim(),
            vehicleType: data.vehicleType || "bike",
            vehicleName: data.vehicleName || "Skuter / Velik",
            plateNumber: data.plateNumber ? data.plateNumber.trim() : "Davlat raqamsiz",
            username: data.username.trim(),
            password: data.password.trim(),
            status: "available",
            statusText: "Bo'sh (Buyurtmaga tayyor)",
            createdAt: new Date().toISOString()
        };

        couriers.unshift(newCourier);
        this.saveAll(couriers);
        return { success: true, message: `Kuryer ${newCourier.name} tizimga muvaffaqiyatli qo'shildi!`, courier: newCourier };
    },

    delete(id) {
        let couriers = this.getAll();
        couriers = couriers.filter(k => k.id !== id);
        this.saveAll(couriers);
        return true;
    },

    getById(id) {
        const couriers = this.getAll();
        return couriers.find(k => k.id === id) || null;
    },

    updateStatus(id, newStatus, newStatusText) {
        const couriers = this.getAll();
        const courier = couriers.find(k => k.id === id);
        if (courier) {
            courier.status = newStatus;
            if (newStatusText) courier.statusText = newStatusText;
            this.saveAll(couriers);

            // Also update current session if this is the active courier!
            const session = Auth.getSession();
            if (session && session.role === 'courier' && session.courier.id === id) {
                session.courier.status = newStatus;
                if (newStatusText) session.courier.statusText = newStatusText;
                localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
            }
            return courier;
        }
        return null;
    },

    resetDefaults() {
        this.saveAll(DEFAULT_COURIERS);
        return DEFAULT_COURIERS;
    }
};

window.Auth = Auth;
window.CourierStore = CourierStore;

// ===================================================================
// 3. UZBEKISTAN PHONE NUMBER INPUT MASK (+998 XX XXX XX XX)
// ===================================================================

window.setupPhoneMask = function(inputEl, allowLetters = false) {
    if (!inputEl) return;

    // Set initial default value
    if (!inputEl.value || inputEl.value.trim() === '') {
        inputEl.value = '+998 ';
    }

    const setCursorToEnd = () => {
        if (inputEl.value === '+998 ') {
            setTimeout(() => {
                inputEl.setSelectionRange(5, 5);
            }, 10);
        }
    };

    inputEl.addEventListener('focus', () => {
        if (!inputEl.value || inputEl.value.trim() === '') {
            inputEl.value = '+998 ';
        }
        setCursorToEnd();
    });

    inputEl.addEventListener('click', () => {
        if (inputEl.value === '+998 ') {
            setCursorToEnd();
        }
    });

    inputEl.addEventListener('keydown', (e) => {
        if (allowLetters && (inputEl.value === '+998 ' || inputEl.value === '+998')) {
            // If user presses backspace on allowLetters input, clear so they can type username (e.g. admin123)
            if (e.key === 'Backspace') {
                inputEl.value = '';
                e.preventDefault();
                return;
            }
            // If user types a letter directly
            if (e.key.length === 1 && /[a-zA-Z_]/.test(e.key)) {
                inputEl.value = '';
                // normal typing will insert the key
            }
        } else if (!allowLetters) {
            if (e.key === 'Backspace' && (inputEl.value === '+998 ' || inputEl.value === '+998')) {
                e.preventDefault();
            }
        }
    });

    inputEl.addEventListener('input', () => {
        const val = inputEl.value;

        // If allowLetters is true (e.g. loginIdentifier which can be admin123):
        if (allowLetters) {
            if (/^[a-zA-Z_]/.test(val) || (val.length > 0 && !val.startsWith('+') && !/^\d/.test(val))) {
                return;
            }
        }

        // If user erased everything or left with '+' or '+9'
        if (!val || val === '+' || val === '+9' || val === '+99') {
            inputEl.value = '+998 ';
            return;
        }

        // Extract digits
        let digits = val.replace(/\D/g, '');
        if (digits.startsWith('998')) {
            digits = digits.slice(3);
        }
        digits = digits.slice(0, 9); // 9 digits max: 2 digit code + 7 digit number

        // Format: +998 XX XXX XX XX
        let formatted = '+998';
        if (digits.length > 0) formatted += ' ' + digits.slice(0, 2);
        if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
        if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
        if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);

        inputEl.value = formatted;
    });
};
