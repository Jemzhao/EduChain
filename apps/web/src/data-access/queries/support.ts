import type { components } from "@educhain/api-contract";

import { apiClient } from "@/data-access/http/client";
import { unwrapApiResult } from "@/data-access/http/result";

type TicketStatus = components["schemas"]["SupportTicketStatus"];

export const getMySupportTickets = async () =>
  unwrapApiResult(await apiClient.GET("/support/tickets", { params: { query: { limit: 50 } } }));

export const getMySupportTicket = async (ticketId: string) =>
  unwrapApiResult(
    await apiClient.GET("/support/tickets/{ticketId}", { params: { path: { ticketId } } }),
  );

export const getAdminSupportTickets = async (status?: TicketStatus) =>
  unwrapApiResult(
    await apiClient.GET("/admin/support-tickets", {
      params: { query: { status, limit: 50 } },
    }),
  );

export const getAdminSupportTicket = async (ticketId: string) =>
  unwrapApiResult(
    await apiClient.GET("/admin/support-tickets/{ticketId}", {
      params: { path: { ticketId } },
    }),
  );
