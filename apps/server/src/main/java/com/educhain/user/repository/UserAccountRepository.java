package com.educhain.user.repository;

import com.educhain.user.domain.UserRoleName;

import com.educhain.user.entity.UserAccountEntity;
import java.util.Optional;
import java.util.List;
import java.util.UUID;
import com.educhain.user.domain.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserAccountRepository extends JpaRepository<UserAccountEntity, UUID> {

    boolean existsByEmailNormalizedOrHandleNormalized(String email, String handle);

    boolean existsByEmailNormalizedAndIdNot(String email, UUID id);

    boolean existsByHandleNormalizedAndIdNot(String handle, UUID id);

    Optional<UserAccountEntity> findByEmailNormalizedOrHandleNormalized(String email, String handle);

    Optional<UserAccountEntity> findByEmailNormalized(String email);

    Optional<UserAccountEntity> findByHandleNormalized(String handle);

    @Query("""
            select account
              from UserAccountEntity account
             where (:status is null or account.status = :status)
               and (:query = ''
                    or lower(account.emailNormalized) like lower(concat('%', :query, '%'))
                    or lower(account.handleNormalized) like lower(concat('%', :query, '%')))
             order by account.createdAt desc, account.id desc
            """)
    Page<UserAccountEntity> searchForGovernance(
            @Param("query") String query,
            @Param("status") UserStatus status,
            Pageable pageable
    );

    @Query("""
            select count(account)
              from UserAccountEntity account, UserRoleEntity role
             where role.userId = account.id
               and role.roleName = com.educhain.user.domain.UserRoleName.ADMINISTRATOR
               and account.status = com.educhain.user.domain.UserStatus.ACTIVE
            """)
    long countActiveAdministrators();

    long countByStatus(UserStatus status);

    List<UserAccountEntity> findAllByStatus(UserStatus status);
}
