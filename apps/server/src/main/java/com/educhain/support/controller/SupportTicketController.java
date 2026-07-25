package com.educhain.support.controller;

import com.educhain.platform.security.EduChainPrincipal;
import com.educhain.support.dto.SupportModels;
import com.educhain.support.service.SupportTicketService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/v1/support/tickets")
public class SupportTicketController {
    private final SupportTicketService service;
    public SupportTicketController(SupportTicketService service) { this.service=service; }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public SupportModels.TicketDetail create(@AuthenticationPrincipal EduChainPrincipal principal,@Valid @RequestBody SupportModels.CreateRequest request){return service.create(principal.userId(),request);}
    @GetMapping public SupportModels.TicketList mine(@AuthenticationPrincipal EduChainPrincipal principal,@RequestParam(defaultValue="30") @Min(1) @Max(50) int limit){return service.mine(principal.userId(),limit);}
    @GetMapping("/{ticketId}") public SupportModels.TicketDetail detail(@AuthenticationPrincipal EduChainPrincipal principal,@PathVariable UUID ticketId){return service.mine(principal.userId(),ticketId);}
    @PostMapping("/{ticketId}/messages") @ResponseStatus(HttpStatus.CREATED)
    public SupportModels.TicketDetail message(@AuthenticationPrincipal EduChainPrincipal principal,@PathVariable UUID ticketId,@Valid @RequestBody SupportModels.MessageRequest request){return service.addUserMessage(principal.userId(),ticketId,request.body());}
}
