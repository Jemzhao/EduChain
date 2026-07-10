package com.educhain.taxonomy.dto;

import java.util.UUID;

public record TagResponse(UUID id, String slug, String name) {
}
