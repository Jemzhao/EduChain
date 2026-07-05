package com.educhain.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "user_profile")
public class UserProfileEntity {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID userId;

    @Column(name = "display_name", nullable = false, length = 80)
    private String displayName;

    @Column(name = "bio", nullable = false, length = 500)
    private String bio;

    @Column(name = "education", nullable = false, length = 160)
    private String education;

    @Column(name = "avatar_file_id", columnDefinition = "BINARY(16)")
    private UUID avatarFileId;

    @Column(name = "location", nullable = false, length = 120)
    private String location;

    @Column(name = "website_url", nullable = false, length = 300)
    private String websiteUrl;

    @Column(name = "contact_email", nullable = false, length = 254)
    private String contactEmail;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserProfileEntity() {
    }

    public UserProfileEntity(UUID userId, String displayName) {
        this.userId = userId;
        this.displayName = displayName;
        this.bio = "";
        this.education = "";
        this.location = "";
        this.websiteUrl = "";
        this.contactEmail = "";
    }

    public String getDisplayName() {
        return displayName;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getBio() {
        return bio;
    }

    public String getEducation() {
        return education;
    }

    public UUID getAvatarFileId() {
        return avatarFileId;
    }

    public String getLocation() {
        return location;
    }

    public String getWebsiteUrl() {
        return websiteUrl;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void update(
            String displayName,
            String bio,
            String education,
            UUID avatarFileId,
            String location,
            String websiteUrl,
            String contactEmail
    ) {
        this.displayName = displayName;
        this.bio = bio;
        this.education = education;
        this.avatarFileId = avatarFileId;
        this.location = location;
        this.websiteUrl = websiteUrl;
        this.contactEmail = contactEmail;
    }
}
