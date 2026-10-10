# pweb-ts-b11-2026 (SehatAntri)

## Project Overview
**SehatAntri** is a client-side hospital queue management web application built with TypeScript, HTML5, and CSS3. It features authentication using the DummyJSON API (`https://dummyjson.com/auth/login`), role-based access control (`admin`, `moderator`, `user`), and client-side state management using browser `localStorage`.

### Key Features & Architecture
- **Authentication & Authorization**: `src/login.ts` and `src/auth.ts` handle authentication against DummyJSON and role verification (`admin`, `moderator`, `user`).
- **Admin Dashboard**: `src/admin.ts` and `index.html` provide management for queue types (adding, activating, non-activating, deleting), resetting queues, and manual ticket issuance with priority selection (Normal, Lansia, Disabilitas, VIP).
- **State Management**: Browser `localStorage` is used to persist queue sessions (`sesiAntrian`), queue types (`jenisAntrean`), and issued queue tickets (`daftarAntrean`).
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

## Aturan kode
- TypeScript `strict`. **Dilarang** memakai `any`, `@ts-ignore`, atau `as` kecuali ada komentar alasannya.
- Fungsi publik wajib punya type annotation untuk parameter dan return.
- Data dari luar (argumen CLI, isi JSON) bertipe `unknown` lalu divalidasi.
- Jangan menambah dependency baru tanpa meminta persetujuan.

## Development Conventions
- **Language**: TypeScript (`.ts`) with strict type checking enabled (`"strict": true`).
- **UI Styling**: Vanilla CSS (`style.css`) and semantic HTML5 structures (`index.html`, `login.html`).
- **State & Storage**: Persistent data handling via browser `localStorage`.
- **Coding Style**: Explicit type annotations, clear Indonesian naming conventions for domain objects (e.g., `SesiAntrian`, `JenisAntrean`, `TiketAntrean`), and modular separation of concerns between authentication, login logic, and admin dashboard logic.
