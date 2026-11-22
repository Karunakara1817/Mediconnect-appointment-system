import { createContext, useContext, useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

const AuthContext = createContext(null);

// Clear any leftover permanent tokens from older runs
localStorage.removeItem("mediconnect_token");
localStorage.removeItem("mediconnect_user");

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => sessionStorage.getItem("mediconnect_token"));
    const [user, setUser] = useState(() => {
        const saved = sessionStorage.getItem("mediconnect_user");
        try {
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [verifying, setVerifying] = useState(() => Boolean(sessionStorage.getItem("mediconnect_token")));

    const logout = () => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem("mediconnect_token");
        sessionStorage.removeItem("mediconnect_user");
        localStorage.removeItem("mediconnect_token");
        localStorage.removeItem("mediconnect_user");
    };

    // Validate session with Spring Boot on startup; force /login if server stopped or user deleted
    useEffect(() => {
        if (!token || !user?.role) {
            setVerifying(false);
            return;
        }

        const checkUrl =
            user.role === "ADMIN"
                ? "/api/admin/dashboard"
                : user.role === "DOCTOR"
                    ? "/api/doctors/profile"
                    : "/api/patients/profile";

        axiosClient
            .get(checkUrl)
            .catch(() => {
                logout();
            })
            .finally(() => {
                setVerifying(false);
            });
        // Run once on initial app mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loginSession = (authResponse) => {
        const cleanUser = {
            userId: authResponse.userId,
            fullName: authResponse.fullName,
            email: authResponse.email,
            role: authResponse.role,
        };
        sessionStorage.setItem("mediconnect_token", authResponse.token);
        sessionStorage.setItem("mediconnect_user", JSON.stringify(cleanUser));
        setToken(authResponse.token);
        setUser(cleanUser);
    };

    const value = {
        token,
        user,
        role: user?.role || null,
        isAuthenticated: Boolean(token && user),
        verifying,
        loginSession,
        logout,
    };

    if (verifying) {
        return (
            <div className="auth-shell">
                <div className="empty-state-card">Verifying session...</div>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}