import type { components } from "@educhain/api-contract";

type Category = components["schemas"]["CategoryResponse"];
type Tag = components["schemas"]["TagResponse"];

export const mockCategories: Category[] = [
  ["10000000-0000-4000-8000-000000000001", "computer-science", "computerScience"],
  ["10000000-0000-4000-8000-000000000002", "mathematics", "mathematics"],
  ["10000000-0000-4000-8000-000000000003", "education", "education"],
  ["10000000-0000-4000-8000-000000000004", "engineering", "engineering"],
  ["10000000-0000-4000-8000-000000000005", "humanities", "humanities"],
].map(([id, slug, key], order) => ({
  id,
  slug,
  nameKey: `category.${key}.name`,
  descriptionKey: `category.${key}.description`,
  order: (order + 1) * 10,
  children: [],
}));

export const mockTags: Tag[] = [
  ["20000000-0000-4000-8000-000000000001", "blockchain", "Blockchain"],
  ["20000000-0000-4000-8000-000000000002", "java", "Java"],
  ["20000000-0000-4000-8000-000000000003", "web-development", "Web Development"],
  ["20000000-0000-4000-8000-000000000004", "algorithms", "Algorithms"],
  ["20000000-0000-4000-8000-000000000005", "databases", "Databases"],
  ["20000000-0000-4000-8000-000000000006", "research-methods", "Research Methods"],
  ["20000000-0000-4000-8000-000000000007", "learning-design", "Learning Design"],
].map(([id, slug, name]) => ({ id, slug, name }));
