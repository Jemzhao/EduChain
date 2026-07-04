package com.educhain.auth.repository;

import com.educhain.auth.entity.AuthCredentialEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthCredentialRepository extends JpaRepository<AuthCredentialEntity, UUID> {
}
