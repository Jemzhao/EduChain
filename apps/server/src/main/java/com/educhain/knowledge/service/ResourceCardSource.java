package com.educhain.knowledge.service;

import com.educhain.knowledge.entity.KnowledgeResourceEntity;
import com.educhain.knowledge.entity.KnowledgeVersionEntity;

public record ResourceCardSource(
        KnowledgeResourceEntity resource,
        KnowledgeVersionEntity version
) {
}
