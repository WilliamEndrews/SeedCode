import { describe, it, expect } from "vitest";
import { parseCodeBlocks } from "./parse-code-blocks";

describe("parseCodeBlocks", () => {
  it("returns empty array for text without code blocks", () => {
    expect(parseCodeBlocks("No code here.")).toEqual([]);
  });

  it("extracts path from info-string", () => {
    const text = `
\`\`\`html path=index.html
<h1>Hello</h1>
\`\`\`
    `.trim();
    const files = parseCodeBlocks(text);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({
      path: "index.html",
      content: "<h1>Hello</h1>",
      lang: "html",
    });
  });

  it("extracts path from first content line as fallback", () => {
    const text = `
\`\`\`html
path=styles.css
body { color: red; }
\`\`\`
    `.trim();
    const files = parseCodeBlocks(text);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({
      path: "styles.css",
      content: "body { color: red; }",
      lang: "html",
    });
  });

  it("uses the filename itself as info-string", () => {
    const text = `
\`\`\`script.js
console.log("ok");
\`\`\`
    `.trim();
    const files = parseCodeBlocks(text);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({
      path: "script.js",
      content: `console.log("ok");`,
    });
  });

  it("deduplicates by path keeping the last occurrence", () => {
    const text = `
\`\`\`path=index.html
first
\`\`\`
\`\`\`path=index.html
second
\`\`\`
    `.trim();
    const files = parseCodeBlocks(text);
    expect(files).toHaveLength(1);
    expect(files[0].content).toBe("second");
  });

  it("normalizes leading ./ from paths", () => {
    const text = `
\`\`\`path=./index.html
ok
\`\`\`
    `.trim();
    const files = parseCodeBlocks(text);
    expect(files[0].path).toBe("index.html");
  });

  it("infers default filename from language-only info-string", () => {
    const text = `
\`\`\`html
<h1>Hello</h1>
\`\`\`

\`\`\`css
body { color: red; }
\`\`\`

\`\`\`javascript
console.log("ok");
\`\`\`
    `.trim();
    const files = parseCodeBlocks(text);
    expect(files).toHaveLength(3);
    expect(files.find((f) => f.path === "index.html")).toBeDefined();
    expect(files.find((f) => f.path === "styles.css")).toBeDefined();
    expect(files.find((f) => f.path === "script.js")).toBeDefined();
  });
});
