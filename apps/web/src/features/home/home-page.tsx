import { ArrowDown, Check } from "lucide-react";
import { useIntlayer } from "next-intlayer/server";

import { ButtonLink } from "@/components/primitives/button-link";
import { Container } from "@/components/layout/container";
import { ServiceStatusCard } from "@/features/system/components/service-status-card";
import { localizedRoute } from "@/lib/routing/localized-route";

type HomePageProps = {
  locale: string;
};

export function HomePage({ locale }: HomePageProps) {
  const content = useIntlayer("home-page");

  return (
    <main id="page-content">
      <section className="border-b border-border py-20 sm:py-28 lg:py-36">
        <Container>
          <div className="grid items-end gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-20">
            <div className="max-w-4xl">
              <p className="mb-5 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
                {content.eyebrow}
              </p>
              <h1 className="m-0 max-w-4xl text-5xl leading-[1.08] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl">
                {content.title}
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-ink-secondary sm:text-xl">
                {content.description}
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href={localizedRoute(locale, "/discover")}>
                  {content.primaryAction}
                </ButtonLink>
                <ButtonLink href={localizedRoute(locale, "#workflow")} variant="secondary">
                  {content.secondaryAction}
                </ButtonLink>
              </div>
            </div>
            <div className="space-y-4">
              <ServiceStatusCard />
              <a
                className="inline-flex items-center gap-2 rounded-sm px-1 py-2 text-sm font-medium text-ink-secondary no-underline hover:text-ink"
                href="#foundation"
              >
                <ArrowDown aria-hidden="true" className="size-4" />
                {content.foundationLabel}
              </a>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-28" id="foundation">
        <Container>
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
              {content.foundationLabel}
            </p>
            <h2 className="m-0 text-3xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
              {content.foundationTitle}
            </h2>
          </div>
          <div className="mt-14 grid border-y border-border md:grid-cols-3">
            <article className="py-8 md:pr-8">
              <span className="mb-8 flex size-9 items-center justify-center rounded-sm bg-accent-soft text-accent">
                <Check aria-hidden="true" className="size-4" />
              </span>
              <h3 className="m-0 text-xl font-semibold tracking-[-0.02em]">
                {content.publishTitle}
              </h3>
              <p className="mt-3 leading-7 text-ink-secondary">{content.publishDescription}</p>
            </article>
            <article className="border-t border-border py-8 md:border-t-0 md:border-l md:px-8">
              <span className="mb-8 flex size-9 items-center justify-center rounded-sm bg-accent-soft text-accent">
                <Check aria-hidden="true" className="size-4" />
              </span>
              <h3 className="m-0 text-xl font-semibold tracking-[-0.02em]">
                {content.searchTitle}
              </h3>
              <p className="mt-3 leading-7 text-ink-secondary">{content.searchDescription}</p>
            </article>
            <article className="border-t border-border py-8 md:border-t-0 md:border-l md:pl-8">
              <span className="mb-8 flex size-9 items-center justify-center rounded-sm bg-accent-soft text-accent">
                <Check aria-hidden="true" className="size-4" />
              </span>
              <h3 className="m-0 text-xl font-semibold tracking-[-0.02em]">
                {content.evidenceTitle}
              </h3>
              <p className="mt-3 leading-7 text-ink-secondary">{content.evidenceDescription}</p>
            </article>
          </div>
        </Container>
      </section>

      <section className="border-y border-border bg-surface py-20 sm:py-28" id="workflow">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="mb-4 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
                {content.workflowLabel}
              </p>
              <h2 className="m-0 text-3xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
                {content.workflowTitle}
              </h2>
            </div>
            <ol className="m-0 grid list-none gap-0 p-0">
              {[
                content.stepDraft,
                content.stepDigest,
                content.stepEvidence,
                content.stepVerify,
              ].map((step, index) => (
                <li
                  className="grid grid-cols-[3rem_1fr] items-center border-b border-border py-5 first:border-t"
                  key={String(step)}
                >
                  <span className="font-mono text-sm text-ink-tertiary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-lg font-medium">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>
    </main>
  );
}
