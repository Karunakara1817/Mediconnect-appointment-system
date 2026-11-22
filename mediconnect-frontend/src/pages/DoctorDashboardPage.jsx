import { useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    Briefcase,
    Calendar,
    CalendarClock,
    Check,
    CheckCheck,
    CheckCircle2,
    Clock,
    GraduationCap,
    IndianRupee,
    Mail,
    Phone,
    Plus,
    Save,
    Stethoscope,
    Trash2,
    User,
    X,
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import Navbar from "../components/Navbar";

const DAYS_OF_WEEK = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
];

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

export default function DoctorDashboardPage() {
    const [activeTab, setActiveTab] = useState("APPOINTMENTS");
    const [appointments, setAppointments] = useState([]);
    const [noteDrafts, setNoteDrafts] = useState({});
    const [updatingApptId, setUpdatingApptId] = useState(null);

    const [availability, setAvailability] = useState([]);
    const [slotForm, setSlotForm] = useState({
        dayOfWeek: "TUESDAY",
        startTime: "09:00",
        endTime: "13:00",
        slotDurationMinutes: 30,
        available: true,
    });
    const [savingSlot, setSavingSlot] = useState(false);

    const [profile, setProfile] = useState({
        fullName: "",
        phone: "",
        specialization: "",
        qualification: "",
        experienceYears: 0,
        consultationFee: 0,
        bio: "",
    });
    const [savingProfile, setSavingProfile] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadDoctorWorkspace = useCallback(async () => {
        setLoading(true);
        try {
            const [apptRes, availRes, profRes] = await Promise.all([
                axiosClient.get("/api/appointments/my"),
                axiosClient.get("/api/doctors/availability"),
                axiosClient.get("/api/doctors/profile"),
            ]);

            const apptList = Array.isArray(apptRes.data) ? apptRes.data : [];
            setAppointments(apptList);
            setAvailability(Array.isArray(availRes.data) ? availRes.data : []);

            const p = profRes.data;
            setProfile({
                fullName: p.fullName || "",
                phone: p.phone || "",
                specialization: p.specialization || "",
                qualification: p.qualification || "",
                experienceYears: p.experienceYears ?? 0,
                consultationFee: p.consultationFee ?? 0,
                bio: p.bio || "",
            });
        } catch (err) {
            setError(extractError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDoctorWorkspace();
    }, [loadDoctorWorkspace]);

    const handleStatusUpdate = async (appointmentId, nextStatus) => {
        setError("");
        setSuccess("");
        setUpdatingApptId(appointmentId);
        try {
            await axiosClient.put(`/api/appointments/${appointmentId}/status`, {
                status: nextStatus,
                notes: noteDrafts[appointmentId]?.trim() || null,
            });
            setSuccess(`Appointment #${appointmentId} marked as ${nextStatus}.`);
            await loadDoctorWorkspace();
            window.dispatchEvent(new Event("mediconnect:notifications-updated"));
        } catch (err) {
            setError(extractError(err));
        } finally {
            setUpdatingApptId(null);
        }
    };

    const handleSaveAvailability = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setSavingSlot(true);
        try {
            await axiosClient.post("/api/doctors/availability", {
                dayOfWeek: slotForm.dayOfWeek,
                startTime: slotForm.startTime,
                endTime: slotForm.endTime,
                slotDurationMinutes: Number(slotForm.slotDurationMinutes),
                available: Boolean(slotForm.available),
            });
            setSuccess(`Saved schedule for ${slotForm.dayOfWeek}.`);
            const res = await axiosClient.get("/api/doctors/availability");
            setAvailability(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError(extractError(err));
        } finally {
            setSavingSlot(false);
        }
    };

    const handleDeleteAvailability = async (slotId) => {
        setError("");
        setSuccess("");
        try {
            await axiosClient.delete(`/api/doctors/availability/${slotId}`);
            setSuccess("Availability slot removed.");
            setAvailability((prev) => prev.filter((item) => item.id !== slotId));
        } catch (err) {
            setError(extractError(err));
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setSavingProfile(true);
        try {
            await axiosClient.put("/api/doctors/profile", {
                fullName: profile.fullName.trim(),
                phone: profile.phone.trim(),
                specialization: profile.specialization.trim(),
                qualification: profile.qualification.trim(),
                experienceYears: Number(profile.experienceYears),
                consultationFee: Number(profile.consultationFee),
                bio: profile.bio.trim() || null,
            });
            setSuccess("Doctor profile updated successfully.");
        } catch (err) {
            setError(extractError(err));
        } finally {
            setSavingProfile(false);
        }
    };

    const pendingCount = appointments.filter((a) => a.status === "PENDING").length;
    const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;
    const activeDaysCount = availability.filter((s) => s.available).length;

    return (
        <div className="page-shell">
            <Navbar />

            <main className="page-container">
                {/* Banner */}
                <section className="dash-banner">
                    <div>
            <span className="card-eyebrow">
              <Stethoscope size={13} />
              Doctor Clinical Portal
            </span>
                        <h1 className="page-title">{profile.fullName || "Doctor Workspace"}</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>
                            {profile.specialization
                                ? `${profile.specialization} • ${profile.qualification}`
                                : "Manage patient appointments, weekly consultation hours, and specialist details."}
                        </p>
                    </div>
                </section>

                {/* KPI Metric Tiles */}
                <section className="kpi-grid">
                    <div className="kpi-tile accent-amber">
                        <span className="kpi-label">Pending Requests</span>
                        <strong className="kpi-value">{pendingCount}</strong>
                    </div>
                    <div className="kpi-tile accent-teal">
                        <span className="kpi-label">Confirmed Visits</span>
                        <strong className="kpi-value">{confirmedCount}</strong>
                    </div>
                    <div className="kpi-tile accent-blue">
                        <span className="kpi-label">Active Weekly Days</span>
                        <strong className="kpi-value">{activeDaysCount}</strong>
                    </div>
                </section>

                {/* Tabs */}
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
                        <span>Patient Appointments</span>
                    </button>
                    <button
                        type="button"
                        className={`dash-tab-btn ${activeTab === "AVAILABILITY" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("AVAILABILITY");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        <Clock size={16} />
                        <span>Weekly Schedule</span>
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
                        <span>Specialist Profile</span>
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

                {/* TAB 1: INCOMING APPOINTMENTS */}
                {activeTab === "APPOINTMENTS" && (
                    <section className="dash-panel">
                        <h2 className="panel-heading" style={{ marginBottom: 18 }}>
                            Incoming &amp; Scheduled Appointments
                        </h2>

                        {loading ? (
                            <div className="slot-empty-well">Loading appointments...</div>
                        ) : appointments.length === 0 ? (
                            <div className="slot-empty-well">No patient bookings received yet.</div>
                        ) : (
                            <div className="appt-list">
                                {appointments.map((appt) => {
                                    const isActionable =
                                        appt.status === "PENDING" || appt.status === "CONFIRMED";
                                    const noteValue =
                                        noteDrafts[appt.id] !== undefined ? noteDrafts[appt.id] : appt.notes || "";

                                    return (
                                        <article key={appt.id} className="appt-card doctor-appt-card">
                                            <div className="appt-main">
                                                <div className="appt-top-row">
                          <span className={`status-badge status-${appt.status.toLowerCase()}`}>
                            {appt.status}
                          </span>
                                                    <span className="appt-id">Booking #{appt.id}</span>
                                                </div>

                                                <h3 className="appt-title">{appt.patientName}</h3>

                                                <div className="appt-meta-row">
                          <span className="meta-chip">
                            <Calendar size={14} />
                              {appt.appointmentDate}
                          </span>
                                                    <span className="meta-chip">
                            <Clock size={14} />
                                                        {formatTime(appt.appointmentTime)}
                          </span>
                                                    <span className="meta-chip">
                            <Phone size={13} />
                                                        {appt.patientPhone}
                          </span>
                                                    <span className="meta-chip">
                            <Mail size={13} />
                                                        {appt.patientEmail}
                          </span>
                                                </div>

                                                {appt.reason && (
                                                    <p className="appt-note">
                                                        <strong>Patient Reason:</strong> {appt.reason}
                                                    </p>
                                                )}

                                                {isActionable ? (
                                                    <div className="doctor-action-zone">
                                                        <div className="input-well" style={{ marginBottom: 10 }}>
                                                            <input
                                                                type="text"
                                                                className="tactile-input"
                                                                placeholder="Add optional consultation note or instructions for patient..."
                                                                value={noteValue}
                                                                onChange={(e) =>
                                                                    setNoteDrafts((prev) => ({
                                                                        ...prev,
                                                                        [appt.id]: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </div>

                                                        <div className="action-btn-row">
                                                            {appt.status === "PENDING" && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-tactile-primary compact-btn"
                                                                        disabled={updatingApptId === appt.id}
                                                                        onClick={() => handleStatusUpdate(appt.id, "CONFIRMED")}
                                                                    >
                                                                        <Check size={15} />
                                                                        <span>Accept</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-tactile-danger"
                                                                        disabled={updatingApptId === appt.id}
                                                                        onClick={() => handleStatusUpdate(appt.id, "REJECTED")}
                                                                    >
                                                                        <X size={15} />
                                                                        <span>Reject</span>
                                                                    </button>
                                                                </>
                                                            )}

                                                            {appt.status === "CONFIRMED" && (
                                                                <button
                                                                    type="button"
                                                                    className="btn-tactile-primary compact-btn"
                                                                    disabled={updatingApptId === appt.id}
                                                                    onClick={() => handleStatusUpdate(appt.id, "COMPLETED")}
                                                                >
                                                                    <CheckCheck size={15} />
                                                                    <span>Mark Completed</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    appt.notes && (
                                                        <p className="appt-note doctor-reply">
                                                            <strong>Your Note:</strong> {appt.notes}
                                                        </p>
                                                    )
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* TAB 2: WEEKLY AVAILABILITY MANAGER */}
                {activeTab === "AVAILABILITY" && (
                    <div className="split-panel-grid">
                        <section className="dash-panel">
                            <h2 className="panel-heading" style={{ marginBottom: 16 }}>
                                Add or Update Working Day
                            </h2>
                            <form className="form-stack" onSubmit={handleSaveAvailability}>
                                <div className="field-group">
                                    <label className="field-label" htmlFor="avail-day">
                                        Day of Week
                                    </label>
                                    <div className="input-well">
                                        <select
                                            id="avail-day"
                                            className="tactile-input"
                                            value={slotForm.dayOfWeek}
                                            onChange={(e) =>
                                                setSlotForm((prev) => ({ ...prev, dayOfWeek: e.target.value }))
                                            }
                                        >
                                            {DAYS_OF_WEEK.map((day) => (
                                                <option key={day} value={day}>
                                                    {day}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row-2">
                                    <div className="field-group">
                                        <label className="field-label" htmlFor="avail-start">
                                            Start Time
                                        </label>
                                        <div className="input-well">
                                            <input
                                                id="avail-start"
                                                type="time"
                                                className="tactile-input"
                                                value={slotForm.startTime}
                                                onChange={(e) =>
                                                    setSlotForm((prev) => ({ ...prev, startTime: e.target.value }))
                                                }
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label" htmlFor="avail-end">
                                            End Time
                                        </label>
                                        <div className="input-well">
                                            <input
                                                id="avail-end"
                                                type="time"
                                                className="tactile-input"
                                                value={slotForm.endTime}
                                                onChange={(e) =>
                                                    setSlotForm((prev) => ({ ...prev, endTime: e.target.value }))
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row-2">
                                    <div className="field-group">
                                        <label className="field-label" htmlFor="avail-duration">
                                            Slot Duration (Mins)
                                        </label>
                                        <div className="input-well">
                                            <select
                                                id="avail-duration"
                                                className="tactile-input"
                                                value={slotForm.slotDurationMinutes}
                                                onChange={(e) =>
                                                    setSlotForm((prev) => ({
                                                        ...prev,
                                                        slotDurationMinutes: Number(e.target.value),
                                                    }))
                                                }
                                            >
                                                {[15, 20, 30, 45, 60].map((mins) => (
                                                    <option key={mins} value={mins}>
                                                        {mins} minutes
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label className="field-label" htmlFor="avail-status">
                                            Availability Status
                                        </label>
                                        <div className="input-well">
                                            <select
                                                id="avail-status"
                                                className="tactile-input"
                                                value={slotForm.available ? "true" : "false"}
                                                onChange={(e) =>
                                                    setSlotForm((prev) => ({
                                                        ...prev,
                                                        available: e.target.value === "true",
                                                    }))
                                                }
                                            >
                                                <option value="true">Available</option>
                                                <option value="false">Unavailable / Off</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="btn-tactile-primary" disabled={savingSlot}>
                                    <Plus size={16} />
                                    <span>{savingSlot ? "Saving..." : "Save Day Schedule"}</span>
                                </button>
                            </form>
                        </section>

                        <section className="dash-panel">
                            <h2 className="panel-heading" style={{ marginBottom: 16 }}>
                                Published Weekly Schedule
                            </h2>

                            {availability.length === 0 ? (
                                <div className="slot-empty-well">
                                    No weekly schedule configured yet. Add your first working day on the left.
                                </div>
                            ) : (
                                <div className="schedule-manage-list">
                                    {availability.map((slot) => (
                                        <div key={slot.id} className="schedule-manage-row">
                                            <div>
                                                <div className="schedule-day-title">
                                                    <strong>{slot.dayOfWeek}</strong>
                                                    <span
                                                        className={`status-badge ${
                                                            slot.available ? "status-confirmed" : "status-cancelled"
                                                        }`}
                                                    >
                            {slot.available ? "OPEN" : "OFF"}
                          </span>
                                                </div>
                                                <p className="schedule-time-sub">
                                                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)} •{" "}
                                                    {slot.slotDurationMinutes} min slots
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                className="icon-tactile-btn danger-icon-btn"
                                                onClick={() => handleDeleteAvailability(slot.id)}
                                                title="Delete schedule"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* TAB 3: DOCTOR PROFILE */}
                {activeTab === "PROFILE" && (
                    <section className="dash-panel">
                        <h2 className="panel-heading" style={{ marginBottom: 18 }}>
                            Update Specialist Profile
                        </h2>

                        <form className="form-stack" onSubmit={handleSaveProfile}>
                            <div className="form-row-2">
                                <div className="field-group">
                                    <label className="field-label" htmlFor="doc-name">
                                        Full Name
                                    </label>
                                    <div className="input-well">
                    <span className="input-icon">
                      <User size={16} />
                    </span>
                                        <input
                                            id="doc-name"
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
                                    <label className="field-label" htmlFor="doc-phone">
                                        Phone Number
                                    </label>
                                    <div className="input-well">
                    <span className="input-icon">
                      <Phone size={16} />
                    </span>
                                        <input
                                            id="doc-phone"
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

                            <div className="form-row-2">
                                <div className="field-group">
                                    <label className="field-label" htmlFor="doc-spec">
                                        Specialization
                                    </label>
                                    <div className="input-well">
                    <span className="input-icon">
                      <Stethoscope size={16} />
                    </span>
                                        <input
                                            id="doc-spec"
                                            type="text"
                                            className="tactile-input"
                                            value={profile.specialization}
                                            onChange={(e) =>
                                                setProfile((prev) => ({ ...prev, specialization: e.target.value }))
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label className="field-label" htmlFor="doc-qual">
                                        Qualification
                                    </label>
                                    <div className="input-well">
                    <span className="input-icon">
                      <GraduationCap size={16} />
                    </span>
                                        <input
                                            id="doc-qual"
                                            type="text"
                                            className="tactile-input"
                                            value={profile.qualification}
                                            onChange={(e) =>
                                                setProfile((prev) => ({ ...prev, qualification: e.target.value }))
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-row-2">
                                <div className="field-group">
                                    <label className="field-label" htmlFor="doc-exp">
                                        Experience (Years)
                                    </label>
                                    <div className="input-well">
                    <span className="input-icon">
                      <Briefcase size={16} />
                    </span>
                                        <input
                                            id="doc-exp"
                                            type="number"
                                            min={0}
                                            max={70}
                                            className="tactile-input"
                                            value={profile.experienceYears}
                                            onChange={(e) =>
                                                setProfile((prev) => ({ ...prev, experienceYears: e.target.value }))
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label className="field-label" htmlFor="doc-fee">
                                        Consultation Fee (₹)
                                    </label>
                                    <div className="input-well">
                    <span className="input-icon">
                      <IndianRupee size={16} />
                    </span>
                                        <input
                                            id="doc-fee"
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            className="tactile-input"
                                            value={profile.consultationFee}
                                            onChange={(e) =>
                                                setProfile((prev) => ({ ...prev, consultationFee: e.target.value }))
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="field-group">
                                <label className="field-label" htmlFor="doc-bio">
                                    Bio
                                </label>
                                <div className="input-well">
                  <textarea
                      id="doc-bio"
                      className="tactile-textarea"
                      maxLength={500}
                      value={profile.bio}
                      onChange={(e) =>
                          setProfile((prev) => ({ ...prev, bio: e.target.value }))
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
                                    <span>{savingProfile ? "Saving..." : "Save Specialist Profile"}</span>
                                </button>
                            </div>
                        </form>
                    </section>
                )}
            </main>
        </div>
    );
}