package com.educhain.notification.dto;

import com.educhain.knowledge.dto.PageInfoResponse;
import java.util.List;

public record NotificationListResponse(
        List<NotificationResponse> items,
        long unreadCount,
        PageInfoResponse page
) {
}
