export async function extractPdf(file: File): Promise<{
text: string
pages: number
metadata: { title?: string; authors?: string[] }
}> {
// Load the library entry that exposes version and API
const pdfjsLib: any = await import("pdfjs-dist")

// Align worker to the installed API version to avoid "API version X != Worker version Y"
const version: string = pdfjsLib.version || "5.4.54"
const major = parseInt(version.split(".")[0] || "5", 10)
const workerFile =
  major >= 4 ? "build/pdf.worker.min.mjs" : "build/pdf.worker.min.js"

// Use a CDN URL that matches the library version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/${workerFile}`

const arrayBuf = await file.arrayBuffer()
const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise
const meta = await pdf.getMetadata().catch(() => null)

let fullText = ""
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i)
  const content = await page.getTextContent()
  const strings = (content.items as any[]).map((it: any) => it.str)
  fullText += strings.join(" ") + "\n\n"
}

const title =
  meta?.info?.Title ||
  (file.name.endsWith(".pdf") ? file.name.replace(/\.pdf$/i, "") : file.name)
const authorsRaw = (meta?.info?.Author as string | undefined) || ""
const authors =
  authorsRaw && authorsRaw.includes(",")
    ? authorsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : authorsRaw
    ? [authorsRaw.trim()]
    : []

return {
  text: fullText,
  pages: pdf.numPages,
  metadata: { title, authors },
}
}
