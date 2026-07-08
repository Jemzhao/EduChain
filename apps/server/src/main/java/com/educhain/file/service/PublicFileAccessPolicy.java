package com.educhain.file.service;

import java.util.UUID;

public interface PublicFileAccessPolicy {
    boolean allows(UUID fileId);
}
