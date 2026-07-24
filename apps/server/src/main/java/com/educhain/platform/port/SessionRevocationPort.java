package com.educhain.platform.port;

import java.util.UUID;

public interface SessionRevocationPort {

    void revokeActiveSessions(UUID userId);
}
