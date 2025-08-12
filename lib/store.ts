"use client"

import { useMemo, useSyncExternalStore } from "react"
import type { Paper, PaperMeta, Analysis } from "./types"
import { v4 as uuidv4 } from "uuid"

type StoreState = {
  papers: Paper[]
}

const KEY = "pt-research-store-v1"

let storeState: StoreState = { papers: [] }
const listeners = new Set<() => void>()

if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      storeState = JSON.parse(raw)
    }
  } catch (e) {
    console.error("Failed to parse library from localStorage", e)
    storeState = { papers: [] }
  }
}

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function write(state: StoreState) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    storeState = state
    emitChange()
  } catch (e) {
    console.error("Failed to write library to localStorage", e)
  }
}

const libraryStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot() {
    return storeState
  },
}

const getServerSnapshot = () => {
  return { papers: [] }
}

export function useLibrary() {
  const state = useSyncExternalStore(libraryStore.subscribe, libraryStore.getSnapshot, getServerSnapshot)

  const actions = useMemo(
    () => ({
      addPaper: (meta: Omit<PaperMeta, "id"> & { text?: string; pages?: number }) => {
        const id = uuidv4()
        const paper: Paper = { ...meta, id, source: meta.source ?? "upload", bookmarked: false }
        const currentPapers = libraryStore.getSnapshot().papers
        // Avoid duplicates by filename for uploads
        if (paper.source === "upload" && paper.filename) {
          const existing = currentPapers.find((p) => p.filename === paper.filename)
          if (existing) {
            console.log(`Paper ${paper.filename} already in library. Skipping add.`)
            return existing.id
          }
        }
        write({ papers: [paper, ...currentPapers] })
        return id
      },
      upsertPaper: (paper: Paper) => {
        const currentPapers = libraryStore.getSnapshot().papers
        const idx = currentPapers.findIndex((p) => p.id === paper.id)
        let newPapers
        if (idx === -1) {
          newPapers = [paper, ...currentPapers]
        } else {
          newPapers = [...currentPapers]
          newPapers[idx] = paper
        }
        write({ papers: newPapers })
      },
      setAnalysis: (paperId: string, analysis: Analysis) => {
        const currentPapers = libraryStore.getSnapshot().papers
        const newPapers = currentPapers.map((p) => (p.id === paperId ? { ...p, analysis } : p))
        write({ papers: newPapers })
      },
      toggleBookmark: (paperId: string) => {
        const currentPapers = libraryStore.getSnapshot().papers
        const newPapers = currentPapers.map((p) => (p.id === paperId ? { ...p, bookmarked: !p.bookmarked } : p))
        write({ papers: newPapers })
      },
      removePaper: (paperId: string) => {
        const currentPapers = libraryStore.getSnapshot().papers
        const newPapers = currentPapers.filter((p) => p.id !== paperId)
        write({ papers: newPapers })
      },
      clear: () => {
        write({ papers: [] })
      },
    }),
    [],
  )

  return { papers: state.papers, ...actions }
}
