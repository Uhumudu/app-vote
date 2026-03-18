// src/services/settingsApi.js
// ─── Utilitaire de base ───────────────────────────────────────────────────────
const BASE = "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}

async function request(method, url, body = null) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(BASE + url, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`);
  return data;
}

// ─── Admin Élection ───────────────────────────────────────────────────────────
export const adminElectionApi = {
  getProfil:            ()          => request("GET",  "/admin-election/settings/profil"),
  updateProfil:         (body)      => request("PUT",  "/admin-election/settings/profil", body),
  changePassword:       (body)      => request("PUT",  "/admin-election/settings/password", body),
  getNotifications:     ()          => request("GET",  "/admin-election/settings/notifications"),
  updateNotifications:  (body)      => request("PUT",  "/admin-election/settings/notifications", body),
};

// ─── Super Admin ──────────────────────────────────────────────────────────────
export const superAdminApi = {
  // Utilisateurs
  getUsers:         (search = "")  => request("GET",    `/super-admin/settings/users${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  createUser:       (body)         => request("POST",   "/super-admin/settings/users", body),
  updateUser:       (id, body)     => request("PUT",    `/super-admin/settings/users/${id}`, body),
  toggleUser:       (id)           => request("PATCH",  `/super-admin/settings/users/${id}/toggle`),
  deleteUser:       (id)           => request("DELETE", `/super-admin/settings/users/${id}`),
  // Rôles
  getRoles:         ()             => request("GET",    "/super-admin/settings/roles"),
  // Plateforme
  getPlatformConfig:    ()         => request("GET",    "/super-admin/settings/platform"),
  updatePlatformConfig: (body)     => request("PUT",    "/super-admin/settings/platform", body),
  // Logs
  getLogs:          (params = {})  => {
    const q = new URLSearchParams(params).toString();
    return request("GET", `/super-admin/settings/logs${q ? `?${q}` : ""}`);
  },
  exportLogs:       ()             => {
    const a = document.createElement("a");
    a.href = `${BASE}/super-admin/settings/logs/export`;
    a.setAttribute("download", "logs.csv");
    // Ajouter token via header n'est pas possible avec <a>, on utilise fetch + blob
    return fetch(`${BASE}/super-admin/settings/logs/export`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `logs_${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });
  },
};
