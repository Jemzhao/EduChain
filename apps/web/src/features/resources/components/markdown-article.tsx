export function MarkdownArticle({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/).filter((block) => block.trim());

  return (
    <div className="space-y-6 text-[1.0625rem] leading-8 text-ink-secondary">
      {blocks.map((rawBlock, index) => {
        const block = rawBlock.trim();
        if (block.startsWith("### ")) {
          return (
            <h3 className="pt-4 text-xl font-semibold text-ink" key={index}>
              {block.slice(4)}
            </h3>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h2 className="pt-5 text-2xl font-semibold tracking-[-0.02em] text-ink" key={index}>
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith("# ")) {
          return (
            <h2 className="pt-5 text-2xl font-semibold tracking-[-0.02em] text-ink" key={index}>
              {block.slice(2)}
            </h2>
          );
        }
        if (block.startsWith("```")) {
          return (
            <pre
              className="overflow-x-auto rounded-md bg-surface-subtle p-5 font-mono text-sm leading-6 text-ink"
              key={index}
            >
              <code>{block.replace(/^```[^\n]*\n?/, "").replace(/```$/, "")}</code>
            </pre>
          );
        }
        return (
          <p className="m-0 whitespace-pre-line" key={index}>
            {block}
          </p>
        );
      })}
    </div>
  );
}
