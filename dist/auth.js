"use strict";
function ambilSesi() {
    const data = localStorage.getItem("sesiAntrian");
    if (data === null) {
        return null;
    }
    return JSON.parse(data);
}
function cekAdmin() {
    const sesi = ambilSesi();
    if (sesi === null) {
        window.location.href = "login.html";
        return;
    }
    if (sesi.role !== "admin" && sesi.role !== "moderator") {
        window.location.href = "login.html";
    }
}
function logout() {
    localStorage.removeItem("sesiAntrian");
    window.location.href = "login.html";
}
