package com.educhain.maintenance.repository;

import com.educhain.maintenance.entity.MaintenanceJobEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MaintenanceJobRepository extends JpaRepository<MaintenanceJobEntity, UUID> {
    List<MaintenanceJobEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
