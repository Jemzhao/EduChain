package com.educhain.interaction.dto;

import java.util.List;

public record CommentThreadResponse(CommentResponse comment, List<CommentResponse> replies) {
}
