package com.mediconnect.dto;

import com.mediconnect.util.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentStatusUpdateRequest {

    @NotNull(message = "Appointment status is required")
    private AppointmentStatus status;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
}