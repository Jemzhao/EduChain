package com.educhain.evidence.service;

import com.educhain.evidence.dto.LedgerBlockListResponse;
import com.educhain.evidence.dto.LedgerBlockResponse;
import com.educhain.evidence.dto.LedgerBlockSummaryResponse;
import com.educhain.evidence.dto.LedgerTransactionResponse;
import com.educhain.evidence.dto.LedgerSearchResponse;
import com.educhain.evidence.dto.LedgerSearchResultResponse;
import com.educhain.evidence.domain.EvidenceBackendType;
import com.educhain.evidence.entity.EvidenceRecordEntity;
import com.educhain.evidence.repository.EvidenceRecordRepository;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LedgerExplorerService {

    private static final String SCOPE = "APPLICATION_EVIDENCE";
    private final EvidenceRecordRepository repository;

    public LedgerExplorerService(EvidenceRecordRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public LedgerBlockListResponse blocks(int limit) {
        List<EvidenceRecordEntity> records = repository
                .findAllByBlockHeightIsNotNullOrderByConfirmedAtDesc(
                        PageRequest.of(0, Math.min(limit * 10, 500))
                );
        Map<BlockKey, BlockAccumulator> blocks = new LinkedHashMap<>();
        for (EvidenceRecordEntity record : records) {
            BlockKey key = new BlockKey(
                    record.getBackend(),
                    record.getNetworkId(),
                    record.getBlockHeight()
            );
            blocks.computeIfAbsent(key, ignored -> new BlockAccumulator(record)).add(record);
        }
        return new LedgerBlockListResponse(
                blocks.values().stream()
                        .map(BlockAccumulator::response)
                        .limit(limit)
                        .toList(),
                SCOPE
        );
    }

    @Transactional(readOnly = true)
    public LedgerBlockResponse block(
            EvidenceBackendType backend,
            String networkId,
            long blockHeight
    ) {
        List<EvidenceRecordEntity> records = repository
                .findAllByBackendAndNetworkIdAndBlockHeightOrderByConfirmedAtAsc(
                        backend,
                        networkId,
                        blockHeight
                );
        if (records.isEmpty()) throw notFound("Ledger block was not found");
        BlockAccumulator accumulator = new BlockAccumulator(records.getFirst());
        records.forEach(accumulator::add);
        return new LedgerBlockResponse(
                accumulator.response(),
                records.stream().map(this::transaction).toList(),
                SCOPE
        );
    }

    @Transactional(readOnly = true)
    public LedgerTransactionResponse transaction(
            String transactionId,
            EvidenceBackendType backend,
            String networkId
    ) {
        List<EvidenceRecordEntity> records = repository.findAllByTransactionId(transactionId)
                .stream()
                .filter(record -> backend == null || record.getBackend() == backend)
                .filter(record -> networkId == null || record.getNetworkId().equals(networkId))
                .toList();
        if (records.isEmpty()) throw notFound("Ledger transaction was not found");
        if (records.size() > 1) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.LEDGER_TRANSACTION_AMBIGUOUS,
                    "Transaction identifier is ambiguous across evidence networks",
                    false,
                    Map.of("transactionId", transactionId)
            );
        }
        return transaction(records.getFirst());
    }

    @Transactional(readOnly = true)
    public LedgerSearchResponse search(String rawQuery, int limit) {
        String query = rawQuery.trim();
        Map<UUID, LedgerSearchResultResponse> matches = new LinkedHashMap<>();
        try {
            UUID proofId = UUID.fromString(query);
            repository.findById(proofId).ifPresent(record -> matches.put(
                    record.getId(),
                    searchResult(record, LedgerSearchResultResponse.SearchKind.PROOF)
            ));
        } catch (IllegalArgumentException ignored) {
            // The remaining typed indexes still apply.
        }
        repository.findAllByTransactionId(query).forEach(record -> matches.putIfAbsent(
                record.getId(),
                searchResult(record, LedgerSearchResultResponse.SearchKind.TRANSACTION)
        ));
        if (query.matches("^[a-fA-F0-9]{64}$")) {
            repository.findFirstByContentDigestOrderByConfirmedAtDesc(query.toLowerCase(Locale.ROOT))
                    .ifPresent(record -> matches.putIfAbsent(
                            record.getId(),
                            searchResult(record, LedgerSearchResultResponse.SearchKind.DIGEST)
                    ));
        }
        try {
            long blockHeight = Long.parseLong(query);
            repository.findAllByBlockHeightOrderByConfirmedAtDesc(
                    blockHeight,
                    PageRequest.of(0, limit)
            ).forEach(record -> matches.putIfAbsent(
                    record.getId(),
                    searchResult(record, LedgerSearchResultResponse.SearchKind.BLOCK)
            ));
        } catch (NumberFormatException ignored) {
            // Non-numeric searches are not block-height queries.
        }
        return new LedgerSearchResponse(
                matches.values().stream().limit(limit).toList(),
                SCOPE
        );
    }

    private LedgerSearchResultResponse searchResult(
            EvidenceRecordEntity record,
            LedgerSearchResultResponse.SearchKind kind
    ) {
        return new LedgerSearchResultResponse(
                kind,
                record.getId(),
                record.getTransactionId(),
                record.getBackend(),
                record.getNetworkId(),
                record.getBlockHeight(),
                record.getContentDigest(),
                record.getConfirmedAt()
        );
    }

    private LedgerTransactionResponse transaction(EvidenceRecordEntity record) {
        return new LedgerTransactionResponse(
                record.getTransactionId(),
                record.getBackend(),
                record.getNetworkId(),
                record.getBlockHeight(),
                record.getBlockHash(),
                record.getId(),
                record.getResourceId(),
                record.getVersionId(),
                record.getContentDigest(),
                record.getSubmittedAt(),
                record.getConfirmedAt()
        );
    }

    private ApiException notFound(String detail) {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.EVIDENCE_NOT_FOUND,
                detail,
                false,
                Map.of()
        );
    }

    private record BlockKey(EvidenceBackendType backend, String networkId, Long height) {
    }

    private static final class BlockAccumulator {
        private final EvidenceBackendType backend;
        private final String networkId;
        private final long height;
        private final String hash;
        private long transactionCount;
        private Instant confirmedAt;

        private BlockAccumulator(EvidenceRecordEntity record) {
            this.backend = record.getBackend();
            this.networkId = record.getNetworkId();
            this.height = record.getBlockHeight();
            this.hash = record.getBlockHash();
            this.confirmedAt = record.getConfirmedAt();
        }

        private void add(EvidenceRecordEntity record) {
            transactionCount++;
            if (record.getConfirmedAt().isAfter(confirmedAt)) confirmedAt = record.getConfirmedAt();
        }

        private LedgerBlockSummaryResponse response() {
            return new LedgerBlockSummaryResponse(
                    backend,
                    networkId,
                    height,
                    hash,
                    transactionCount,
                    confirmedAt
            );
        }
    }
}
