package com.educhain.support.dto;

import com.educhain.support.domain.SupportTicketCategory;
import com.educhain.support.domain.SupportTicketPriority;
import com.educhain.support.domain.SupportTicketStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class SupportModels {

    private SupportModels() {
    }

    public record CreateRequest(
            @NotNull SupportTicketCategory category,
            @NotBlank @Size(min = 5, max = 160) String subject,
            @NotBlank @Size(min = 20, max = 5000) String description
    ) {
    }

    public record MessageRequest(
            @NotBlank @Size(min = 2, max = 5000) String body
    ) {
    }

    public record GovernanceRequest(
            @NotNull SupportTicketStatus status,
            @NotNull SupportTicketPriority priority,
            @NotBlank @Size(min = 10, max = 500) String reason
    ) {
    }

    public record MessageResponse(
            UUID id,
            UUID authorId,
            boolean staffReply,
            String body,
            Instant createdAt
    ) {
    }

    public record TicketSummary(
            UUID id,
            SupportTicketCategory category,
            String subject,
            SupportTicketStatus status,
            SupportTicketPriority priority,
            long version,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record TicketDetail(
            TicketSummary ticket,
            String description,
            List<MessageResponse> messages
    ) {
        public TicketDetail {
            messages = List.copyOf(messages);
        }
    }

    public record TicketList(List<TicketSummary> items) {
        public TicketList {
            items = List.copyOf(items);
        }
    }
}

