import { useEffect, useState } from "react";
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    IndianRupee,
    Stethoscope,
    X,
} from "lucide-react";
import axiosClient from "../api/axiosClient";

function getTodayLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatSlotLabel(timeStr) {
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
    return data.message || data.error || "Could not complete request.";
}

export default function BookingModal({ doctor, onClose, onBooked }) {
    const today = getTodayLocalDate();
    const [selectedDate, setSelectedDate] = useState(today);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [reason, setReason] = useState("");

    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successInfo, setSuccessInfo] = useState(null);

    const activeDays = (doctor.availability || [])
        .filter((slot) => slot.available)
        .map((slot) => slot.dayOfWeek);

    useEffect(() => {
        if (!doctor?.doctorId || !selectedDate) return;

        let cancelled = false;
        const loadSlots = async () => {
            setLoadingSlots(true);
            setError("");
            setSelectedSlot("");

            try {
                const res = await axiosClient.get("/api/appointments/available-slots", {
                    params: { doctorId: doctor.doctorId, date: selectedDate },
                });
                if (!cancelled) {
                    setAvailableSlots(res.data?.availableSlots || []);
                }
            } catch (err) {
                if (!cancelled) {
                    setAvailableSlots([]);
                    setError(extractError(err));
                }
            } finally {
                if (!cancelled) setLoadingSlots(false);
            }
        };

        loadSlots();
        return () => {
            cancelled = true;
        };
    }, [doctor?.doctorId, selectedDate]);

    const handleBook = async (e) => {
        e.preventDefault();
        if (!selectedSlot) {
            setError("Please select an available time slot.");
            return;
        }

        setError("");
        setSubmitting(true);

        try {
            const res = await axiosClient.post("/api/appointments", {
                doctorId: doctor.doctorId,
                appointmentDate: selectedDate,
                appointmentTime: selectedSlot,
                reason: reason.trim() || null,
            });

            setSuccessInfo(res.data);
            window.dispatchEvent(new Event("mediconnect:notifications-updated"));
            if (onBooked) onBooked(res.data);
        } catch (err) {
            setError(extractError(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
            <div className="tactile-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
            <span className="card-eyebrow">
              <Stethoscope size={13} />
                {doctor.specialization}
            </span>
                        <h3 className="modal-title">Book with {doctor.fullName}</h3>
                        <p className="modal-subtitle">
                            {doctor.qualification} • Consultation Fee:{" "}
                            <strong>
                                <IndianRupee size={13} style={{ verticalAlign: "-2px" }} />
                                {doctor.consultationFee}
                            </strong>
                        </p>
                    </div>

                    <button
                        type="button"
                        className="icon-tactile-btn"
                        onClick={onClose}
                        aria-label="Close booking modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {activeDays.length > 0 && (
                    <div className="modal-days-bar">
                        <span className="modal-days-label">Working Days:</span>
                        <div className="chip-row">
                            {activeDays.map((day) => (
                                <span key={day} className="day-chip">
                  {day.slice(0, 3)}
                </span>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="alert-banner alert-error" role="alert">
                        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>{error}</span>
                    </div>
                )}

                {successInfo ? (
                    <div className="booking-success-box">
                        <div className="alert-banner alert-success" style={{ marginBottom: 16 }}>
                            <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: 1 }} />
                            <div>
                                <strong>Appointment Request Submitted!</strong>
                                <div style={{ marginTop: 4 }}>
                                    Scheduled with {successInfo.doctorName} on{" "}
                                    <strong>{successInfo.appointmentDate}</strong> at{" "}
                                    <strong>{formatSlotLabel(successInfo.appointmentTime)}</strong> (Status:{" "}
                                    {successInfo.status}).
                                </div>
                            </div>
                        </div>

                        <button type="button" className="btn-tactile-primary" onClick={onClose}>
                            Done
                        </button>
                    </div>
                ) : (
                    <form className="form-stack" onSubmit={handleBook}>
                        <div className="field-group">
                            <label className="field-label" htmlFor="booking-date">
                                Select Appointment Date
                            </label>
                            <div className="input-well">
                <span className="input-icon">
                  <Calendar size={17} />
                </span>
                                <input
                                    id="booking-date"
                                    type="date"
                                    min={today}
                                    className="tactile-input"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="field-group">
                            <label className="field-label">
                                Available Time Slots{" "}
                                <span className="label-hint">({selectedDate})</span>
                            </label>

                            {loadingSlots ? (
                                <div className="slot-empty-well">Checking live schedule...</div>
                            ) : availableSlots.length === 0 ? (
                                <div className="slot-empty-well">
                                    No open slots on this date. Try picking one of the doctor&apos;s working days
                                    above.
                                </div>
                            ) : (
                                <div className="slot-grid">
                                    {availableSlots.map((slot) => (
                                        <button
                                            key={slot}
                                            type="button"
                                            className={`slot-chip-btn ${selectedSlot === slot ? "selected" : ""}`}
                                            onClick={() => setSelectedSlot(slot)}
                                        >
                                            <Clock size={14} />
                                            <span>{formatSlotLabel(slot)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="field-group">
                            <label className="field-label" htmlFor="booking-reason">
                                Reason for Visit (Optional)
                            </label>
                            <div className="input-well" style={{ alignItems: "flex-start" }}>
                <span className="input-icon" style={{ marginTop: 12 }}>
                  <FileText size={17} />
                </span>
                                <textarea
                                    id="booking-reason"
                                    className="tactile-textarea"
                                    placeholder="Describe symptoms or consultation purpose..."
                                    maxLength={500}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="modal-footer-actions">
                            <button type="button" className="btn-tactile-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-tactile-primary"
                                style={{ marginTop: 0 }}
                                disabled={submitting || !selectedSlot}
                            >
                                {submitting ? "Booking..." : "Confirm Appointment"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}