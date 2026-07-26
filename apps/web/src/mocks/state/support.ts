import type { components } from "@educhain/api-contract";

import { mockBeforeHours, mockNow } from "@/mocks/clock";
import { demoUser, mockUsers } from "@/mocks/fixtures/auth";
import { readMockSession, writeMockSession } from "@/mocks/state/session-storage";

type TicketDetail = components["schemas"]["SupportTicketDetail"];
type TicketStatus = components["schemas"]["SupportTicketStatus"];
type TicketPriority = components["schemas"]["SupportTicketPriority"];
type CreateRequest = components["schemas"]["CreateSupportTicketRequest"];

type StoredTicket = TicketDetail & { requesterId: string };

const before = mockBeforeHours;
const storageKey = "educhain.mock.support.v2";
const staffId = "10000000-0000-4000-8000-000000000099";
const ticketDefinitions = [
  [
    "EVIDENCE",
    "存证任务状态需要说明",
    "WAITING_FOR_USER",
    "NORMAL",
    "资源已经公开，但我希望进一步了解模拟器记录与真实链上记录的区别。",
  ],
  [
    "ACCOUNT",
    "资料页公开字段范围",
    "RESOLVED",
    "NORMAL",
    "希望确认联系邮箱和登录邮箱是否会同时公开。",
  ],
  [
    "CONTENT",
    "资源新版本与旧版本关系",
    "IN_PROGRESS",
    "NORMAL",
    "发布更正后，旧版本和对应摘要应该如何查看？",
  ],
  [
    "COPYRIGHT",
    "开放许可署名格式复核",
    "OPEN",
    "HIGH",
    "外部课程讲义需要补齐原作者、来源链接和许可名称。",
  ],
  [
    "TECHNICAL",
    "上传完成后仍显示扫描中",
    "RESOLVED",
    "HIGH",
    "文档上传完成后状态短暂保持为扫描中，希望确认恢复路径。",
  ],
  ["OTHER", "建议增加检索评测说明", "CLOSED", "NORMAL", "希望开发者资料补充排序信号和评测边界。"],
  [
    "EVIDENCE",
    "证书中的网络标识含义",
    "IN_PROGRESS",
    "NORMAL",
    "想了解 networkId、交易标识和区块高度分别代表什么。",
  ],
  [
    "CONTENT",
    "评论被隐藏后的展示规则",
    "RESOLVED",
    "NORMAL",
    "需要确认被治理评论是否仍保留回复结构和审计记录。",
  ],
  [
    "ACCOUNT",
    "会话设备列表说明",
    "OPEN",
    "NORMAL",
    "安全设置中的当前设备与其他会话需要更清晰的说明。",
  ],
  [
    "COPYRIGHT",
    "引用资源的核验材料",
    "WAITING_FOR_USER",
    "HIGH",
    "举报材料应该包含哪些权利依据和目标链接？",
  ],
] as const satisfies ReadonlyArray<
  readonly [CreateRequest["category"], string, TicketStatus, TicketPriority, string]
>;

const seed: StoredTicket[] = ticketDefinitions.map(
  ([category, subject, status, priority, description], index) => {
    const requester = index < 5 ? demoUser : mockUsers[index % mockUsers.length];
    const createdAt = before(120 + index * 38);
    const updatedAt = before(20 + index * 11);
    return {
      requesterId: requester.user.id,
      ticket: {
        id: `58000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        category,
        subject,
        status,
        priority,
        version: status === "OPEN" ? 0 : 1,
        createdAt,
        updatedAt,
      },
      description,
      messages:
        status === "OPEN"
          ? []
          : [
              {
                id: `58100000-0000-4000-8000-${String(index * 2 + 1).padStart(12, "0")}`,
                authorId: requester.user.id,
                staffReply: false,
                body: "补充说明：希望处理结果同时给出可执行步骤和对应的产品入口。",
                createdAt,
              },
              {
                id: `58100000-0000-4000-8000-${String(index * 2 + 2).padStart(12, "0")}`,
                authorId: staffId,
                staffReply: true,
                body: "已完成范围核对，并在工单中说明产品边界、操作入口与后续复核方式。",
                createdAt: updatedAt,
              },
            ],
    };
  },
);

let tickets = structuredClone(seed);
let hydrated = false;

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  tickets = readMockSession<StoredTicket[]>(storageKey) ?? structuredClone(seed);
}

function persist() {
  writeMockSession(storageKey, tickets);
}

function clone(ticket: StoredTicket): TicketDetail {
  return structuredClone({
    ticket: ticket.ticket,
    description: ticket.description,
    messages: ticket.messages,
  });
}

function bump(ticket: StoredTicket) {
  ticket.ticket.version += 1;
  ticket.ticket.updatedAt = mockNow();
}

export const supportState = {
  mine(requesterId: string) {
    hydrate();
    return {
      items: tickets
        .filter((item) => item.requesterId === requesterId)
        .sort((left, right) => right.ticket.updatedAt.localeCompare(left.ticket.updatedAt))
        .map((item) => structuredClone(item.ticket)),
    };
  },
  queue(status?: TicketStatus) {
    hydrate();
    return {
      items: tickets
        .filter((item) => !status || item.ticket.status === status)
        .sort((left, right) => {
          const priority =
            Number(right.ticket.priority === "HIGH") - Number(left.ticket.priority === "HIGH");
          return priority || right.ticket.updatedAt.localeCompare(left.ticket.updatedAt);
        })
        .map((item) => structuredClone(item.ticket)),
    };
  },
  detail(ticketId: string, requesterId?: string) {
    hydrate();
    const ticket = tickets.find(
      (item) => item.ticket.id === ticketId && (!requesterId || item.requesterId === requesterId),
    );
    return ticket ? clone(ticket) : undefined;
  },
  create(requesterId: string, request: CreateRequest) {
    hydrate();
    const now = mockNow();
    const ticket: StoredTicket = {
      requesterId,
      ticket: {
        id: crypto.randomUUID(),
        category: request.category,
        subject: request.subject.trim(),
        status: "OPEN",
        priority: "NORMAL",
        version: 0,
        createdAt: now,
        updatedAt: now,
      },
      description: request.description.trim(),
      messages: [],
    };
    tickets.unshift(ticket);
    persist();
    return clone(ticket);
  },
  reply(ticketId: string, authorId: string, body: string, staffReply: boolean) {
    hydrate();
    const ticket = tickets.find((item) => item.ticket.id === ticketId);
    if (!ticket || ticket.ticket.status === "CLOSED") return undefined;
    ticket.messages.push({
      id: crypto.randomUUID(),
      authorId,
      staffReply,
      body: body.trim(),
      createdAt: mockNow(),
    });
    if (staffReply && ticket.ticket.status === "OPEN") ticket.ticket.status = "IN_PROGRESS";
    if (!staffReply && ticket.ticket.status === "WAITING_FOR_USER") {
      ticket.ticket.status = "IN_PROGRESS";
    }
    bump(ticket);
    persist();
    return clone(ticket);
  },
  govern(ticketId: string, version: number, status: TicketStatus, priority: TicketPriority) {
    hydrate();
    const ticket = tickets.find((item) => item.ticket.id === ticketId);
    if (!ticket || ticket.ticket.version !== version) return undefined;
    ticket.ticket.status = status;
    ticket.ticket.priority = priority;
    bump(ticket);
    persist();
    return clone(ticket);
  },
};
