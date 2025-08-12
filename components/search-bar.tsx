"use client"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

const PT_TAGS = [
  "Orthopedics",
  "Neurology",
  "Sports Medicine",
  "Pediatrics",
  "Geriatrics",
  "Cardiopulmonary",
]

export default function SearchBar({
  onSearch = () => {},
  initial = "",
}: {
  onSearch?: (q: string, tags: string[]) => void
  initial?: string
}) {
  const [q, setQ] = useState(initial)
  const [tags, setTags] = useState<string[]>([])

  const toggle = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  return (
    <div className="space-y-2">
      <Input
        placeholder="Search title, author, journal, abstract..."
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          onSearch(e.target.value, tags)
        }}
      />
      <div className="flex flex-wrap gap-2">
        {PT_TAGS.map((t) => (
          <Badge
            key={t}
            variant={tags.includes(t) ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => {
              toggle(t)
              onSearch(q, tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])
            }}
          >
            {t}
          </Badge>
        ))}
      </div>
    </div>
  )
}
