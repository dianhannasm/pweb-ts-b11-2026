# pweb-ts-b11-2026 (SehatAntri)

## Project Overview
**SehatAntri** is a client-side hospital queue management web application built with TypeScript, HTML5, and CSS3. It features authentication using the DummyJSON API (`https://dummyjson.com/auth/login`), role-based access control (`admin`, `moderator`, `user`), and client-side state management using browser `localStorage`.

### Key Features & Architecture
- **Authentication & Authorization**: `src/login.ts` and `src/auth.ts` handle authentication against DummyJSON, token storage, and role verification (`admin`, `moderator`, `user`).
- **Admin Dashboard (`src/admin.ts` & `index.html`)**: Provides management for queue types (adding, activating, non-activating, deleting), resetting queues, and manual ticket issuance with priority selection.
- **Operator Panel (`src/operator.ts` & `operator.html`)**: Allows queue operators/staff to manage active queues, call tickets (`Dipanggil`), skip tickets (`Dilewati`), and complete tickets (`Selesai`), backed by priority sorting (`VIP` > `Disabilitas` > `Lansia` > `Normal`).
- **State Management**: Browser `localStorage` persists:
  - `sesiAntrian`: User session info (token, role, firstName, username).
  - `jenisAntrean`: Queue service definitions (`kode`, `nama`, `aktif`).
  - `daftarAntrean`: Issued queue tickets (`nomor`, `kode`, `namaLayanan`, `prioritas`, `waktu`, `status`).
- **Compilation**: TypeScript source files located in `src/` are compiled to ECMAScript modules in `dist/` according to `tsconfig.json`.

---

## Building and Running

### Prerequisites
- Node.js and npm installed.

### Installation
```bash
npm install
```

### Building TypeScript
To compile TypeScript files from `src/` to `dist/`:
```bash
npx tsc
```

### Running the Application
Serve the workspace directory using any static file server (e.g., Live Server in VS Code, `http-server`, or Python's `http.server`):
```bash
python -m http.server 8000
```
Then open `login.html` in your browser.

---

## Ketentuan & Aturan Kode Terbaru
- **TypeScript `strict`**: Dilarang memakai `any`, `@ts-ignore`, atau `as` casting yang tidak aman kecuali ada komentar alasannya.
- **Defensive Parsing & Validasi Data Eksternal**: Data dari luar atau `localStorage` wajib dibaca sebagai tipe `unknown` lalu divalidasi menggunakan type guards (seperti `isRecord`) sebelum digunakan.
- **Strict DOM Element Retrieval**: Pengambilan elemen DOM wajib divalidasi keberadaan dan tipe elemennya (misal menggunakan helper `elemen<T>`).
- **Type Annotations**: Fungsi publik dan modul helper wajib memiliki type annotation yang jelas untuk parameter dan return type.
- **Priority Queue Sorting**: Pengurutan antrean pada panel operator wajib mengikuti hirarki prioritas: `VIP` (0), `Disabilitas` (1), `Lansia` (2), `Normal` (3), disusul urutan waktu/indeks penambahan.
- **Dependency Management**: Jangan menambah dependency baru tanpa persetujuan.

## Development Conventions
- **Language**: TypeScript (`.ts`) with strict type checking enabled (`"strict": true`).
- **UI Styling**: Vanilla CSS (`style.css`) and semantic HTML5 structures (`index.html`, `login.html`, `operator.html`).
- **State & Storage**: Persistent data handling via browser `localStorage`.
- **Coding Style**: Explicit type annotations, clear Indonesian naming conventions for domain objects (e.g., `SesiAntrian`, `JenisAntrean`, `TiketAntrean`, `SesiOperator`, `TiketOperator`, `StatusTiket`), and modular separation of concerns between authentication, login logic, admin dashboard, and operator panel.
