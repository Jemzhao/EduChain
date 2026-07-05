package com.educhain.user.mapper;

import com.educhain.user.dto.ProfileDetailsResponse;
import com.educhain.user.dto.UserSummaryResponse;
import com.educhain.user.entity.UserAccountEntity;
import com.educhain.user.entity.UserProfileEntity;
import java.net.URI;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    default UserSummaryResponse toSummary(
            UserAccountEntity account,
            UserProfileEntity profile
    ) {
        URI avatarUrl = profile.getAvatarFileId() == null
                ? null
                : URI.create("/api/v1/files/" + profile.getAvatarFileId() + "/content");
        return new UserSummaryResponse(
                account.getId(),
                account.getHandleNormalized(),
                profile.getDisplayName(),
                avatarUrl,
                account.getStatus(),
                account.getVersion()
        );
    }

    default ProfileDetailsResponse toProfile(UserProfileEntity profile) {
        return new ProfileDetailsResponse(
                profile.getBio(),
                profile.getEducation(),
                profile.getLocation(),
                profile.getWebsiteUrl(),
                profile.getContactEmail()
        );
    }
}
