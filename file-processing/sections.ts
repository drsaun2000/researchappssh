export type Sections = {
  abstract?: string
  introduction?: string
  methods?: string
  results?: string
  discussion?: string
  conclusion?: string
  limitations?: string
  other?: string
}

function norm(s: string) {
  return s.replace(/\r\n/g, "\n")
}

const headings = [
  "abstract",
  "introduction",
  "background",
  "methods",
  "materials and methods",
  "participants",
  "results",
  "discussion",
  "conclusion",
  "conclusions",
  "limitations",
  "acknowledgements",
]

export function parseSections(text: string): Sections {
  const t = norm(text)
  // Create a map of index positions for headings using regex on line starts
  const idxs: { name: string; i: number }[] = []
  const re = new RegExp(
    `^\\s*(${headings.map(h => h.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|")})\\s*:?(\\s|$)`,
    "gim"
  )
  let m: RegExpExecArray | null
  while ((m = re.exec(t))) {
    idxs.push({ name: m[1].toLowerCase(), i: m.index })
  }
  idxs.sort((a, b) => a.i - b.i)

  const out: Sections = {}
  if (!idxs.length) {
    // fallback heuristics
    out.abstract = t.slice(0, 1200)
    out.other = t
    return out
  }

  for (let k = 0; k < idxs.length; k++) {
    const cur = idxs[k]
    const next = idxs[k + 1]
    const seg = t.slice(cur.i, next ? next.i : undefined).trim()
    const name = cur.name
    if (name.includes("materials and methods") || name.includes("participants")) {
      out.methods = [out.methods, seg].filter(Boolean).join("\n\n")
    } else if (name.includes("introduction") || name.includes("background")) {
      out.introduction = [out.introduction, seg].filter(Boolean).join("\n\n")
    } else if (name.includes("conclusions") || name === "conclusion") {
      out.conclusion = [out.conclusion, seg].filter(Boolean).join("\n\n")
    } else {
      ;(out as any)[name] = [ (out as any)[name], seg ].filter(Boolean).join("\n\n")
    }
  }

  return out
}

export function chunksFrom(text: string, max = 12000): string[] {
  const normalized = norm(text)
  if (normalized.length <= max) return [normalized]
  const chunks: string[] = []
  let i = 0
  while (i < normalized.length) {
    // try breaking on paragraph boundary
    let end = Math.min(i + max, normalized.length)
    const lastBreak = normalized.lastIndexOf("\n\n", end)
    if (lastBreak > i + max * 0.6) end = lastBreak
    chunks.push(normalized.slice(i, end))
    i = end
  }
  return chunks
}
