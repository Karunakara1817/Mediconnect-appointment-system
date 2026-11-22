package com.mediconnect.service;

import com.mediconnect.dto.NotificationResponse;
import com.mediconnect.entity.Notification;
import com.mediconnect.entity.User;
import com.mediconnect.exception.BadRequestException;
import com.mediconnect.exception.ResourceNotFoundException;
import com.mediconnect.repository.NotificationRepository;
import com.mediconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final RestClient notificationRestClient;

    @Transactional
    public void sendNotification(
            User recipient,
            String recipientName,
            String type,
            String subject,
            String message
    ) {
        boolean emailSent = dispatchToMicroservice(
                recipient.getEmail(),
                recipientName,
                type,
                subject,
                message
        );

        Notification notification = Notification.builder()
                .user(recipient)
                .type(type)
                .subject(subject)
                .message(message)
                .read(false)
                .emailSent(emailSent)
                .build();

        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    @Transactional
    public NotificationResponse markAsRead(String email, Long notificationId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You do not have permission to update this notification");
        }

        notification.setRead(true);
        Notification updated = notificationRepository.save(notification);
        return mapToResponse(updated);
    }

    @Transactional
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Notification> unread = notificationRepository.findByUserIdAndReadFalse(user.getId());
        for (Notification notification : unread) {
            notification.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    private boolean dispatchToMicroservice(
            String recipientEmail,
            String recipientName,
            String type,
            String subject,
            String message
    ) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("recipientEmail", recipientEmail);
        payload.put("recipientName", recipientName);
        payload.put("type", type);
        payload.put("subject", subject);
        payload.put("message", message);

        try {
            notificationRestClient.post()
                    .uri("/api/notifications/send")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (Exception ex) {
            log.warn("Notification microservice unavailable for {}: {}", recipientEmail, ex.getMessage());
            return false;
        }
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .subject(notification.getSubject())
                .message(notification.getMessage())
                .read(notification.isRead())
                .emailSent(notification.isEmailSent())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}