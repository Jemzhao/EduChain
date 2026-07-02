import type { components } from "@educhain/api-contract";

export type ApiProblem = components["schemas"]["Problem"];

export class ApiError extends Error {
  readonly problem: ApiProblem;

  constructor(problem: ApiProblem) {
    super(problem.code);
    this.name = "ApiError";
    this.problem = problem;
  }
}
