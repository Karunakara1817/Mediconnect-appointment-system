import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Bell,
    CheckCheck,
    HeartPulse,
    LayoutDashboard,
    LogOut,
    Stethoscope,
} from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

function formatNotificationTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function Navbar() {
    const { isAuthenticated, user, role, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [panelOpen, setPanelOpen] = useState(false);
    const [loadingList, setLoadingList] = useState(false);
    const dropdownRef = useRef(null);

    const dashboardPath =
        role === "ADMIN"
            ? "/admin/dashboard"
            : role === "DOCTOR"
                ? "/doctor/dashboard"
                : "/patient/dashboard";

    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await axiosClient.get("/api/notifications/unread-count");
            setUnreadCount(res.data?.unreadCount ?? 0);
        } catch {
            // Silently ignore transient polling failures
        }
    }, [isAuthenticated]);

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoadingList(true);
        try {
            const res = await axiosClient.get("/api/notifications");
            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch {
            setNotifications([]);
        } finally {
            setLoadingList(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchUnreadCount();

        const handleRefresh = () => {
            fetchUnreadCount();
            if (panelOpen) fetchNotifications();
        };

        window.addEventListener("mediconnect:notifications-updated", handleRefresh);
        const intervalId = setInterval(fetchUnreadCount, 30000);

        return () => {
            window.removeEventListener("mediconnect:notifications-updated", handleRefresh);
            clearInterval(intervalId);
        };
    }, [isAuthenticated, panelOpen, fetchUnreadCount, fetchNotifications]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setPanelOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleNotifications = () => {
        const nextOpen = !panelOpen;
        setPanelOpen(nextOpen);
        if (nextOpen) {
            fetchNotifications();
            fetchUnreadCount();
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await axiosClient.put(`/api/notifications/${notificationId}/read`);
            setNotifications((prev) =>
                prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {
            // Ignore error
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axiosClient.put("/api/notifications/read-all");
            setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
            setUnreadCount(0);
        } catch {
            // Ignore error
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const isActive = (path) => location.pathname === path;

    return (
        <header className="nav-shell">
            <div className="nav-inner">
                <Link to={isAuthenticated ? dashboardPath : "/doctors"} className="nav-brand">
          <span className="nav-brand-icon">
            <HeartPulse size={20} />
          </span>
                    <span>MediConnect</span>
                </Link>

                <nav className="nav-links" aria-label="Main Navigation">
                    <Link
                        to="/doctors"
                        className={`nav-link-btn ${isActive("/doctors") ? "active" : ""}`}
                    >
                        <Stethoscope size={16} />
                        <span>Find Doctors</span>
                    </Link>

                    {isAuthenticated && (
                        <Link
                            to={dashboardPath}
                            className={`nav-link-btn ${isActive(dashboardPath) ? "active" : ""}`}
                        >
                            <LayoutDashboard size={16} />
                            <span>Dashboard</span>
                        </Link>
                    )}
                </nav>

                <div className="nav-actions">
                    {isAuthenticated ? (
                        <>
                            <div className="notif-anchor" ref={dropdownRef}>
                                <button
                                    type="button"
                                    className="icon-tactile-btn"
                                    onClick={toggleNotifications}
                                    aria-label="Notifications"
                                >
                                    <Bell size={18} />
                                    {unreadCount > 0 && (
                                        <span className="notif-badge">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                                    )}
                                </button>

                                {panelOpen && (
                                    <div className="notif-dropdown">
                                        <div className="notif-dropdown-header">
                                            <div>
                                                <strong>Notifications</strong>
                                                <span className="notif-subcount">{unreadCount} unread</span>
                                            </div>
                                            {unreadCount > 0 && (
                                                <button
                                                    type="button"
                                                    className="notif-read-all-btn"
                                                    onClick={handleMarkAllAsRead}
                                                >
                                                    <CheckCheck size={14} />
                                                    <span>Mark all read</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="notif-list">
                                            {loadingList ? (
                                                <p className="notif-empty">Loading notifications...</p>
                                            ) : notifications.length === 0 ? (
                                                <p className="notif-empty">No notifications yet.</p>
                                            ) : (
                                                notifications.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className={`notif-item ${item.read ? "read" : "unread"}`}
                                                        onClick={() => !item.read && handleMarkAsRead(item.id)}
                                                    >
                                                        <div className="notif-item-top">
                                                            <span className="notif-item-title">{item.subject}</span>
                                                            {!item.read && <span className="notif-unread-dot" />}
                                                        </div>
                                                        <p className="notif-item-msg">{item.message}</p>
                                                        <div className="notif-item-meta">
                                                            <span>{formatNotificationTime(item.createdAt)}</span>
                                                            {item.emailSent && <span className="email-tag">Email sent</span>}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="nav-user-pill">
                                <span className="nav-user-name">{user?.fullName}</span>
                                <span className="nav-user-role">{role}</span>
                            </div>

                            <button
                                type="button"
                                className="btn-tactile-secondary nav-logout-btn"
                                onClick={handleLogout}
                            >
                                <LogOut size={15} />
                                <span>Sign Out</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn-tactile-secondary nav-logout-btn">
                                Sign In
                            </Link>
                            <Link to="/register" className="btn-tactile-primary nav-cta-btn">
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
