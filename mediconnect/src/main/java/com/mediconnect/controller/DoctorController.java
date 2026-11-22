package com.mediconnect.controller;

import com.mediconnect.dto.DoctorAvailabilityRequest;
import com.mediconnect.dto.DoctorAvailabilityResponse;
import com.mediconnect.dto.DoctorProfileUpdateRequest;
import com.mediconnect.dto.DoctorRegisterRequest;
import com.mediconnect.dto.DoctorResponse;
import com.mediconnect.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @PostMapping("/register")
    public ResponseEntity<?> registerDoctor(@Valid @RequestBody DoctorRegisterRequest request) {
        DoctorResponse doctor = doctorService.registerDoctor(request);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Doctor registered successfully. Account is pending admin approval.");
        response.put("doctor", doctor);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<?> getAllDoctors() {
        return ResponseEntity.ok(doctorService.getAllApprovedDoctors());
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchDoctors(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String specialization
    ) {
        return ResponseEntity.ok(doctorService.searchDoctors(name, specialization));
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorResponse> getProfile(Authentication authentication) {
        return ResponseEntity.ok(doctorService.getDoctorProfile(authentication.getName()));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorResponse> updateProfile(
            Authentication authentication,
            @Valid @RequestBody DoctorProfileUpdateRequest request
    ) {
        return ResponseEntity.ok(doctorService.updateDoctorProfile(authentication.getName(), request));
    }

    @GetMapping("/availability")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getMyAvailability(Authentication authentication) {
        return ResponseEntity.ok(doctorService.getMyAvailability(authentication.getName()));
    }

    @PostMapping("/availability")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorAvailabilityResponse> saveAvailability(
            Authentication authentication,
            @Valid @RequestBody DoctorAvailabilityRequest request
    ) {
        return ResponseEntity.ok(doctorService.saveAvailability(authentication.getName(), request));
    }

    @DeleteMapping("/availability/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> deleteAvailability(
            Authentication authentication,
            @PathVariable Long id
    ) {
        doctorService.deleteAvailability(authentication.getName(), id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Availability slot deleted successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorResponse> getDoctorById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getApprovedDoctorById(id));
    }
}