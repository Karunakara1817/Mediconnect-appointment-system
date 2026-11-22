import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ArrowRight,
    Briefcase,
    CheckCircle2,
    Eye,
    EyeOff,
    FileText,
    GraduationCap,
    HeartPulse,
    IndianRupee,
    Lock,
    Mail,
    Phone,
    ShieldCheck,
    Stethoscope,
    User,
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import Spatial3DCard from "../components/Spatial3DCard";
import Medical3DPrism from "../components/Medical3DPrism";

function extractErrorMessage(err) {
    const data = err.response?.data;
    if (!data) {
        return "Unable to reach MediConnect server. Make sure Spring Boot is running on port 8080.";
    }
    if (data.errors && typeof data.errors === "object") {
        return Object.values(data.errors).join(" • ");
    }
    return data.message || data.error || "Registration failed. Please check your details.";
}

export default function RegisterPage() {
    const navigate = useNavigate();
    const { loginSession } = useAuth();

    const [accountType, setAccountType] = useState("PATIENT");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        specialization: "",
        qualification: "",
        experienceYears: "",
        consultationFee: "",
        bio: "",
    });

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError("");
    };

    const handleModeSwitch = (mode) => {
        setAccountType(mode);
        setError("");
        setSuccessMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setLoading(true);

        try {
            if (accountType === "PATIENT") {
                const response = await axiosClient.post("/api/patients/register", {
                    fullName: formData.fullName.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone.trim(),
                    password: formData.password,
                });

                loginSession(response.data);
                navigate("/patient/dashboard", { replace: true });
            } else {
                const response = await axiosClient.post("/api/doctors/register", {
                    fullName: formData.fullName.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone.trim(),
                    password: formData.password,
                    specialization: formData.specialization.trim(),
                    qualification: formData.qualification.trim(),
                    experienceYears: Number(formData.experienceYears),
                    consultationFee: Number(formData.consultationFee),
                    bio: formData.bio.trim() || null,
                });

                setSuccessMessage(
                    response.data?.message ||
                    "Doctor registered successfully. Your account is pending admin approval."
                );
                setFormData({
                    fullName: "",
                    email: "",
                    phone: "",
                    password: "",
                    specialization: "",
                    qualification: "",
                    experienceYears: "",
                    consultationFee: "",
                    bio: "",
                });
            }
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            <div className="auth-grid">
                {/* Left Interactive 3D Onboarding Panel */}
                <Spatial3DCard maxTilt={10} glareOpacity={0.22}>
                    <section className="tactile-hero">
                        <div className="depth-1">
                            <div className="brand-pill depth-2">
                                <HeartPulse size={20} />
                                <span>MediConnect</span>
                            </div>

                            <Medical3DPrism />

                            <h1 className="hero-title depth-2" style={{ marginTop: 12 }}>
                                {accountType === "PATIENT"
                                    ? "Create your personal health access."
                                    : "Join our verified specialist network."}
                            </h1>
                            <p className="hero-subtitle">
                                {accountType === "PATIENT"
                                    ? "Register in seconds to discover approved doctors, pick open slots, and manage your medical appointments."
                                    : "Submit your medical credentials to publish your weekly consultation hours and manage incoming bookings."}
                            </p>

                            <div className="hero-feature-stack">
                                <div className="hero-feature-card depth-1">
                                    <div className="hero-feature-icon">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <h4>Instant Patient Onboarding</h4>
                                        <p>Immediate portal access with profile management and booking history.</p>
                                    </div>
                                </div>

                                <div className="hero-feature-card depth-1">
                                    <div className="hero-feature-icon">
                                        <Stethoscope size={18} />
                                    </div>
                                    <div>
                                        <h4>Verified Doctor Approval</h4>
                                        <p>Every specialist profile is reviewed by an administrator before going live.</p>
                                    </div>
                                </div>

                                <div className="hero-feature-card depth-1">
                                    <div className="hero-feature-icon">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <div>
                                        <h4>Encrypted Credentials</h4>
                                        <p>BCrypt password hashing and stateless JWT authentication end to end.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="hero-footer-note depth-1">
                            Switch between Patient and Doctor tabs at any time on the right panel.
                        </div>
                    </section>
                </Spatial3DCard>

                {/* Right Interactive 3D Registration Card */}
                <Spatial3DCard maxTilt={4} glareOpacity={0.12}>
                    <section className="tactile-card">
            <span className="card-eyebrow depth-2">
              <HeartPulse size={14} />
              New Account Registration
            </span>
                        <h2 className="card-title depth-2">Join MediConnect</h2>
                        <p className="card-subtitle depth-1">
                            Choose your role and fill in your details below.
                        </p>

                        {/* 3D Tactile Role Switcher */}
                        <div className="tactile-segment depth-1" role="tablist" aria-label="Account Type">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={accountType === "PATIENT"}
                                className={`segment-btn ${accountType === "PATIENT" ? "active" : ""}`}
                                onClick={() => handleModeSwitch("PATIENT")}
                            >
                                <User size={17} />
                                <span>Patient</span>
                            </button>

                            <button
                                type="button"
                                role="tab"
                                aria-selected={accountType === "DOCTOR"}
                                className={`segment-btn ${accountType === "DOCTOR" ? "active" : ""}`}
                                onClick={() => handleModeSwitch("DOCTOR")}
                            >
                                <Stethoscope size={17} />
                                <span>Doctor</span>
                            </button>
                        </div>

                        {error && (
                            <div className="alert-banner alert-error depth-2" role="alert">
                                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                                <span>{error}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="alert-banner alert-success depth-2" role="status">
                                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                                <div>
                                    <div>{successMessage}</div>
                                    <div style={{ marginTop: 6 }}>
                                        <Link to="/login" className="auth-switch-link">
                                            Proceed to Sign In →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form className="form-stack depth-1" onSubmit={handleSubmit}>
                            <div className="form-row-2">
                                <div className="field-group">
                                    <label className="field-label" htmlFor="reg-name">
                                        Full Name
                                    </label>
                                    <div className="input-well">
                    <span className="input-icon">
                      <User size={17} />
                    </span>
                                        <input
                                            id="reg-name"
                                            name="fullName"
                                            type="text"
                                            className="tactile-input"
                                            placeholder={accountType === "DOCTOR" ? "Dr. Priya Sharma" : "Karna K B"}
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label className="field-label" htmlFor="reg-phone">
                                        Phone Number
                                    </label>
                                    <div className="input-well">
                    <span className="input-icon">
                      <Phone size={17} />
                    </span>
                                        <input
                                            id="reg-phone"
                                            name="phone"
                                            type="tel"
                                            className="tactile-input"
                                            placeholder="9876543210"
                                            pattern="[0-9]{10,15}"
                                            title="Enter 10 to 15 digits"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-row-2">
                                <div className="field-group">
                                    <label className="field-label" htmlFor="reg-email">
                                        Email Address
                                    </label>
                                    <div className="input-well">
                    <span className="input-icon">
                      <Mail size={17} />
                    </span>
                                        <input
                                            id="reg-email"
                                            name="email"
                                            type="email"
                                            className="tactile-input"
                                            placeholder="name@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label className="field-label" htmlFor="reg-password">
                                        Password
                                    </label>
                                    <div className="input-well">
                    <span className="input-icon">
                      <Lock size={17} />
                    </span>
                                        <input
                                            id="reg-password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            className="tactile-input"
                                            placeholder="Min. 6 characters"
                                            minLength={6}
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="input-action-btn"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {accountType === "DOCTOR" && (
                                <>
                                    <div className="form-row-2">
                                        <div className="field-group">
                                            <label className="field-label" htmlFor="reg-spec">
                                                Specialization
                                            </label>
                                            <div className="input-well">
                        <span className="input-icon">
                          <Stethoscope size={17} />
                        </span>
                                                <input
                                                    id="reg-spec"
                                                    name="specialization"
                                                    type="text"
                                                    className="tactile-input"
                                                    placeholder="Cardiology"
                                                    value={formData.specialization}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label" htmlFor="reg-qual">
                                                Qualification
                                            </label>
                                            <div className="input-well">
                        <span className="input-icon">
                          <GraduationCap size={17} />
                        </span>
                                                <input
                                                    id="reg-qual"
                                                    name="qualification"
                                                    type="text"
                                                    className="tactile-input"
                                                    placeholder="MBBS, MD"
                                                    value={formData.qualification}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row-2">
                                        <div className="field-group">
                                            <label className="field-label" htmlFor="reg-exp">
                                                Experience (Years)
                                            </label>
                                            <div className="input-well">
                        <span className="input-icon">
                          <Briefcase size={17} />
                        </span>
                                                <input
                                                    id="reg-exp"
                                                    name="experienceYears"
                                                    type="number"
                                                    min={0}
                                                    max={70}
                                                    className="tactile-input"
                                                    placeholder="6"
                                                    value={formData.experienceYears}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="field-group">
                                            <label className="field-label" htmlFor="reg-fee">
                                                Consultation Fee (₹)
                                            </label>
                                            <div className="input-well">
                        <span className="input-icon">
                          <IndianRupee size={17} />
                        </span>
                                                <input
                                                    id="reg-fee"
                                                    name="consultationFee"
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    className="tactile-input"
                                                    placeholder="600"
                                                    value={formData.consultationFee}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label" htmlFor="reg-bio">
                                            Short Bio (Optional)
                                        </label>
                                        <div className="input-well" style={{ alignItems: "flex-start" }}>
                      <span className="input-icon" style={{ marginTop: 12 }}>
                        <FileText size={17} />
                      </span>
                                            <textarea
                                                id="reg-bio"
                                                name="bio"
                                                className="tactile-textarea"
                                                placeholder="Brief summary of your clinical focus and experience..."
                                                maxLength={500}
                                                value={formData.bio}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <button type="submit" className="btn-tactile-primary depth-3" disabled={loading}>
                <span>
                  {loading
                      ? "Creating account..."
                      : accountType === "PATIENT"
                          ? "Create Patient Account"
                          : "Submit Doctor Application"}
                </span>
                                {!loading && <ArrowRight size={18} />}
                            </button>
                        </form>

                        <p className="auth-switch-text depth-1">
                            Already have an account?{" "}
                            <Link to="/login" className="auth-switch-link">
                                Sign in here
                            </Link>
                        </p>
                    </section>
                </Spatial3DCard>
            </div>
        </div>
    );
}