interface SesiAdmin {
  token: string;
  role: string;
  firstName: string;
  username: string;
}

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
}

// 1. PENGECEKAN LOGIN DAN ROLE

const dataSesi = localStorage.getItem("sesiAntrian");

if (dataSesi === null) {
  window.location.href = "login.html";
} else {
  const sesi = JSON.parse(dataSesi) as SesiAdmin;

  if (sesi.role !== "admin" && sesi.role !== "moderator") {
    window.location.href = "login.html";
  } else {
    const infoPengguna = document.getElementById("infoPengguna");
    const tombolLogout = document.getElementById("tombolLogout");

    if (infoPengguna !== null) {
      infoPengguna.textContent =
        "Halo, " + sesi.firstName + " | Role: " + sesi.role;
    }

    if (tombolLogout !== null) {
      tombolLogout.addEventListener("click", () => {
        localStorage.removeItem("sesiAntrian");
        window.location.href = "login.html";
      });
    }
  }
}

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

// 4. MENYIMPAN JENIS ANTREAN

function simpanJenisAntrean(): void {
  localStorage.setItem(
    "jenisAntrean",
    JSON.stringify(jenisAntrean)
  );
}

// 5. MENAMPILKAN DAFTAR JENIS ANTREAN

function tampilkanJenisAntrean(): void {
  daftarJenisAntrean.innerHTML = "";

  jenisAntrean.forEach((item) => {
    const baris = document.createElement("tr");

    const kolomKode = document.createElement("td");
    kolomKode.textContent = item.kode;

    const kolomNama = document.createElement("td");
    kolomNama.textContent = item.nama;

    const kolomStatus = document.createElement("td");
    kolomStatus.textContent = item.aktif ? "Aktif" : "Nonaktif";

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

// 6. MENAMBAHKAN JENIS ANTREAN

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

// 7. AKTIF/NONAKTIF DAN HAPUS JENIS ANTREAN

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

// 8. RESET SELURUH ANTREAN

tombolResetAntrean.addEventListener("click", () => {
  const yakin = confirm(
    "Yakin ingin menghapus seluruh tiket dan mereset nomor antrean?"
  );

  if (!yakin) {
    return;
  }

  // Hapus semua tiket yang tersimpan.
  localStorage.removeItem("daftarAntrean");

  // Reset penghitung untuk semua kode layanan,
  // termasuk kode layanan yang mungkin sudah dihapus.
  const daftarKunci: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const kunci = localStorage.key(i);

    if (
      kunci !== null &&
      kunci.startsWith("nomorAntrean_")
    ) {
      daftarKunci.push(kunci);
    }
  }

  daftarKunci.forEach((kunci) => {
    localStorage.removeItem(kunci);
  });

  pesanReset.textContent =
    "Seluruh tiket berhasil dihapus dan nomor antrean direset.";
});

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

// 10. MENGHITUNG NOMOR ANTREAN

function ambilNomorBerikutnya(kode: string): number {
  const kunci = "nomorAntrean_" + kode;

  const nomorLama = Number(
    localStorage.getItem(kunci) || "0"
  );

  const nomorBaru = nomorLama + 1;

  localStorage.setItem(kunci, String(nomorBaru));

  return nomorBaru;
}

// 11. MENERBITKAN TIKET ANTREAN MANUAL

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
      waktu: new Date().toLocaleString("id-ID")
    };

    const dataLama = localStorage.getItem("daftarAntrean");
    let daftarTiket: TiketAntrean[] = [];

    if (dataLama !== null) {
      try {
        daftarTiket = JSON.parse(dataLama) as TiketAntrean[];
      } catch {
        daftarTiket = [];
      }
    }

    daftarTiket.push(tiket);

    localStorage.setItem(
      "daftarAntrean",
      JSON.stringify(daftarTiket)
    );

    pesanTiket.textContent =
      "Tiket berhasil diterbitkan!";

    hasilTiket.textContent =
      "Nomor: " + tiket.nomor +
      " | Layanan: " + tiket.namaLayanan +
      " | Prioritas: " + tiket.prioritas;

    formTiketManual.reset();
  }
);

// 12. MENAMPILKAN DATA SAAT HALAMAN DIBUKA

tampilkanJenisAntrean();
tampilkanPilihanLayanan();
