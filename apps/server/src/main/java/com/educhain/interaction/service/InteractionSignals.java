package com.educhain.interaction.service;

public record InteractionSignals(long likes, long saves, long comments) {

    public double robustPopularity() {
        return Math.log1p(likes * 2.0 + saves * 3.0 + comments * 4.0);
    }

    public boolean present() {
        return likes > 0 || saves > 0 || comments > 0;
    }
}
