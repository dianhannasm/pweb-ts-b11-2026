
interface SesiAntrian {
  token: string;
  role: string;
  firstName: string;
  username: string;
}

function ambilSesi(): SesiAntrian | null {
  const data = localStorage.getItem("sesiAntrian");

  if (data === null) {
    return null;
  }

  return JSON.parse(data) as SesiAntrian;
}

function cekAdmin(): void {
  const sesi = ambilSesi();

  if (sesi === null) {
    window.location.href = "login.html";
    return;
  }

  if (sesi.role !== "admin" && sesi.role !== "moderator") {
    window.location.href = "login.html";
  }
}

function logout(): void {
  localStorage.removeItem("sesiAntrian");
  window.location.href = "login.html";
}
