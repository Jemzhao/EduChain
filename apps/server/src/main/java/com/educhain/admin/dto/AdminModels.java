package com.educhain.admin.dto;

import com.educhain.audit.domain.AuditResultStatus;
import com.educhain.admin.domain.OperationalAlertSeverity;
import com.educhain.admin.domain.OperationalAlertStatus;
import com.educhain.evidence.dto.EvidenceJobResponse;
import com.educhain.interaction.dto.ReportResponse;
import com.educhain.interaction.domain.CommentStatus;
import com.educhain.interaction.domain.ReportStatus;
import com.educhain.platform.contract.EvidenceProcessingStatus;
import com.educhain.knowledge.dto.ResourceAuthorResponse;
import com.educhain.knowledge.domain.ResourceStatus;
import com.educhain.taxonomy.domain.TaxonomyStatus;
import com.educhain.user.dto.UserSummaryResponse;
import com.educhain.user.domain.UserRoleName;
import com.educhain.user.domain.UserStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Email;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class AdminModels {

    private AdminModels() {
    }

    public record GovernanceReasonRequest(
            @NotBlank @Size(min = 10, max = 500) String reason
    ) {
    }

    public record UserStatusRequest(
            @NotNull UserStatus status,
            @NotBlank @Size(min = 10, max = 500) String reason
    ) {
    }

    public record UserCreateRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 3, max = 32)
            @Pattern(regexp = "^[a-z0-9](?:[a-z0-9_-]{1,30}[a-z0-9])?$") String handle,
            @NotBlank @Size(min = 2, max = 80) String displayName,
            @NotNull @Size(min = 1) List<@NotNull UserRoleName> roles,
            @NotBlank @Size(min = 10, max = 500) String reason
    ) {
    }

    public record UserUpdateRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 3, max = 32)
            @Pattern(regexp = "^[a-z0-9](?:[a-z0-9_-]{1,30}[a-z0-9])?$") String handle,
            @NotBlank @Size(min = 2, max = 80) String displayName,
            @NotNull @Size(min = 1) List<@NotNull UserRoleName> roles,
            @NotNull UserStatus status,
            @NotBlank @Size(min = 10, max = 500) String reason
    ) {
    }

    public record UserDeletionBatchRequest(
            @NotNull @Size(min = 1, max = 100) List<@NotNull UUID> userIds,
            @NotBlank @Size(min = 10, max = 500) String reason
    ) {
    }

    public record PasswordResetResponse(boolean accepted, String previewToken) {
    }

    public record UserProvisioningResponse(
            UserResponse user,
            PasswordResetResponse passwordSetup
    ) {
    }

    public enum ResourceReviewDecision {
        APPROVE,
        REJECT
    }

    public record ResourceReviewBatchRequest(
            @NotNull @Size(min = 1, max = 100) List<@NotNull UUID> resourceIds,
            @NotNull ResourceReviewDecision decision,
            @NotBlank @Size(min = 10, max = 500) String reason
    ) {
    }

    public record TaxonomyDeletionRef(
            @NotNull UUID id,
            @NotNull TaxonomyKind kind,
            @Min(0) long version
    ) {
    }

    public enum TaxonomyKind {
        CATEGORY,
        TAG
    }

    public record TaxonomyDeletionBatchRequest(
            @NotNull @Size(min = 1, max = 100) List<@NotNull TaxonomyDeletionRef> items,
            @NotBlank @Size(min = 10, max = 500) String reason
    ) {
    }

    public record BatchResultResponse(int processedCount) {
    }

    public record ReportResolutionRequest(
            @NotNull ReportResolutionStatus status,
            @NotBlank @Size(min = 10, max = 500) String reason
    ) {
    }

    public enum ReportResolutionStatus {
        RESOLVED,
        DISMISSED;

        public ReportStatus toReportStatus() {
            return ReportStatus.valueOf(name());
        }
    }

    public record TaxonomyStatusRequest(
            @NotNull TaxonomyStatus status,
            @NotBlank @Size(min = 10, max = 500) String reason
    ) {
    }

    public record TaxonomyMergeRequest(
            @NotNull UUID targetId,
            @NotBlank @Size(min = 10, max = 500) String reason
    ) {
    }

    public record CategoryWriteRequest(
            @NotBlank @Size(max = 80) @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$") String slug,
            @NotBlank @Size(max = 120) String label,
            @NotNull @Size(max = 240) String description,
            UUID parentId,
            @Min(0) int order,
            @NotBlank @Size(min = 10, max = 500) String reason
    ) {
    }

    public record TagWriteRequest(
            @NotBlank @Size(max = 80) @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$") String slug,
            @NotBlank @Size(max = 80) String label,
            @NotNull @Size(max = 240) String description,
            @NotBlank @Size(min = 10, max = 500) String reason
    ) {
    }

    public record OverviewResponse(
            long openReports,
            long restrictedUsers,
            long withdrawnResources,
            long hiddenComments,
            long retryableEvidenceJobs,
            HealthStatus health
    ) {
    }

    public record UserResponse(
            UserSummaryResponse user,
            String email,
            List<UserRoleName> roles,
            Instant createdAt
    ) {
    }

    public record UserListResponse(List<UserResponse> items, PageInfo page) {
    }

    public record ResourceResponse(
            UUID id,
            String slug,
            String title,
            ResourceAuthorResponse author,
            ResourceStatus status,
            long version,
            EvidenceProcessingStatus evidenceStatus,
            Instant publishedAt
    ) {
    }

    public record ResourceListResponse(List<ResourceResponse> items, PageInfo page) {
    }

    public record CommentResponse(
            UUID id,
            UUID resourceId,
            String resourceTitle,
            ResourceAuthorResponse author,
            String body,
            CommentStatus status,
            long version,
            Instant createdAt
    ) {
    }

    public record CommentListResponse(List<CommentResponse> items, PageInfo page) {
    }

    public record ReportListResponse(List<ReportResponse> items, PageInfo page) {
    }

    public record TaxonomyItem(
            UUID id,
            String kind,
            String slug,
            String label,
            String description,
            UUID parentId,
            Integer order,
            TaxonomyStatus status,
            UUID mergedIntoId,
            long version,
            long referenceCount
    ) {
    }

    public record TaxonomyResponse(List<TaxonomyItem> items) {
    }

    public record EvidenceJobListResponse(List<EvidenceJobResponse> items, PageInfo page) {
    }

    public enum EvidenceIntegrityStatus {
        CONSISTENT,
        ATTENTION_REQUIRED
    }

    public record EvidenceIntegrityResponse(
            EvidenceIntegrityStatus status,
            long totalJobs,
            long totalRecords,
            long orphanRecords,
            long mismatchedRecords,
            Instant checkedAt
    ) {
    }

    public record AuditEventResponse(
            UUID id,
            UUID actorId,
            String action,
            String targetType,
            String targetId,
            String reason,
            String requestId,
            AuditResultStatus result,
            Instant createdAt
    ) {
    }

    public record AuditEventListResponse(List<AuditEventResponse> items, PageInfo page) {
    }

    public enum HealthStatus {
        HEALTHY,
        DEGRADED,
        UNAVAILABLE
    }

    public record HealthComponent(String name, HealthStatus status, String summaryCode) {
    }

    public record SystemHealthResponse(HealthStatus status, List<HealthComponent> components) {
    }

    public enum OperationalMetricStatus {
        HEALTHY,
        WARNING,
        CRITICAL
    }

    public record OperationalMetric(
            String name,
            double value,
            String unit,
            OperationalMetricStatus status
    ) {
    }

    public record OperationalMetricsResponse(
            List<OperationalMetric> items,
            Instant sampledAt
    ) {
    }

    public record OperationalEventResponse(
            UUID id,
            String category,
            String summaryCode,
            String targetType,
            AuditResultStatus result,
            Instant occurredAt
    ) {
    }

    public record OperationalEventListResponse(List<OperationalEventResponse> items) {
    }

    public record OperationalAlertResponse(
            UUID id,
            OperationalAlertSeverity severity,
            String component,
            String summaryCode,
            OperationalAlertStatus status,
            long occurrenceCount,
            Instant firstSeenAt,
            Instant lastSeenAt,
            Instant resolvedAt,
            UUID resolvedBy,
            String resolutionReason,
            long version
    ) {
    }

    public record OperationalAlertListResponse(List<OperationalAlertResponse> items) {
    }

    public record StatisticsBucket(String key, long count) {
    }

    public record StatisticsResponse(
            long users,
            long publishedResources,
            long comments,
            long likes,
            long views,
            long evidenceRecords,
            List<StatisticsBucket> categories,
            List<StatisticsBucket> tags,
            List<StatisticsBucket> resourceTypes,
            List<StatisticsBucket> evidenceBackends,
            List<StatisticsTrend> trends
    ) {
    }

    public record StatisticsTrend(
            String period,
            long registrations,
            long publications,
            long views
    ) {
    }

    public record PageInfo(String nextCursor, boolean hasMore) {
    }
}
