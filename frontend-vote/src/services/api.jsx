// frontend/services/api.jsx
import axios from "axios";

// Création d'une instance Axios avec baseURL
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" }
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercepteur de réponse pour nettoyer le token expiré ou invalide
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // nettoie aussi les infos user si stockées
    }
    return Promise.reject(error);
  }
);

export default api;

























// // frontend/services/api.jsx
// import axios from "axios";

// // Création d'une instance Axios avec baseURL
// const api = axios.create({
//   baseURL: "http://localhost:5000/api", // attention au préfixe /api
//   headers: { "Content-Type": "application/json" }
// });

// // Intercepteur pour ajouter le token JWT à chaque requête
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`; // backticks pour injecter le token
//   }
//   return config;
// }, (error) => {
//   return Promise.reject(error);
// });

// export default api;
