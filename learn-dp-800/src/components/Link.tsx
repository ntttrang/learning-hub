"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { BASE_PATH, route } from "@/lib/asset";

type NextLinkProps = ComponentProps<typeof NextLink>;

function hrefToPath(href: NextLinkProps["href"]): string | null {
  if (typeof href === "string") return href;
  if (!href || typeof href !== "object" || !href.pathname) return null;
  const search =
    typeof href.query === "string"
      ? href.query
      : href.query
        ? new URLSearchParams(
            Object.entries(href.query).flatMap(([key, value]) => {
              if (value == null) return [];
              return Array.isArray(value) ? value.map((item) => [key, String(item)]) : [[key, String(value)]];
            }),
          ).toString()
        : "";
  const query = search ? (search.startsWith("?") ? search : `?${search}`) : "";
  return `${href.pathname}${query}${href.hash ?? ""}`;
}

/**
 * On the GitHub Pages static export, skip Next.js client RSC prefetch (which
 * requests `?_rsc=` / missing `.txt` payloads and 503s) and use a real document
 * link. Local `next dev` keeps the App Router Link.
 */
export function Link({ href, prefetch = false, replace, scroll, ...rest }: NextLinkProps) {
  const path = hrefToPath(href);
  if (BASE_PATH && path) {
    return <a href={route(path)} {...rest} />;
  }
  return <NextLink href={href} prefetch={prefetch} replace={replace} scroll={scroll} {...rest} />;
}
