package com.educhain.admin.repository;

import com.educhain.admin.entity.OperationalAlertEntity;
import com.educhain.admin.domain.OperationalAlertStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationalAlertRepository extends JpaRepository<OperationalAlertEntity, UUID> {

    Optional<OperationalAlertEntity> findFirstByComponentNameAndSummaryCodeAndStatus(
            String componentName,
            String summaryCode,
            OperationalAlertStatus status
    );

    List<OperationalAlertEntity> findAllByOrderByStatusAscSeverityDescLastSeenAtDesc();
}
