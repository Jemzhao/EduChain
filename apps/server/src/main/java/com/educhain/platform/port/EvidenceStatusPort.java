package com.educhain.platform.port;

import com.educhain.platform.contract.EvidenceProcessingStatus;
import java.util.Collection;
import java.util.Map;
import java.util.UUID;

public interface EvidenceStatusPort {

    EvidenceProcessingStatus status(UUID versionId);

    Map<UUID, EvidenceProcessingStatus> statuses(Collection<UUID> versionIds);
}
