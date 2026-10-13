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
                    status: status,
                    waktuPanggil: typeof item.waktuPanggil === "string"
                        ? item.waktuPanggil
                        : undefined
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
const antreanSuara = [];
const panggilanSebelumnya = new Map();
let suaraDidukung = false;
let suaraDipakai = false;
let suaraBerjalan = false;
let suaraSiap = false;
let acuanPanggilanTerbentuk = false;
function siapkanSuara() {
    // Guard: inisialisasi hanya sekali walau listener dipasang ulang
    if (suaraSiap)
        return;
    suaraSiap = true;
    const tombolSuara = elemenLayar("tombolSuara", HTMLButtonElement);
    const pesanSuara = elemenLayar("pesanSuara", HTMLParagraphElement);
    suaraDidukung =
        typeof window.speechSynthesis !== "undefined" &&
            typeof SpeechSynthesisUtterance !== "undefined";
    if (!suaraDidukung) {
        tombolSuara.disabled = true;
        tombolSuara.textContent = "🔇 Suara Tidak Didukung";
        pesanSuara.textContent =
            "Browser ini tidak mendukung pengumuman suara. Nomor antrean tetap diperbarui.";
        return;
    }
    // Preferensi pengguna; default nonaktif (audio otomatis sering diblokir browser)
    suaraDipakai = localStorage.getItem("suaraAntrean") === "aktif";
    perbaruiTampilanSuara();
    tombolSuara.addEventListener("click", () => {
        try {
            if (suaraDipakai) {
                suaraDipakai = false;
                antreanSuara.length = 0;
                window.speechSynthesis.cancel();
            }
            else {
                suaraDipakai = true;
                // Konfirmasi singkat sekaligus membuka blokir audio otomatis browser
                antrePengumuman("Suara pengumuman aktif.");
            }
            localStorage.setItem("suaraAntrean", suaraDipakai ? "aktif" : "nonaktif");
            perbaruiTampilanSuara();
        }
        catch {
            // Gangguan audio tidak boleh merusak layar monitor
        }
    });
}
function perbaruiTampilanSuara() {
    const tombolSuara = elemenLayar("tombolSuara", HTMLButtonElement);
    const pesanSuara = elemenLayar("pesanSuara", HTMLParagraphElement);
    tombolSuara.textContent = suaraDipakai ? "🔊 Suara Aktif" : "🔇 Suara Nonaktif";
    tombolSuara.setAttribute("aria-pressed", suaraDipakai ? "true" : "false");
    tombolSuara.className = "tombol-suara" + (suaraDipakai ? " suara-aktif" : "");
    pesanSuara.textContent = suaraDipakai
        ? "Pengumuman panggilan sedang aktif."
        : "Suara nonaktif — aktifkan untuk pengumuman panggilan.";
}
// Masukkan satu kalimat ke antrean pengumuman (berurutan, tidak bertumpuk)
function antrePengumuman(teks) {
    if (!suaraDidukung || !suaraDipakai)
        return;
    try {
        // Pemulihan bila pengeras suara macet (onend tidak pernah terpanggil)
        if (suaraBerjalan && !window.speechSynthesis.speaking) {
            suaraBerjalan = false;
        }
        antreanSuara.push(teks);
        lanjutkanAntreanSuara();
    }
    catch {
        // Audio gagal tidak boleh mengganggu render atau polling
    }
}
function lanjutkanAntreanSuara() {
    if (!suaraDidukung || suaraBerjalan || antreanSuara.length === 0)
        return;
    try {
        // Masih berbunyi: tunggu onend dari pengumuman sebelumnya
        if (window.speechSynthesis.speaking)
            return;
        const teks = antreanSuara.shift();
        if (teks === undefined)
            return;
        suaraBerjalan = true;
        const u = new SpeechSynthesisUtterance(teks);
        u.lang = "id-ID";
        u.rate = 0.92; // tempo lebih santai agar jelas
        const suaraIndonesia = window.speechSynthesis
            .getVoices()
            .find((v) => v.lang.toLowerCase().startsWith("id"));
        if (suaraIndonesia !== undefined) {
            u.voice = suaraIndonesia;
        }
        const selesai = () => {
            suaraBerjalan = false;
            lanjutkanAntreanSuara();
        };
        u.onend = selesai;
        u.onerror = selesai;
        window.speechSynthesis.speak(u);
    }
    catch {
        suaraBerjalan = false;
    }
}
// Deteksi panggilan BARU dengan membandingkan data antrean antar-render.
// Render pertama (termasuk saat halaman dibuka/refresh) hanya membentuk acuan
// senyap, sehingga panggilan lama tidak pernah diumumkan ulang.
function deteksiPanggilanBaru(aktifSekarang) {
    if (!acuanPanggilanTerbentuk) {
        acuanPanggilanTerbentuk = true;
        aktifSekarang.forEach((nilai, kode) => panggilanSebelumnya.set(kode, nilai.nomor));
        return;
    }
    aktifSekarang.forEach((nilai, kode) => {
        if (panggilanSebelumnya.get(kode) !== nilai.nomor) {
            panggilanSebelumnya.set(kode, nilai.nomor);
            antrePengumuman(`Perhatian. Nomor antrean ${nilai.nomor}, ${nilai.nama}. Silakan menuju loket pelayanan.`);
        }
    });
    // Lupakan poli yang tidak lagi memiliki tiket dipanggil, agar panggilan
    // berikutnya (termasuk panggil ulang yang disengaja) tetap terdeteksi baru
    panggilanSebelumnya.forEach((_, kode) => {
        if (!aktifSekarang.has(kode)) {
            panggilanSebelumnya.delete(kode);
        }
    });
}
// ---- Ringkasan global (dua card utama layar) ----
// Antrean menunggu seluruh poli, terurut hierarki prioritas
// (VIP > Disabilitas > Lansia > Normal) lalu urutan pengambilan tiket.
// Aturan urut sama dengan panel operator — murni tampilan, tidak mengubah
// alur pemanggilan operator.
function urutMenungguGlobal(daftarTiket) {
    return daftarTiket
        .map((tiket, index) => ({ tiket, index }))
        .filter(({ tiket }) => tiket.status === "Menunggu")
        .sort((a, b) => {
        const pA = urutanPrioritasLayar[a.tiket.prioritas] ?? 3;
        const pB = urutanPrioritasLayar[b.tiket.prioritas] ?? 3;
        return pA - pB || a.index - b.index;
    })
        .map(({ tiket }) => tiket);
}
// Tiket dengan peristiwa pemanggilan PALING AKHIR di seluruh poli,
// berdasarkan waktu panggilan yang benar-benar tercatat (waktuPanggil) —
// bukan urutan nomor atau urutan poli. Tiket tanpa catatan waktu panggilan
// (data lama) dianggap lebih lama daripada yang punya catatan.
function panggilanTerbaruGlobal(daftarTiket) {
    let hasil;
    let waktuTerbaik = null;
    daftarTiket.forEach((tiket) => {
        if (tiket.status !== "Dipanggil")
            return;
        if (tiket.waktuPanggil === undefined) {
            if (hasil === undefined)
                hasil = tiket; // cadangan untuk data lama
            return;
        }
        if (waktuTerbaik === null || tiket.waktuPanggil >= waktuTerbaik) {
            hasil = tiket;
            waktuTerbaik = tiket.waktuPanggil;
        }
    });
    return hasil;
}
function formatWaktuLayar(iso) {
    try {
        const tanggal = new Date(iso);
        if (Number.isNaN(tanggal.getTime()))
            return iso;
        return tanggal.toLocaleString("id-ID");
    }
    catch {
        return iso;
    }
}
// Render dua card ringkasan global. Hanya membaca & menampilkan data:
// tidak mengubah status, prioritas, nomor, maupun riwayat tiket, dan tidak
// memicu pengumuman suara (pemicu suara tetap hanya deteksiPanggilanBaru).
function renderRingkasanLayar(daftarTiket) {
    const nomorTerbaru = elemenLayar("nomorTerbaru", HTMLParagraphElement);
    const layananTerbaru = elemenLayar("layananTerbaru", HTMLParagraphElement);
    const metaTerbaru = elemenLayar("metaTerbaru", HTMLDivElement);
    const prioritasTerbaru = elemenLayar("prioritasTerbaru", HTMLSpanElement);
    const waktuTerbaru = elemenLayar("waktuTerbaru", HTMLSpanElement);
    const terbaru = panggilanTerbaruGlobal(daftarTiket);
    if (terbaru === undefined) {
        nomorTerbaru.textContent = "Belum ada panggilan";
        nomorTerbaru.classList.add("kosong");
        layananTerbaru.hidden = true;
        metaTerbaru.hidden = true;
    }
    else {
        nomorTerbaru.textContent = terbaru.nomor;
        nomorTerbaru.classList.remove("kosong");
        layananTerbaru.textContent = terbaru.namaLayanan;
        layananTerbaru.hidden = false;
        prioritasTerbaru.textContent = terbaru.prioritas;
        waktuTerbaru.textContent = terbaru.waktuPanggil !== undefined
            ? formatWaktuLayar(terbaru.waktuPanggil)
            : "—";
        metaTerbaru.hidden = false;
    }
    const nomorBerikutnya = elemenLayar("nomorBerikutnya", HTMLParagraphElement);
    const layananBerikutnya = elemenLayar("layananBerikutnya", HTMLParagraphElement);
    const metaBerikutnya = elemenLayar("metaBerikutnya", HTMLDivElement);
    const prioritasBerikutnya = elemenLayar("prioritasBerikutnya", HTMLSpanElement);
    const waktuBerikutnya = elemenLayar("waktuBerikutnya", HTMLSpanElement);
    const berikutnya = urutMenungguGlobal(daftarTiket)[0];
    if (berikutnya === undefined) {
        nomorBerikutnya.textContent = "Belum ada antrean berikutnya";
        nomorBerikutnya.classList.add("kosong");
        layananBerikutnya.hidden = true;
        metaBerikutnya.hidden = true;
    }
    else {
        nomorBerikutnya.textContent = berikutnya.nomor;
        nomorBerikutnya.classList.remove("kosong");
        layananBerikutnya.textContent = berikutnya.namaLayanan;
        layananBerikutnya.hidden = false;
        prioritasBerikutnya.textContent = berikutnya.prioritas;
        waktuBerikutnya.textContent = berikutnya.waktu;
        metaBerikutnya.hidden = false;
    }
}
function renderLayarMonitor() {
    const jenisList = bacaJenisAntreanLayar().filter((j) => j.aktif);
    const daftarTiket = bacaDaftarTiketLayar();
    const panelLayanan = elemenLayar("panelLayanan", HTMLDivElement);
    // Kumpulkan tiket "Dipanggil" per poli untuk deteksi panggilan baru.
    // Hanya membaca data — status, prioritas, nomor, dan riwayat tidak diubah.
    const aktifPerPoli = new Map();
    daftarTiket.forEach((tiket) => {
        if (tiket.status === "Dipanggil") {
            aktifPerPoli.set(tiket.kode, { nomor: tiket.nomor, nama: tiket.namaLayanan });
        }
    });
    deteksiPanggilanBaru(aktifPerPoli);
    // Ringkasan global (panggilan terbaru & antrean berikutnya) — tampilan saja
    renderRingkasanLayar(daftarTiket);
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
        // Antrean berstatus "Menunggu" untuk layanan ini — mengikuti urutan
        // global prioritas, sehingga urutan per poli tetap sama seperti sebelumnya
        const tiketMenunggu = urutMenungguGlobal(daftarTiket).filter((tiket) => tiket.kode === jenis.kode);
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
        labelDipanggil.textContent =
            tiketDipanggilJenis !== undefined
                ? "Sedang Dipanggil"
                : "Tidak Ada Antrean Dipanggil";
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
    // Guard autentikasi: layar monitor hanya untuk pengguna yang sudah login
    // (role user, admin, atau moderator).
    const sesi = periksaAksesHalaman(["user", "admin", "moderator"]);
    if (sesi === null) {
        return;
    }
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
    // Kontrol pengumuman suara (aktif/nonaktif + indikator)
    siapkanSuara();
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
