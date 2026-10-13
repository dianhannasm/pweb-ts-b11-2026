type StatusTiket = "Menunggu" | "Dipanggil" | "Selesai" | "Dilewati";

interface TiketOperator {
  nomor: string;
  kode: string;
  namaLayanan: string;
  prioritas: string;
  waktu: string;
  status: StatusTiket;
  // Waktu peristiwa pemanggilan (ISO), dicatat saat operator menekan Panggil.
  // Opsional: tiket lama bisa belum memiliki catatan ini.
  waktuPanggil?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function elemen<T extends HTMLElement>(id: string, tipe: new (...args: never[]) => T): T {
  const target = document.getElementById(id);
  if (!(target instanceof tipe)) {
    throw new Error(`Elemen halaman tidak ditemukan: ${id}`);
  }
  return target;
}

// Guard autentikasi & role bersama (auth.js dimuat sebelum operator.js):
// operator hanya untuk admin/moderator; selain itu dialihkan otomatis.
const sesi = periksaAksesHalaman(["admin", "moderator"]);
if (sesi !== null) {
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

    // Info akun (nama & role) serta tombol logout pada navbar dirender
    // oleh auth.js sehingga tampilannya sama dengan dashboard.

    // Baca jenis antrean aktif untuk daftar poli (parsing defensif)
    function bacaJenisAktif(): { kode: string; nama: string }[] {
      const data = localStorage.getItem("jenisAntrean");
      if (data === null) return [];
      try {
        const parsed: unknown = JSON.parse(data);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(isRecord).flatMap((item): { kode: string; nama: string }[] => {
          if (
            typeof item.kode !== "string" ||
            typeof item.nama !== "string" ||
            item.aktif !== true
          ) return [];
          return [{ kode: item.kode, nama: item.nama }];
        });
      } catch {
        return [];
      }
    }

    function bacaTiket(): TiketOperator[] {
      const data = localStorage.getItem("daftarAntrean");
      if (data === null) return [];
      try {
        const parsed: unknown = JSON.parse(data);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(isRecord).flatMap((item): TiketOperator[] => {
          if (
            typeof item.nomor !== "string" || typeof item.kode !== "string" ||
            typeof item.namaLayanan !== "string" ||
            typeof item.prioritas !== "string" || typeof item.waktu !== "string"
          ) return [];

          const status: StatusTiket = item.status === "Dipanggil" ||
            item.status === "Selesai" || item.status === "Dilewati"
            ? item.status
            : "Menunggu";
          return [{
            nomor: item.nomor,
            kode: item.kode,
            namaLayanan: item.namaLayanan,
            prioritas: item.prioritas,
            waktu: item.waktu,
            status,
            // Pertahankan catatan waktu panggilan bila ada (jangan hilang
            // saat daftar tiket disimpan ulang oleh operator)
            waktuPanggil: typeof item.waktuPanggil === "string"
              ? item.waktuPanggil
              : undefined
          }];
        });
      } catch {
        return [];
      }
    }

    let daftarTiket = bacaTiket();
    let poliTerpilih = "";
    const urutanPrioritas: Record<string, number> = {
      VIP: 0,
      Disabilitas: 1,
      Lansia: 2,
      Normal: 3
    };

    function antrianMenunggu(): TiketOperator[] {
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
    function menungguPoli(): TiketOperator[] {
      return antrianMenunggu().filter((tiket) => tiket.kode === poliTerpilih);
    }

    // Daftar poli: jenis antrean aktif, dilengkapi kode yang ada pada tiket
    function daftarPoliTersedia(): { kode: string; nama: string }[] {
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

    function simpanTiket(): void {
      localStorage.setItem("daftarAntrean", JSON.stringify(daftarTiket));
    }

    function tampilkanDetail(tiket: TiketOperator | undefined): string {
      return tiket === undefined
        ? "Belum ada tiket menunggu."
        : `${tiket.namaLayanan} | ${tiket.prioritas}`;
    }

    function render(): void {
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
      const aktif = daftarTiket.find(
        (tiket) => tiket.kode === poliTerpilih && tiket.status === "Dipanggil"
      );
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

    function perbaruiStatus(status: StatusTiket): void {
      const aktif = daftarTiket.find(
        (tiket) => tiket.kode === poliTerpilih && tiket.status === "Dipanggil"
      );
      if (aktif === undefined) return;
      aktif.status = status;
      simpanTiket();
      pesanOperator.textContent = `Tiket ${aktif.nomor} ditandai ${status}.`;
      render();
    }

    tombolPanggil.addEventListener("click", () => {
      const aktif = daftarTiket.find(
        (tiket) => tiket.kode === poliTerpilih && tiket.status === "Dipanggil"
      );
      if (aktif !== undefined) aktif.status = "Selesai";
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
      // Catat waktu peristiwa pemanggilan (dasar card "Panggilan Terbaru"
      // pada layar monitor). Tidak mengubah status, prioritas, atau urutan.
      berikutnya.waktuPanggil = new Date().toISOString();
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
