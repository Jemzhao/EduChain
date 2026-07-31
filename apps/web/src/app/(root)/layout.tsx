import type { PropsWithChildren } from "react";

import "@/styles/globals.css";

export default function RootRedirectLayout({ children }: PropsWithChildren) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
