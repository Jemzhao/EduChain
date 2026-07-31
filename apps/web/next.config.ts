import type { NextConfig } from "next";
import { withIntlayer } from "next-intlayer/server";
import path from "node:path";

const apiMode = process.env.NEXT_PUBLIC_API_MODE ?? "mock";
const serverUrl = process.env.EDUCHAIN_SERVER_URL ?? "http://localhost:8080";
const deploymentEnvironment = process.env.EDUCHAIN_DEPLOYMENT_ENV ?? "local";
const staticExport = process.env.EDUCHAIN_STATIC_EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

if (apiMode !== "mock" && apiMode !== "remote") {
  throw new Error("NEXT_PUBLIC_API_MODE must be either mock or remote.");
}

if (deploymentEnvironment !== "local" && !staticExport && apiMode === "mock") {
  throw new Error("Mock API mode is restricted to the local environment.");
}

if (staticExport && apiMode !== "mock") {
  throw new Error("Static exports require NEXT_PUBLIC_API_MODE=mock.");
}

if (basePath && (!basePath.startsWith("/") || basePath.endsWith("/"))) {
  throw new Error("NEXT_PUBLIC_BASE_PATH must start with '/' and must not end with '/'.");
}

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${deploymentEnvironment === "local" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  deploymentEnvironment === "local"
    ? "connect-src 'self' ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*"
    : "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(deploymentEnvironment === "local" ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  output: staticExport ? "export" : "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  ...(staticExport
    ? {
        basePath,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {
        outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                ...(deploymentEnvironment === "local"
                  ? []
                  : [
                      { key: "Content-Security-Policy", value: contentSecurityPolicy },
                      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
                      {
                        key: "Strict-Transport-Security",
                        value: "max-age=31536000; includeSubDomains",
                      },
                    ]),
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                {
                  key: "Permissions-Policy",
                  value: "camera=(), microphone=(), geolocation=()",
                },
              ],
            },
          ];
        },
        async rewrites() {
          if (apiMode !== "remote") {
            return [];
          }

          return [
            {
              source: "/api/v1/:path*",
              destination: `${serverUrl}/api/v1/:path*`,
            },
          ];
        },
      }),
};

export default withIntlayer(nextConfig);
