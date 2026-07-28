package com.educhain.admin.controller;

import com.educhain.admin.service.AdminSupportService;
import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.shared.api.RequestIdFilter;
import com.educhain.shared.http.EntityTagVersions;
import com.educhain.support.dto.SupportModels;
import com.educhain.support.domain.SupportTicketStatus;
import com.educhain.support.service.SupportTicketService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated @RestController @RequestMapping("/api/v1/admin/support-tickets")
@PreAuthorize("hasAnyRole('MODERATOR','ADMINISTRATOR')")
public class AdminSupportController {
    private final SupportTicketService support; private final AdminSupportService admin;
    public AdminSupportController(SupportTicketService support,AdminSupportService admin){this.support=support;this.admin=admin;}
    @GetMapping public SupportModels.TicketList queue(@RequestParam(required=false) SupportTicketStatus status,@RequestParam(defaultValue="30") @Min(1) @Max(50) int limit){return support.queue(status,limit);}
    @GetMapping("/{ticketId}") public SupportModels.TicketDetail detail(@PathVariable UUID ticketId){return support.adminDetail(ticketId);}
    @PutMapping("/{ticketId}/governance") public SupportModels.TicketDetail govern(@AuthenticationPrincipal EduChainPrincipal principal,@PathVariable UUID ticketId,@RequestHeader("If-Match") String ifMatch,@Valid @RequestBody SupportModels.GovernanceRequest request,@RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId){return admin.govern(principal.userId(),ticketId,EntityTagVersions.parse(ifMatch),request,requestId);}
    @PostMapping("/{ticketId}/messages") public SupportModels.TicketDetail reply(@AuthenticationPrincipal EduChainPrincipal principal,@PathVariable UUID ticketId,@Valid @RequestBody SupportModels.MessageRequest request,@RequestAttribute(RequestIdFilter.ATTRIBUTE_NAME) String requestId){return admin.reply(principal.userId(),ticketId,request.body(),requestId);}
}
