import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { applyDocumentSeo } from "@/seo/document";
import { defaultDescription } from "@/seo/pages";

export type PageSeoOptions = {
  description?: string;
  image?: string | null;
  canonicalPath?: string;
  type?: "website" | "article" | "product";
  robots?: string;
};

export function usePageTitle(title: string, descriptionOrOptions?: string | PageSeoOptions): void {
  const { pathname } = useLocation();
  const options = typeof descriptionOrOptions === "object" && descriptionOrOptions ? descriptionOrOptions : undefined;
  const description = typeof descriptionOrOptions === "string" ? descriptionOrOptions : (options?.description ?? defaultDescription(pathname));

  useEffect(() => {
    applyDocumentSeo({
      title,
      description,
      pathname,
      image: options?.image,
      canonicalPath: options?.canonicalPath,
      type: options?.type,
      robots: options?.robots,
    });
  }, [title, description, pathname, options?.image, options?.canonicalPath, options?.type, options?.robots]);
}
