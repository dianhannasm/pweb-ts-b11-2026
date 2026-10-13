"use strict";
function isRecordAmbil(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function elemenAmbil(id, tipe) {
    const target = document.getElementById(id);
    if (!(target instanceof tipe)) {
        throw new Error(`Elemen halaman tidak ditemukan: ${id}`);
    }
    return target;
}
function bacaJenisAntreanAmbil() {
    const data = localStorage.getItem("jenisAntrean");
    if (data === null)
        return [];
    try {
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter(isRecordAmbil).flatMap((item) => {
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
function bacaDaftarTiketAmbil() {
    const data = localStorage.getItem("daftarAntrean");
    if (data === null)
        return [];
    try {
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter(isRecordAmbil).flatMap((item) => {
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
function ambilNomorBerikutnyaAmbil(kode) {
    const kunci = "nomorAntrean_" + kode;
    const data = localStorage.getItem(kunci);
    const nomorLama = data !== null ? Number(data) : 0;
    // Hindari kemungkinan nomor duplikat dengan memeriksa nomor tertinggi pada tiket yang sudah ada
    const daftarTiket = bacaDaftarTiketAmbil();
    const maxTiket = daftarTiket
        .filter((t) => t.kode === kode)
        .reduce((max, t) => {
        const parts = t.nomor.split("-");
        const num = parts.length > 1 ? parseInt(parts[1], 10) : 0;
        return !Number.isNaN(num) && num > max ? num : max;
    }, 0);
    const base = Math.max(Number.isNaN(nomorLama) ? 0 : nomorLama, maxTiket);
    const nomorBaru = base + 1;
    localStorage.setItem(kunci, String(nomorBaru));
    return nomorBaru;
}
function hitungSisaAntreanAmbil(kode) {
    const daftarTiket = bacaDaftarTiketAmbil();
    return daftarTiket.filter((t) => t.kode === kode && t.status === "Menunggu").length;
}
function renderPilihanLayananAmbil() {
    const container = elemenAmbil("containerPilihanLayanan", HTMLDivElement);
    const jenisAktif = bacaJenisAntreanAmbil().filter((j) => j.aktif);
    const terpilih = document.querySelector('input[name="layanan"]:checked')?.value;
    container.replaceChildren();
    if (jenisAktif.length === 0) {
        const pesan = document.createElement("p");
        pesan.className = "pesan-layanan-kosong";
        pesan.textContent = "Saat ini belum ada jenis antrean layanan aktif. Silakan hubungi petugas.";
        container.appendChild(pesan);
        return;
    }
    jenisAktif.forEach((item, index) => {
        const wrapper = document.createElement("label");
        wrapper.className = "item-layanan-radio";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "layanan";
        radio.value = item.kode;
        radio.required = true;
        // Pertahankan pilihan sebelumnya jika masih ada, atau pilih yang pertama jika belum ada
        if (terpilih !== undefined ? item.kode === terpilih : index === 0) {
            radio.checked = true;
        }
        const kartu = document.createElement("div");
        kartu.className = "kartu-opsi-layanan";
        const kodeSpan = document.createElement("span");
        kodeSpan.className = "kode-layanan";
        kodeSpan.textContent = item.kode;
        const infoDiv = document.createElement("div");
        infoDiv.className = "info-layanan";
        const namaSpan = document.createElement("p");
        namaSpan.className = "nama-layanan";
        namaSpan.textContent = item.nama;
        const sisa = hitungSisaAntreanAmbil(item.kode);
        const sisaSpan = document.createElement("p");
        sisaSpan.className = "sisa-info";
        sisaSpan.textContent = `Antrean menunggu: ${sisa} orang`;
        infoDiv.appendChild(namaSpan);
        infoDiv.appendChild(sisaSpan);
        kartu.appendChild(kodeSpan);
        kartu.appendChild(infoDiv);
        wrapper.appendChild(radio);
        wrapper.appendChild(kartu);
        container.appendChild(wrapper);
    });
}
function inisialisasiAmbilAntrian() {
    // Guard autentikasi: kios ambil antrean hanya untuk pengguna yang sudah login
    // (role user, admin, atau moderator).
    const sesi = periksaAksesHalaman(["user", "admin", "moderator"]);
    if (sesi === null) {
        return;
    }
    const formAmbilTiket = elemenAmbil("formAmbilTiket", HTMLFormElement);
    const pesanForm = elemenAmbil("pesanForm", HTMLParagraphElement);
    const modalStruk = elemenAmbil("modalStruk", HTMLDivElement);
    const strukNomor = elemenAmbil("strukNomor", HTMLDivElement);
    const strukLayanan = elemenAmbil("strukLayanan", HTMLElement);
    const strukPrioritas = elemenAmbil("strukPrioritas", HTMLElement);
    const strukSisa = elemenAmbil("strukSisa", HTMLElement);
    const strukWaktu = elemenAmbil("strukWaktu", HTMLSpanElement);
    const tombolCetakStruk = elemenAmbil("tombolCetakStruk", HTMLButtonElement);
    const tombolTutupStruk = elemenAmbil("tombolTutupStruk", HTMLButtonElement);
    // Render awal pilihan layanan
    renderPilihanLayananAmbil();
    // Polling otomatis setiap 2.5 detik agar penambahan jenis antrean dari admin otomatis muncul
    setInterval(renderPilihanLayananAmbil, 2500);
    // Update real-time antar-tab melalui storage event
    window.addEventListener("storage", (event) => {
        if (event.key === "jenisAntrean" || event.key === "daftarAntrean") {
            renderPilihanLayananAmbil();
        }
    });
    formAmbilTiket.addEventListener("submit", (event) => {
        event.preventDefault();
        const inputLayanan = document.querySelector('input[name="layanan"]:checked');
        const inputPrioritas = document.querySelector('input[name="prioritas"]:checked');
        if (inputLayanan === null || inputLayanan.value === "") {
            pesanForm.textContent = "Silakan pilih jenis layanan antrean.";
            return;
        }
        if (inputPrioritas === null || inputPrioritas.value === "") {
            pesanForm.textContent = "Silakan pilih tingkat prioritas pasien.";
            return;
        }
        const kodeLayanan = inputLayanan.value;
        const prioritas = inputPrioritas.value;
        const jenisList = bacaJenisAntreanAmbil();
        const layanan = jenisList.find((j) => j.kode === kodeLayanan && j.aktif);
        if (layanan === undefined) {
            pesanForm.textContent = "Layanan yang dipilih tidak aktif atau tidak ditemukan.";
            return;
        }
        // Hitung jumlah antrean menunggu sebelum tiket ini diterbitkan
        const sisaSebelumnya = hitungSisaAntreanAmbil(kodeLayanan);
        // Ambil nomor berikutnya dan format KODE-001 (3 digit)
        const nomorUrut = ambilNomorBerikutnyaAmbil(kodeLayanan);
        const nomorTiket = `${kodeLayanan}-${String(nomorUrut).padStart(3, "0")}`;
        const waktuSekarang = new Date().toLocaleString("id-ID");
        const tiketBaru = {
            nomor: nomorTiket,
            kode: kodeLayanan,
            namaLayanan: layanan.nama,
            prioritas: prioritas,
            waktu: waktuSekarang,
            status: "Menunggu"
        };
        const daftarTiket = bacaDaftarTiketAmbil();
        daftarTiket.push(tiketBaru);
        localStorage.setItem("daftarAntrean", JSON.stringify(daftarTiket));
        // Tampilkan struk tiket
        strukNomor.textContent = tiketBaru.nomor;
        strukLayanan.textContent = `${tiketBaru.namaLayanan} (${tiketBaru.kode})`;
        strukPrioritas.textContent = tiketBaru.prioritas;
        strukSisa.textContent = String(sisaSebelumnya);
        strukWaktu.textContent = tiketBaru.waktu;
        modalStruk.hidden = false;
        pesanForm.textContent = "";
        // Perbarui jumlah menunggu pada kartu
        renderPilihanLayananAmbil();
    });
    tombolCetakStruk.addEventListener("click", () => {
        window.print();
    });
    tombolTutupStruk.addEventListener("click", () => {
        modalStruk.hidden = true;
    });
}
document.addEventListener("DOMContentLoaded", inisialisasiAmbilAntrian);
