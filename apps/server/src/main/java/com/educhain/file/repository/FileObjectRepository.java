package com.educhain.file.repository;

import com.educhain.file.entity.FileObjectEntity;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileObjectRepository extends JpaRepository<FileObjectEntity, UUID> {

    List<FileObjectEntity> findAllByIdInAndOwnerId(Collection<UUID> ids, UUID ownerId);
}
