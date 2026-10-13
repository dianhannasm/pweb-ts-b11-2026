interface JenisAntrean {
  kode: string;
  nama: string;
  aktif: boolean;
}

interface TiketAntrean {
  nomor: string;
  kode: string;
  namaLayanan: string;
  prioritas: string;
  waktu: string;
  status?: string;
}

// 1. PENGECEKAN LOGIN DAN ROLE
// Memakai guard bersama dari auth.js (dimuat sebelum admin.js di index.html):
// - Belum login        -> dialihkan ke login.html
// - Role user/dll      -> dialihkan ke halaman yang boleh diakses (ambil-antrian.html)
// - Role admin/moderator -> diizinkan; nav & info akun navbar (nama, role,
//   tombol logout) dirender oleh auth.js sehingga sama di semua halaman.
periksaAksesHalaman(["admin", "moderator"]);

// 2. MENGAMBIL DATA JENIS ANTREAN

const dataTersimpan = localStorage.getItem("jenisAntrean");

let jenisAntrean: JenisAntrean[] = [];

if (dataTersimpan !== null) {
  try {
    jenisAntrean = JSON.parse(dataTersimpan) as JenisAntrean[];
  } catch {
    jenisAntrean = [];
  }
}

// 3. MENGHUBUNGKAN ELEMEN HTML

const formJenisAntrean = document.getElementById(
  "formJenisAntrean"
) as HTMLFormElement;

const inputKode = document.getElementById(
  "kodeAntrean"
) as HTMLInputElement;

const inputNama = document.getElementById(
  "namaLayanan"
) as HTMLInputElement;

const pesanAntrean = document.getElementById(
  "pesanAntrean"
) as HTMLParagraphElement;

const daftarJenisAntrean = document.getElementById(
  "daftarJenisAntrean"
) as HTMLTableSectionElement;

const tombolResetAntrean = document.getElementById(
  "tombolResetAntrean"
) as HTMLButtonElement;

const pesanReset = document.getElementById(
  "pesanReset"
) as HTMLParagraphElement;

const pilihanLayanan = document.getElementById(
  "pilihanLayanan"
) as HTMLSelectElement;

const formTiketManual = document.getElementById(
  "formTiketManual"
) as HTMLFormElement;

const prioritasPasien = document.getElementById(
  "prioritasPasien"
) as HTMLSelectElement;

const pesanTiket = document.getElementById(
  "pesanTiket"
) as HTMLParagraphElement;

const hasilTiket = document.getElementById(
  "hasilTiket"
) as HTMLDivElement;

const daftarTiketManual = document.getElementById(
  "daftarTiketManual"
) as HTMLTableSectionElement;

// 4. MENYIMPAN JENIS ANTREAN

function simpanJenisAntrean(): void {
  localStorage.setItem(
    "jenisAntrean",
    JSON.stringify(jenisAntrean)
  );
}

// 5. MENGAMBIL DATA TIKET

function ambilDaftarTiket(): TiketAntrean[] {
  const data = localStorage.getItem("daftarAntrean");

  if (data === null) {
    return [];
  }

  try {
    return JSON.parse(data) as TiketAntrean[];
  } catch {
    return [];
  }
}

// 6. MENAMPILKAN DAFTAR JENIS ANTREAN

function tampilkanJenisAntrean(): void {
  daftarJenisAntrean.innerHTML = "";

  jenisAntrean.forEach((item) => {
    const baris = document.createElement("tr");

    const kolomKode = document.createElement("td");
    kolomKode.textContent = item.kode;

    const kolomNama = document.createElement("td");
    kolomNama.textContent = item.nama;

    const kolomStatus = document.createElement("td");
    const labelStatus = document.createElement("span");
    labelStatus.className = item.aktif ? "status" : "status-nonaktif";
    labelStatus.textContent = item.aktif ? "Aktif" : "Nonaktif";
    kolomStatus.appendChild(labelStatus);

    const kolomAksi = document.createElement("td");

    const tombolStatus = document.createElement("button");
    tombolStatus.type = "button";
    tombolStatus.dataset.aksi = "status";
    tombolStatus.dataset.kode = item.kode;
    tombolStatus.textContent = item.aktif
      ? "Nonaktifkan"
      : "Aktifkan";

    const tombolHapus = document.createElement("button");
    tombolHapus.type = "button";
    tombolHapus.dataset.aksi = "hapus";
    tombolHapus.dataset.kode = item.kode;
    tombolHapus.textContent = "Hapus";

    kolomAksi.appendChild(tombolStatus);
    kolomAksi.appendChild(tombolHapus);

    baris.appendChild(kolomKode);
    baris.appendChild(kolomNama);
    baris.appendChild(kolomStatus);
    baris.appendChild(kolomAksi);

    daftarJenisAntrean.appendChild(baris);
  });
}

