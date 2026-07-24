package com.educhain.platform.repository;

import com.educhain.platform.entity.PlatformSettingEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformSettingRepository extends JpaRepository<PlatformSettingEntity, String> {
    List<PlatformSettingEntity> findAllByOrderByKeyAsc();
    List<PlatformSettingEntity> findAllByPublicVisibleTrueOrderByKeyAsc();
}
