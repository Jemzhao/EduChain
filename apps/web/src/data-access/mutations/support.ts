import type { components } from "@educhain/api-contract";

import { apiClient } from "@/data-access/http/client";
import { getCsrfToken } from "@/data-access/http/csrf";
import { unwrapApiResult } from "@/data-access/http/result";

type CreateRequest = components["schemas"]["CreateSupportTicketRequest"];
type GovernanceRequest = components["schemas"]["SupportTicketGovernanceRequest"];

const writeHeaders = async () => ({ "X-XSRF-TOKEN": await getCsrfToken() });

export const createSupportTicket = async (body: CreateRequest) =>
  unwrapApiResult(
    await apiClient.POST("/support/tickets", { body, headers: await writeHeaders() }),
  );

export const addMySupportTicketMessage = async (ticketId: string, body: string) =>
  unwrapApiResult(
    await apiClient.POST("/support/tickets/{ticketId}/messages", {
      body: { body },
      params: { path: { ticketId } },
      headers: await writeHeaders(),
    }),
  );

export const governAdminSupportTicket = async (
  ticketId: string,
  version: number,
  body: GovernanceRequest,
) =>
  unwrapApiResult(
    await apiClient.PUT("/admin/support-tickets/{ticketId}/governance", {
      body,
      params: { path: { ticketId }, header: { "If-Match": `"${version}"` } },
      headers: await writeHeaders(),
    }),
  );

export const addAdminSupportTicketMessage = async (ticketId: string, body: string) =>
  unwrapApiResult(
    await apiClient.POST("/admin/support-tickets/{ticketId}/messages", {
      body: { body },
      params: { path: { ticketId } },
      headers: await writeHeaders(),
    }),
  );
