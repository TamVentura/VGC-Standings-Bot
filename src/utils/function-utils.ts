export function lastChildOf<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[arr.length - 1];
}

export function cleanPlayerName(name: string): string {
  const trimmed = name.length > 4 ? name.slice(0, -4) : name;
  return toProperCase(trimmed);
}

function toProperCase(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function chunkByCharLimit(lines: string[], limit = 1000): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length > limit) {
      if (current) chunks.push(current);
      current = line;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
