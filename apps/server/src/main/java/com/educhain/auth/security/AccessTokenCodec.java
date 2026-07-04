package com.educhain.auth.security;

import com.educhain.auth.config.AuthProperties;
import com.educhain.user.domain.UserRoleName;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

public final class AccessTokenCodec {

    private final AuthProperties properties;
    private final Clock clock;
    private final JwtEncoder encoder;
    private final JwtDecoder decoder;

    public AccessTokenCodec(AuthProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
        SecretKey key = new SecretKeySpec(
                properties.sessionSecret().getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"
        );
        this.encoder = NimbusJwtEncoder.withSecretKey(key)
                .algorithm(MacAlgorithm.HS256)
                .build();
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        jwtDecoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(properties.issuer()));
        this.decoder = jwtDecoder;
    }

    public String issue(
            UUID userId,
            UUID sessionId,
            String handle,
            List<UserRoleName> roles
    ) {
        Instant issuedAt = clock.instant();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(properties.issuer())
                .audience(List.of(properties.audience()))
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plus(properties.accessTokenTtl()))
                .subject(userId.toString())
                .id(UUID.randomUUID().toString())
                .claim("sid", sessionId.toString())
                .claim("handle", handle)
                .claim("roles", roles.stream().map(Enum::name).toList())
                .build();
        return encoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    public Optional<AccessTokenIdentity> decode(String token) {
        try {
            Jwt jwt = decoder.decode(token);
            if (!jwt.getAudience().contains(properties.audience())) {
                return Optional.empty();
            }
            return Optional.of(new AccessTokenIdentity(
                    UUID.fromString(jwt.getSubject()),
                    UUID.fromString(jwt.getClaimAsString("sid"))
            ));
        } catch (IllegalArgumentException | JwtException exception) {
            return Optional.empty();
        }
    }
}
