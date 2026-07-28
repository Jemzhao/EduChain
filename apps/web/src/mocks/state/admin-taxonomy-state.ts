import { mockCategories, mockTags } from "@/mocks/fixtures/taxonomy";
import type { TaxonomyItem, CategoryWrite, TagWrite } from "./admin-state-types";
import { adminData, persistAdminData } from "./admin-store";

export const adminTaxonomyState = {
  taxonomy() {
    const state = adminData();
    return { items: structuredClone(state.taxonomy) };
  },
  setTaxonomyStatus(id: string, status: TaxonomyItem["status"]) {
    const state = adminData();
    const item = state.taxonomy.find((candidate) => candidate.id === id);
    if (
      !item ||
      (status === "DISABLED" && item.referenceCount > 0) ||
      (status === "ACTIVE" && item.mergedIntoId)
    )
      return undefined;
    item.status = status;
    item.version += 1;
    persistAdminData();
    return structuredClone(item);
  },
  writeCategory(body: CategoryWrite, itemId?: string) {
    const state = adminData();
    const duplicate = state.taxonomy.some(
      (item) => item.id !== itemId && item.kind === "CATEGORY" && item.slug === body.slug,
    );
    if (duplicate) return undefined;
    let item = itemId
      ? state.taxonomy.find((candidate) => candidate.id === itemId && candidate.kind === "CATEGORY")
      : undefined;
    if (!item) {
      item = {
        id: crypto.randomUUID(),
        kind: "CATEGORY",
        slug: body.slug,
        label: body.label,
        description: body.description,
        parentId: body.parentId,
        order: body.order,
        status: "ACTIVE",
        mergedIntoId: null,
        version: 0,
        referenceCount: 0,
      };
      state.taxonomy.push(item);
      mockCategories.push({
        id: item.id,
        slug: body.slug,
        nameKey: body.label,
        descriptionKey: body.description,
        order: body.order,
        children: [],
      });
    } else {
      item.slug = body.slug;
      item.label = body.label;
      item.description = body.description;
      item.parentId = body.parentId;
      item.order = body.order;
      item.version += 1;
      const category = mockCategories.find((candidate) => candidate.id === item!.id);
      if (category) {
        category.slug = body.slug;
        category.nameKey = body.label;
        category.descriptionKey = body.description;
        category.order = body.order;
      }
    }
    persistAdminData();
    return structuredClone(item);
  },
  writeTag(body: TagWrite, itemId?: string) {
    const state = adminData();
    const duplicate = state.taxonomy.some(
      (item) => item.id !== itemId && item.kind === "TAG" && item.slug === body.slug,
    );
    if (duplicate) return undefined;
    let item = itemId
      ? state.taxonomy.find((candidate) => candidate.id === itemId && candidate.kind === "TAG")
      : undefined;
    if (!item) {
      item = {
        id: crypto.randomUUID(),
        kind: "TAG",
        slug: body.slug,
        label: body.label,
        description: body.description,
        parentId: null,
        order: null,
        status: "ACTIVE",
        mergedIntoId: null,
        version: 0,
        referenceCount: 0,
      };
      state.taxonomy.push(item);
      mockTags.push({ id: item.id, slug: body.slug, name: body.label });
    } else {
      item.slug = body.slug;
      item.label = body.label;
      item.description = body.description;
      item.version += 1;
      const tag = mockTags.find((candidate) => candidate.id === item!.id);
      if (tag) {
        tag.slug = body.slug;
        tag.name = body.label;
      }
    }
    persistAdminData();
    return structuredClone(item);
  },
  mergeTaxonomy(itemId: string, targetId: string) {
    const state = adminData();
    const item = state.taxonomy.find((candidate) => candidate.id === itemId);
    const target = state.taxonomy.find(
      (candidate) =>
        candidate.id === targetId && candidate.kind === item?.kind && candidate.status === "ACTIVE",
    );
    if (!item || !target || item.id === target.id) return undefined;
    item.status = "DISABLED";
    item.mergedIntoId = target.id;
    item.version += 1;
    persistAdminData();
    return structuredClone(item);
  },
  deleteTaxonomy(itemId: string, version: number) {
    const state = adminData();
    const index = state.taxonomy.findIndex((item) => item.id === itemId);
    const item = state.taxonomy[index];
    if (
      !item ||
      item.version !== version ||
      item.status !== "DISABLED" ||
      item.referenceCount > 0
    ) {
      return false;
    }
    state.taxonomy.splice(index, 1);
    if (item.kind === "CATEGORY") {
      const fixtureIndex = mockCategories.findIndex((candidate) => candidate.id === item.id);
      if (fixtureIndex >= 0) mockCategories.splice(fixtureIndex, 1);
    } else {
      const fixtureIndex = mockTags.findIndex((candidate) => candidate.id === item.id);
      if (fixtureIndex >= 0) mockTags.splice(fixtureIndex, 1);
    }
    persistAdminData();
    return true;
  },
};
