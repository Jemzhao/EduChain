package com.educhain.knowledge.service;

import com.educhain.knowledge.dto.ResourceCardResponse;

public record SearchableResourceSnapshot(ResourceCardResponse card, String body) {
}
