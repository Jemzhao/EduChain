package com.educhain.interaction.repository;

import java.util.UUID;

public interface ResourceCountProjection {
    UUID getResourceId();

    long getTotal();
}