// 7. MENAMBAHKAN JENIS ANTREAN

formJenisAntrean.addEventListener(
  "submit",
  (event: SubmitEvent) => {
    event.preventDefault();

    const kode = inputKode.value.trim().toUpperCase();
    const nama = inputNama.value.trim();

    if (!/^[A-Z]$/.test(kode)) {
      pesanAntrean.textContent =
        "Kode antrean harus tepat satu huruf.";
      return;
    }

    if (nama === "") {
      pesanAntrean.textContent =
        "Nama layanan tidak boleh kosong.";
      return;
    }

    const kodeDuplikat = jenisAntrean.some(
      (item) => item.kode === kode
    );

    const namaDuplikat = jenisAntrean.some(
      (item) => item.nama.toLowerCase() === nama.toLowerCase()
    );

    if (kodeDuplikat || namaDuplikat) {
      pesanAntrean.textContent =
        "Kode atau nama layanan sudah digunakan.";
      return;
    }

    jenisAntrean.push({
      kode: kode,
      nama: nama,
      aktif: true
    });

    simpanJenisAntrean();
    tampilkanJenisAntrean();
    tampilkanPilihanLayanan();

    pesanAntrean.textContent =
      "Jenis antrean berhasil ditambahkan.";

    formJenisAntrean.reset();
  }
);

// 8. AKTIF/NONAKTIF DAN HAPUS JENIS ANTREAN

daftarJenisAntrean.addEventListener(
  "click",
  (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const tombol = target.closest("button");

    if (tombol === null) {
      return;
    }

    const aksi = tombol.dataset.aksi;
    const kode = tombol.dataset.kode;

    if (kode === undefined) {
      return;
    }

    if (aksi === "status") {
      jenisAntrean.forEach((item) => {
        if (item.kode === kode) {
          item.aktif = !item.aktif;
        }
      });
    }

    if (aksi === "hapus") {
      jenisAntrean = jenisAntrean.filter(
        (item) => item.kode !== kode
      );
    }

    simpanJenisAntrean();
    tampilkanJenisAntrean();
    tampilkanPilihanLayanan();
  }
);

// 9. MENAMPILKAN PILIHAN LAYANAN

function tampilkanPilihanLayanan(): void {
  pilihanLayanan.innerHTML =
    '<option value="">Pilih layanan</option>';

  jenisAntrean.forEach((item) => {
    if (item.aktif) {
      const opsi = document.createElement("option");
      opsi.value = item.kode;
      opsi.textContent = item.kode + " - " + item.nama;
      pilihanLayanan.appendChild(opsi);
    }
  });
}


 // 10. MENAMPILKAN DAFTAR TIKET DALAM BENTUK TABEL

