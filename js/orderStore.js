/**
 * YETKAZ PRO — Centralized Order Store & Real-time State Management
 * Works seamlessly across client and admin panels with LocalStorage synchronization.
 */

const ORDER_STORAGE_KEY = 'yetkazpro_orders_v2';

const INITIAL_SAMPLE_ORDERS = [
    {
        id: "YKZ-88219",
        clientName: "Jasur Aliyev",
        clientPhone: "+998 90 123 45 67",
        dept: "parcel",
        deptName: "Pochta & Kichik Yuklar",
        itemDescription: "iPhone 15 Pro Max qutisi va Apple Watch Series 9",
        weight: "1.2 kg",
        weightKg: 1.2,
        vehicleType: "bike",
        vehicleName: "Elektro-skuter / Bike",
        pickupAddress: "Toshkent, Chilonzor 9-mavze, 12-uy",
        deliveryAddress: "Toshkent, Yunusobod 4-mavze, 45-uy",
        distanceKm: 14,
        priceSoM: 28000,
        speed: "express",
        status: "in_transit", // pending, confirmed, in_transit, delivered, cancelled
        statusText: "Yo'lda (Yetkazilmoqda)",
        courier: {
            name: "Jasur Aliyev",
            phone: "+998 90 772 11 00",
            vehicle: "Niu NQi Elektro-skuter (01 772 AAA)",
            rating: "4.98"
        },
        createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        timeline: [
            { title: "Buyurtma qabul qilindi", time: "35 daqiqa oldin", completed: true },
            { title: "Admin tomonidan tasdiqlandi", time: "25 daqiqa oldin", completed: true },
            { title: "Kuryerga topshirildi va yo'lga chiqdi", time: "15 daqiqa oldin", completed: true },
            { title: "Mijozga topshirish", time: "Kutilmoqda (~10 daq)", completed: false }
        ]
    },
    {
        id: "YKZ-44120",
        clientName: "Dilnoza Rahimova",
        clientPhone: "+998 93 555 43 21",
        dept: "food",
        deptName: "Oziq-ovqat Bo'limi",
        itemDescription: "Milliy taomlar restorani (4 ta osh, salatlar va issiq nonlar)",
        weight: "3.5 kg",
        weightKg: 3.5,
        vehicleType: "bike",
        vehicleName: "Elektro-velik (Termoboks)",
        pickupAddress: "Shayxontohur tumani, Navoiy ko'chasi 24",
        deliveryAddress: "Yakkasaroy tumani, Shota Rustaveli 112",
        distanceKm: 6,
        priceSoM: 22000,
        speed: "express",
        status: "pending",
        statusText: "Yangi (Tasdiqlash kutilmoqda)",
        courier: null,
        createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        timeline: [
            { title: "Buyurtma qabul qilindi", time: "8 daqiqa oldin", completed: true },
            { title: "Admin tomonidan tasdiqlash", time: "Kutilmoqda...", completed: false },
            { title: "Kuryerga topshirish", time: "Kutilmoqda", completed: false },
            { title: "Mijozga topshirish", time: "Kutilmoqda", completed: false }
        ]
    },
    {
        id: "YKZ-63104",
        clientName: "Bobur Umarov (Comfort Santex)",
        clientPhone: "+998 97 711 00 22",
        dept: "plumbing",
        deptName: "Santexnika Bo'limi",
        itemDescription: "2 ta 24kW ikki konturli kombi qozoni va 40 metr PPR quvurlar",
        weight: "145 kg",
        weightKg: 145,
        vehicleType: "car",
        vehicleName: "Chevrolet Damas / Labo",
        pickupAddress: "Bekto'pi bozori, Santexnika qatori 4-do'kon",
        deliveryAddress: "Sergeli tumani, Yangi Choshtepa mavzesi 18-uy",
        distanceKm: 22,
        priceSoM: 125000,
        speed: "standard",
        status: "confirmed",
        statusText: "Tasdiqlandi (Yuklanmoqda)",
        courier: {
            name: "Rustam Qodirov",
            phone: "+998 91 333 88 99",
            vehicle: "Chevrolet Labo Bortli (01 445 BCA)",
            rating: "4.92"
        },
        createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
        timeline: [
            { title: "Buyurtma qabul qilindi", time: "55 daqiqa oldin", completed: true },
            { title: "Admin tomonidan tasdiqlandi", time: "40 daqiqa oldin", completed: true },
            { title: "Yuk avtomobilga ortilmoqda", time: "Hozir", completed: true },
            { title: "Manzilga yetkazildi", time: "Kutilmoqda", completed: false }
        ]
    },
    {
        id: "YKZ-91255",
        clientName: "Azizbek Karimov (Metal Stroy)",
        clientPhone: "+998 99 888 12 34",
        dept: "metal",
        deptName: "Metall Bo'limi",
        itemDescription: "14-diametrli po'lat armatura (6 metrli) va 10 ta metall shveller",
        weight: "4 200 kg",
        weightKg: 4200,
        vehicleType: "isuzu",
        vehicleName: "Isuzu 5t Ochiq bort",
        pickupAddress: "Chilonzor metall bazasi, 2-ombor",
        deliveryAddress: "Qibray tumani, Bino qurilish uchastkasi",
        distanceKm: 38,
        priceSoM: 450000,
        speed: "standard",
        status: "delivered",
        statusText: "Muvaffaqiyatli Yetkazildi",
        courier: {
            name: "Dilshod Toshmatov",
            phone: "+998 94 222 34 56",
            vehicle: "Isuzu NPR Ochiq bort (01 890 XAA)",
            rating: "5.0"
        },
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        timeline: [
            { title: "Buyurtma qabul qilindi", time: "4 soat oldin", completed: true },
            { title: "Admin tomonidan tasdiqlandi", time: "3.5 soat oldin", completed: true },
            { title: "Kran orqali yuklandi va jo'natildi", time: "2 soat oldin", completed: true },
            { title: "Manzilga topshirildi", time: "30 daqiqa oldin", completed: true }
        ]
    },
    {
        id: "YKZ-10523",
        clientName: "Farrux Eshmatov (Global Logistics)",
        clientPhone: "+998 90 999 00 11",
        dept: "truck",
        deptName: "Katta Trak & Fura Logistika",
        itemDescription: "22 tonna qadoqlangan oziq-ovqat va konservalar to'plami (30 palet)",
        weight: "22 000 kg",
        weightKg: 22000,
        vehicleType: "fura",
        vehicleName: "MAN TGX 24t Tent Fura",
        pickupAddress: "Toshkent shahri, Erkin logistika markazi",
        deliveryAddress: "Samarqand shahri, Dagbitskaya sanoat bazasi",
        distanceKm: 310,
        priceSoM: 3850000,
        speed: "standard",
        status: "in_transit",
        statusText: "Yo'lda (M39 Magistralida)",
        courier: {
            name: "Farhod Mirzayev",
            phone: "+998 93 111 22 33",
            vehicle: "MAN TGX 18.480 TIR (01 112 TIR)",
            rating: "4.95"
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        timeline: [
            { title: "Yuklash va plombalash yakunlandi", time: "2 soat oldin", completed: true },
            { title: "Admin tomonidan tasdiqlandi", time: "1.8 soat oldin", completed: true },
            { title: "Toshkent - Samarqand trassasida harakatlanmoqda", time: "Yo'lda (75 km/h)", completed: true },
            { title: "Samarqand omboriga yetib borish", time: "Kutilmoqda (~2.5 soat)", completed: false }
        ]
    }
];

// Unified Order Management Object
const OrderStore = {
    // Get all orders from localStorage or initialize with sample data
    getAll() {
        try {
            const raw = localStorage.getItem(ORDER_STORAGE_KEY);
            if (!raw) {
                this.saveAll(INITIAL_SAMPLE_ORDERS);
                return INITIAL_SAMPLE_ORDERS;
            }
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed) || parsed.length === 0) {
                this.saveAll(INITIAL_SAMPLE_ORDERS);
                return INITIAL_SAMPLE_ORDERS;
            }
            return parsed;
        } catch (e) {
            console.error("Error reading orders:", e);
            return INITIAL_SAMPLE_ORDERS;
        }
    },

    // Save full list
    saveAll(orders) {
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
        this.triggerChangeEvent();
    },

    // Get order by track code
    getById(orderId) {
        if (!orderId) return null;
        const cleanId = orderId.trim().toUpperCase().replace('#', '');
        const orders = this.getAll();
        return orders.find(o => o.id.toUpperCase() === cleanId) || null;
    },

    // Add a new order
    add(orderData) {
        const orders = this.getAll();
        const newOrder = {
            id: orderData.id || ('YKZ-' + Math.floor(10000 + Math.random() * 90000)),
            clientName: orderData.clientName || "Noma'lum Mijoz",
            clientPhone: orderData.clientPhone || "+998 -- --- -- --",
            dept: orderData.dept || "parcel",
            deptName: this.getDeptName(orderData.dept),
            itemDescription: orderData.itemDescription || "Buyurtma yuki",
            weight: orderData.weight || "5 kg",
            weightKg: parseFloat(orderData.weightKg) || 5,
            vehicleType: orderData.vehicleType || "bike",
            vehicleName: this.getVehicleName(orderData.vehicleType),
            pickupAddress: orderData.pickupAddress || "Toshkent shahri",
            deliveryAddress: orderData.deliveryAddress || "Toshkent shahri",
            distanceKm: parseFloat(orderData.distanceKm) || 10,
            priceSoM: parseInt(orderData.priceSoM) || 30000,
            speed: orderData.speed || "standard",
            status: "pending",
            statusText: "Yangi (Tasdiqlash kutilmoqda)",
            courier: null,
            createdAt: new Date().toISOString(),
            timeline: [
                { title: "Buyurtma qabul qilindi", time: "Hozir", completed: true },
                { title: "Admin tomonidan tasdiqlash", time: "Kutilmoqda...", completed: false },
                { title: "Transportga yuklash va yo'lga chiqish", time: "Kutilmoqda", completed: false },
                { title: "Mijozga yetkazish", time: "Kutilmoqda", completed: false }
            ]
        };

        orders.unshift(newOrder); // Add to beginning
        this.saveAll(orders);
        this.playNotificationSound();
        return newOrder;
    },

    // Update order status (Confirm, In-transit, Deliver, Cancel)
    updateStatus(orderId, newStatus, courierData = null) {
        const orders = this.getAll();
        const index = orders.findIndex(o => o.id === orderId);
        if (index === -1) return null;

        const order = orders[index];
        order.status = newStatus;

        if (courierData) {
            order.courier = courierData;
        }

        // Adjust status text and timeline
        if (newStatus === 'confirmed') {
            order.statusText = "Tasdiqlandi (Kuryerga biriktirildi)";
            if (!order.courier) {
                order.courier = this.getDefaultCourierForVehicle(order.vehicleType);
            }
            order.timeline[1].completed = true;
            order.timeline[1].time = "Tasdiqlandi";
            order.timeline[2].time = "Yuklanmoqda";
        } else if (newStatus === 'in_transit') {
            order.statusText = "Yo'lda (Yetkazilmoqda)";
            if (!order.courier) {
                order.courier = this.getDefaultCourierForVehicle(order.vehicleType);
            }
            order.timeline[0].completed = true;
            order.timeline[1].completed = true;
            order.timeline[2].completed = true;
            order.timeline[2].time = "Yo'lda harakatlanmoqda";
            order.timeline[3].time = "Kutilmoqda";
        } else if (newStatus === 'delivered') {
            order.statusText = "Muvaffaqiyatli Yetkazildi";
            order.timeline.forEach(t => t.completed = true);
            order.timeline[3].time = "Yetkazildi (" + new Date().toLocaleTimeString().slice(0, 5) + ")";
        } else if (newStatus === 'cancelled') {
            order.statusText = "Bekor qilindi";
        }

        orders[index] = order;
        this.saveAll(orders);
        return order;
    },

    // Delete order
    delete(orderId) {
        let orders = this.getAll();
        orders = orders.filter(o => o.id !== orderId);
        this.saveAll(orders);
        return true;
    },

    // Reset data
    resetDefaults() {
        this.saveAll(INITIAL_SAMPLE_ORDERS);
        return INITIAL_SAMPLE_ORDERS;
    },

    // Helpers
    getDeptName(deptKey) {
        const map = {
            food: "Oziq-ovqat Bo'limi",
            parcel: "Pochta & Kichik Yuklar",
            plumbing: "Santexnika Bo'limi",
            metal: "Metall Bo'limi",
            truck: "Katta Trak & Fura"
        };
        return map[deptKey] || "Boshqa";
    },

    getVehicleName(vehType) {
        const map = {
            bike: "Elektro-velik / Skuter",
            car: "Damas / Labo / Yengil Avto",
            isuzu: "Isuzu / Gazel (5t)",
            fura: "Katta Fura / TIR Traki (35t)"
        };
        return map[vehType] || "Transport";
    },

    getDefaultCourierForVehicle(vehType) {
        if (vehType === 'bike') {
            return {
                name: "Jasur Aliyev",
                phone: "+998 90 772 11 00",
                vehicle: "Niu NQi Elektro-skuter (01 772 AAA)",
                rating: "4.98"
            };
        } else if (vehType === 'car') {
            return {
                name: "Rustam Qodirov",
                phone: "+998 91 333 88 99",
                vehicle: "Chevrolet Labo Bortli (01 445 BCA)",
                rating: "4.92"
            };
        } else if (vehType === 'isuzu') {
            return {
                name: "Dilshod Toshmatov",
                phone: "+998 94 222 34 56",
                vehicle: "Isuzu NPR Furgon (01 890 XAA)",
                rating: "4.96"
            };
        } else {
            return {
                name: "Farhod Mirzayev",
                phone: "+998 93 111 22 33",
                vehicle: "MAN TGX 18.480 Fura (01 112 TIR)",
                rating: "4.99"
            };
        }
    },

    // Notify listeners
    triggerChangeEvent() {
        const event = new CustomEvent('yetkaz_orders_updated', {
            detail: { orders: this.getAll() }
        });
        window.dispatchEvent(event);
    },

    // Play modern chime sound with Web Audio API (no external file needed!)
    playNotificationSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.45);
        } catch (e) {
            // Audio context not allowed without interaction
        }
    }
};

// Expose globally
window.OrderStore = OrderStore;
