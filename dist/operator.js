"use strict";
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function bacaSesi() {
    const data = localStorage.getItem("sesiAntrian");
    if (data === null)
        return null;
    try {
        const parsed = JSON.parse(data);
        if (!isRecord(parsed) ||
            typeof parsed.role !== "string" ||
            typeof parsed.firstName !== "string" ||
            typeof parsed.username !== "string")
            return null;
        return {
            role: parsed.role.toLowerCase(),
            firstName: parsed.firstName,
            username: parsed.username
        };
    }
    catch {
        return null;
    }
}
function elemen(id, tipe) {
    const target = document.getElementById(id);
    if (!(target instanceof tipe)) {
        throw new Error(`Elemen halaman tidak ditemukan: ${id}`);
    }
    return target;
}
const sesi = bacaSesi();
if (sesi === null || (sesi.role !== "admin" && sesi.role !== "moderator")) {
    window.location.href = "login.html";
}
else {
    const pengguna = elemen("infoPengguna", HTMLParagraphElement);
    const logout = elemen("tombolLogout", HTMLButtonElement);
    const tiketAktif = elemen("tiketAktif", HTMLParagraphElement);
    const detailAktif = elemen("detailAktif", HTMLParagraphElement);
    const tiketBerikutnya = elemen("tiketBerikutnya", HTMLParagraphElement);
    const detailBerikutnya = elemen("detailBerikutnya", HTMLParagraphElement);
    const daftarTunggu = elemen("daftarTunggu", HTMLTableSectionElement);
    const jumlahTunggu = elemen("jumlahTunggu", HTMLSpanElement);
    const pesanKosong = elemen("pesanKosong", HTMLParagraphElement);
    const pesanOperator = elemen("pesanOperator", HTMLParagraphElement);
    const tombolPanggil = elemen("tombolPanggil", HTMLButtonElement);
    const tombolLewati = elemen("tombolLewati", HTMLButtonElement);
    const tombolSelesai = elemen("tombolSelesai", HTMLButtonElement);
    const pilihanPoli = elemen("pilihanPoli", HTMLSelectElement);
    pengguna.textContent = `Halo, ${sesi.firstName} | Role: ${sesi.role}`;
    logout.addEventListener("click", () => {
        localStorage.removeItem("sesiAntrian");
        window.location.href = "login.html";
    });
    // Baca jenis antrean aktif untuk daftar poli (parsing defensif)
    function bacaJenisAktif() {
        const data = localStorage.getItem("jenisAntrean");
        if (data === null)
            return [];
        try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed))
                return [];
            return parsed.filter(isRecord).flatMap((item) => {
                if (typeof item.kode !== "string" ||
                    typeof item.nama !== "string" ||
                    item.aktif !== true)
                    return [];
                return [{ kode: item.kode, nama: item.nama }];
            });
        }
        catch {
            return [];
        }
    }
    function bacaTiket() {
        const data = localStorage.getItem("daftarAntrean");
        if (data === null)
            return [];
        try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed))
                return [];
            return parsed.filter(isRecord).flatMap((item) => {
                if (typeof item.nomor !== "string" || typeof item.kode !== "string" ||
                    typeof item.namaLayanan !== "string" ||
                    typeof item.prioritas !== "string" || typeof item.waktu !== "string")
                    return [];
                const status = item.status === "Dipanggil" ||
                    item.status === "Selesai" || item.status === "Dilewati"
                    ? item.status
                    : "Menunggu";
                return [{
                        nomor: item.nomor,
                        kode: item.kode,
                        namaLayanan: item.namaLayanan,
                        prioritas: item.prioritas,
                        waktu: item.waktu,
                        status
                    }];
            });
        }
        catch {
            return [];
        }
    }
    let daftarTiket = bacaTiket();
    let poliTerpilih = "";
    const urutanPrioritas = {
        VIP: 0,
        Disabilitas: 1,
        Lansia: 2,
        Normal: 3
    };
    function antrianMenunggu() {
        return daftarTiket
            .map((tiket, index) => ({ tiket, index }))
            .filter(({ tiket }) => tiket.status === "Menunggu")
            .sort((a, b) => {
            const prioritasA = urutanPrioritas[a.tiket.prioritas] ?? 3;
            const prioritasB = urutanPrioritas[b.tiket.prioritas] ?? 3;
            return prioritasA - prioritasB || a.index - b.index;
        })
            .map(({ tiket }) => tiket);
    }
    // Antrean menunggu untuk poli terpilih (hirarki prioritas tetap berlaku per poli)
    function menungguPoli() {
        return antrianMenunggu().filter((tiket) => tiket.kode === poliTerpilih);
    }
    // Daftar poli: jenis antrean aktif, dilengkapi kode yang ada pada tiket
    function daftarPoliTersedia() {
        const daftar = bacaJenisAktif();
        const sudahAda = new Set(daftar.map((poli) => poli.kode));
        daftarTiket.forEach((tiket) => {
            if (!sudahAda.has(tiket.kode)) {
                sudahAda.add(tiket.kode);
                daftar.push({ kode: tiket.kode, nama: tiket.namaLayanan });
            }
        });
        return daftar;
    }
    function simpanTiket() {
        localStorage.setItem("daftarAntrean", JSON.stringify(daftarTiket));
    }
    function tampilkanDetail(tiket) {
        return tiket === undefined
            ? "Belum ada tiket menunggu."
            : `${tiket.namaLayanan} | ${tiket.prioritas}`;
    }
    function render() {
        // Perbarui pilihan poli: jenis antrean aktif + poli yang masih punya tiket
        const poliTersedia = daftarPoliTersedia();
        if (!poliTersedia.some((poli) => poli.kode === poliTerpilih)) {
            poliTerpilih = poliTersedia[0]?.kode ?? "";
        }
        pilihanPoli.replaceChildren();
        poliTersedia.forEach((poli) => {
            const opsi = document.createElement("option");
            opsi.value = poli.kode;
            opsi.textContent = `${poli.kode} - ${poli.nama}`;
            pilihanPoli.appendChild(opsi);
        });
        pilihanPoli.value = poliTerpilih;
        // Status poli terpilih: satu tiket dipanggil pada satu waktu per poli
        const aktif = daftarTiket.find((tiket) => tiket.kode === poliTerpilih && tiket.status === "Dipanggil");
        const menunggu = menungguPoli();
        tiketAktif.textContent = aktif?.nomor ?? "—";
        detailAktif.textContent = aktif === undefined
            ? "Belum ada tiket yang dipanggil."
            : `${aktif.namaLayanan} | ${aktif.prioritas}`;
        tiketBerikutnya.textContent = menunggu[0]?.nomor ?? "—";
        detailBerikutnya.textContent = tampilkanDetail(menunggu[0]);
        jumlahTunggu.textContent = `(${menunggu.length})`;
        daftarTunggu.replaceChildren();
        pesanKosong.hidden = menunggu.length > 0;
        menunggu.forEach((tiket) => {
            const baris = document.createElement("tr");
            [tiket.nomor, tiket.namaLayanan, tiket.prioritas, tiket.waktu].forEach((nilai) => {
                const kolom = document.createElement("td");
                kolom.textContent = nilai;
                baris.appendChild(kolom);
            });
            daftarTunggu.appendChild(baris);
        });
        tombolLewati.disabled = aktif === undefined;
        tombolSelesai.disabled = aktif === undefined;
        tombolPanggil.disabled = menunggu.length === 0 && aktif === undefined;
    }
    function perbaruiStatus(status) {
        const aktif = daftarTiket.find((tiket) => tiket.kode === poliTerpilih && tiket.status === "Dipanggil");
        if (aktif === undefined)
            return;
        aktif.status = status;
        simpanTiket();
        pesanOperator.textContent = `Tiket ${aktif.nomor} ditandai ${status}.`;
        render();
    }
    tombolPanggil.addEventListener("click", () => {
        const aktif = daftarTiket.find((tiket) => tiket.kode === poliTerpilih && tiket.status === "Dipanggil");
        if (aktif !== undefined)
            aktif.status = "Selesai";
        const berikutnya = menungguPoli()[0];
        if (berikutnya === undefined) {
            simpanTiket();
            pesanOperator.textContent = aktif === undefined
                ? "Tidak ada tiket yang menunggu."
                : `Tiket ${aktif.nomor} selesai. Tidak ada tiket berikutnya.`;
            render();
            return;
        }
        berikutnya.status = "Dipanggil";
        simpanTiket();
        pesanOperator.textContent = `Tiket ${berikutnya.nomor} sedang dipanggil.`;
        render();
    });
    tombolLewati.addEventListener("click", () => perbaruiStatus("Dilewati"));
    tombolSelesai.addEventListener("click", () => perbaruiStatus("Selesai"));
    // Ganti poli yang sedang ditangani
    pilihanPoli.addEventListener("change", () => {
        poliTerpilih = pilihanPoli.value;
        render();
    });
    render();
}
