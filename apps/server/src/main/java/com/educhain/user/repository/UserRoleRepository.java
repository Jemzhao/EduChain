package com.educhain.user.repository;

import com.educhain.user.entity.UserRoleEntity;
import com.educhain.user.entity.UserRoleKey;
import com.educhain.user.domain.UserRoleName;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRoleEntity, UserRoleKey> {

    List<UserRoleEntity> findAllByUserIdOrderByRoleNameAsc(UUID userId);

    boolean existsByUserIdAndRoleName(UUID userId, UserRoleName roleName);

    void deleteAllByUserId(UUID userId);
}
