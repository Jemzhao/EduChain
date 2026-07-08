package com.educhain.file.service;

public record StoredObjectInspection(long size, String detectedMediaType, String sha256) {
}
