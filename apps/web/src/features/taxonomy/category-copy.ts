import type { ReactNode } from "react";

type TaxonomyContent = {
  computerScienceName: ReactNode;
  computerScienceDescription: ReactNode;
  mathematicsName: ReactNode;
  mathematicsDescription: ReactNode;
  educationName: ReactNode;
  educationDescription: ReactNode;
  engineeringName: ReactNode;
  engineeringDescription: ReactNode;
  humanitiesName: ReactNode;
  humanitiesDescription: ReactNode;
};

export function categoryName(content: TaxonomyContent, slug: string, fallback?: string) {
  switch (slug) {
    case "computer-science":
      return content.computerScienceName;
    case "mathematics":
      return content.mathematicsName;
    case "education":
      return content.educationName;
    case "engineering":
      return content.engineeringName;
    case "humanities":
      return content.humanitiesName;
    default:
      return fallback || slug;
  }
}

export function categoryDescription(content: TaxonomyContent, slug: string, fallback?: string) {
  switch (slug) {
    case "computer-science":
      return content.computerScienceDescription;
    case "mathematics":
      return content.mathematicsDescription;
    case "education":
      return content.educationDescription;
    case "engineering":
      return content.engineeringDescription;
    case "humanities":
      return content.humanitiesDescription;
    default:
      return fallback || slug;
  }
}
