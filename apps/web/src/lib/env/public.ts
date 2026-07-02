import { z } from "zod";

const publicEnvironmentSchema = z.object({
  apiMode: z.enum(["mock", "remote"]),
  apiBaseUrl: z.string().startsWith("/"),
});

export const publicEnvironment = publicEnvironmentSchema.parse({
  apiMode: process.env.NEXT_PUBLIC_API_MODE ?? "mock",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1",
});

export type ApiMode = (typeof publicEnvironment)["apiMode"];
