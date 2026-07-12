import { describe, it, expect } from "vitest";
import { buildSandboxHtml } from "./html-sandbox";
import type { ProjectFile } from "@/lib/types";

function makeFile(path: string, content: string): ProjectFile {
  return {
    id: "1",
    projectId: "p1",
    path,
    content,
    updatedAt: new Date().toISOString(),
  };
}

describe("buildSandboxHtml", () => {
  it("returns null when there are no files", () => {
    expect(buildSandboxHtml([])).toBeNull();
  });

  it("returns null when there is no index.html", () => {
    const files = [makeFile("styles.css", "body {}")];
    expect(buildSandboxHtml(files)).toBeNull();
  });

  it("inlines CSS referenced by link href", () => {
    const html = `<!DOCTYPE html><html><head><link rel="stylesheet" href="styles.css"></head><body></body></html>`;
    const css = "body { color: red; }";
    const files = [makeFile("index.html", html), makeFile("styles.css", css)];
    const result = buildSandboxHtml(files);
    expect(result).toContain("<style>");
    expect(result).toContain(css);
    expect(result).not.toContain('href="styles.css"');
  });

  it("inlines JS referenced by script src", () => {
    const html = `<!DOCTYPE html><html><body><script src="script.js"></script></body></html>`;
    const js = "console.log('ok');";
    const files = [makeFile("index.html", html), makeFile("script.js", js)];
    const result = buildSandboxHtml(files);
    expect(result).toContain("<script>");
    expect(result).toContain(js);
    expect(result).not.toContain('src="script.js"');
  });

  it("falls back to styles.css when no link is present", () => {
    const html = `<!DOCTYPE html><html><head></head><body></body></html>`;
    const files = [makeFile("index.html", html), makeFile("styles.css", "body {}")];
    const result = buildSandboxHtml(files);
    expect(result).toContain("<style>");
  });

  it("falls back to script.js when no script src is present", () => {
    const html = `<!DOCTYPE html><html><body></body></html>`;
    const files = [makeFile("index.html", html), makeFile("script.js", "console.log(1);")];
    const result = buildSandboxHtml(files);
    expect(result).toContain("<script>");
    expect(result).toContain("console.log(1);");
  });
});
