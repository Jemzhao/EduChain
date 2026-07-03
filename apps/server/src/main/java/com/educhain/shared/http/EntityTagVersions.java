package com.educhain.shared.http;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class EntityTagVersions {

    private static final Pattern QUOTED_VERSION = Pattern.compile("^\"(\\d+)\"$");

    private EntityTagVersions() {
    }

    public static long parse(String value) {
        Matcher matcher = QUOTED_VERSION.matcher(value);
        if (!matcher.matches()) {
            throw new IllegalArgumentException("If-Match must contain a quoted numeric version.");
        }
        return Long.parseLong(matcher.group(1));
    }
}
