import { searchPubMed } from "../pubmed-integration/client"
import { getSql } from "../lib/db"

async function main() {
  const sql = getSql()
  const q = `"physical therapy"[Title/Abstract] AND (randomized OR cohort OR review)`
  const items = await searchPubMed({ q, max: 20 })
  console.log(`Fetched ${items.length} items from PubMed for query: ${q}`)
  if (!sql) {
    console.log("DATABASE_URL not set. Printing titles:")
    items.forEach((it, i) => console.log(`${i + 1}. ${it.title}`))
    return
  }

  for (const it of items) {
    await sql`
      insert into papers (title, authors, abstract, journal, publication_date, source)
      values (${it.title}, ${it.authors}, ${it.abstract ?? ""}, ${it.journal ?? ""}, ${it.publicationDate ?? null}, 'pubmed')
      on conflict do nothing;
    `
  }
  console.log("Upserted PubMed items into the database.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
