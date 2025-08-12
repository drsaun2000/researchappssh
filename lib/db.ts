import { neon } from "@neondatabase/serverless"

let sql: ReturnType<typeof neon> | null = null

export function getSql() {
  if (typeof process === "undefined") return null
  const url = process.env?.DATABASE_URL
  if (!url) return null
  if (sql) return sql
  sql = neon(url)
  return sql
}

export async function ensureSchema() {
  const client = getSql()
  if (!client) return
  await client`
  create table if not exists users(
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    name text,
    created_at timestamptz default now()
  );
  `
}
