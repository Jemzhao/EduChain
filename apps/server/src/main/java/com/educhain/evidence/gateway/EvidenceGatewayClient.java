package com.educhain.evidence.gateway;

import com.educhain.evidence.config.EvidenceProperties;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class EvidenceGatewayClient {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final EvidenceProperties properties;

    public EvidenceGatewayClient(
            HttpClient evidenceHttpClient,
            ObjectMapper objectMapper,
            EvidenceProperties properties
    ) {
        this.httpClient = evidenceHttpClient;
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    public GatewayEvidenceProof submit(
            String idempotencyKey,
            GatewayEvidencePayload payload
    ) {
        return exchange(
                request("/evidence")
                        .header("Idempotency-Key", idempotencyKey)
                        .header("X-Payload-Version", Short.toString(payload.payloadVersion()))
                        .POST(HttpRequest.BodyPublishers.ofString(
                                objectMapper.writeValueAsString(payload)
                        ))
                        .build(),
                GatewayEvidenceProof.class
        );
    }

    public GatewayEvidenceProof findSubmission(String idempotencyKey) {
        return exchange(
                request("/evidence/submissions/" + idempotencyKey).GET().build(),
                GatewayEvidenceProof.class
        );
    }

    public GatewayCertificateArtifact generateCertificate(
            UUID proofId,
            GatewayCertificateRequest payload
    ) {
        return exchange(
                request("/evidence/" + proofId + "/certificate")
                        .header("X-Payload-Version", "1")
                        .POST(HttpRequest.BodyPublishers.ofString(
                                objectMapper.writeValueAsString(payload)
                        ))
                        .build(),
                GatewayCertificateArtifact.class
        );
    }

    public byte[] downloadCertificate(UUID proofId) {
        HttpRequest request = request("/evidence/" + proofId + "/certificate")
                .setHeader("Accept", "application/pdf")
                .GET()
                .build();
        try {
            HttpResponse<byte[]> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofByteArray()
            );
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return response.body();
            }
            GatewayProblem problem = parseProblem(
                    response.statusCode(),
                    new String(response.body(), StandardCharsets.UTF_8)
            );
            throw new EvidenceGatewayException(
                    problem.code(),
                    problem.detail(),
                    problem.retryable(),
                    false
            );
        } catch (EvidenceGatewayException exception) {
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (IOException | RuntimeException exception) {
            throw unavailable(exception);
        }
    }

    public boolean health() {
        try {
            HttpResponse<Void> response = httpClient.send(
                    request("/health").GET().build(),
                    HttpResponse.BodyHandlers.discarding()
            );
            return response.statusCode() >= 200 && response.statusCode() < 300;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return false;
        } catch (IOException | RuntimeException exception) {
            return false;
        }
    }

    private HttpRequest.Builder request(String path) {
        return HttpRequest.newBuilder(resolve(path))
                .timeout(properties.requestTimeout())
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .header("X-Service-Token", properties.serviceToken())
                .header("X-Request-Id", UUID.randomUUID().toString());
    }

    private URI resolve(String path) {
        String base = properties.gatewayBaseUrl().toString().replaceAll("/+$", "");
        return URI.create(base + path);
    }

    private <T> T exchange(HttpRequest request, Class<T> responseType) {
        try {
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return objectMapper.readValue(response.body(), responseType);
            }
            GatewayProblem problem = parseProblem(response.statusCode(), response.body());
            throw new EvidenceGatewayException(
                    problem.code(),
                    problem.detail(),
                    problem.retryable(),
                    "EVIDENCE_RESULT_UNKNOWN".equals(problem.code())
            );
        } catch (EvidenceGatewayException exception) {
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (IOException | RuntimeException exception) {
            throw unavailable(exception);
        }
    }

    private GatewayProblem parseProblem(int statusCode, String body) {
        try {
            return objectMapper.readValue(body, GatewayProblem.class);
        } catch (RuntimeException exception) {
            return new GatewayProblem(
                    "EVIDENCE_GATEWAY_INVALID_RESPONSE",
                    "Evidence Gateway returned an invalid response",
                    statusCode >= 500
            );
        }
    }

    private EvidenceGatewayException unavailable(Exception exception) {
        return new EvidenceGatewayException(
                "EVIDENCE_BACKEND_UNAVAILABLE",
                "Evidence Gateway is unavailable",
                true,
                false
        );
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GatewayProblem(String code, String detail, boolean retryable) {
    }
}
