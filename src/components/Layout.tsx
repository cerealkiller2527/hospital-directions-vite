"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, X, Search, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Z_INDEX } from "@/lib/constants"

// ==================== APP HEADER ====================

interface AppHeaderProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

export function AppHeader({ isSidebarOpen, onToggleSidebar }: AppHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-background border-b" style={{ zIndex: Z_INDEX.header }}>
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">{isSidebarOpen ? "Close sidebar" : "Open sidebar"}</span>
          </Button>
          <HospitalLogo />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="text" placeholder="Search..." className="w-[200px] rounded-md pl-8 pr-4" aria-label="Search" />
          </div>
          <Button variant="outline" size="icon" className="rounded-md" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/vibrant-street-market.png" alt="User avatar" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

// Hospital Logo Component
function HospitalLogo({ className }: { className?: string }) {
  return (
    <a href="/" className={cn("flex items-center gap-2 group", className)}>
      <img src="/bwh-logo-icon.svg" alt="BWH Logo" className="h-12 w-auto" />
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-tight text-primary group-hover:text-primary/90 transition-colors">
          Brigham and Women's
        </span>
        <span className="text-base leading-tight text-primary group-hover:text-primary/90 transition-colors">
          Hospital
        </span>
      </div>
    </a>
  )
}

// ==================== SIDEBAR CONTAINER ====================

interface SidebarContainerProps {
  children: ReactNode
  isOpen: boolean
  className?: string
}

export function SidebarContainer({ children, isOpen, className }: SidebarContainerProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined)

  // Calculate available height and update when window resizes
  useEffect(() => {
    const calculateHeights = () => {
      const headerHeight = 64 // 64px header
      const bottomPadding = 16 // 16px padding at bottom
      const availableHeight = window.innerHeight - headerHeight - bottomPadding

      if (contentRef.current) {
        const actualContentHeight = contentRef.current.scrollHeight

        if (actualContentHeight < availableHeight - 32) {
          setContentHeight(undefined) // Use auto height
        } else {
          setContentHeight(availableHeight - 32) // Fixed height with scrolling
        }
      }
    }

    calculateHeights()
    window.addEventListener("resize", calculateHeights)

    // Add mutation observer to detect DOM changes
    const mutationObserver = new MutationObserver(calculateHeights)
    if (contentRef.current) {
      mutationObserver.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
      })
    }

    return () => {
      window.removeEventListener("resize", calculateHeights)
      mutationObserver.disconnect()
    }
  }, [])

  return (
    <div
      className={cn(
        "fixed top-16 left-0 z-30 w-[420px]",
        "transition-all duration-300 ease-in-out",
        !isOpen && "-translate-x-full",
        className,
      )}
      style={{
        maxHeight: `calc(100vh - 64px)`,
        padding: "1rem",
      }}
    >
      <div
        className="w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
        style={{
          padding: "0.5rem",
          height: contentHeight === undefined ? "auto" : "auto",
          maxHeight: contentHeight ? `${contentHeight}px` : "calc(100vh - 64px - 32px)",
        }}
      >
        <div
          ref={contentRef}
          className="w-full overflow-y-auto rounded-lg bg-white scrollbar-thin"
          style={{
            padding: "0.75rem",
            height: contentHeight === undefined ? "auto" : `${contentHeight}px`,
            maxHeight: contentHeight === undefined ? "auto" : `${contentHeight}px`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
