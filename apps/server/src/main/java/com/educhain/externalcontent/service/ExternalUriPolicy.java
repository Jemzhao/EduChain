package com.educhain.externalcontent.service;

import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class ExternalUriPolicy {
    public URI configurationUri(String value) {
        try {
            URI uri = URI.create(value.trim()).normalize();
            if (!"https".equalsIgnoreCase(uri.getScheme())
                    || uri.getHost() == null
                    || uri.getUserInfo() != null
                    || (uri.getPort() != -1 && uri.getPort() != 443)) {
                throw rejected(HttpStatus.UNPROCESSABLE_CONTENT);
            }
            String path = uri.getPath();
            return new URI(
                    "https",
                    null,
                    uri.getHost().toLowerCase(),
                    uri.getPort(),
                    path == null || path.isBlank() ? "/" : path,
                    uri.getQuery(),
                    null
            );
        } catch (IllegalArgumentException | URISyntaxException exception) {
            throw rejected(HttpStatus.UNPROCESSABLE_CONTENT);
        }
    }

    public URI fetchUri(String value) {
        URI uri = configurationUri(value);
        try {
            for (InetAddress address : InetAddress.getAllByName(uri.getHost())) {
                if (address.isAnyLocalAddress()
                        || address.isLoopbackAddress()
                        || address.isLinkLocalAddress()
                        || address.isSiteLocalAddress()
                        || address.isMulticastAddress()) {
                    throw rejected(HttpStatus.SERVICE_UNAVAILABLE);
                }
            }
            return uri;
        } catch (UnknownHostException exception) {
            throw unavailable();
        }
    }

    public URI itemUri(String value, String allowedHost) {
        URI uri = configurationUri(value);
        if (!uri.getHost().equalsIgnoreCase(allowedHost)) {
            throw feedInvalid();
        }
        return uri;
    }

    private ApiException rejected(HttpStatus status) {
        return new ApiException(
                status,
                ErrorCode.EXTERNAL_FETCH_REJECTED,
                "External URL is outside the controlled fetch policy",
                false,
                Map.of()
        );
    }

    private ApiException unavailable() {
        return new ApiException(
                HttpStatus.SERVICE_UNAVAILABLE,
                ErrorCode.SERVICE_UNAVAILABLE,
                "External source host is unavailable",
                true,
                Map.of()
        );
    }

    public ApiException feedInvalid() {
        return new ApiException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                ErrorCode.EXTERNAL_FEED_INVALID,
                "External feed does not match the bounded contract",
                false,
                Map.of()
        );
    }
}
