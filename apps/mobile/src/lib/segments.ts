export type Segment =
  | { kind: 'text'; t: string }
  | { kind: 'ref'; n: string; key: string };

/**
 * Split Akakū Intelligence prose into text and proof marks.
 * `[[5:02:31]]` is a timestamp in the recording (numbered in order);
 * `[[#2]]` is source number 2.
 */
export function toSegments(str: string): Segment[] {
  const out: Segment[] = [];
  const re = /\[\[(#?)([^\]]+)\]\]/g;
  let i = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(str))) {
    if (m.index > i) out.push({ kind: 'text', t: str.slice(i, m.index) });
    k += 1;
    out.push({ kind: 'ref', n: m[1] ? m[2] : String(k), key: m[2] });
    i = m.index + m[0].length;
  }
  if (i < str.length) out.push({ kind: 'text', t: str.slice(i) });
  return out;
}

/** The prose without proof marks — for read-aloud and sharing. */
export const plainText = (str: string) => str.replace(/\[\[[^\]]+\]\]/g, '').replace(/\s+/g, ' ').trim();
