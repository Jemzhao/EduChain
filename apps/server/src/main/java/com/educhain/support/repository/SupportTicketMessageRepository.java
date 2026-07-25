package com.educhain.support.repository;
import com.educhain.support.entity.SupportTicketMessageEntity;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface SupportTicketMessageRepository extends JpaRepository<SupportTicketMessageEntity, UUID> {
    List<SupportTicketMessageEntity> findAllByTicketIdOrderByCreatedAtAscIdAsc(UUID ticketId);
}
