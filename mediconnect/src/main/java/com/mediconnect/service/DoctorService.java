package com.mediconnect.service;

import com.mediconnect.dto.DoctorAvailabilityRequest;
import com.mediconnect.dto.DoctorAvailabilityResponse;
import com.mediconnect.dto.DoctorProfileUpdateRequest;
import com.mediconnect.dto.DoctorRegisterRequest;
import com.mediconnect.dto.DoctorResponse;
import com.mediconnect.entity.Doctor;
import com.mediconnect.entity.DoctorAvailability;
import com.mediconnect.entity.User;
import com.mediconnect.exception.BadRequestException;
import com.mediconnect.exception.ResourceNotFoundException;
import com.mediconnect.repository.DoctorAvailabilityRepository;
import com.mediconnect.repository.DoctorRepository;
import com.mediconnect.repository.UserRepository;
import com.mediconnect.util.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public DoctorResponse registerDoctor(DoctorRegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("An account with this email already exists");
        }

        User user = User.builder()
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.DOCTOR)
                .enabled(false)
                .build();

        User savedUser = userRepository.save(user);

        Doctor doctor = Doctor.builder()
                .user(savedUser)
                .fullName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .specialization(request.getSpecialization().trim())
                .qualification(request.getQualification().trim())
                .experienceYears(request.getExperienceYears())
                .consultationFee(request.getConsultationFee())
                .bio(request.getBio() != null ? request.getBio().trim() : null)
                .approved(false)
                .build();

        Doctor savedDoctor = doctorRepository.save(doctor);
        return mapToResponse(savedDoctor);
    }

    @Transactional(readOnly = true)
    public List<DoctorResponse> getAllApprovedDoctors() {
        return doctorRepository.findByApprovedTrue()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DoctorResponse getApprovedDoctorById(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .filter(Doctor::isApproved)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        return mapToResponse(doctor);
    }

    @Transactional(readOnly = true)
    public List<DoctorResponse> searchDoctors(String name, String specialization) {
        String safeName = name != null ? name.trim() : "";
        String safeSpecialization = specialization != null ? specialization.trim() : "";

        return doctorRepository.searchApprovedDoctors(safeName, safeSpecialization)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DoctorResponse getDoctorProfile(String email) {
        Doctor doctor = doctorRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
        return mapToResponse(doctor);
    }

    @Transactional
    public DoctorResponse updateDoctorProfile(String email, DoctorProfileUpdateRequest request) {
        Doctor doctor = doctorRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        doctor.setFullName(request.getFullName().trim());
        doctor.setPhone(request.getPhone().trim());
        doctor.setSpecialization(request.getSpecialization().trim());
        doctor.setQualification(request.getQualification().trim());
        doctor.setExperienceYears(request.getExperienceYears());
        doctor.setConsultationFee(request.getConsultationFee());
        doctor.setBio(request.getBio() != null ? request.getBio().trim() : null);

        Doctor updatedDoctor = doctorRepository.save(doctor);
        return mapToResponse(updatedDoctor);
    }

    @Transactional
    public DoctorAvailabilityResponse saveAvailability(String email, DoctorAvailabilityRequest request) {
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time");
        }

        Doctor doctor = doctorRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        DoctorAvailability availability = availabilityRepository
                .findByDoctorIdAndDayOfWeek(doctor.getId(), request.getDayOfWeek())
                .orElseGet(() -> DoctorAvailability.builder()
                        .doctor(doctor)
                        .dayOfWeek(request.getDayOfWeek())
                        .build());

        availability.setStartTime(request.getStartTime());
        availability.setEndTime(request.getEndTime());
        availability.setSlotDurationMinutes(request.getSlotDurationMinutes());
        availability.setAvailable(request.getAvailable());

        DoctorAvailability saved = availabilityRepository.save(availability);
        return mapAvailabilityToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DoctorAvailabilityResponse> getMyAvailability(String email) {
        Doctor doctor = doctorRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        return availabilityRepository.findByDoctorIdOrderByDayOfWeekAsc(doctor.getId())
                .stream()
                .map(this::mapAvailabilityToResponse)
                .toList();
    }

    @Transactional
    public void deleteAvailability(String email, Long availabilityId) {
        Doctor doctor = doctorRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));

        DoctorAvailability availability = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Availability slot not found"));

        if (!availability.getDoctor().getId().equals(doctor.getId())) {
            throw new BadRequestException("You cannot delete another doctor's availability");
        }

        availabilityRepository.delete(availability);
    }

    private DoctorResponse mapToResponse(Doctor doctor) {
        List<DoctorAvailabilityResponse> slots = availabilityRepository
                .findByDoctorIdOrderByDayOfWeekAsc(doctor.getId())
                .stream()
                .map(this::mapAvailabilityToResponse)
                .toList();

        return DoctorResponse.builder()
                .doctorId(doctor.getId())
                .userId(doctor.getUser().getId())
                .fullName(doctor.getFullName())
                .email(doctor.getUser().getEmail())
                .phone(doctor.getPhone())
                .specialization(doctor.getSpecialization())
                .qualification(doctor.getQualification())
                .experienceYears(doctor.getExperienceYears())
                .consultationFee(doctor.getConsultationFee())
                .bio(doctor.getBio())
                .approved(doctor.isApproved())
                .availability(slots)
                .build();
    }

    private DoctorAvailabilityResponse mapAvailabilityToResponse(DoctorAvailability availability) {
        return DoctorAvailabilityResponse.builder()
                .id(availability.getId())
                .dayOfWeek(availability.getDayOfWeek())
                .startTime(availability.getStartTime())
                .endTime(availability.getEndTime())
                .slotDurationMinutes(availability.getSlotDurationMinutes())
                .available(availability.isAvailable())
                .build();
    }
}