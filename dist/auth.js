"use strict";
// Penjaga autentikasi & role bersama untuk semua halaman yang dilindungi.
// auth.js dimuat sebagai skrip biasa (bukan module) SEBELUM skrip halaman,
// sehingga fungsi di bawah tersedia global pada halaman tersebut.
function isRecordAuth(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
// Membaca sesi dari localStorage dengan parsing defensif.
// Mengembalikan null bila data tidak ada atau tidak valid.
function ambilSesi() {
    const data = localStorage.getItem("sesiAntrian");
    if (data === null) {
        return null;
    }
    try {
        const parsed = JSON.parse(data);
        if (!isRecordAuth(parsed) ||
            typeof parsed.token !== "string" ||
            typeof parsed.role !== "string" ||
            typeof parsed.firstName !== "string" ||
            typeof parsed.username !== "string") {
            return null;
        }
        return {
            token: parsed.token,
            role: parsed.role.toLowerCase(),
            firstName: parsed.firstName,
            username: parsed.username
        };
    }
    catch {
        return null;
    }
}
// Halaman tujuan untuk sebuah role ketika ia mengakses halaman yang tidak
// diizinkan. Mengembalikan null bila role tidak dikenal.
function halamanTujuanPeran(role) {
    if (role === "admin" || role === "moderator") {
        return "index.html";
    }
    if (role === "user") {
        return "ambil-antrian.html";
    }
    return null;
}
// Guard utama: pastikan pengguna sudah login dan role-nya diizinkan mengakses
// halaman saat ini. Mengembalikan sesi bila lolos; selain itu mengalihkan
// halaman dan mengembalikan null (pemanggil wajib berhenti melakukan init).
function periksaAksesHalaman(daftarPeranDiizinkan) {
    const sesi = ambilSesi();
    if (sesi === null) {
        // Belum login atau data sesi tidak valid — bersihkan sesi lalu ke login.
        localStorage.removeItem("sesiAntrian");
        window.location.href = "login.html";
        return null;
    }
    if (!daftarPeranDiizinkan.includes(sesi.role)) {
        const tujuan = halamanTujuanPeran(sesi.role);
        if (tujuan === null) {
            // Role tidak dikenal dianggap sesi tidak sah.
            localStorage.removeItem("sesiAntrian");
            window.location.href = "login.html";
            return null;
        }
        // Sudah login tetapi tidak berhak: arahkan ke halaman yang boleh diakses
        // (mencegah redirect berulang antarhalaman yang sama sekali tidak boleh).
        window.location.href = tujuan;
        return null;
    }
    return sesi;
}
function logout() {
    localStorage.removeItem("sesiAntrian");
    window.location.href = "login.html";
}
