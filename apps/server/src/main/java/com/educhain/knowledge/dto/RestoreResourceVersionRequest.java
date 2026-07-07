package com.educhain.knowledge.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record RestoreResourceVersionRequest(@NotNull UUID versionId) {
}
