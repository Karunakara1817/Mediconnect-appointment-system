import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    Calendar,
    CalendarClock,
    CheckCircle2,
    Clock,
    Droplets,
    IndianRupee,
    KeyRound,
    MapPin,
    Phone,
    Save,
    Stethoscope,
    User,
    XCircle,
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import Navbar from "../components/Navbar";

const STATUS_FILTERS = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"];

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from(
    { length: CURRENT_YEAR - 1919 },
    (_, index) => String(CURRENT_YEAR - index)
);

const MONTHS = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
];

function getDaysInMonth(year, month) {
    if (!month) return 31;
    const safeYear = year ? Number(year) : 2000;
    return new Date(safeYear, Number(month), 0).getDate();
}

function getTodayLocalIso() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatTime(timeStr) {
    if (!timeStr) return "";
    const [hoursStr, minutesStr] = timeStr.split(":");
    const hours = Number(hoursStr);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return `${String(displayHour).padStart(2, "0")}:${minutesStr} ${period}`;
}

function extractError(err) {
    const data = err.response?.data;
    if (!data) return "Unable to connect to MediConnect server.";
    if (data.errors && typeof data.errors === "object") {
        return Object.values(data.errors).join(" • ");
    }
    return data.message || data.error || "Request failed.";
}

export default function PatientDashboardPage() {
    const [activeTab, setActiveTab] = useState("APPOINTMENTS");
    const [appointments, setAppointments] = useState([]);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);

    const [profile, setProfile] = useState({
        fullName: "",
        email: "",
        phone: "",
        dobYear: "",
        dobMonth: "",
        dobDay: "",
        gender: "",
        bloodGroup: "",
        address: "",
    });
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [savingPassword, setSavingPassword] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchAppointments = useCallback(async () => {
        setLoadingAppointments(true);
        try {
            const res = await axiosClient.get("/api/appointments/my");
            setAppointments(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError(extractError(err));
        } finally {
            setLoadingAppointments(false);
        }
    }, []);

    const fetchProfile = useCallback(async () => {
        setLoadingProfile(true);
        try {
            const res = await axiosClient.get("/api/patients/profile");
            const p = res.data;
            const [dobYear = "", dobMonth = "", dobDay = ""] = p.dateOfBirth
                ? String(p.dateOfBirth).split("-")
                : [];

            setProfile({
                fullName: p.fullName || "",
                email: p.email || "",
                phone: p.phone || "",
                dobYear,
                dobMonth,
                dobDay,
                gender: p.gender || "",
                bloodGroup: p.bloodGroup || "",
                address: p.address || "",
            });
        } catch (err) {
            setError(extractError(err));
        } finally {
            setLoadingProfile(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
        fetchProfile();
    }, [fetchAppointments, fetchProfile]);

    const handleDobPartChange = (part, value) => {
        setProfile((prev) => {
            const next = { ...prev, [part]: value };
            const maxDays = getDaysInMonth(next.dobYear, next.dobMonth);
            if (next.dobDay && Number(next.dobDay) > maxDays) {
                next.dobDay = String(maxDays).padStart(2, "0");
            }
            return next;
        });
    };

    const handleCancelAppointment = async (appointmentId) => {
        setError("");
        setSuccess("");
        setCancellingId(appointmentId);
        try {
            await axiosClient.delete(`/api/appointments/${appointmentId}`);
            setSuccess("Appointment cancelled. The time slot has been released.");
            await fetchAppointments();
            window.dispatchEvent(new Event("mediconnect:notifications-updated"));
        } catch (err) {
            setError(extractError(err));
        } finally {
            setCancellingId(null);
        }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        let formattedDob = null;
        const hasAnyDobPart = profile.dobYear || profile.dobMonth || profile.dobDay;

        if (hasAnyDobPart) {
            if (!profile.dobYear || !profile.dobMonth || !profile.dobDay) {
                setError("Please select complete Day, Month, and Year for Date of Birth.");
                return;
            }

            formattedDob = `${profile.dobYear}-${profile.dobMonth}-${profile.dobDay}`;
            if (formattedDob > getTodayLocalIso()) {
                setError("Date of Birth cannot be a future date.");
                return;
            }
        }

        setSavingProfile(true);
        try {
            await axiosClient.put("/api/patients/profile", {
                fullName: profile.fullName.trim(),
                phone: profile.phone.trim(),
                dateOfBirth: formattedDob,
                gender: profile.gender.trim() || null,
                bloodGroup: profile.bloodGroup.trim() || null,
                address: profile.address.trim() || null,
            });
            setSuccess("Patient profile updated successfully.");
            await fetchProfile();
        } catch (err) {
            setError(extractError(err));
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError("New password and confirmation do not match.");
            return;
        }

        setSavingPassword(true);
        try {
            const res = await axiosClient.put("/api/patients/change-password", {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            setSuccess(res.data?.message || "Password updated successfully.");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            setError(extractError(err));
        } finally {
            setSavingPassword(false);
        }
    };

    const totalCount = appointments.length;
    const upcomingCount = appointments.filter(
        (a) => a.status === "PENDING" || a.status === "CONFIRMED"
    ).length;
    const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;

    const filteredAppointments =
        statusFilter === "ALL"
            ? appointments
            : appointments.filter((a) => a.status === statusFilter);

    const daysInSelectedMonth = getDaysInMonth(profile.dobYear, profile.dobMonth);
    const dayOptions = Array.from({ length: daysInSelectedMonth }, (_, index) =>
        String(index + 1).padStart(2, "0")
    );

    return (
        <div className="page-shell">
            <Navbar />

            <main className="page-container">
                {/* Header & Quick CTA */}
                <section className="dash-banner">
                    <div>
            <span className="card-eyebrow">
              <User size={13} />
              Patient Portal
            </span>
                        <h1 className="page-title">Hello, {profile.fullName || "Patient"}</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>
                            Track your scheduled visits, manage personal health details, and book new
                            consultations.
                        </p>
                    </div>

                    <Link
                        to="/doctors"
                        className="btn-tactile-primary"
                        style={{ width: "auto", marginTop: 0, textDecoration: "none" }}
                    >
                        <Stethoscope size={17} />
                        <span>Book New Appointment</span>
                    </Link>
                </section>

                {/* KPI Metric Tiles */}
                <section className="kpi-grid">
                    <div className="kpi-tile">
                        <span className="kpi-label">Total Bookings</span>
                        <strong className="kpi-value">{totalCount}</strong>
                    </div>
                    <div className="kpi-tile accent-teal">
                        <span className="kpi-label">Upcoming / Active</span>
                        <strong className="kpi-value">{upcomingCount}</strong>
                    </div>
                    <div className="kpi-tile accent-blue">
                        <span className="kpi-label">Completed Visits</span>
                        <strong className="kpi-value">{completedCount}</strong>
                    </div>
                </section>

                {/* Tactile Section Tabs */}
                <div className="dash-tabs" role="tablist">
                    <button
                        type="button"
                        className={`dash-tab-btn ${activeTab === "APPOINTMENTS" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("APPOINTMENTS");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        <CalendarClock size={16} />
                        <span>My Appointments</span>
                    </button>
                    <button
                        type="button"
                        className={`dash-tab-btn ${activeTab === "PROFILE" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("PROFILE");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        <User size={16} />
                        <span>Health Profile</span>
                    </button>
                    <button
                        type="button"
                        className={`dash-tab-btn ${activeTab === "SECURITY" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("SECURITY");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        <KeyRound size={16} />
                        <span>Change Password</span>
                    </button>
                </div>

                {error && (
                    <div className="alert-banner alert-error" role="alert">
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="alert-banner alert-success" role="status">
                        <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                        <span>{success}</span>
                    </div>
                )}

                {/* TAB 1: APPOINTMENTS */}
                {activeTab === "APPOINTMENTS" && (
                    <section className="dash-panel">
                        <div className="panel-toolbar">
                            <h2 className="panel-heading">Appointment History</h2>
                            <div className="spec-pill-row" style={{ marginTop: 0 }}>
                                {STATUS_FILTERS.map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        className={`spec-pill ${statusFilter === status ? "active" : ""}`}
                                        onClick={() => setStatusFilter(status)}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loadingAppointments ? (
                            <div className="slot-empty-well">Loading your appointments...</div>
                        ) : filteredAppointments.length === 0 ? (
                            <div className="slot-empty-well">
                                No appointments found under <strong>{statusFilter}</strong>.
                            </div>
                        ) : (
                            <div className="appt-list">
                                {filteredAppointments.map((appt) => {
                                    const canCancel =
                                        appt.status === "PENDING" || appt.status === "CONFIRMED";
                                    return (
                                        <article key={appt.id} className="appt-card">
                                            <div className="appt-main">
                                                <div className="appt-top-row">
                          <span className={`status-badge status-${appt.status.toLowerCase()}`}>
                            {appt.status}
                          </span>
                                                    <span className="appt-id">Booking #{appt.id}</span>
                                                </div>

                                                <h3 className="appt-title">{appt.doctorName}</h3>
                                                <p className="appt-sub">{appt.doctorSpecialization}</p>

                                                <div className="appt-meta-row">
                          <span className="meta-chip">
                            <Calendar size={14} />
                              {appt.appointmentDate}
                          </span>
                                                    <span className="meta-chip">
                            <Clock size={14} />
                                                        {formatTime(appt.appointmentTime)}
                          </span>
                                                    <span className="meta-chip fee">
                            <IndianRupee size={13} />
                                                        {appt.consultationFee}
                          </span>
                                                </div>

                                                {appt.reason && (
                                                    <p className="appt-note">
                                                        <strong>Reason:</strong> {appt.reason}
                                                    </p>
                                                )}
                                                {appt.notes && (
                                                    <p className="appt-note doctor-reply">
                                                        <strong>Doctor&apos;s Note:</strong> {appt.notes}
                                                    </p>
                                                )}
                                            </div>

                                            {canCancel && (
                                                <div className="appt-actions">
                                                    <button
                                                        type="button"
                                                        className="btn-tactile-danger"
                                                        disabled={cancellingId === appt.id}
                                                        onClick={() => handleCancelAppointment(appt.id)}
                                                    >
                                                        <XCircle size={15} />
                                                        <span>
                              {cancellingId === appt.id ? "Cancelling..." : "Cancel Booking"}
                            </span>
                                                    </button>
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* TAB 2: PROFILE */}
                {activeTab === "PROFILE" && (
                    <section className="dash-panel">
                        <h2 className="panel-heading" style={{ marginBottom: 18 }}>
                            Personal &amp; Health Profile
                        </h2>

                        {loadingProfile ? (
                            <div className="slot-empty-well">Loading profile...</div>
                        ) : (
                            <form className="form-stack" onSubmit={handleProfileSave}>
                                <div className="form-row-2">
                                    <div className="field-group">
                                        <label className="field-label" htmlFor="pat-name">
                                            Full Name
                                        </label>
                                        <div className="input-well">
                      <span className="input-icon">
                        <User size={16} />
                      </span>
                                            <input
                                                id="pat-name"
                                                type="text"
                                                className="tactile-input"
                                                value={profile.fullName}
                                                onChange={(e) =>
                                                    setProfile((prev) => ({ ...prev, fullName: e.target.value }))
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label" htmlFor="pat-phone">
                                            Phone Number
                                        </label>
                                        <div className="input-well">
                      <span className="input-icon">
                        <Phone size={16} />
                      </span>
                                            <input
                                                id="pat-phone"
                                                type="tel"
                                                pattern="[0-9]{10,15}"
                                                className="tactile-input"
                                                value={profile.phone}
                                                onChange={(e) =>
                                                    setProfile((prev) => ({ ...prev, phone: e.target.value }))
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Date of Birth: Explicit Day / Month / Year Selector (1920–2026) */}
                                <div className="field-group">
                                    <label className="field-label" htmlFor="pat-dob-year">
                                        Date of Birth
                                    </label>
                                    <div className="form-row-3">
                                        <div className="input-well">
                      <span className="input-icon">
                        <Calendar size={16} />
                      </span>
                                            <select
                                                id="pat-dob-day"
                                                aria-label="Birth Day"
                                                className="tactile-input"
                                                value={profile.dobDay}
                                                onChange={(e) => handleDobPartChange("dobDay", e.target.value)}
                                            >
                                                <option value="">Day</option>
                                                {dayOptions.map((day) => (
                                                    <option key={day} value={day}>
                                                        {day}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="input-well">
                                            <select
                                                id="pat-dob-month"
                                                aria-label="Birth Month"
                                                className="tactile-input"
                                                value={profile.dobMonth}
                                                onChange={(e) => handleDobPartChange("dobMonth", e.target.value)}
                                            >
                                                <option value="">Month</option>
                                                {MONTHS.map((m) => (
                                                    <option key={m.value} value={m.value}>
                                                        {m.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="input-well">
                                            <select
                                                id="pat-dob-year"
                                                aria-label="Birth Year"
                                                className="tactile-input"
                                                value={profile.dobYear}
                                                onChange={(e) => handleDobPartChange("dobYear", e.target.value)}
                                            >
                                                <option value="">Year</option>
                                                {BIRTH_YEARS.map((year) => (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row-2">
                                    <div className="field-group">
                                        <label className="field-label" htmlFor="pat-gender">
                                            Gender
                                        </label>
                                        <div className="input-well">
                                            <select
                                                id="pat-gender"
                                                className="tactile-input"
                                                value={profile.gender}
                                                onChange={(e) =>
                                                    setProfile((prev) => ({ ...prev, gender: e.target.value }))
                                                }
                                            >
                                                <option value="">Select gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label" htmlFor="pat-blood">
                                            Blood Group
                                        </label>
                                        <div className="input-well">
                      <span className="input-icon">
                        <Droplets size={16} />
                      </span>
                                            <select
                                                id="pat-blood"
                                                className="tactile-input"
                                                value={profile.bloodGroup}
                                                onChange={(e) =>
                                                    setProfile((prev) => ({ ...prev, bloodGroup: e.target.value }))
                                                }
                                            >
                                                <option value="">Select blood group</option>
                                                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                                                    <option key={bg} value={bg}>
                                                        {bg}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label className="field-label" htmlFor="pat-address">
                                        Address
                                    </label>
                                    <div className="input-well">
                    <span className="input-icon">
                      <MapPin size={16} />
                    </span>
                                        <input
                                            id="pat-address"
                                            type="text"
                                            className="tactile-input"
                                            placeholder="City, State"
                                            value={profile.address}
                                            onChange={(e) =>
                                                setProfile((prev) => ({ ...prev, address: e.target.value }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        className="btn-tactile-primary"
                                        style={{ width: "auto" }}
                                        disabled={savingProfile}
                                    >
                                        <Save size={16} />
                                        <span>{savingProfile ? "Saving..." : "Save Profile Changes"}</span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>
                )}

                {/* TAB 3: CHANGE PASSWORD */}
                {activeTab === "SECURITY" && (
                    <section className="dash-panel" style={{ maxWidth: 560 }}>
                        <h2 className="panel-heading" style={{ marginBottom: 18 }}>
                            Update Account Password
                        </h2>

                        <form className="form-stack" onSubmit={handlePasswordChange}>
                            <div className="field-group">
                                <label className="field-label" htmlFor="cur-pass">
                                    Current Password
                                </label>
                                <div className="input-well">
                                    <input
                                        id="cur-pass"
                                        type="password"
                                        className="tactile-input"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) =>
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                currentPassword: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <label className="field-label" htmlFor="new-pass">
                                    New Password
                                </label>
                                <div className="input-well">
                                    <input
                                        id="new-pass"
                                        type="password"
                                        minLength={6}
                                        className="tactile-input"
                                        value={passwordForm.newPassword}
                                        onChange={(e) =>
                                            setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <label className="field-label" htmlFor="conf-pass">
                                    Confirm New Password
                                </label>
                                <div className="input-well">
                                    <input
                                        id="conf-pass"
                                        type="password"
                                        minLength={6}
                                        className="tactile-input"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) =>
                                            setPasswordForm((prev) => ({
                                                ...prev,
                                                confirmPassword: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="btn-tactile-primary"
                                    style={{ width: "auto" }}
                                    disabled={savingPassword}
                                >
                                    <KeyRound size={16} />
                                    <span>{savingPassword ? "Updating..." : "Update Password"}</span>
                                </button>
                            </div>
                        </form>
                    </section>
                )}
            </main>
        </div>
    );
}