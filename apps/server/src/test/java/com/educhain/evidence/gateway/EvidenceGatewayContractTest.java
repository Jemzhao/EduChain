package com.educhain.evidence.gateway;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

class EvidenceGatewayContractTest {

    private final ObjectMapper objectMapper = JsonMapper.builder()
            .findAndAddModules()
            .build();

    @Test
    void serializesPayloadUsingGatewayFieldNames() {
        GatewayEvidencePayload payload = new GatewayEvidencePayload(
                UUID.fromString("ac9db611-0cfb-4bc8-a4f5-2fdac6583a84"),
                UUID.fromString("baf61580-f3af-452c-9225-32ea8a5e028c"),
                "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
                "v1",
                (short) 1,
                "adaec87d15f83a230fb28e0e3ea47b48a83fb634502b0a2343464047d8fe5159",
                null,
                Instant.parse("2026-07-31T15:19:28.685470Z")
        );

        String json = objectMapper.writeValueAsString(payload);

        assertTrue(json.contains("\"resource_id\""));
        assertTrue(json.contains("\"attachment_merkle_root\":null"));
        assertEquals(payload, objectMapper.readValue(json, GatewayEvidencePayload.class));
    }
}
