package com.educhain.evidence.gateway;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GatewayCertificateRequest(
        @JsonProperty("resource_title") String resourceTitle,
        @JsonProperty("version_number") int versionNumber,
        @JsonProperty("author_display_name") String authorDisplayName
) {
}
