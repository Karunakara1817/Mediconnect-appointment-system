import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ArrowRight,
    BellRing,
    CalendarCheck2,
    Eye,
    EyeOff,
    HeartPulse,
    Lock,
    Mail,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    User,
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import Spatial3DCard from "../components/Spatial3DCard";
import Medical3DPrism from "../components/Medical3DPrism";
import InteractiveAuroraCanvas from "../components/InteractiveAuroraCanvas";

const PORTAL_THEMES = {
    PATIENT: {
        label: "Patient",
        headline: "Care that connects patients & doctors seamlessly.",
        subtitle:
            "Book verified specialists in real time, track live consultation slots, and receive instant appointment alerts.",
        badge: "Patient Portal Ready",
        icon: User,
    },
    DOCTOR: {
        label: "Doctor",
        headline: "Manage consultations & weekly schedules effortlessly.",
        subtitle:
            "Publish live availability slots, review incoming patient bookings, and confirm appointments in one click.",
        badge: "Verified Specialist Access",
        icon: Stethoscope,
    },
    ADMIN: {
        label: "Admin",
        headline: "Full oversight across doctors, patients & bookings.",
        subtitle:
            "Approve newly registered doctors, monitor real-time platform KPIs, and control user access securely.",
        badge: "Control Center Security",
        icon: ShieldCheck,
    },
};

function extractErrorMessage(err) {
    const data = err.response?.data;
    if (!data) {
        return "Unable to reach MediConnect server. Make sure Spring Boot is running on port 8080.";
    }
    if (data.errors && typeof data.errors === "object") {
        return Object.values(data.errors).join(" • ");
    }
    return data.message || data.error || "Invalid email or password.";
}

export default function LoginPage() {
    const navigate = useNavigate();
    const { loginSession } = useAuth();

    const [portalTheme, setPortalTheme] = useState("PATIENT");
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const activePortal = PORTAL_THEMES[portalTheme];

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await axiosClient.post("/api/auth/login", {
                email: formData.email.trim(),
                password: formData.password,
            });

            const authData = response.data;
            loginSession(authData);

            if (authData.role === "ADMIN") {
                navigate("/admin/dashboard", { replace: true });
            } else if (authData.role === "DOCTOR") {
                navigate("/doctor/dashboard", { replace: true });
            } else {
                navigate("/patient/dashboard", { replace: true });
            }
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`auth-shell auth-interactive theme-${portalTheme.toLowerCase()}`}>
            <InteractiveAuroraCanvas themeKey={portalTheme} />

            <div className="auth-grid auth-foreground">
                <Spatial3DCard maxTilt={11} glareOpacity={0.34}>
                    <section className="tactile-hero interactive-hero">
                        <div className="depth-1">
                            <div className="hero-top-bar depth-2">
                                <div className="brand-pill">
                                    <HeartPulse size={20} />
                                    <span>MediConnect</span>
                                </div>
                                <span className="live-pulse-pill">
                  <span className="live-dot" />
                  <span>Live 3D</span>
                </span>
                            </div>

                            <Medical3DPrism />

                            <h1 className="hero-title depth-2" style={{ marginTop: 12 }}>
                                {activePortal.headline}
                            </h1>
                            <p className="hero-subtitle">{activePortal.subtitle}</p>

                            <div className="hero-feature-stack">
                                <div className="hero-feature-card depth-1">
                                    <div className="hero-feature-icon">
                                        <CalendarCheck2 size={18} />
                                    </div>
                                    <div>
                                        <h4>Real-Time Slot Engine</h4>
                                        <p>Live doctor schedules with automatic double-booking prevention.</p>
                                    </div>
                                </div>

                                <div className="hero-feature-card depth-1">
                                    <div className="hero-feature-icon">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <div>
                                        <h4>Role-Based JWT Security</h4>
                                        <p>Dedicated portals for Patients, Verified Doctors, and Administrators.</p>
                                    </div>
                                </div>

                                <div className="hero-feature-card depth-1">
                                    <div className="hero-feature-icon">
                                        <BellRing size={18} />
                                    </div>
                                    <div>
                                        <h4>Instant Status Alerts</h4>
                                        <p>Synchronized in-app and email notifications on every appointment update.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hero-footer-note depth-1">
                            MediConnect Healthcare Platform • Move cursor or click to interact
                        </div>
                    </section>
                </Spatial3DCard>

                <Spatial3DCard maxTilt={5} glareOpacity={0.22}>
                    <section className="tactile-card interactive-form-card">
            <span className="card-eyebrow depth-2">
              <Sparkles size={14} />
                {activePortal.badge}
            </span>
                        <h2 className="card-title depth-2">Welcome back</h2>
                        <p className="card-subtitle depth-1">
                            Sign in with your Patient, Doctor, or Admin credentials to continue.
                        </p>

                        <div className="portal-mood-bar depth-1" role="tablist" aria-label="Portal Theme">
                            {Object.entries(PORTAL_THEMES).map(([key, item]) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        role="tab"
                                        aria-selected={portalTheme === key}
                                        className={`portal-mood-btn ${portalTheme === key ? "active" : ""}`}
                                        onClick={() => setPortalTheme(key)}
                                    >
                                        <Icon size={15} />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {error && (
                            <div className="alert-banner alert-error depth-2" role="alert">
                                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form className="form-stack depth-1" onSubmit={handleSubmit}>
                            <div className="field-group">
                                <label className="field-label" htmlFor="login-email">
                                    Email Address
                                </label>
                                <div className="input-well interactive-input-well">
                  <span className="input-icon">
                    <Mail size={18} />
                  </span>
                                    <input
                                        id="login-email"
                                        name="email"
                                        type="email"
                                        className="tactile-input"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <label className="field-label" htmlFor="login-password">
                                    Password
                                </label>
                                <div className="input-well interactive-input-well">
                  <span className="input-icon">
                    <Lock size={18} />
                  </span>
                                    <input
                                        id="login-password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        className="tactile-input"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="input-action-btn"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn-tactile-primary depth-3" disabled={loading}>
                                <span>{loading ? "Signing in..." : "Sign In to MediConnect"}</span>
                                {!loading && <ArrowRight size={18} />}
                            </button>
                        </form>

                        <p className="auth-switch-text depth-1">
                            New to MediConnect?{" "}
                            <Link to="/register" className="auth-switch-link">
                                Create an account
                            </Link>
                        </p>
                    </section>
                </Spatial3DCard>
            </div>
        </div>
    );
}