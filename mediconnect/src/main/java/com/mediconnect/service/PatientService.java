package com.mediconnect.service;

import com.mediconnect.dto.ChangePasswordRequest;
import com.mediconnect.dto.PatientProfileResponse;
import com.mediconnect.dto.PatientProfileUpdateRequest;
import com.mediconnect.entity.Patient;
import com.mediconnect.entity.User;
import com.mediconnect.exception.BadRequestException;
import com.mediconnect.exception.ResourceNotFoundException;
import com.mediconnect.repository.PatientRepository;
import com.mediconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PatientProfileResponse getProfile(String email) {
        Patient patient = patientRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
        return mapToResponse(patient);
    }

    @Transactional
    public PatientProfileResponse updateProfile(String email, PatientProfileUpdateRequest request) {
        Patient patient = patientRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        patient.setFullName(request.getFullName().trim());
        patient.setPhone(request.getPhone().trim());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender() != null ? request.getGender().trim() : null);
        patient.setBloodGroup(request.getBloodGroup() != null ? request.getBloodGroup().trim() : null);
        patient.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);

        Patient updatedPatient = patientRepository.save(patient);
        return mapToResponse(updatedPatient);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new BadRequestException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private PatientProfileResponse mapToResponse(Patient patient) {
        return PatientProfileResponse.builder()
                .patientId(patient.getId())
                .userId(patient.getUser().getId())
                .fullName(patient.getFullName())
                .email(patient.getUser().getEmail())
                .phone(patient.getPhone())
                .dateOfBirth(patient.getDateOfBirth())
                .gender(patient.getGender())
                .bloodGroup(patient.getBloodGroup())
                .address(patient.getAddress())
                .createdAt(patient.getCreatedAt())
                .updatedAt(patient.getUpdatedAt())
                .build();
    }
}