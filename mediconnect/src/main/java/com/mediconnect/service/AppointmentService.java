package com.mediconnect.service;

import com.mediconnect.dto.AppointmentRequest;
import com.mediconnect.dto.AppointmentResponse;
import com.mediconnect.dto.AppointmentStatusUpdateRequest;
import com.mediconnect.entity.Appointment;
import com.mediconnect.entity.Doctor;
import com.mediconnect.entity.DoctorAvailability;
import com.mediconnect.entity.Patient;
import com.mediconnect.entity.User;
import com.mediconnect.exception.BadRequestException;
import com.mediconnect.exception.ResourceNotFoundException;
import com.mediconnect.repository.AppointmentRepository;
import com.mediconnect.repository.DoctorAvailabilityRepository;
import com.mediconnect.repository.DoctorRepository;
import com.mediconnect.repository.PatientRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.util.AppointmentStatus;
import com.mediconnect.util.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private static final List<AppointmentStatus> ACTIVE_STATUSES = List.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED
    );

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<LocalTime> getAvailableSlots(Long doctorId, LocalDate date) {
        if (date.isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot check available slots for a past date");
        }

        Doctor doctor = doctorRepository.findById(doctorId)
                .filter(Doctor::isApproved)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        DoctorAvailability availability = availabilityRepository
                .findByDoctorIdAndDayOfWeek(doctor.getId(), date.getDayOfWeek())
                .orElse(null);

        if (availability == null || !availability.isAvailable()) {
            return List.of();
        }

        Set<LocalTime> bookedTimes = appointmentRepository
                .findByDoctorIdAndAppointmentDateAndStatusIn(doctor.getId(), date, ACTIVE_STATUSES)
                .stream()
                .map(Appointment::getAppointmentTime)
                .collect(Collectors.toSet());

        List<LocalTime> validScheduleSlots = generateScheduleSlots(availability);
        List<LocalTime> openSlots = new ArrayList<>();
        LocalTime now = LocalTime.now();

        for (LocalTime slot : validScheduleSlots) {
            if (date.equals(LocalDate.now()) && !slot.isAfter(now)) {
                continue;
            }
            if (!bookedTimes.contains(slot)) {
                openSlots.add(slot);
            }
        }

        return openSlots;
    }

    @Transactional
    public AppointmentResponse bookAppointment(String patientEmail, AppointmentRequest request) {
        Patient patient = patientRepository.findByUserEmail(patientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .filter(Doctor::isApproved)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        LocalDate date = request.getAppointmentDate();
        LocalTime time = request.getAppointmentTime();

        if (date.isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot book an appointment in the past");
        }

        if (date.equals(LocalDate.now()) && !time.isAfter(LocalTime.now())) {
            throw new BadRequestException("Appointment time must be in the future");
        }

        DoctorAvailability availability = availabilityRepository
                .findByDoctorIdAndDayOfWeek(doctor.getId(), date.getDayOfWeek())
                .orElseThrow(() -> new BadRequestException("Doctor is not available on " + date.getDayOfWeek()));

        if (!availability.isAvailable()) {
            throw new BadRequestException("Doctor is not available on " + date.getDayOfWeek());
        }

        List<LocalTime> validScheduleSlots = generateScheduleSlots(availability);
        if (!validScheduleSlots.contains(time)) {
            throw new BadRequestException("Selected time is not a valid slot in the doctor's schedule");
        }

        boolean doctorSlotTaken = appointmentRepository
                .existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
                        doctor.getId(), date, time, ACTIVE_STATUSES
                );

        if (doctorSlotTaken) {
            throw new BadRequestException("This time slot is already booked");
        }

        boolean patientSlotTaken = appointmentRepository
                .existsByPatientIdAndAppointmentDateAndAppointmentTimeAndStatusIn(
                        patient.getId(), date, time, ACTIVE_STATUSES
                );

        if (patientSlotTaken) {
            throw new BadRequestException("You already have an appointment booked at this date and time");
        }

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .appointmentDate(date)
                .appointmentTime(time)
                .status(AppointmentStatus.PENDING)
                .reason(request.getReason() != null ? request.getReason().trim() : null)
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        notificationService.sendNotification(
                patient.getUser(),
                patient.getFullName(),
                "APPOINTMENT_BOOKED",
                "Appointment Request Submitted",
                "Your appointment request with " + doctor.getFullName() + " on " + date + " at " + time + " is pending confirmation."
        );

        notificationService.sendNotification(
                doctor.getUser(),
                doctor.getFullName(),
                "NEW_APPOINTMENT_REQUEST",
                "New Appointment Request",
                patient.getFullName() + " requested an appointment on " + date + " at " + time + "."
        );

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getMyAppointments(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Appointment> appointments;

        if (user.getRole() == Role.PATIENT) {
            Patient patient = patientRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
            appointments = appointmentRepository
                    .findByPatientIdOrderByAppointmentDateDescAppointmentTimeDesc(patient.getId());
        } else if (user.getRole() == Role.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
            appointments = appointmentRepository
                    .findByDoctorIdOrderByAppointmentDateDescAppointmentTimeDesc(doctor.getId());
        } else {
            appointments = appointmentRepository.findAllByOrderByCreatedAtDesc();
        }

        return appointments.stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(String email, Long appointmentId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        boolean isOwnerPatient = user.getRole() == Role.PATIENT
                && appointment.getPatient().getUser().getId().equals(user.getId());
        boolean isOwnerDoctor = user.getRole() == Role.DOCTOR
                && appointment.getDoctor().getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isOwnerPatient && !isOwnerDoctor && !isAdmin) {
            throw new BadRequestException("You do not have permission to view this appointment");
        }

        return mapToResponse(appointment);
    }

    @Transactional
    public AppointmentResponse updateAppointmentStatus(
            String doctorEmail,
            Long appointmentId,
            AppointmentStatusUpdateRequest request
    ) {
        Doctor doctor = doctorRepository.findByUserEmail(doctorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getDoctor().getId().equals(doctor.getId())) {
            throw new BadRequestException("You can only update your own appointments");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED
                || appointment.getStatus() == AppointmentStatus.REJECTED
                || appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot change status of an appointment that is already " + appointment.getStatus());
        }

        if (request.getStatus() == AppointmentStatus.PENDING) {
            throw new BadRequestException("Cannot revert appointment status to PENDING");
        }

        appointment.setStatus(request.getStatus());
        if (request.getNotes() != null) {
            appointment.setNotes(request.getNotes().trim());
        }

        Appointment updated = appointmentRepository.save(appointment);

        notificationService.sendNotification(
                appointment.getPatient().getUser(),
                appointment.getPatient().getFullName(),
                "APPOINTMENT_" + updated.getStatus().name(),
                "Appointment " + updated.getStatus().name(),
                "Your appointment with " + doctor.getFullName() + " on " + updated.getAppointmentDate()
                        + " at " + updated.getAppointmentTime() + " is now " + updated.getStatus().name() + "."
        );

        return mapToResponse(updated);
    }

    @Transactional
    public AppointmentResponse cancelAppointment(String email, Long appointmentId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        boolean isOwnerPatient = user.getRole() == Role.PATIENT
                && appointment.getPatient().getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isOwnerPatient && !isAdmin) {
            throw new BadRequestException("You do not have permission to cancel this appointment");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED
                || appointment.getStatus() == AppointmentStatus.REJECTED
                || appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("This appointment can no longer be cancelled");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        Appointment cancelled = appointmentRepository.save(appointment);

        notificationService.sendNotification(
                appointment.getDoctor().getUser(),
                appointment.getDoctor().getFullName(),
                "APPOINTMENT_CANCELLED",
                "Appointment Cancelled",
                "Appointment with " + appointment.getPatient().getFullName() + " on "
                        + cancelled.getAppointmentDate() + " at " + cancelled.getAppointmentTime() + " was cancelled."
        );

        return mapToResponse(cancelled);
    }

    private List<LocalTime> generateScheduleSlots(DoctorAvailability availability) {
        List<LocalTime> slots = new ArrayList<>();
        LocalTime current = availability.getStartTime();
        int duration = availability.getSlotDurationMinutes();

        while (!current.plusMinutes(duration).isAfter(availability.getEndTime())) {
            slots.add(current);
            current = current.plusMinutes(duration);
        }

        return slots;
    }

    private AppointmentResponse mapToResponse(Appointment appointment) {
        return AppointmentResponse.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatient().getId())
                .patientName(appointment.getPatient().getFullName())
                .patientEmail(appointment.getPatient().getUser().getEmail())
                .patientPhone(appointment.getPatient().getPhone())
                .doctorId(appointment.getDoctor().getId())
                .doctorName(appointment.getDoctor().getFullName())
                .doctorSpecialization(appointment.getDoctor().getSpecialization())
                .consultationFee(appointment.getDoctor().getConsultationFee())
                .appointmentDate(appointment.getAppointmentDate())
                .appointmentTime(appointment.getAppointmentTime())
                .status(appointment.getStatus())
                .reason(appointment.getReason())
                .notes(appointment.getNotes())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .build();
    }
}