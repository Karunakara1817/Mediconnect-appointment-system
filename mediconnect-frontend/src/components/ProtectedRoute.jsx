import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles, children }) {
    const { isAuthenticated, role } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
        if (role === "DOCTOR") return <Navigate to="/doctor/dashboard" replace />;
        return <Navigate to="/patient/dashboard" replace />;
    }

    return children;
}