package com.educhain.search.repository;

import com.educhain.search.entity.SearchEventEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SearchEventRepository extends JpaRepository<SearchEventEntity, UUID> {
}
