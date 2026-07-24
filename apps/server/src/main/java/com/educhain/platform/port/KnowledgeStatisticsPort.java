package com.educhain.platform.port;

import java.util.UUID;

public interface KnowledgeStatisticsPort {

    long publishedCount(UUID authorId);
}
