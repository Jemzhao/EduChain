import type { components } from "@educhain/api-contract";
import { HttpResponse } from "msw";

type ApiProblem = components["schemas"]["Problem"];
type FieldError = components["schemas"]["FieldError"];

type ProblemOptions = {
  status: number;
  code: string;
  path: string;
  fieldErrors?: FieldError[];
  parameters?: Record<string, string>;
  retryable?: boolean;
};

export function problemResponse({
  status,
  code,
  path,
  fieldErrors,
  parameters,
  retryable = false,
}: ProblemOptions) {
  const problem: ApiProblem = {
    type: `/problems/${code.toLowerCase().replaceAll("_", "-")}`,
    title: code,
    status,
    code,
    instance: path,
    requestId: crypto.randomUUID(),
    retryable,
    ...(fieldErrors ? { fieldErrors } : {}),
    ...(parameters ? { parameters } : {}),
  };

  return HttpResponse.json(problem, {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
}
