package com.educhain.notification.controller;

import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.notification.dto.NotificationListResponse;
import com.educhain.notification.dto.NotificationDeletionBatchRequest;
import com.educhain.notification.dto.NotificationDeletionBatchResponse;
import com.educhain.notification.dto.NotificationPreferenceListResponse;
import com.educhain.notification.dto.NotificationReadBatchRequest;
import com.educhain.notification.dto.NotificationReadBatchResponse;
import com.educhain.notification.dto.NotificationReadStateRequest;
import com.educhain.notification.dto.NotificationResponse;
import com.educhain.notification.dto.UpdateNotificationPreferencesRequest;
import com.educhain.notification.domain.NotificationType;
import com.educhain.notification.service.NotificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

@Validated
@RestController
@RequestMapping("/api/v1")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/notifications")
    public NotificationListResponse notifications(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) Boolean read,
            @RequestParam(required = false) @Size(max = 200) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return notificationService.list(principal.userId(), type, read, cursor, limit);
    }

    @PutMapping("/notifications/{notificationId}/read-state")
    public NotificationResponse setReadState(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID notificationId,
            @Valid @RequestBody NotificationReadStateRequest request
    ) {
        return notificationService.setRead(principal.userId(), notificationId, request.read());
    }

    @DeleteMapping("/notifications/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @PathVariable UUID notificationId
    ) {
        notificationService.delete(principal.userId(), notificationId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/notification-read-batches")
    public NotificationReadBatchResponse readBatch(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody NotificationReadBatchRequest request
    ) {
        return notificationService.markReadBatch(principal.userId(), request);
    }

    @PostMapping("/notification-deletion-batches")
    public NotificationDeletionBatchResponse deletionBatch(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody NotificationDeletionBatchRequest request
    ) {
        return notificationService.deleteBatch(principal.userId(), request);
    }

    @GetMapping("/notification-preferences")
    public NotificationPreferenceListResponse preferences(
            @AuthenticationPrincipal EduChainPrincipal principal
    ) {
        return notificationService.preferences(principal.userId());
    }

    @PutMapping("/notification-preferences")
    public NotificationPreferenceListResponse updatePreferences(
            @AuthenticationPrincipal EduChainPrincipal principal,
            @Valid @RequestBody UpdateNotificationPreferencesRequest request
    ) {
        return notificationService.updatePreferences(principal.userId(), request);
    }
}
