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
const daftarNavigasi = [
    { label: "Dashboard", href: "index.html", bukaTabBaru: false },
    { label: "Operator", href: "operator.html", bukaTabBaru: false },
    { label: "Ambil Antrean", href: "ambil-antrian.html", bukaTabBaru: false },
    { label: "Layar Antrean", href: "layar.html", bukaTabBaru: true }
];
// Halaman yang boleh dibuka tiap role — mencerminkan guard per halaman:
// admin & moderator boleh semua halaman; user hanya ambil antrean + layar.
function halamanDiizinkanPeran(role) {
    if (role === "admin" || role === "moderator") {
        return ["index.html", "operator.html", "ambil-antrian.html", "layar.html"];
    }
    if (role === "user") {
        return ["ambil-antrian.html", "layar.html"];
    }
    return [];
}
// Nama file halaman yang sedang dibuka, untuk menandai tautan aktif.
// Mengembalikan "" bila lokasi tidak terbaca (mis. di lingkungan uji).
function halamanSaatIni() {
    const jalur = window.location.pathname;
    if (typeof jalur !== "string") {
        return "";
    }
    const mentah = jalur.split("/").pop() ?? "";
    const bagian = mentah.split("?")[0].split("#")[0];
    if (bagian === "") {
        return "index.html"; // dibuka lewat folder, index menjadi halaman awal
    }
    return bagian;
}
// Render isi navbar berdasarkan role yang tersimpan di sesi autentikasi.
// Tautan yang tidak berhak tidak pernah dibuat (bukan sekadar disembunyikan
// lewat CSS), halaman yang sedang dibuka ditandai aria-current="page".
function renderNavigasiPeran(sesi) {
    const nav = document.querySelector("nav[aria-label]");
    if (nav === null) {
        return; // halaman tanpa navbar (mis. bila container nav tidak tersedia)
    }
    const diizinkan = halamanDiizinkanPeran(sesi.role);
    const halamanIni = halamanSaatIni();
    nav.textContent = "";
    for (const item of daftarNavigasi) {
        if (!diizinkan.includes(item.href)) {
            continue;
        }
        const tautan = document.createElement("a");
        tautan.setAttribute("href", item.href);
        if (item.href === halamanIni) {
            tautan.setAttribute("aria-current", "page");
        }
        else if (item.bukaTabBaru) {
            tautan.setAttribute("target", "_blank");
            tautan.setAttribute("rel", "noopener");
        }
        tautan.textContent = item.label;
        nav.appendChild(tautan);
    }
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
    // Navbar dirender dari role sesi: hanya halaman yang berhak yang tampil.
    renderNavigasiPeran(sesi);
    return sesi;
}
function logout() {
    localStorage.removeItem("sesiAntrian");
    window.location.href = "login.html";
}
