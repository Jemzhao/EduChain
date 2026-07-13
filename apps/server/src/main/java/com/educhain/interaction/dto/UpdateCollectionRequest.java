package com.educhain.interaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCollectionRequest(@NotBlank @Size(max = 60) String name) {
}
