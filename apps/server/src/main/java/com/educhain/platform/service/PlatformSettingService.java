package com.educhain.platform.service;

import com.educhain.platform.dto.PlatformSettingListResponse;
import com.educhain.platform.dto.PlatformSettingResponse;
import com.educhain.platform.entity.PlatformSettingEntity;
import com.educhain.platform.domain.PlatformSettingType;
import com.educhain.platform.repository.PlatformSettingRepository;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlatformSettingService {

    private final PlatformSettingRepository repository;

    public PlatformSettingService(PlatformSettingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PlatformSettingListResponse publicSettings() {
        return new PlatformSettingListResponse(repository
                .findAllByPublicVisibleTrueOrderByKeyAsc()
                .stream()
                .map(this::response)
                .toList());
    }

    @Transactional(readOnly = true)
    public PlatformSettingListResponse all() {
        return new PlatformSettingListResponse(repository.findAllByOrderByKeyAsc()
                .stream()
                .map(this::response)
                .toList());
    }

    @Transactional
    public PlatformSettingResponse update(
            UUID actorId,
            String key,
            long expectedVersion,
            String value
    ) {
        PlatformSettingEntity setting = repository.findById(key).orElseThrow(this::notFound);
        if (setting.getVersion() != expectedVersion) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ErrorCode.VERSION_CONFLICT,
                    "Platform setting version conflict",
                    false,
                    Map.of("currentVersion", Long.toString(setting.getVersion()))
            );
        }
        String normalized = normalize(setting.getType(), value);
        setting.update(normalized, actorId);
        repository.flush();
        return response(setting);
    }

    private String normalize(PlatformSettingType type, String value) {
        String normalized = value.trim();
        return switch (type) {
            case TEXT -> normalized;
            case BOOLEAN -> {
                if (!normalized.equals("true") && !normalized.equals("false")) throw invalidValue();
                yield normalized;
            }
            case INTEGER -> {
                try {
                    yield Long.toString(Long.parseLong(normalized));
                } catch (NumberFormatException exception) {
                    throw invalidValue();
                }
            }
        };
    }

    private PlatformSettingResponse response(PlatformSettingEntity setting) {
        return new PlatformSettingResponse(
                setting.getKey(),
                setting.getType(),
                setting.getValue(),
                setting.isPublicVisible(),
                setting.getVersion(),
                setting.getUpdatedAt()
        );
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND,
                "Platform setting was not found",
                false,
                Map.of()
        );
    }

    private ApiException invalidValue() {
        return new ApiException(
                HttpStatus.UNPROCESSABLE_CONTENT,
                ErrorCode.FIELD_VALIDATION_FAILED,
                "Platform setting value is invalid",
                false,
                Map.of()
        );
    }
}
