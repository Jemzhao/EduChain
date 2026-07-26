import type { components } from "@educhain/api-contract";
import { delay, http, HttpResponse } from "msw";

import { problemResponse } from "@/mocks/problem";
import { pathOf, requireWriteAccess } from "@/mocks/request-guards";
import { authState } from "@/mocks/state/auth";
import { supportState } from "@/mocks/state/support";

type CreateRequest = components["schemas"]["CreateSupportTicketRequest"];
type MessageRequest = components["schemas"]["SupportTicketMessageRequest"];
type GovernanceRequest = components["schemas"]["SupportTicketGovernanceRequest"];
type TicketStatus = components["schemas"]["SupportTicketStatus"];

function requireSession(request: Request) {
  return authState.current()
    ? undefined
    : problemResponse({ status: 401, code: "AUTHENTICATION_REQUIRED", path: pathOf(request) });
}

function requireGovernance(request: Request, write = false) {
  const current = authState.current();
  if (!current) return requireSession(request);
  if (!current.roles.some((role) => role === "MODERATOR" || role === "ADMINISTRATOR")) {
    return problemResponse({ status: 403, code: "ACCESS_DENIED", path: pathOf(request) });
  }
  return write ? requireWriteAccess(request) : undefined;
}

const quotedVersion = (request: Request) => {
  const match = request.headers.get("If-Match")?.match(/^"(\d+)"$/);
  return match ? Number(match[1]) : undefined;
};

export const supportHandlers = [
  http.get("*/api/v1/support/tickets", async ({ request }) => {
    await delay(100);
    const access = requireSession(request);
    return access ?? HttpResponse.json(supportState.mine(authState.current()!.user.id));
  }),
  http.post("*/api/v1/support/tickets", async ({ request }) => {
    await delay(160);
    const access = requireWriteAccess(request);
    if (access) return access;
    const body = (await request.json()) as CreateRequest;
    if (body.subject.trim().length < 5 || body.description.trim().length < 20) {
      return problemResponse({
        status: 422,
        code: "FIELD_VALIDATION_FAILED",
        path: pathOf(request),
      });
    }
    return HttpResponse.json(supportState.create(authState.current()!.user.id, body), {
      status: 201,
    });
  }),
  http.get("*/api/v1/support/tickets/:ticketId", async ({ params, request }) => {
    await delay(90);
    const access = requireSession(request);
    if (access) return access;
    const detail = supportState.detail(String(params.ticketId), authState.current()!.user.id);
    return detail
      ? HttpResponse.json(detail)
      : problemResponse({
          status: 404,
          code: "SUPPORT_TICKET_NOT_FOUND",
          path: pathOf(request),
        });
  }),
  http.post("*/api/v1/support/tickets/:ticketId/messages", async ({ params, request }) => {
    await delay(140);
    const access = requireWriteAccess(request);
    if (access) return access;
    const ticketId = String(params.ticketId);
    if (!supportState.detail(ticketId, authState.current()!.user.id)) {
      return problemResponse({
        status: 404,
        code: "SUPPORT_TICKET_NOT_FOUND",
        path: pathOf(request),
      });
    }
    const body = (await request.json()) as MessageRequest;
    const result = supportState.reply(ticketId, authState.current()!.user.id, body.body, false);
    return result
      ? HttpResponse.json(result, { status: 201 })
      : problemResponse({ status: 409, code: "SUPPORT_TICKET_CLOSED", path: pathOf(request) });
  }),
  http.get("*/api/v1/admin/support-tickets", async ({ request }) => {
    await delay(110);
    const access = requireGovernance(request);
    if (access) return access;
    const status = new URL(request.url).searchParams.get("status") as TicketStatus | null;
    return HttpResponse.json(supportState.queue(status ?? undefined));
  }),
  http.get("*/api/v1/admin/support-tickets/:ticketId", async ({ params, request }) => {
    await delay(90);
    const access = requireGovernance(request);
    if (access) return access;
    const detail = supportState.detail(String(params.ticketId));
    return detail
      ? HttpResponse.json(detail)
      : problemResponse({
          status: 404,
          code: "SUPPORT_TICKET_NOT_FOUND",
          path: pathOf(request),
        });
  }),
  http.put("*/api/v1/admin/support-tickets/:ticketId/governance", async ({ params, request }) => {
    await delay(150);
    const access = requireGovernance(request, true);
    if (access) return access;
    const body = (await request.json()) as GovernanceRequest;
    if (body.reason.trim().length < 10) {
      return problemResponse({ status: 422, code: "ADMIN_REASON_REQUIRED", path: pathOf(request) });
    }
    const result = supportState.govern(
      String(params.ticketId),
      quotedVersion(request) ?? -1,
      body.status,
      body.priority,
    );
    return result
      ? HttpResponse.json(result)
      : problemResponse({ status: 409, code: "VERSION_CONFLICT", path: pathOf(request) });
  }),
  http.post("*/api/v1/admin/support-tickets/:ticketId/messages", async ({ params, request }) => {
    await delay(140);
    const access = requireGovernance(request, true);
    if (access) return access;
    const body = (await request.json()) as MessageRequest;
    const result = supportState.reply(
      String(params.ticketId),
      authState.current()!.user.id,
      body.body,
      true,
    );
    return result
      ? HttpResponse.json(result)
      : problemResponse({ status: 409, code: "SUPPORT_TICKET_CLOSED", path: pathOf(request) });
  }),
];