function tampilkanDaftarTiket(): void {
  daftarTiketManual.innerHTML = "";

  const daftarTiket = ambilDaftarTiket();

  // Jika belum ada tiket
  if (daftarTiket.length === 0) {
    const baris = document.createElement("tr");
    const kolom = document.createElement("td");
    kolom.colSpan = 5;
    kolom.textContent = "Belum ada tiket antrean.";
    baris.appendChild(kolom);
    daftarTiketManual.appendChild(baris);
    return;
  }

  // Baris mengikuti urutan kolom <thead> statis di index.html:
  // No. Tiket | Layanan | Prioritas | Status | Waktu
  daftarTiket.forEach((tiket) => {
    const baris = document.createElement("tr");

    const kolomNomor = document.createElement("td");
    kolomNomor.textContent = tiket.nomor;

    const kolomLayanan = document.createElement("td");
    kolomLayanan.textContent = tiket.namaLayanan;

    const kolomPrioritas = document.createElement("td");
    const labelPrioritas = document.createElement("span");
    labelPrioritas.className = "prioritas";
    labelPrioritas.textContent = tiket.prioritas;
    kolomPrioritas.appendChild(labelPrioritas);

    const statusTiket = tiket.status || "Menunggu";
    const kolomStatus = document.createElement("td");
    const labelStatusTiket = document.createElement("span");
    labelStatusTiket.className =
      statusTiket === "Selesai"
        ? "status"
        : statusTiket === "Dipanggil"
          ? "status-dipanggil"
          : statusTiket === "Dilewati"
            ? "status-dilewati"
            : "status-menunggu";
    labelStatusTiket.textContent = statusTiket;
    kolomStatus.appendChild(labelStatusTiket);

    const kolomWaktu = document.createElement("td");
    kolomWaktu.textContent = tiket.waktu;

    baris.appendChild(kolomNomor);
    baris.appendChild(kolomLayanan);
    baris.appendChild(kolomPrioritas);
    baris.appendChild(kolomStatus);
    baris.appendChild(kolomWaktu);

    daftarTiketManual.appendChild(baris);
  });
}

// 11. RESET SELURUH ANTREAN

tombolResetAntrean.addEventListener("click", () => {
  const yakin = confirm(
    "Yakin ingin menghapus seluruh tiket dan mereset nomor antrean?"
  );

  if (!yakin) {
    return;
  }

  localStorage.removeItem("daftarAntrean");

  const daftarKunci: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const kunci = localStorage.key(i);

    if (kunci !== null && kunci.startsWith("nomorAntrean_")) {
      daftarKunci.push(kunci);
    }
  }

  daftarKunci.forEach((kunci) => {
    localStorage.removeItem(kunci);
  });

  tampilkanDaftarTiket();

  pesanReset.textContent =
    "Seluruh tiket berhasil dihapus dan nomor antrean direset.";
});

// 12. MENGHITUNG NOMOR ANTREAN

function ambilNomorBerikutnya(kode: string): number {
  const kunci = "nomorAntrean_" + kode;

  const nomorLama = Number(
    localStorage.getItem(kunci) || "0"
  );

  const nomorBaru = nomorLama + 1;

  localStorage.setItem(kunci, String(nomorBaru));

  return nomorBaru;
}

// 13. MENERBITKAN TIKET ANTREAN MANUAL

formTiketManual.addEventListener(
  "submit",
  (event: SubmitEvent) => {
    event.preventDefault();

    const kode = pilihanLayanan.value;
    const prioritas = prioritasPasien.value;

    const layanan = jenisAntrean.find(
      (item) => item.kode === kode && item.aktif
    );

    if (layanan === undefined) {
      pesanTiket.textContent =
        "Pilih layanan yang masih aktif.";
      return;
    }

    if (prioritas === "") {
      pesanTiket.textContent =
        "Pilih prioritas pasien.";
      return;
    }

    const nomorUrut = ambilNomorBerikutnya(kode);

    const nomorTiket =
      kode + "-" + String(nomorUrut).padStart(3, "0");

    const tiket: TiketAntrean = {
      nomor: nomorTiket,
      kode: kode,
      namaLayanan: layanan.nama,
      prioritas: prioritas,
      waktu: new Date().toLocaleString("id-ID"),
      status: "Menunggu"
    };

    const daftarTiket = ambilDaftarTiket();
    daftarTiket.push(tiket);

    localStorage.setItem(
      "daftarAntrean",
      JSON.stringify(daftarTiket)
    );

    pesanTiket.textContent = "Tiket berhasil diterbitkan!";

    hasilTiket.textContent =
      "Nomor: " + tiket.nomor +
      " | Layanan: " + tiket.namaLayanan +
      " | Prioritas: " + tiket.prioritas;

    tampilkanDaftarTiket();
    formTiketManual.reset();
  }
);

// 14. MENAMPILKAN DATA SAAT HALAMAN DIBUKA

tampilkanJenisAntrean();
tampilkanPilihanLayanan();
tampilkanDaftarTiket();