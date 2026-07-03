package com.educhain.shared.error;

import java.util.Map;

public record FieldViolation(String field, String code, Map<String, String> parameters) {

    public FieldViolation {
        parameters = Map.copyOf(parameters);
    }
}
