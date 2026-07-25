package com.educhain.support.repository;

import com.educhain.support.domain.SupportTicketStatus;
import com.educhain.support.entity.*;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface SupportTicketRepository extends JpaRepository<SupportTicketEntity, UUID> {
    Page<SupportTicketEntity> findAllByRequesterIdOrderByUpdatedAtDesc(UUID requesterId, Pageable pageable);
    Page<SupportTicketEntity> findAllByStatusOrderByPriorityDescUpdatedAtDesc(SupportTicketStatus status, Pageable pageable);
    Page<SupportTicketEntity> findAllByOrderByPriorityDescUpdatedAtDesc(Pageable pageable);
    Optional<SupportTicketEntity> findByIdAndRequesterId(UUID id, UUID requesterId);
}
