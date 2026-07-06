"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, ShieldCheck, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/primitives/button";
import { ApiError } from "@/data-access/http/api-error";
import { deleteCurrentSession } from "@/data-access/mutations/auth";
import { uploadAvatar } from "@/data-access/mutations/resources";
import { getCurrentUser, updateCurrentUser } from "@/data-access/queries/user";
import { localizedRoute } from "@/lib/routing/localized-route";

type ProfileValues = {
  displayName: string;
  bio: string;
  education: string;
  location: string;
  websiteUrl: string;
  contactEmail: string;
};

const schema = z.object({
  displayName: z.string().trim().min(1).max(80),
  bio: z.string().max(500),
  education: z.string().max(160),
  location: z.string().max(120),
  websiteUrl: z
    .string()
    .refine((value) => !value || /^https:\/\/.+/.test(value), "invalid website"),
  contactEmail: z
    .string()
    .refine((value) => !value || z.string().email().safeParse(value).success, "invalid email"),
});

function avatarFileIdFromUrl(url: string | null | undefined): string | null {
  return url?.match(/\/files\/([^/]+)\/content(?:\?|$)/)?.[1] ?? null;
}

export function ProfileSettings({ locale }: { locale: string }) {
  const content = useIntlayer("profile-page");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [avatarSelection, setAvatarSelection] = useState<
    { fileId: string; preview: string } | null | undefined
  >();
  const [avatarError, setAvatarError] = useState(false);
  const profileQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<ProfileValues>({
    defaultValues: {
      displayName: "",
      bio: "",
      education: "",
      location: "",
      websiteUrl: "",
      contactEmail: "",
    },
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    reset({
      displayName: profileQuery.data.user.displayName,
      bio: profileQuery.data.profile.bio,
      education: profileQuery.data.profile.education,
      location: profileQuery.data.profile.location,
      websiteUrl: profileQuery.data.profile.websiteUrl,
      contactEmail: profileQuery.data.profile.contactEmail,
    });
  }, [profileQuery.data, reset]);

  const avatarFileId =
    avatarSelection === undefined
      ? avatarFileIdFromUrl(profileQuery.data?.user.avatarUrl)
      : (avatarSelection?.fileId ?? null);
  const avatarPreview =
    avatarSelection === undefined
      ? (profileQuery.data?.user.avatarUrl ?? null)
      : (avatarSelection?.preview ?? null);

  const signOut = useMutation({
    mutationFn: deleteCurrentSession,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["current-user"] });
      router.push(localizedRoute(locale, "/sign-in"));
    },
  });
  const avatarUpload = useMutation({
    mutationFn: uploadAvatar,
    onMutate: () => setAvatarError(false),
    onSuccess: (file) => {
      setAvatarSelection({ fileId: file.id, preview: `/api/v1/files/${file.id}/content` });
    },
    onError: () => setAvatarError(true),
  });

  const submit = handleSubmit(async (values) => {
    clearErrors();
    setSaved(false);
    const result = schema.safeParse(values);
    if (!result.success) {
      const messages: Record<keyof ProfileValues, unknown> = {
        displayName: content.validationDisplayName,
        bio: content.validationBio,
        education: content.validationEducation,
        location: content.validationLocation,
        websiteUrl: content.validationWebsite,
        contactEmail: content.validationContactEmail,
      };
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ProfileValues;
        setError(field, { type: "validate", message: String(messages[field]) });
      }
      return;
    }
    if (!profileQuery.data) return;

    try {
      const updated = await updateCurrentUser(
        {
          displayName: result.data.displayName.trim(),
          bio: result.data.bio.trim(),
          education: result.data.education.trim(),
          avatarFileId,
          location: result.data.location.trim(),
          websiteUrl: result.data.websiteUrl.trim(),
          contactEmail: result.data.contactEmail.trim(),
        },
        profileQuery.data.user.version,
      );
      queryClient.setQueryData(["current-user"], updated);
      setAvatarSelection(undefined);
      setSaved(true);
    } catch (error) {
      setError("root", {
        type: "server",
        message:
          error instanceof ApiError && error.problem.code === "VERSION_CONFLICT"
            ? String(content.versionConflict)
            : String(content.saveError),
      });
    }
  });

  if (profileQuery.isPending) {
    return (
      <p className="py-20 text-center text-ink-secondary" aria-live="polite">
        {content.loading}
      </p>
    );
  }

  const unauthenticated =
    profileQuery.error instanceof ApiError &&
    ["AUTHENTICATION_REQUIRED", "SESSION_EXPIRED"].includes(profileQuery.error.problem.code);
  if (unauthenticated) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <h1 className="m-0 text-3xl font-semibold tracking-[-0.03em]">
          {content.authenticationRequiredTitle}
        </h1>
        <p className="mt-4 text-ink-secondary">{content.authenticationRequiredDescription}</p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-sm bg-accent px-5 text-sm font-semibold text-white no-underline"
          href={localizedRoute(locale, "/sign-in")}
        >
          {content.signInAction}
        </Link>
      </div>
    );
  }

  if (!profileQuery.data) {
    return (
      <p className="py-20 text-center text-danger" role="alert">
        {content.loadError}
      </p>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
      <aside>
        <p className="m-0 text-sm font-semibold tracking-[0.1em] text-accent uppercase">
          {content.settingsEyebrow}
        </p>
        <h1 className="mt-4 mb-0 text-3xl font-semibold tracking-[-0.035em]">
          {content.settingsTitle}
        </h1>
        <p className="mt-4 leading-7 text-ink-secondary">{content.settingsDescription}</p>
        <nav aria-label={String(content.settingsEyebrow)} className="mt-8 space-y-2">
          <Link
            aria-current="page"
            className="flex min-h-11 items-center gap-3 rounded-sm bg-accent-soft px-3 text-sm font-semibold text-accent no-underline"
            href={localizedRoute(locale, "/settings/profile")}
          >
            <UserRound aria-hidden="true" className="size-4" />
            {content.profileLink}
          </Link>
          <Link
            className="flex min-h-11 items-center gap-3 rounded-sm px-3 text-sm font-semibold text-ink-secondary no-underline hover:bg-surface-subtle hover:text-ink"
            href={localizedRoute(locale, "/settings/security")}
          >
            <ShieldCheck aria-hidden="true" className="size-4" />
            {content.securityLink}
          </Link>
        </nav>
      </aside>
      <div className="space-y-6">
        <section className="rounded-md border border-border bg-surface p-6 sm:p-8">
          <h2 className="m-0 text-xl font-semibold tracking-[-0.02em]">{content.identityTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">{content.identityDescription}</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-sm bg-surface-subtle p-4">
              <dt className="text-xs font-semibold tracking-[0.08em] text-ink-tertiary uppercase">
                {content.emailLabel}
              </dt>
              <dd className="mt-1 mb-0 break-all text-sm font-medium">{profileQuery.data.email}</dd>
            </div>
            <div className="rounded-sm bg-surface-subtle p-4">
              <dt className="text-xs font-semibold tracking-[0.08em] text-ink-tertiary uppercase">
                {content.handleLabel}
              </dt>
              <dd className="mt-1 mb-0 text-sm font-medium">@{profileQuery.data.user.handle}</dd>
            </div>
          </dl>
        </section>

        <form
          className="rounded-md border border-border bg-surface p-6 sm:p-8"
          noValidate
          onSubmit={submit}
        >
          <section className="mb-8 border-b border-border pb-8">
            <h2 className="m-0 text-xl font-semibold tracking-[-0.02em]">{content.avatarTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-secondary">{content.avatarDescription}</p>
            <div className="mt-5 flex flex-wrap items-center gap-5">
              <div className="flex size-24 items-center justify-center overflow-hidden rounded-[var(--ed-radius-pill)] bg-accent-soft text-accent">
                {avatarPreview ? (
                  <Image
                    alt=""
                    className="size-full object-cover"
                    height={96}
                    src={avatarPreview}
                    unoptimized
                    width={96}
                  />
                ) : (
                  <UserRound aria-hidden="true" className="size-10" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-sm bg-ink px-4 text-sm font-semibold text-surface hover:opacity-90">
                    <ImagePlus aria-hidden="true" className="size-4" />
                    {avatarUpload.isPending ? content.avatarUploading : content.avatarAction}
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={avatarUpload.isPending}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) avatarUpload.mutate(file);
                        event.currentTarget.value = "";
                      }}
                      type="file"
                    />
                  </label>
                  {avatarPreview ? (
                    <Button
                      onClick={() => {
                        setAvatarSelection(null);
                      }}
                      type="button"
                      variant="quiet"
                    >
                      {content.avatarRemove}
                    </Button>
                  ) : null}
                </div>
                {avatarError ? (
                  <p className="mt-2 text-sm text-danger" role="alert">
                    {content.avatarError}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField
                error={errors.displayName?.message}
                id="profile-display-name"
                inputProps={{ ...register("displayName"), autoComplete: "name", maxLength: 80 }}
                label={String(content.displayNameLabel)}
              />
            </div>
            <div className="sm:col-span-2">
              <FormField
                description={String(content.bioDescription)}
                error={errors.bio?.message}
                id="profile-bio"
                inputProps={{ ...register("bio"), maxLength: 500 }}
                label={String(content.bioLabel)}
                multiline
              />
            </div>
            <FormField
              description={String(content.educationDescription)}
              error={errors.education?.message}
              id="profile-education"
              inputProps={{ ...register("education"), maxLength: 160 }}
              label={String(content.educationLabel)}
            />
            <FormField
              description={String(content.locationDescription)}
              error={errors.location?.message}
              id="profile-location"
              inputProps={{ ...register("location"), maxLength: 120 }}
              label={String(content.locationLabel)}
            />
            <FormField
              description={String(content.websiteDescription)}
              error={errors.websiteUrl?.message}
              id="profile-website"
              inputProps={{ ...register("websiteUrl"), inputMode: "url", type: "url" }}
              label={String(content.websiteLabel)}
            />
            <FormField
              description={String(content.contactEmailDescription)}
              error={errors.contactEmail?.message}
              id="profile-contact-email"
              inputProps={{ ...register("contactEmail"), inputMode: "email", type: "email" }}
              label={String(content.contactEmailLabel)}
            />
          </div>
          {errors.root?.message ? (
            <p
              className="mt-5 rounded-sm bg-danger-soft px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {errors.root.message}
            </p>
          ) : null}
          {saved ? (
            <p
              className="mt-5 rounded-sm bg-success-soft px-4 py-3 text-sm font-medium text-success"
              role="status"
            >
              {content.savedMessage}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <Button
              disabled={signOut.isPending}
              onClick={() => signOut.mutate()}
              type="button"
              variant="quiet"
            >
              {signOut.isPending ? content.signingOutAction : content.signOutAction}
            </Button>
            <Button disabled={isSubmitting || avatarUpload.isPending} type="submit">
              {isSubmitting ? content.savingAction : content.saveAction}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
