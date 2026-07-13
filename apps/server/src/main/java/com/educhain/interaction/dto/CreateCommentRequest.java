package com.educhain.interaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record CreateCommentRequest(
        UUID parentCommentId,
        @NotBlank @Size(max = 2000) String body
) {
}
