import { mockBeforeHours } from "@/mocks/clock";
import { authState } from "@/mocks/state/auth";
import type { AdminUser, UserStatus, UserCreate, UserUpdate } from "./admin-state-types";
import { adminPage } from "./admin-store";

export const adminUserState = {
  users(query = "", status?: UserStatus) {
    const normalized = query.trim().toLowerCase();
    const items: AdminUser[] = authState
      .all()
      .filter((item) => !status || item.user.status === status)
      .filter(
        (item) =>
          !normalized ||
          item.email.includes(normalized) ||
          item.user.handle.includes(normalized) ||
          item.user.displayName.toLowerCase().includes(normalized),
      )
      .map((item, index) => ({
        user: item.user,
        email: item.email,
        roles: item.roles,
        createdAt: mockBeforeHours(240 + index * 24),
      }));
    return { items, adminPage };
  },
  updateUser(userId: string, status: UserStatus) {
    const current = authState.findById(userId)?.currentUser;
    if (!current) return undefined;
    return authState.update({
      ...current,
      user: { ...current.user, status, version: current.user.version + 1 },
    });
  },
  provisionUser(body: UserCreate) {
    const roles = [...new Set(["USER" as const, ...body.roles])];
    const currentUser = authState.provision({
      currentUser: {
        user: {
          id: crypto.randomUUID(),
          handle: body.handle.trim().toLowerCase(),
          displayName: body.displayName.trim(),
          avatarUrl: null,
          status: "ACTIVE",
          version: 0,
        },
        email: body.email.trim().toLowerCase(),
        roles,
        profile: {
          bio: "",
          education: "",
          location: "",
          websiteUrl: "",
          contactEmail: "",
        },
      },
      password: `${crypto.randomUUID()}${crypto.randomUUID()}`,
    });
    return this.users().items.find((item) => item.user.id === currentUser.user.id)!;
  },
  replaceUser(userId: string, body: UserUpdate) {
    const current = authState.findById(userId)?.currentUser;
    if (!current) return undefined;
    const updated = authState.update({
      ...current,
      email: body.email.trim().toLowerCase(),
      roles: [...new Set(["USER" as const, ...body.roles])],
      user: {
        ...current.user,
        handle: body.handle.trim().toLowerCase(),
        displayName: body.displayName.trim(),
        status: body.status,
        version: current.user.version + 1,
      },
    });
    return this.users().items.find((item) => item.user.id === updated.user.id);
  },
};
