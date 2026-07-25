package com.educhain.support.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "support_ticket_message")
public class SupportTicketMessageEntity {
    @Id @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)") private UUID id;
    @Column(name = "ticket_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)") private UUID ticketId;
    @Column(name = "author_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)") private UUID authorId;
    @Column(name = "staff_reply", nullable = false, updatable = false) private boolean staffReply;
    @Column(name = "body_content", nullable = false, updatable = false, columnDefinition = "TEXT") private String body;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    protected SupportTicketMessageEntity() {}
    public SupportTicketMessageEntity(UUID ticketId, UUID authorId, boolean staffReply, String body) {
        this.id = UUID.randomUUID(); this.ticketId = ticketId; this.authorId = authorId; this.staffReply = staffReply; this.body = body;
    }
    public UUID getId() { return id; }
    public UUID getAuthorId() { return authorId; }
    public boolean isStaffReply() { return staffReply; }
    public String getBody() { return body; }
    public Instant getCreatedAt() { return createdAt; }
}
