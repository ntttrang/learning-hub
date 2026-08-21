import { describe, expect, it } from "vitest";
import { resolveRoute } from "./asset";

describe("resolveRoute", () => {
  it("prefixes the GitHub Pages base path and adds a trailing slash", () => {
    expect(resolveRoute("/learn/permissions-and-passwordless", "/learn-dp-800")).toBe(
      "/learn-dp-800/learn/permissions-and-passwordless/",
    );
  });

  it("keeps the site root as a trailing-slash folder URL", () => {
    expect(resolveRoute("/", "/learn-dp-800")).toBe("/learn-dp-800/");
  });

  it("preserves query strings and hashes after the trailing slash", () => {
    expect(resolveRoute("/learn/tables-data-types-indexes?x=1#top", "/learn-dp-800")).toBe(
      "/learn-dp-800/learn/tables-data-types-indexes/?x=1#top",
    );
  });

  it("leaves absolute and hash-only URLs unchanged", () => {
    expect(resolveRoute("https://learn.microsoft.com/dp-800", "/learn-dp-800")).toBe(
      "https://learn.microsoft.com/dp-800",
    );
    expect(resolveRoute("#notes", "/learn-dp-800")).toBe("#notes");
  });

  it("still trailing-slashes routes when there is no base path", () => {
    expect(resolveRoute("/learn", "")).toBe("/learn/");
  });
});
