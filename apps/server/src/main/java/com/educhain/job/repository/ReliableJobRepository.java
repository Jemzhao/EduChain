package com.educhain.job.repository;

import com.educhain.job.entity.ReliableJobEntity;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReliableJobRepository extends JpaRepository<ReliableJobEntity, UUID> {

    Optional<ReliableJobEntity> findByJobTypeAndBusinessKey(String jobType, String businessKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select job
              from ReliableJobEntity job
             where job.jobType = :jobType
               and (
                    (job.status in (
                        com.educhain.job.entity.ReliableJobStatus.PENDING,
                        com.educhain.job.entity.ReliableJobStatus.RETRY_WAIT
                    ) and job.availableAt <= :now)
                    or
                    (job.status = com.educhain.job.entity.ReliableJobStatus.RUNNING
                        and job.leaseUntil < :now)
               )
             order by job.availableAt asc, job.createdAt asc
            """)
    List<ReliableJobEntity> findClaimable(
            @Param("jobType") String jobType,
            @Param("now") Instant now,
            Pageable pageable
    );
}
