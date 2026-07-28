package com.educhain.admin.service;

import com.educhain.audit.service.AuditService;
import com.educhain.support.dto.SupportModels;
import com.educhain.support.service.SupportTicketService;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminSupportService {
    private final SupportTicketService support; private final AuditService audit;
    public AdminSupportService(SupportTicketService support, AuditService audit){this.support=support;this.audit=audit;}
    @Transactional public SupportModels.TicketDetail govern(UUID actorId,UUID ticketId,long version,SupportModels.GovernanceRequest request,String requestId){
        var result=support.govern(ticketId,version,request.status(),request.priority());
        audit.succeeded(actorId,"SUPPORT_TICKET_GOVERNED","SUPPORT_TICKET",ticketId,request.reason().trim(),requestId); return result;
    }
    @Transactional public SupportModels.TicketDetail reply(UUID actorId,UUID ticketId,String body,String requestId){
        var result=support.staffReply(actorId,ticketId,body);
        audit.succeeded(actorId,"SUPPORT_TICKET_REPLIED","SUPPORT_TICKET",ticketId,"Staff response added",requestId); return result;
    }
}
