package com.mediconnect.service;

import com.mediconnect.entity.Appointment;
import com.mediconnect.entity.Doctor;
import com.mediconnect.entity.User;
import com.mediconnect.repository.AppointmentRepository;
import com.mediconnect.repository.DoctorRepository;
import com.mediconnect.repository.PatientRepository;
import com.mediconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    public AdminService(
            UserRepository userRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            AppointmentRepository appointmentRepository
    ) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
    }

    public LinkedHashMap<String, Object> getDashboardStats() {
        List<Doctor> doctors = doctorRepository.findAll();
        long approvedDoctors = doctors.stream().filter(d -> Boolean.TRUE.equals(d.isApproved())).count();
        long pendingDoctors = doctors.size() - approvedDoctors;

        LinkedHashMap<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalPatients", patientRepository.count());
        stats.put("totalDoctors", (long) doctors.size());
        stats.put("approvedDoctors", approvedDoctors);
        stats.put("pendingDoctors", pendingDoctors);
        stats.put("totalAppointments", appointmentRepository.count());
        return stats;
    }

    public List<LinkedHashMap<String, Object>> getPendingDoctors() {
        return doctorRepository.findAll().stream()
                .filter(d -> !Boolean.TRUE.equals(d.isApproved()))
                .sorted(Comparator.comparing(Doctor::getId))
                .map(d -> {
                    LinkedHashMap<String, Object> map = new LinkedHashMap<>();
                    map.put("id", d.getId());
                    map.put("doctorId", d.getId());
                    map.put("fullName", d.getFullName());
                    map.put("specialization", d.getSpecialization());
                    map.put("qualification", d.getQualification());
                    map.put("email", d.getUser() != null ? d.getUser().getEmail() : "");
                    map.put("phone", d.getPhone());
                    map.put("experienceYears", d.getExperienceYears());
                    map.put("consultationFee", d.getConsultationFee());
                    map.put("bio", d.getBio());
                    return map;
                })
                .toList();
    }

    @Transactional
    public LinkedHashMap<String, Object> approveDoctor(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + doctorId));

        doctor.setApproved(true);
        doctorRepository.save(doctor);

        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("message", doctor.getFullName() + " has been approved.");
        response.put("doctorId", doctor.getId());
        response.put("approved", true);
        return response;
    }

    public List<LinkedHashMap<String, Object>> getAllUsers() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getId))
                .map(u -> {
                    LinkedHashMap<String, Object> map = new LinkedHashMap<>();
                    map.put("id", u.getId());
                    map.put("email", u.getEmail());
                    map.put("role", String.valueOf(u.getRole()));
                    map.put("enabled", Boolean.TRUE.equals(u.isEnabled()));
                    map.put("createdAt", u.getCreatedAt());
                    return map;
                })
                .toList();
    }

    @Transactional
    public LinkedHashMap<String, Object> updateUserStatus(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        if ("ADMIN".equalsIgnoreCase(String.valueOf(user.getRole()))) {
            throw new IllegalArgumentException("Admin accounts cannot be disabled.");
        }

        user.setEnabled(enabled);
        userRepository.save(user);

        LinkedHashMap<String, Object> response = new LinkedHashMap<>();
        response.put("message", "User status updated.");
        response.put("userId", user.getId());
        response.put("enabled", enabled);
        return response;
    }

    public List<LinkedHashMap<String, Object>> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .sorted(Comparator.comparing(Appointment::getId).reversed())
                .map(a -> {
                    LinkedHashMap<String, Object> map = new LinkedHashMap<>();
                    map.put("id", a.getId());
                    map.put("patientName", a.getPatient() != null ? a.getPatient().getFullName() : "—");
                    map.put("patientEmail",
                            a.getPatient() != null && a.getPatient().getUser() != null
                                    ? a.getPatient().getUser().getEmail()
                                    : "");
                    map.put("doctorName", a.getDoctor() != null ? a.getDoctor().getFullName() : "—");
                    map.put("doctorSpecialization",
                            a.getDoctor() != null ? a.getDoctor().getSpecialization() : "");
                    map.put("appointmentDate", a.getAppointmentDate());
                    map.put("appointmentTime", a.getAppointmentTime());
                    map.put("consultationFee", a.getDoctor() != null ? a.getDoctor().getConsultationFee() : 0);
                    map.put("status", a.getStatus() != null ? String.valueOf(a.getStatus()) : "PENDING");
                    return map;
                })
                .toList();
    }
}