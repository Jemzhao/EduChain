package com.educhain.social.service;

import com.educhain.notification.domain.NotificationType;
import com.educhain.notification.service.NotificationIntent;
import com.educhain.notification.service.NotificationService;
import com.educhain.knowledge.dto.PageInfoResponse;
import com.educhain.knowledge.dto.ResourceAuthorResponse;
import com.educhain.shared.error.ApiException;
import com.educhain.shared.error.ErrorCode;
import com.educhain.social.dto.FollowStateResponse;
import com.educhain.social.dto.FollowUserListResponse;
import com.educhain.social.entity.FollowRelationEntity;
import com.educhain.social.repository.FollowRelationRepository;
import com.educhain.user.service.PublicAuthorSnapshot;
import com.educhain.user.service.UserService;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SocialService {

    private final FollowRelationRepository followRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public SocialService(
            FollowRelationRepository followRepository,
            UserService userService,
            NotificationService notificationService
    ) {
        this.followRepository = followRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public FollowStateResponse state(UUID followerId, UUID followedId) {
        validateUsers(followerId, followedId);
        return response(followerId, followedId);
    }

    @Transactional
    public FollowStateResponse setState(UUID followerId, UUID followedId, boolean following) {
        validateUsers(followerId, followedId);
        boolean current = followRepository.existsByFollowerIdAndFollowedId(followerId, followedId);
        if (following && !current) {
            followRepository.save(new FollowRelationEntity(followerId, followedId));
            notificationService.emit(new NotificationIntent(
                    followedId,
                    NotificationType.NEW_FOLLOWER,
                    "new-follower:" + followerId,
                    followerId,
                    null,
                    null
            ));
        } else if (!following && current) {
            followRepository.deleteByFollowerIdAndFollowedId(followerId, followedId);
        }
        return response(followerId, followedId);
    }

    @Transactional(readOnly = true)
    public long followerCount(UUID userId) {
        return followRepository.countByFollowedId(userId);
    }

    @Transactional(readOnly = true)
    public long followingCount(UUID userId) {
        return followRepository.countByFollowerId(userId);
    }

    @Transactional(readOnly = true)
    public FollowUserListResponse followers(UUID userId, String cursor, int limit) {
        userService.requireActiveSocialUser(userId);
        return listUsers(
                followRepository.findAllByFollowedId(userId, pageRequest(cursor, limit)),
                FollowRelationEntity::getFollowerId,
                cursor
        );
    }

    @Transactional(readOnly = true)
    public FollowUserListResponse following(UUID userId, String cursor, int limit) {
        userService.requireActiveSocialUser(userId);
        return listUsers(
                followRepository.findAllByFollowerId(userId, pageRequest(cursor, limit)),
                FollowRelationEntity::getFollowedId,
                cursor
        );
    }

    private void validateUsers(UUID followerId, UUID followedId) {
        if (followerId.equals(followedId)) {
            throw new ApiException(
                    HttpStatus.UNPROCESSABLE_CONTENT,
                    ErrorCode.FOLLOW_SELF_NOT_ALLOWED,
                    "A user cannot follow themselves",
                    false,
                    Map.of()
            );
        }
        userService.requireActiveSocialUser(followerId);
        userService.requireActiveSocialUser(followedId);
    }

    private FollowStateResponse response(UUID followerId, UUID followedId) {
        return new FollowStateResponse(
                followedId,
                followRepository.existsByFollowerIdAndFollowedId(followerId, followedId),
                followRepository.countByFollowedId(followedId),
                followRepository.countByFollowerId(followedId)
        );
    }

    private PageRequest pageRequest(String cursor, int limit) {
        return PageRequest.of(
                decodeCursor(cursor),
                limit,
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("followerId"))
        );
    }

    private FollowUserListResponse listUsers(
            Page<FollowRelationEntity> page,
            Function<FollowRelationEntity, UUID> userId,
            String cursor
    ) {
        var items = page.getContent().stream()
                .map(userId)
                .map(userService::getPublicAuthor)
                .map(this::toAuthorResponse)
                .toList();
        int pageIndex = decodeCursor(cursor);
        return new FollowUserListResponse(
                items,
                new PageInfoResponse(
                        page.hasNext() ? encodeCursor(pageIndex + 1) : null,
                        page.hasNext()
                )
        );
    }

    private ResourceAuthorResponse toAuthorResponse(PublicAuthorSnapshot author) {
        return new ResourceAuthorResponse(
                author.id(),
                author.handle(),
                author.displayName(),
                author.avatarUrl()
        );
    }

    private int decodeCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) return 0;
        try {
            String decoded = new String(
                    Base64.getUrlDecoder().decode(cursor),
                    StandardCharsets.UTF_8
            );
            if (!decoded.startsWith("page:")) throw new IllegalArgumentException();
            int page = Integer.parseInt(decoded.substring(5));
            if (page < 0) throw new IllegalArgumentException();
            return page;
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Cursor is invalid.");
        }
    }

    private String encodeCursor(int page) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(("page:" + page).getBytes(StandardCharsets.UTF_8));
    }
}
