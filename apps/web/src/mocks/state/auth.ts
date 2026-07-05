import type { MockCurrentUser } from "@/mocks/fixtures/auth";
import { demoPassword, demoUser, mockUsers } from "@/mocks/fixtures/auth";
import { readMockSession, writeMockSession } from "@/mocks/state/session-storage";

type MockAccount = {
  currentUser: MockCurrentUser;
  password: string;
};

const seedAccounts: MockAccount[] = [
  ...mockUsers.map((currentUser, index) => ({
    currentUser: structuredClone(currentUser),
    password: index === 0 ? demoPassword : "MockOnly!Member",
  })),
];

const storageKey = "educhain.mock.auth.v3";
let accounts: MockAccount[] = structuredClone(seedAccounts);
let activeUserId: string | undefined;
let hydrated = false;

function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  const stored = readMockSession<{ accounts: MockAccount[]; activeUserId?: string }>(storageKey);
  if (!stored || !Array.isArray(stored.accounts)) return;
  accounts = stored.accounts;
  activeUserId = stored.activeUserId;
  const demoAccount = accounts.find(({ currentUser }) => currentUser.user.id === demoUser.user.id);
  if (demoAccount && !demoAccount.currentUser.roles.includes("ADMINISTRATOR")) {
    demoAccount.currentUser.roles.push("ADMINISTRATOR");
  }
}

function persist(): void {
  writeMockSession(storageKey, { accounts, activeUserId });
}

export const authState = {
  register(account: MockAccount): MockCurrentUser {
    hydrate();
    accounts.push(account);
    activeUserId = account.currentUser.user.id;
    persist();
    return structuredClone(account.currentUser);
  },
  provision(account: MockAccount): MockCurrentUser {
    hydrate();
    accounts.push(account);
    persist();
    return structuredClone(account.currentUser);
  },
  find(identifier: string): MockAccount | undefined {
    hydrate();
    const normalized = identifier.trim().toLowerCase();
    return accounts.find(
      ({ currentUser }) =>
        currentUser.email === normalized || currentUser.user.handle === normalized,
    );
  },
  identifierTaken(email: string, handle: string): boolean {
    hydrate();
    return accounts.some(
      ({ currentUser }) => currentUser.email === email || currentUser.user.handle === handle,
    );
  },
  identifierTakenByOther(email: string, handle: string, userId: string): boolean {
    hydrate();
    return accounts.some(
      ({ currentUser }) =>
        currentUser.user.id !== userId &&
        (currentUser.email === email || currentUser.user.handle === handle),
    );
  },
  login(account: MockAccount): MockCurrentUser {
    hydrate();
    activeUserId = account.currentUser.user.id;
    persist();
    return structuredClone(account.currentUser);
  },
  logout(): void {
    hydrate();
    activeUserId = undefined;
    persist();
  },
  current(): MockCurrentUser | undefined {
    hydrate();
    const account = accounts.find(({ currentUser }) => currentUser.user.id === activeUserId);
    return account ? structuredClone(account.currentUser) : undefined;
  },
  findById(userId: string): MockAccount | undefined {
    hydrate();
    return accounts.find(({ currentUser }) => currentUser.user.id === userId);
  },
  all(): MockCurrentUser[] {
    hydrate();
    return accounts.map(({ currentUser }) => structuredClone(currentUser));
  },
  update(user: MockCurrentUser): MockCurrentUser {
    hydrate();
    const account = accounts.find(({ currentUser }) => currentUser.user.id === user.user.id);
    if (!account) {
      throw new Error("Mock account not found");
    }
    account.currentUser = structuredClone(user);
    persist();
    return structuredClone(user);
  },
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): "changed" | "invalid" | "reused" {
    hydrate();
    const account = accounts.find(({ currentUser }) => currentUser.user.id === userId);
    if (!account || account.password !== currentPassword) return "invalid";
    if (account.password === newPassword) return "reused";
    account.password = newPassword;
    activeUserId = undefined;
    persist();
    return "changed";
  },
  resetPassword(userId: string, newPassword: string): "changed" | "invalid" | "reused" {
    hydrate();
    const account = accounts.find(({ currentUser }) => currentUser.user.id === userId);
    if (!account) return "invalid";
    if (account.password === newPassword) return "reused";
    account.password = newPassword;
    if (activeUserId === userId) activeUserId = undefined;
    persist();
    return "changed";
  },
};
