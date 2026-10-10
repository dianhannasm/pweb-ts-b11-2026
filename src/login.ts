
interface LoginResponse {
  accessToken?: string;
  token?: string;
  id: number;
  username: string;
  firstName: string;
  role?: string;
}

const formLogin = document.getElementById("formLogin") as HTMLFormElement;
const inputUsername = document.getElementById("username") as HTMLInputElement;
const inputPassword = document.getElementById("password") as HTMLInputElement;
const tombolLogin = document.getElementById("tombolLogin") as HTMLButtonElement;
const pesan = document.getElementById("pesan") as HTMLParagraphElement;

formLogin.addEventListener("submit", async (event: SubmitEvent) => {
  event.preventDefault();

  const username = inputUsername.value.trim();
  const password = inputPassword.value;

  tombolLogin.disabled = true;
  tombolLogin.textContent = "Memeriksa...";
  pesan.textContent = "Sedang memverifikasi login...";

  try {
    const response = await fetch("https://dummyjson.com/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    username: username,
    password: password,
    expiresInMins: 30
  })
});

    if (!response.ok) {
      throw new Error("Username atau password salah.");
    }

    const data: LoginResponse = await response.json();

    let role = data.role;

    // Jika respons login tidak menyertakan role,
    // ambil informasi pengguna dari API.
    if (!role) {
      const userResponse = await fetch(
        `https://dummyjson.com/users/${data.id}`
      );

      if (!userResponse.ok) {
        throw new Error("Gagal mengambil role pengguna.");
      }

      const userData: LoginResponse = await userResponse.json();
      role = userData.role;
    }

    if (!role) {
      throw new Error("Role pengguna tidak tersedia dari API.");
    }

    const token = data.accessToken || data.token;

    if (!token) {
      throw new Error("Token login tidak ditemukan.");
    }

    const sesi = {
      token: token,
      role: role.toLowerCase(),
      firstName: data.firstName,
      username: data.username
    };

    localStorage.setItem("sesiAntrian", JSON.stringify(sesi));

    pesan.textContent = "Login berhasil!";

    if (role.toLowerCase() === "admin" ||
        role.toLowerCase() === "moderator") {
      window.location.href = "index.html";
    } else if (role.toLowerCase() === "user") {
      window.location.href = "ambil-antrian.html";
    } else {
      localStorage.removeItem("sesiAntrian");
      throw new Error("Role pengguna tidak dikenali.");
    }

  } catch (error) {
    if (error instanceof Error) {
      pesan.textContent = error.message;
    } else {
      pesan.textContent = "Terjadi kesalahan jaringan.";
    }
  } finally {
    tombolLogin.disabled = false;
    tombolLogin.textContent = "Login";
  }
});