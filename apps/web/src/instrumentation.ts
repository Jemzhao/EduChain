export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PUBLIC_API_MODE === "mock") {
    const { mockServer } = await import("@/mocks/node");
    mockServer.listen({ onUnhandledRequest: "bypass" });
  }
}
