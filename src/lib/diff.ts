import { diffLines } from "diff";

export type DiffPart = {
  type: "equal" | "insert" | "delete";
  value: string;
  lineNumber: number;
};

export function computeLineDiff(before: string, after: string): DiffPart[] {
  const changes = diffLines(before, after);
  const parts: DiffPart[] = [];
  let lineNumber = 1;

  for (const change of changes) {
    if (change.added) {
      parts.push({ type: "insert", value: change.value, lineNumber });
      lineNumber += countLines(change.value);
    } else if (change.removed) {
      parts.push({ type: "delete", value: change.value, lineNumber });
      lineNumber += countLines(change.value);
    } else {
      parts.push({ type: "equal", value: change.value, lineNumber });
      lineNumber += countLines(change.value);
    }
  }

  return parts;
}

function countLines(text: string): number {
  if (text === "") return 0;
  let n = 1;
  for (const ch of text) {
    if (ch === "\n") n++;
  }
  return n;
}
