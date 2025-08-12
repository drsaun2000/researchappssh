"use client"

import { Button } from "@/components/ui/button"
import { CardHoverEffect } from "@/components/aceternity-inspired/card-hover-effect"
import { Brain, Search, TrendingUp, SparklesIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { TypewriterEffect } from "@/components/effects/typewriter-effect"
import { TextEffect } from "@/components/motion-primitives/text-effect"
import dynamic from "next/dynamic"
import { LatestListSkeleton } from "@/components/latest-list"
import { AppShell } from "@/components/app-sidebar"

const features = [
  {
    title: "AI-Powered Analysis",
    description:
      "Advanced AI analyzes research papers to extract key findings, limitations, and clinical relevance for physical therapy practice.",
    link: "/upload",
    icon: <Brain className="h-6 w-6" />,
  },
  {
    title: "PubMed Integration",
    description:
      "Seamlessly search and import the latest research from PubMed with automated metadata extraction and categorization.",
    link: "/pubmed",
    icon: <Search className="h-6 w-6" />,
  },
  {
    title: "Smart Comparisons",
    description:
      "Compare multiple studies side-by-side with AI-generated insights highlighting similarities, differences, and clinical implications.",
    link: "/library",
    icon: <TrendingUp className="h-6 w-6" />,
  },
]

const DynamicLatestList = dynamic(() => import("@/components/latest-list"), {
  ssr: false,
  loading: () => <LatestListSkeleton />,
})

export default function Page() {
  return (
    <AppShell>
      <div className="space-y-16">
        {/* Hero Section */}
        <section className="relative text-center py-20">
          <div className="container mx-auto px-4">
            <Badge variant="outline" className="mb-4 border-primary/20 text-primary bg-primary/10">
              <SparklesIcon className="h-4 w-4 mr-2 text-primary" />
              YOUR #1 LEARNING PARTNER
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              <div className="block">
                <TextEffect preset="fade-in-blur" per="word" speedReveal={1.1} speedSegment={0.3} delay={0.2}>
                  Analyse
                </TextEffect>
              </div>
              <div className="block">
                <TypewriterEffect text="Research" />
              </div>
              <div className="block">
                <TextEffect preset="fade-in-blur" per="word" speedReveal={1.1} speedSegment={0.3} delay={1.0}>
                  with Confidence!
                </TextEffect>
              </div>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300">
              <TextEffect as="span" preset="fade" per="word" speedReveal={0.8} speedSegment={0.5} delay={1.2}>
                Maximize your Research Skills.
              </TextEffect>
            </p>
            {/* Centered single CTA */}
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-3 font-bold"
                asChild
              >
                <Link href="/upload" aria-label="Go to Upload and Analyze Papers">
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center">Powerful Research Tools</h2>
          <CardHoverEffect items={features} />
        </section>

        <DynamicLatestList />
      </div>
    </AppShell>
  )
}
