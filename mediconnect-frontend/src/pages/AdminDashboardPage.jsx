import { useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    IndianRupee,
    RefreshCw,
    ShieldCheck,
    Stethoscope,
    UserCheck,
    UserX,
    Users,
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import Navbar from "../components/Navbar";

function formatTime(timeStr) {
    if (!timeStr) return "";
    const [hoursStr, minutesStr] = timeStr.split(":");
    const hours = Number(hoursStr);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return `${String(displayHour).padStart(2, "0")}:${minutesStr} ${period}`;
}

function formatDate(isoString) {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function extractError(err) {
    const data = err.response?.data;
    if (!data) return "Unable to connect to MediConnect server on port 8080.";
    return data.message || data.error || "Admin request failed.";
}

export default function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState("PENDING_DOCTORS");
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalPatients: 0,
        totalDoctors: 0,
        approvedDoctors: 0,
        pendingDoctors: 0,
        totalAppointments: 0,
    });
    const [pendingDoctors, setPendingDoctors] = useState([]);
    const [users, setUsers] = useState([]);
    const [appointments, setAppointments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [busyKey, setBusyKey] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadAdminData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [statsRes, pendingRes, usersRes, apptsRes] = await Promise.all([
                axiosClient.get("/api/admin/dashboard"),
                axiosClient.get("/api/admin/doctors/pending"),
                axiosClient.get("/api/admin/users"),
                axiosClient.get("/api/admin/appointments"),
            ]);

            setStats(statsRes.data || {});
            setPendingDoctors(Array.isArray(pendingRes.data) ? pendingRes.data : []);
            setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
            setAppointments(Array.isArray(apptsRes.data) ? apptsRes.data : []);
        } catch (err) {
            setError(extractError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAdminData();
    }, [loadAdminData]);

    const handleApproveDoctor = async (doctorId, fullName) => {
        setError("");
        setSuccess("");
        setBusyKey(`approve-${doctorId}`);
        try {
            await axiosClient.put(`/api/admin/doctors/${doctorId}/approve`);
            setSuccess(`${fullName} has been approved and can now sign in and accept bookings.`);
            await loadAdminData();
        } catch (err) {
            setError(extractError(err));
        } finally {
            setBusyKey("");
        }
    };

    const handleToggleUserStatus = async (userId, currentEnabled) => {
        setError("");
        setSuccess("");
        setBusyKey(`user-${userId}`);
        try {
            const nextEnabled = !currentEnabled;
            await axiosClient.put(`/api/admin/users/${userId}/status`, null, {
                params: { enabled: nextEnabled },
            });
            setSuccess(`User #${userId} has been ${nextEnabled ? "enabled" : "disabled"}.`);
            await loadAdminData();
        } catch (err) {
            setError(extractError(err));
        } finally {
            setBusyKey("");
        }
    };

    return (
        <div className="page-shell">
            <Navbar />

            <main className="page-container">
                {/* Banner */}
                <section className="dash-banner">
                    <div>
            <span className="card-eyebrow">
              <ShieldCheck size={13} />
              Administrator Portal
            </span>
                        <h1 className="page-title">MediConnect Control Center</h1>
                        <p className="page-subtitle" style={{ marginBottom: 0 }}>
                            Approve verified doctors, manage platform accounts, and monitor all scheduled
                            appointments.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn-tactile-secondary"
                        onClick={loadAdminData}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        <span>{loading ? "Refreshing..." : "Refresh Data"}</span>
                    </button>
                </section>

                {/* Platform KPIs */}
                <section className="kpi-grid">
                    <div className="kpi-tile">
                        <span className="kpi-label">Total Users</span>
                        <strong className="kpi-value">{stats.totalUsers ?? 0}</strong>
                    </div>
                    <div className="kpi-tile accent-blue">
                        <span className="kpi-label">Patients</span>
                        <strong className="kpi-value">{stats.totalPatients ?? 0}</strong>
                    </div>
                    <div className="kpi-tile accent-teal">
                        <span className="kpi-label">Approved Doctors</span>
                        <strong className="kpi-value">{stats.approvedDoctors ?? 0}</strong>
                    </div>
                    <div className="kpi-tile accent-amber">
                        <span className="kpi-label">Pending Approvals</span>
                        <strong className="kpi-value">{stats.pendingDoctors ?? 0}</strong>
                    </div>
                    <div className="kpi-tile">
                        <span className="kpi-label">Appointments</span>
                        <strong className="kpi-value">{stats.totalAppointments ?? 0}</strong>
                    </div>
                </section>

                {/* Tabs */}
                <div className="dash-tabs" role="tablist">
                    <button
                        type="button"
                        className={`dash-tab-btn ${activeTab === "PENDING_DOCTORS" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("PENDING_DOCTORS");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        <Stethoscope size={16} />
                        <span>Pending Doctors ({pendingDoctors.length})</span>
                    </button>
                    <button
                        type="button"
                        className={`dash-tab-btn ${activeTab === "USERS" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("USERS");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        <Users size={16} />
                        <span>Manage Users ({users.length})</span>
                    </button>
                    <button
                        type="button"
                        className={`dash-tab-btn ${activeTab === "APPOINTMENTS" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("APPOINTMENTS");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        <Calendar size={16} />
                        <span>All Appointments ({appointments.length})</span>
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

                {/* TAB 1: PENDING DOCTOR APPROVALS */}
                {activeTab === "PENDING_DOCTORS" && (
                    <section className="dash-panel">
                        <h2 className="panel-heading" style={{ marginBottom: 18 }}>
                            Doctors Awaiting Verification
                        </h2>

                        {loading ? (
                            <div className="slot-empty-well">Loading pending applications...</div>
                        ) : pendingDoctors.length === 0 ? (
                            <div className="slot-empty-well">
                                No pending doctor approvals right now. All registered specialists are verified.
                            </div>
                        ) : (
                            <div className="appt-list">
                                {pendingDoctors.map((doc) => (
                                    <article key={doc.doctorId} className="appt-card">
                                        <div className="appt-main">
                                            <div className="appt-top-row">
                                                <span className="status-badge status-pending">PENDING APPROVAL</span>
                                                <span className="appt-id">Doctor #{doc.doctorId}</span>
                                            </div>

                                            <h3 className="appt-title">{doc.fullName}</h3>
                                            <p className="appt-sub">
                                                {doc.specialization} • {doc.qualification}
                                            </p>

                                            <div className="appt-meta-row">
                                                <span className="meta-chip">{doc.email}</span>
                                                <span className="meta-chip">{doc.phone}</span>
                                                <span className="meta-chip">{doc.experienceYears} yrs exp</span>
                                                <span className="meta-chip fee">
                          <IndianRupee size={13} />
                                                    {doc.consultationFee}
                        </span>
                                            </div>

                                            {doc.bio && <p className="appt-note">{doc.bio}</p>}
                                        </div>

                                        <div className="appt-actions">
                                            <button
                                                type="button"
                                                className="btn-tactile-primary compact-btn"
                                                disabled={busyKey === `approve-${doc.doctorId}`}
                                                onClick={() => handleApproveDoctor(doc.doctorId, doc.fullName)}
                                            >
                                                <UserCheck size={16} />
                                                <span>
                          {busyKey === `approve-${doc.doctorId}`
                              ? "Approving..."
                              : "Approve Doctor"}
                        </span>
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* TAB 2: MANAGE USERS */}
                {activeTab === "USERS" && (
                    <section className="dash-panel">
                        <h2 className="panel-heading" style={{ marginBottom: 18 }}>
                            Platform User Accounts
                        </h2>

                        {loading ? (
                            <div className="slot-empty-well">Loading users...</div>
                        ) : users.length === 0 ? (
                            <div className="slot-empty-well">No users found.</div>
                        ) : (
                            <div className="table-wrap">
                                <table className="tactile-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th>Action</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {users.map((u) => {
                                        const isAdmin = u.role === "ADMIN";
                                        const isBusy = busyKey === `user-${u.id}`;
                                        return (
                                            <tr key={u.id}>
                                                <td>#{u.id}</td>
                                                <td>
                                                    <strong>{u.email}</strong>
                                                </td>
                                                <td>
                                                    <span className="role-pill">{u.role}</span>
                                                </td>
                                                <td>
                            <span
                                className={`status-badge ${
                                    u.enabled ? "status-confirmed" : "status-cancelled"
                                }`}
                            >
                              {u.enabled ? "ACTIVE" : "DISABLED"}
                            </span>
                                                </td>
                                                <td>{formatDate(u.createdAt)}</td>
                                                <td>
                                                    {isAdmin ? (
                                                        <span className="appt-id">Protected</span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className={
                                                                u.enabled
                                                                    ? "btn-tactile-danger"
                                                                    : "btn-tactile-primary compact-btn"
                                                            }
                                                            disabled={isBusy}
                                                            onClick={() => handleToggleUserStatus(u.id, u.enabled)}
                                                        >
                                                            {u.enabled ? <UserX size={14} /> : <UserCheck size={14} />}
                                                            <span>
                                  {isBusy
                                      ? "Updating..."
                                      : u.enabled
                                          ? "Disable"
                                          : "Enable"}
                                </span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

                {/* TAB 3: ALL APPOINTMENTS */}
                {activeTab === "APPOINTMENTS" && (
                    <section className="dash-panel">
                        <h2 className="panel-heading" style={{ marginBottom: 18 }}>
                            All Platform Appointments
                        </h2>

                        {loading ? (
                            <div className="slot-empty-well">Loading appointments...</div>
                        ) : appointments.length === 0 ? (
                            <div className="slot-empty-well">No appointments booked on the platform yet.</div>
                        ) : (
                            <div className="table-wrap">
                                <table className="tactile-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Patient</th>
                                        <th>Doctor</th>
                                        <th>Date &amp; Time</th>
                                        <th>Fee</th>
                                        <th>Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {appointments.map((appt) => (
                                        <tr key={appt.id}>
                                            <td>#{appt.id}</td>
                                            <td>
                                                <strong>{appt.patientName}</strong>
                                                <div className="table-subtext">{appt.patientEmail}</div>
                                            </td>
                                            <td>
                                                <strong>{appt.doctorName}</strong>
                                                <div className="table-subtext">{appt.doctorSpecialization}</div>
                                            </td>
                                            <td>
                                                <div className="table-inline-meta">
                                                    <Calendar size={13} />
                                                    <span>{appt.appointmentDate}</span>
                                                </div>
                                                <div className="table-subtext table-inline-meta">
                                                    <Clock size={12} />
                                                    <span>{formatTime(appt.appointmentTime)}</span>
                                                </div>
                                            </td>
                                            <td>₹{appt.consultationFee}</td>
                                            <td>
                          <span className={`status-badge status-${appt.status.toLowerCase()}`}>
                            {appt.status}
                          </span>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}