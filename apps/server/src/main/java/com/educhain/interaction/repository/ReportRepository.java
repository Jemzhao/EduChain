package com.educhain.interaction.repository;

import com.educhain.interaction.entity.ReportEntity;
import com.educhain.interaction.domain.ReportStatus;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<ReportEntity, UUID> {

    Page<ReportEntity> findAllByStatusOrderByCreatedAtAsc(ReportStatus status, Pageable pageable);

    long countByStatus(ReportStatus status);
}
