"use client"

import type React from "react"
import Image from "next/image"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Upload, Library, Microscope, Home, UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import CursorGlow from "@/components/effects/cursor-glow"
import { AnimatedTabsHover } from "@/components/motion-primitives/animated-tabs-hover"

const items = [
  { title: "Explore", href: "/explore", icon: Home },
  { title: "Upload", href: "/upload", icon: Upload },
  { title: "Library", href: "/library", icon: Library },
  { title: "PubMed", href: "/pubmed", icon: Microscope },
]

function TopNavigation() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/30 dark:border-white/10 bg-gradient-to-b from-white/70 to-white/10 dark:from-slate-900/60 dark:to-slate-900/10 backdrop-blur-md">
      <div className="grid grid-cols-[auto_1fr_auto] h-16 items-center px-4 md:px-6 w-full">
        {/* Left: Brand pinned to the left edge */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/physiohub-logo.png" alt="PaperInsight Logo" width={32} height={32} />
          <span className="text-xl font-bold text-slate-800 dark:text-white">PaperInsight</span>
        </Link>

        {/* Center: Desktop Nav links with animated background */}
        <nav className="hidden md:flex items-center justify-center">
          <AnimatedTabsHover />
        </nav>

        {/* Right: Profile and Mobile Menu */}
        <div className="flex items-center gap-4 justify-self-end">
          <button className="hidden md:block rounded-full">
            <UserIcon className="h-5 w-5 text-slate-700/80 dark:text-slate-200/80" />
          </button>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <div className="flex items-center gap-2 p-4 border-b">
                  <Image src="/physiohub-logo.png" alt="PaperInsight Logo" width={28} height={28} />
                  <span className="text-lg font-bold">PaperInsight</span>
                </div>
                <nav className="flex flex-col gap-1 p-4">
                  {items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        pathname === item.href && "bg-muted text-primary",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar">
      <SidebarHeader>
        <div className="px-2 py-1.5 text-sm font-semibold flex items-center gap-2">
          <Image src="/physiohub-logo.png" alt="PaperInsight Logo" width={20} height={20} />
          <span className="truncate">PaperInsight</span>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground">Ctrl/Cmd + B to toggle</div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Radial Gradient Background from Bottom */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(125% 125% at 50% 90%, hsl(var(--background)) 40%, hsl(var(--primary)) 100%)",
        }}
      />
      {/* Top blend overlay to merge header with background */}
      <div className="absolute inset-x-0 top-0 h-28 z-0 bg-gradient-to-b from-blue-300/20 to-transparent dark:from-blue-500/10 pointer-events-none" />

      {/* Cursor glow that follows the mouse */}
      <CursorGlow />

      {/* App Content */}
      <TopNavigation />
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
