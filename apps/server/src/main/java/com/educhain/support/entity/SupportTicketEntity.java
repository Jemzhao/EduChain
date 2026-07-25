package com.educhain.support.entity;

import com.educhain.support.domain.SupportTicketStatus;

import com.educhain.support.domain.SupportTicketPriority;

import com.educhain.support.domain.SupportTicketCategory;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "support_ticket")
public class SupportTicketEntity {
    @Id @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;
    @Column(name = "requester_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID requesterId;
    @Enumerated(EnumType.STRING) @Column(name = "category", nullable = false, updatable = false, length = 32)
    private SupportTicketCategory category;
    @Column(name = "subject", nullable = false, updatable = false, length = 160)
    private String subject;
    @Column(name = "description", nullable = false, updatable = false, columnDefinition = "TEXT")
    private String description;
    @Enumerated(EnumType.STRING) @Column(name = "status", nullable = false, length = 32)
    private SupportTicketStatus status;
    @Enumerated(EnumType.STRING) @Column(name = "priority", nullable = false, length = 16)
    private SupportTicketPriority priority;
    @Version @Column(name = "version", nullable = false)
    private long version;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SupportTicketEntity() {}
    public SupportTicketEntity(UUID id, UUID requesterId, SupportTicketCategory category, String subject, String description) {
        this.id = id; this.requesterId = requesterId; this.category = category;
        this.subject = subject; this.description = description;
        this.status = SupportTicketStatus.OPEN; this.priority = SupportTicketPriority.NORMAL;
    }
    public UUID getId() { return id; }
    public UUID getRequesterId() { return requesterId; }
    public SupportTicketCategory getCategory() { return category; }
    public String getSubject() { return subject; }
    public String getDescription() { return description; }
    public SupportTicketStatus getStatus() { return status; }
    public SupportTicketPriority getPriority() { return priority; }
    public long getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void govern(SupportTicketStatus status, SupportTicketPriority priority) { this.status = status; this.priority = priority; }
    public void reopenForRequester() { if (status == SupportTicketStatus.WAITING_FOR_USER) status = SupportTicketStatus.IN_PROGRESS; }
    public void touch() { this.updatedAt = Instant.now(); }
}
