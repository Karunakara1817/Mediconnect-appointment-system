package com.mediconnect.controller;

import com.mediconnect.dto.ChangePasswordRequest;
import com.mediconnect.dto.PatientProfileResponse;
import com.mediconnect.dto.PatientProfileUpdateRequest;
import com.mediconnect.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @GetMapping("/profile")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PatientProfileResponse> getProfile(Authentication authentication) {
        return ResponseEntity.ok(patientService.getProfile(authentication.getName()));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<PatientProfileResponse> updateProfile(
            Authentication authentication,
            @Valid @RequestBody PatientProfileUpdateRequest request
    ) {
        return ResponseEntity.ok(patientService.updateProfile(authentication.getName(), request));
    }

    @PutMapping("/change-password")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        patientService.changePassword(authentication.getName(), request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Password updated successfully");
        return ResponseEntity.ok(response);
    }
}