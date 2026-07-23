package com.educhain.externalcontent.repository;

import com.educhain.externalcontent.entity.ExternalContentSourceEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExternalContentSourceRepository extends JpaRepository<ExternalContentSourceEntity, UUID> {
    List<ExternalContentSourceEntity> findAllByOrderByNameAsc();
}
