package com.educhain.support.service;

import com.educhain.support.domain.SupportTicketStatus;

import com.educhain.support.domain.SupportTicketPriority;

import com.educhain.shared.error.*;
import com.educhain.support.dto.SupportModels;
import com.educhain.support.entity.*;
import com.educhain.support.repository.*;
import java.util.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportTicketService {
    private final SupportTicketRepository tickets;
    private final SupportTicketMessageRepository messages;

    public SupportTicketService(
            SupportTicketRepository tickets,
            SupportTicketMessageRepository messages
    ) {
        this.tickets = tickets;
        this.messages = messages;
    }

    @Transactional
    public SupportModels.TicketDetail create(
            UUID userId,
            SupportModels.CreateRequest request
    ) {
        SupportTicketEntity ticket = tickets.save(new SupportTicketEntity(
                UUID.randomUUID(),
                userId,
                request.category(),
                request.subject().trim(),
                request.description().trim()
        ));
        tickets.flush();
        return detail(ticket);
    }

    @Transactional(readOnly = true)
    public SupportModels.TicketList mine(UUID userId, int limit) {
        return new SupportModels.TicketList(tickets
                .findAllByRequesterIdOrderByUpdatedAtDesc(userId, PageRequest.of(0, limit))
                .map(this::summary)
                .getContent());
    }

    @Transactional(readOnly = true)
    public SupportModels.TicketDetail mine(UUID userId, UUID ticketId) {
        return detail(tickets.findByIdAndRequesterId(ticketId, userId).orElseThrow(this::notFound));
    }

    @Transactional
    public SupportModels.TicketDetail addUserMessage(UUID userId, UUID ticketId, String body) {
        SupportTicketEntity ticket = tickets.findByIdAndRequesterId(ticketId, userId)
                .orElseThrow(this::notFound);
        if (ticket.getStatus() == SupportTicketStatus.CLOSED) {
            throw closed();
        }
        messages.save(new SupportTicketMessageEntity(ticketId, userId, false, body.trim()));
        ticket.reopenForRequester();
        ticket.touch();
        tickets.flush();
        return detail(ticket);
    }

    @Transactional(readOnly = true)
    public SupportModels.TicketList queue(SupportTicketStatus status, int limit) {
        var page = status == null
                ? tickets.findAllByOrderByPriorityDescUpdatedAtDesc(PageRequest.of(0, limit))
                : tickets.findAllByStatusOrderByPriorityDescUpdatedAtDesc(
                        status,
                        PageRequest.of(0, limit)
                );
        return new SupportModels.TicketList(page.map(this::summary).getContent());
    }

    @Transactional(readOnly = true)
    public SupportModels.TicketDetail adminDetail(UUID ticketId) {
        return detail(require(ticketId));
    }

    @Transactional
    public SupportModels.TicketDetail govern(
            UUID ticketId,
            long version,
            SupportTicketStatus status,
            SupportTicketPriority priority
    ) {
        SupportTicketEntity ticket = require(ticketId);
        if (ticket.getVersion() != version) {
            throw conflict(ticket.getVersion());
        }
        ticket.govern(status, priority);
        tickets.flush();
        return detail(ticket);
    }

    @Transactional
    public SupportModels.TicketDetail staffReply(UUID actorId, UUID ticketId, String body) {
        SupportTicketEntity ticket = require(ticketId);
        if (ticket.getStatus() == SupportTicketStatus.CLOSED) {
            throw closed();
        }
        messages.save(new SupportTicketMessageEntity(ticketId, actorId, true, body.trim()));
        if (ticket.getStatus() == SupportTicketStatus.OPEN) {
            ticket.govern(SupportTicketStatus.IN_PROGRESS, ticket.getPriority());
        }
        ticket.touch();
        tickets.flush();
        return detail(ticket);
    }

    private SupportTicketEntity require(UUID id) {
        return tickets.findById(id).orElseThrow(this::notFound);
    }

    private SupportModels.TicketSummary summary(SupportTicketEntity ticket) {
        return new SupportModels.TicketSummary(
                ticket.getId(),
                ticket.getCategory(),
                ticket.getSubject(),
                ticket.getStatus(),
                ticket.getPriority(),
                ticket.getVersion(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt()
        );
    }

    private SupportModels.TicketDetail detail(SupportTicketEntity ticket) {
        var ticketMessages = messages.findAllByTicketIdOrderByCreatedAtAscIdAsc(ticket.getId())
                .stream()
                .map(message -> new SupportModels.MessageResponse(
                        message.getId(),
                        message.getAuthorId(),
                        message.isStaffReply(),
                        message.getBody(),
                        message.getCreatedAt()
                ))
                .toList();
        return new SupportModels.TicketDetail(summary(ticket), ticket.getDescription(), ticketMessages);
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.SUPPORT_TICKET_NOT_FOUND,
                "Support ticket was not found",
                false,
                Map.of()
        );
    }

    private ApiException closed() {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.SUPPORT_TICKET_CLOSED,
                "Support ticket is closed",
                false,
                Map.of()
        );
    }

    private ApiException conflict(long currentVersion) {
        return new ApiException(
                HttpStatus.CONFLICT,
                ErrorCode.VERSION_CONFLICT,
                "Support ticket version conflict",
                false,
                Map.of("currentVersion", Long.toString(currentVersion))
        );
    }
}
