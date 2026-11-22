import axios from "axios";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
    headers: {
        "Content-Type": "application/json",
    },
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem("mediconnect_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || "";
        const isAuthRequest =
            requestUrl.includes("/api/auth/login") ||
            requestUrl.includes("/api/patients/login") ||
            requestUrl.includes("/api/patients/register") ||
            requestUrl.includes("/api/doctors/register");

        if ((status === 401 || status === 403) && !isAuthRequest) {
            sessionStorage.removeItem("mediconnect_token");
            sessionStorage.removeItem("mediconnect_user");
            localStorage.removeItem("mediconnect_token");
            localStorage.removeItem("mediconnect_user");
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;