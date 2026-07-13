package com.educhain.interaction.dto;

import java.util.UUID;

public record LikeStateResponse(UUID resourceId, boolean liked, long likeCount) {
}
