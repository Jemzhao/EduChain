package com.educhain.evidence.controller;

import com.educhain.evidence.dto.LedgerBlockListResponse;
import com.educhain.evidence.dto.LedgerBlockResponse;
import com.educhain.evidence.dto.LedgerTransactionResponse;
import com.educhain.evidence.dto.LedgerSearchResponse;
import com.educhain.evidence.domain.EvidenceBackendType;
import com.educhain.evidence.service.LedgerExplorerService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/ledger")
public class LedgerExplorerController {

    private final LedgerExplorerService service;

    public LedgerExplorerController(LedgerExplorerService service) {
        this.service = service;
    }

    @GetMapping("/blocks")
    public LedgerBlockListResponse blocks(
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return service.blocks(limit);
    }

    @GetMapping("/blocks/{backend}/{networkId}/{blockHeight}")
    public LedgerBlockResponse block(
            @PathVariable EvidenceBackendType backend,
            @PathVariable @Size(min = 1, max = 120) String networkId,
            @PathVariable @Min(0) long blockHeight
    ) {
        return service.block(backend, networkId, blockHeight);
    }

    @GetMapping("/transactions/{transactionId}")
    public LedgerTransactionResponse transaction(
            @PathVariable @Size(min = 16, max = 160) String transactionId,
            @RequestParam(required = false) EvidenceBackendType backend,
            @RequestParam(required = false) @Size(max = 120) String networkId
    ) {
        return service.transaction(transactionId, backend, networkId);
    }

    @GetMapping("/search")
    public LedgerSearchResponse search(
            @RequestParam @Size(min = 1, max = 160) String query,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit
    ) {
        return service.search(query, limit);
    }
}
