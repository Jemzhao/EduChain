"use client";

import type { components } from "@educhain/api-contract";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useIntlayer } from "next-intlayer";
import { useEffect, useRef, useState } from "react";

import { ApiError } from "@/data-access/http/api-error";
import {
  publishResource,
  restoreResourceVersion,
  updateResourceDraft,
  uploadResourceAttachment,
  uploadResourceCover,
} from "@/data-access/mutations/resources";
import { listResourceVersions } from "@/data-access/queries/resources";
import { getCategories, getTags } from "@/data-access/queries/taxonomy";
import { resourceRoute } from "@/lib/routing/localized-route";

export type DraftResponse = components["schemas"]["ResourceDraftResponse"];
type DraftBody = components["schemas"]["UpdateResourceDraftRequest"];
type SaveStatus = "saved" | "unsaved" | "saving" | "error" | "conflict";

export function useResourceEditor({
  initial,
  locale,
  resourceId,
}: {
  initial: DraftResponse;
  locale: string;
  resourceId: string;
}) {
  const content = useIntlayer("studio");
  const taxonomy = useIntlayer("taxonomy");
  const router = useRouter();
  const initialBody: DraftBody = {
    title: initial.title,
    summary: initial.summary,
    body: initial.body,
    sourceUrl: initial.sourceUrl,
    categoryId: initial.categoryId,
    tagIds: initial.tagIds,
    coverFileId: initial.coverFileId,
    attachments: initial.attachments,
    copyrightStatement: initial.copyrightStatement,
  };
  const [editor, setEditor] = useState(initialBody);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [coverName, setCoverName] = useState(initial.coverFileId ?? "");
  const editorRef = useRef(editor);
  const versionRef = useRef(initial.draftVersion);
  const lastSavedRef = useRef(serialize(initialBody));
  const categories = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const tags = useQuery({ queryKey: ["tags", "studio"], queryFn: () => getTags("", 50) });
  const versions = useQuery({
    queryKey: ["resource-versions", resourceId],
    queryFn: () => listResourceVersions(resourceId),
    enabled: initial.status === "PUBLISHED",
    retry: false,
  });

  const saveDraft = useMutation({
    mutationFn: (snapshot: DraftBody) =>
      updateResourceDraft(resourceId, snapshot, versionRef.current),
    onMutate: () => setSaveStatus("saving"),
    onSuccess: (saved, snapshot) => {
      versionRef.current = saved.draftVersion;
      lastSavedRef.current = serialize(snapshot);
      setSaveStatus(serialize(editorRef.current) === lastSavedRef.current ? "saved" : "unsaved");
    },
    onError: (error) => {
      setSaveStatus(
        error instanceof ApiError && error.problem.code === "VERSION_CONFLICT"
          ? "conflict"
          : "error",
      );
    },
  });

  useEffect(() => {
    if (saveStatus !== "unsaved" || saveDraft.isPending) return;
    const timer = window.setTimeout(
      () => saveDraft.mutate(structuredClone(editorRef.current)),
      900,
    );
    return () => window.clearTimeout(timer);
  }, [saveDraft, saveStatus]);

  const updateEditor = (update: Partial<DraftBody>) => {
    setEditor((current) => {
      const next = { ...current, ...update };
      editorRef.current = next;
      return next;
    });
    setSaveStatus("unsaved");
  };

  const uploadFile = useMutation({
    mutationFn: async ({ file, kind }: { file: File; kind: "cover" | "attachment" }) => ({
      file,
      kind,
      uploaded:
        kind === "cover" ? await uploadResourceCover(file) : await uploadResourceAttachment(file),
    }),
    onSuccess: ({ file, kind, uploaded }) => {
      if (kind === "cover") {
        setCoverName(file.name);
        updateEditor({ coverFileId: uploaded.id });
        return;
      }
      updateEditor({
        attachments: [
          ...editorRef.current.attachments,
          {
            fileId: uploaded.id,
            displayName: file.name,
            purpose: "ATTACHMENT",
            order: editorRef.current.attachments.length,
          },
        ],
      });
    },
  });

  const publication = useMutation({
    mutationFn: () => publishResource(resourceId, versionRef.current),
    onSuccess: (result) => {
      router.push(resourceRoute(locale, result.resource.slug));
    },
  });

  const restoration = useMutation({
    mutationFn: (versionId: string) =>
      restoreResourceVersion(resourceId, { versionId }, versionRef.current),
    onSuccess: (restored) => {
      const restoredBody: DraftBody = {
        title: restored.title,
        summary: restored.summary,
        body: restored.body,
        sourceUrl: restored.sourceUrl,
        categoryId: restored.categoryId,
        tagIds: restored.tagIds,
        coverFileId: restored.coverFileId,
        attachments: restored.attachments,
        copyrightStatement: restored.copyrightStatement,
      };
      setEditor(restoredBody);
      editorRef.current = restoredBody;
      versionRef.current = restored.draftVersion;
      lastSavedRef.current = serialize(restoredBody);
      setCoverName(restored.coverFileId ?? "");
      setSaveStatus("saved");
    },
  });

  const selectedTags = new Set(editor.tagIds);
  const textFirst = initial.resourceType === "ARTICLE" || initial.resourceType === "DOCUMENT";
  const requirements = [
    { met: editor.title.trim().length >= 3, label: content.checkTitle },
    { met: editor.summary.trim().length >= 20, label: content.checkSummary },
    ...(textFirst ? [{ met: editor.body.trim().length >= 100, label: content.checkBody }] : []),
    ...(!textFirst
      ? [
          {
            met: /^https:\/\/.+/.test(editor.sourceUrl.trim()),
            label: content.checkSourceUrl,
          },
        ]
      : []),
    { met: Boolean(editor.categoryId), label: content.checkCategory },
    { met: Boolean(editor.copyrightStatement.trim()), label: content.checkCopyright },
  ];
  const publishable = requirements.every((item) => item.met) && saveStatus === "saved";

  const toggleTag = (tagId: string) => {
    const next = selectedTags.has(tagId)
      ? editor.tagIds.filter((id) => id !== tagId)
      : editor.tagIds.length < 8
        ? [...editor.tagIds, tagId]
        : editor.tagIds;
    updateEditor({ tagIds: next });
  };

  const removeAttachment = (fileId: string) => {
    updateEditor({
      attachments: editor.attachments
        .filter((file) => file.fileId !== fileId)
        .map((file, order) => ({ ...file, order })),
    });
  };

  const statusCopy = {
    saved: content.statusSaved,
    unsaved: content.statusUnsaved,
    saving: content.statusSaving,
    error: content.statusError,
    conflict: content.statusConflict,
  }[saveStatus];
  const saveNow = () => saveDraft.mutate(structuredClone(editorRef.current));

  return {
    categories,
    content,
    coverName,
    editor,
    publication,
    publishable,
    removeAttachment,
    requirements,
    restoration,
    saveDraft,
    saveNow,
    saveStatus,
    selectedTags,
    statusCopy,
    tags,
    taxonomy,
    textFirst,
    toggleTag,
    updateEditor,
    uploadFile,
    versions,
  };
}

function serialize(value: DraftBody) {
  return JSON.stringify(value);
}
