import axios from "axios";

// Tạo instance axios để dùng chung
export const http = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: false, // nếu backend có cookie/session
});

// Interceptor: gắn token vào header (nếu có login)
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
