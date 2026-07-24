package com.educhain.platform.port;

import com.educhain.platform.contract.EvidenceVersionSnapshot;
import java.util.UUID;

public interface KnowledgeEvidencePort {

    EvidenceVersionSnapshot requireVersion(UUID versionId);

    EvidenceVersionSnapshot requireCurrentVersion(UUID resourceId);
}
