package com.educhain.interaction.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class CollectionItemKey implements Serializable {
    private UUID collectionId;
    private UUID resourceId;

    public CollectionItemKey() {
    }

    public CollectionItemKey(UUID collectionId, UUID resourceId) {
        this.collectionId = collectionId;
        this.resourceId = resourceId;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof CollectionItemKey that)) return false;
        return Objects.equals(collectionId, that.collectionId)
                && Objects.equals(resourceId, that.resourceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(collectionId, resourceId);
    }
}
