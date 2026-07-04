package com.educhain.auth.service;

public interface PasswordResetDelivery {

    void send(String email, String rawToken);
}
