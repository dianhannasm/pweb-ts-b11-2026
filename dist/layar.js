"use strict";
function isRecordLayar(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function elemenLayar(id, tipe) {
    const target = document.getElementById(id);
    if (!(target instanceof tipe)) {
        throw new Error(`Elemen halaman tidak ditemukan: ${id}`);
    }
    return target;
}
function bacaJenisAntreanLayar() {
    const data = localStorage.getItem("jenisAntrean");
    if (data === null)
        return [];
    try {
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter(isRecordLayar).flatMap((item) => {
            if (typeof item.kode !== "string" ||
                typeof item.nama !== "string" ||
                typeof item.aktif !== "boolean") {
                return [];
            }
            return [{
                    kode: item.kode,
                    nama: item.nama,
                    aktif: item.aktif
                }];
        });
    }
    catch {
        return [];
    }
}
function bacaDaftarTiketLayar() {
    const data = localStorage.getItem("daftarAntrean");
    if (data === null)
        return [];
    try {
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter(isRecordLayar).flatMap((item) => {
            if (typeof item.nomor !== "string" ||
                typeof item.kode !== "string" ||
                typeof item.namaLayanan !== "string" ||
                typeof item.prioritas !== "string" ||
                typeof item.waktu !== "string") {
                return [];
            }
            const status = item.status === "Dipanggil" ||
                item.status === "Selesai" ||
                item.status === "Dilewati"
                ? item.status
                : "Menunggu";
            return [{
                    nomor: item.nomor,
                    kode: item.kode,
                    namaLayanan: item.namaLayanan,
                    prioritas: item.prioritas,
                    waktu: item.waktu,
                    status: status
                }];
        });
    }
    catch {
        return [];
    }
}
const urutanPrioritasLayar = {
    VIP: 0,
    Disabilitas: 1,
    Lansia: 2,
    Normal: 3
};
function renderLayarMonitor() {
    const jenisList = bacaJenisAntreanLayar().filter((j) => j.aktif);
    const daftarTiket = bacaDaftarTiketLayar();
    const nomorUtama = elemenLayar("nomorUtama", HTMLHeadingElement);
    const layananUtama = elemenLayar("layananUtama", HTMLParagraphElement);
    const metaUtama = elemenLayar("metaUtama", HTMLDivElement);
    const prioritasUtama = elemenLayar("prioritasUtama", HTMLSpanElement);
    const waktuUtama = elemenLayar("waktuUtama", HTMLSpanElement);
    const panelLayanan = elemenLayar("panelLayanan", HTMLDivElement);
    // Cari tiket yang saat ini berstatus "Dipanggil".
    // Bisa lebih dari satu poli aktif bersamaan, jadi tampilkan yang terakhir dipanggil.
    const tiketDipanggilUtama = [...daftarTiket]
        .reverse()
        .find((t) => t.status === "Dipanggil");
    if (tiketDipanggilUtama !== undefined) {
        nomorUtama.textContent = tiketDipanggilUtama.nomor;
        layananUtama.textContent = `${tiketDipanggilUtama.namaLayanan} (Kode ${tiketDipanggilUtama.kode})`;
        prioritasUtama.textContent = tiketDipanggilUtama.prioritas;
        prioritasUtama.className = `badge-prioritas prioritas-${tiketDipanggilUtama.prioritas.toLowerCase()}`;
        waktuUtama.textContent = `Waktu: ${tiketDipanggilUtama.waktu}`;
        metaUtama.hidden = false;
    }
    else {
        nomorUtama.textContent = "—";
        layananUtama.textContent = "Belum ada nomor antrean yang dipanggil";
        metaUtama.hidden = true;
    }
    // Render Panel Layar per Jenis Antrean Aktif
    panelLayanan.replaceChildren();
    if (jenisList.length === 0) {
        const pesanKosong = document.createElement("p");
        pesanKosong.className = "pesan-layanan-kosong";
        pesanKosong.textContent = "Belum ada jenis layanan antrean aktif saat ini.";
        panelLayanan.appendChild(pesanKosong);
        return;
    }
    jenisList.forEach((jenis) => {
        const kartu = document.createElement("article");
        kartu.className = "kartu-panel-layar";
        // Cari tiket yang sedang "Dipanggil" untuk layanan ini
        const tiketDipanggilJenis = daftarTiket.find((t) => t.kode === jenis.kode && t.status === "Dipanggil");
        // Ambil antrean berstatus "Menunggu" untuk layanan ini, urutkan berdasarkan hirarki prioritas
        const tiketMenunggu = daftarTiket
            .map((tiket, index) => ({ tiket, index }))
            .filter(({ tiket }) => tiket.kode === jenis.kode && tiket.status === "Menunggu")
            .sort((a, b) => {
            const pA = urutanPrioritasLayar[a.tiket.prioritas] ?? 3;
            const pB = urutanPrioritasLayar[b.tiket.prioritas] ?? 3;
            return pA - pB || a.index - b.index;
        })
            .map(({ tiket }) => tiket);
        // 1. Header kartu: Nama Layanan & Kode
        const header = document.createElement("div");
        header.className = "kartu-panel-header";
        const infoLayanan = document.createElement("div");
        const namaLayanan = document.createElement("h3");
        namaLayanan.className = "nama-layanan";
        namaLayanan.textContent = jenis.nama;
        infoLayanan.appendChild(namaLayanan);
        const kodeBadge = document.createElement("span");
        kodeBadge.className = "kode-badge";
        kodeBadge.textContent = jenis.kode;
        header.appendChild(infoLayanan);
        header.appendChild(kodeBadge);
        // 2. Body kartu: Nomor Sedang Dipanggil
        const body = document.createElement("div");
        body.className = "kartu-panel-body";
        const labelDipanggil = document.createElement("span");
        labelDipanggil.className = "label-status";
        labelDipanggil.textContent = "Sedang Dipanggil";
        const nomorDipanggil = document.createElement("div");
        nomorDipanggil.className = "nomor-dipanggil";
        nomorDipanggil.textContent = tiketDipanggilJenis !== undefined ? tiketDipanggilJenis.nomor : "—";
        body.appendChild(labelDipanggil);
        body.appendChild(nomorDipanggil);
        // 3. Footer kartu: Nomor Berikutnya & Jumlah Menunggu
        const footer = document.createElement("div");
        footer.className = "kartu-panel-footer";
        const barisBerikutnya = document.createElement("div");
        barisBerikutnya.className = "baris-info";
        const labelBerikutnya = document.createElement("span");
        labelBerikutnya.className = "label-info";
        labelBerikutnya.textContent = "Berikutnya:";
        const nilaiBerikutnya = document.createElement("strong");
        nilaiBerikutnya.className = "nilai-berikutnya";
        nilaiBerikutnya.textContent = tiketMenunggu.length > 0 ? tiketMenunggu[0].nomor : "—";
        barisBerikutnya.appendChild(labelBerikutnya);
        barisBerikutnya.appendChild(nilaiBerikutnya);
        const barisSisa = document.createElement("div");
        barisSisa.className = "baris-info";
        const labelSisa = document.createElement("span");
        labelSisa.className = "label-info";
        labelSisa.textContent = "Menunggu:";
        const sisaBadge = document.createElement("span");
        sisaBadge.className = "sisa-antrean-badge";
        sisaBadge.textContent = `${tiketMenunggu.length} Orang`;
        barisSisa.appendChild(labelSisa);
        barisSisa.appendChild(sisaBadge);
        footer.appendChild(barisBerikutnya);
        footer.appendChild(barisSisa);
        kartu.appendChild(header);
        kartu.appendChild(body);
        kartu.appendChild(footer);
        panelLayanan.appendChild(kartu);
    });
}
function inisialisasiLayar() {
    const tombolFullscreen = elemenLayar("tombolFullscreen", HTMLButtonElement);
    tombolFullscreen.addEventListener("click", () => {
        if (document.fullscreenElement === null) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {
                    // Tangani jika fullscreen tidak diizinkan oleh peramban
                });
            }
        }
        else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {
                    // Tangani jika keluar fullscreen gagal
                });
            }
        }
    });
    document.addEventListener("fullscreenchange", () => {
        if (document.fullscreenElement !== null) {
            tombolFullscreen.textContent = "⛶ Keluar Layar Penuh";
        }
        else {
            tombolFullscreen.textContent = "⛶ Layar Penuh";
        }
    });
    // Render awal
    renderLayarMonitor();
    // Polling otomatis setiap 2.5 detik (interval 2-3 detik) tanpa reload halaman
    setInterval(renderLayarMonitor, 2500);
    // Sinkronisasi otomatis saat ada event storage dari tab lain
    window.addEventListener("storage", (event) => {
        if (event.key === "jenisAntrean" || event.key === "daftarAntrean") {
            renderLayarMonitor();
        }
    });
}
document.addEventListener("DOMContentLoaded", inisialisasiLayar);
