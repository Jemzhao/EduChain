import { ApiError, type ApiProblem } from "./api-error";

type ApiResult<T> = {
  data?: T;
  error?: unknown;
  response: Response;
};

const isApiProblem = (value: unknown): value is ApiProblem => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ApiProblem>;
  return (
    typeof candidate.code === "string" &&
    typeof candidate.status === "number" &&
    typeof candidate.requestId === "string" &&
    typeof candidate.retryable === "boolean"
  );
};

export function unwrapApiResult<T>({ data, error, response }: ApiResult<T>): T {
  if (data !== undefined) {
    return data;
  }

  if (isApiProblem(error)) {
    throw new ApiError(error);
  }

  throw new Error(`Unexpected API response (${response.status}).`);
}

export function ensureApiSuccess({ error, response }: Omit<ApiResult<never>, "data">): void {
  if (response.ok) {
    return;
  }

  if (isApiProblem(error)) {
    throw new ApiError(error);
  }

  throw new Error(`Unexpected API response (${response.status}).`);
}
