import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    Briefcase,
    CalendarPlus,
    GraduationCap,
    IndianRupee,
    RotateCcw,
    Search,
    Stethoscope,
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import BookingModal from "../components/BookingModal";

const QUICK_SPECIALIZATIONS = [
    "All",
    "Cardiology",
    "Dermatology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "General Medicine",
];

function formatShortTime(timeStr) {
    if (!timeStr) return "";
    return timeStr.slice(0, 5);
}

export default function DoctorsPage() {
    const { isAuthenticated, role } = useAuth();
    const navigate = useNavigate();

    const [doctors, setDoctors] = useState([]);
    const [nameQuery, setNameQuery] = useState("");
    const [specQuery, setSpecQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    const fetchDoctors = useCallback(async (name = "", specialization = "") => {
        setLoading(true);
        setError("");
        try {
            const hasFilters = name.trim() !== "" || specialization.trim() !== "";
            const res = hasFilters
                ? await axiosClient.get("/api/doctors/search", {
                    params: {
                        name: name.trim(),
                        specialization: specialization.trim(),
                    },
                })
                : await axiosClient.get("/api/doctors");

            setDoctors(Array.isArray(res.data) ? res.data : []);
        } catch {
            setError("Failed to load approved doctors. Make sure Spring Boot is running on port 8080.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchDoctors(nameQuery, specQuery);
    };

    const handleQuickSpec = (spec) => {
        const nextSpec = spec === "All" ? "" : spec;
        setSpecQuery(nextSpec);
        fetchDoctors(nameQuery, nextSpec);
    };

    const handleReset = () => {
        setNameQuery("");
        setSpecQuery("");
        fetchDoctors("", "");
    };

    const handleBookClick = (doctor) => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
        setSelectedDoctor(doctor);
    };

    return (
        <div className="page-shell">
            <Navbar />

            <main className="page-container">
                {/* Tactile Directory Header + Search */}
                <section className="directory-hero">
                    <div>
            <span className="card-eyebrow">
              <Stethoscope size={14} />
              Verified Specialist Directory
            </span>
                        <h1 className="page-title">Find Your Doctor &amp; Book Live Slots</h1>
                        <p className="page-subtitle">
                            Browse admin-approved specialists, view weekly hours, and reserve open appointments
                            instantly.
                        </p>
                    </div>

                    <form className="search-bar-card" onSubmit={handleSearchSubmit}>
                        <div className="input-well">
              <span className="input-icon">
                <Search size={17} />
              </span>
                            <input
                                type="text"
                                className="tactile-input"
                                placeholder="Search by doctor name (e.g., Meera)"
                                value={nameQuery}
                                onChange={(e) => setNameQuery(e.target.value)}
                            />
                        </div>

                        <div className="input-well">
              <span className="input-icon">
                <Stethoscope size={17} />
              </span>
                            <input
                                type="text"
                                className="tactile-input"
                                placeholder="Specialization (e.g., Cardiology)"
                                value={specQuery}
                                onChange={(e) => setSpecQuery(e.target.value)}
                            />
                        </div>

                        <div className="search-bar-buttons">
                            <button type="submit" className="btn-tactile-primary" style={{ marginTop: 0 }}>
                                <Search size={16} />
                                <span>Search</span>
                            </button>
                            <button
                                type="button"
                                className="btn-tactile-secondary"
                                onClick={handleReset}
                                title="Reset filters"
                            >
                                <RotateCcw size={16} />
                            </button>
                        </div>
                    </form>

                    <div className="spec-pill-row">
                        {QUICK_SPECIALIZATIONS.map((spec) => {
                            const active =
                                (spec === "All" && specQuery === "") ||
                                specQuery.toLowerCase() === spec.toLowerCase();
                            return (
                                <button
                                    key={spec}
                                    type="button"
                                    className={`spec-pill ${active ? "active" : ""}`}
                                    onClick={() => handleQuickSpec(spec)}
                                >
                                    {spec}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {error && (
                    <div className="alert-banner alert-error" role="alert">
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="empty-state-card">Loading verified doctors...</div>
                ) : doctors.length === 0 ? (
                    <div className="empty-state-card">
                        <h3>No approved doctors matched your search</h3>
                        <p>Try clearing your filters or search for a different specialization.</p>
                    </div>
                ) : (
                    <section className="doctor-grid">
                        {doctors.map((doctor) => {
                            const openDays = (doctor.availability || []).filter((slot) => slot.available);
                            const canBook = !isAuthenticated || role === "PATIENT";

                            return (
                                <article key={doctor.doctorId} className="doctor-card">
                                    <div className="doctor-card-top">
                                        <div className="doctor-avatar">
                                            {doctor.fullName
                                                .replace(/^Dr\.?\s*/i, "")
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        </div>
                                        <div className="doctor-head-meta">
                                            <span className="spec-badge">{doctor.specialization}</span>
                                            <h2 className="doctor-name">{doctor.fullName}</h2>
                                            <p className="doctor-qual">
                                                <GraduationCap size={14} />
                                                <span>{doctor.qualification}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {doctor.bio && <p className="doctor-bio">{doctor.bio}</p>}

                                    <div className="doctor-stats-row">
                                        <div className="stat-pill">
                                            <Briefcase size={14} />
                                            <span>{doctor.experienceYears} yrs exp</span>
                                        </div>
                                        <div className="stat-pill fee">
                                            <IndianRupee size={14} />
                                            <span>{doctor.consultationFee} fee</span>
                                        </div>
                                    </div>

                                    <div className="doctor-schedule-box">
                                        <span className="schedule-heading">Weekly Availability</span>
                                        {openDays.length === 0 ? (
                                            <p className="schedule-empty">Schedule not published yet</p>
                                        ) : (
                                            <div className="schedule-list">
                                                {openDays.map((slot) => (
                                                    <span key={slot.id} className="schedule-chip">
                            <strong>{slot.dayOfWeek.slice(0, 3)}</strong>{" "}
                                                        {formatShortTime(slot.startTime)}–{formatShortTime(slot.endTime)}
                          </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-tactile-primary"
                                        disabled={!canBook || openDays.length === 0}
                                        onClick={() => handleBookClick(doctor)}
                                    >
                                        <CalendarPlus size={17} />
                                        <span>
                      {!isAuthenticated
                          ? "Sign In to Book"
                          : role !== "PATIENT"
                              ? "Patient Booking Only"
                              : openDays.length === 0
                                  ? "No Schedule Set"
                                  : "Book Appointment"}
                    </span>
                                    </button>
                                </article>
                            );
                        })}
                    </section>
                )}
            </main>

            {selectedDoctor && (
                <BookingModal
                    doctor={selectedDoctor}
                    onClose={() => setSelectedDoctor(null)}
                />
            )}
        </div>
    );
}