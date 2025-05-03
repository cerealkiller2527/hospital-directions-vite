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
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function AppHeader({ isSidebarOpen, onToggleSidebar, searchQuery, setSearchQuery }: AppHeaderProps) {
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
            <Input 
              type="text" 
              placeholder="Search..." 
              className="w-[200px] rounded-md pl-8 pr-4" 
              aria-label="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Effect to dynamically adjust inner container height
  useEffect(() => {
    if (!isOpen) {
      if (innerRef.current) {
        innerRef.current.style.height = 'auto'
      }
      return;
    }

    const updateHeight = () => {
      if (!innerRef.current || !contentRef.current) return;
      const windowHeight = window.innerHeight;
      const headerHeight = 64; // fixed header
      const outerPadding = 32; // 1rem top + bottom
      const maxHeight = windowHeight - headerHeight - outerPadding;
      const contentHeight = contentRef.current.scrollHeight + 24; // include inner padding 0.75*2
      if (contentHeight > maxHeight) {
        innerRef.current.style.height = `${maxHeight}px`;
      } else {
        innerRef.current.style.height = 'auto';
      }
    };

    // Initial update after next paint
    const rAF = requestAnimationFrame(updateHeight);
    window.addEventListener('resize', updateHeight);

    // Observe content size changes
    const resizeObserver = new ResizeObserver(updateHeight);
    if (contentRef.current) resizeObserver.observe(contentRef.current);

    return () => {
      cancelAnimationFrame(rAF);
      window.removeEventListener('resize', updateHeight);
      resizeObserver.disconnect();
    };
  }, [isOpen, children]);

  return (
    <div className={cn("fixed top-16 left-0 z-30 w-[420px]","transition-all duration-300 ease-in-out",!isOpen && "-translate-x-full",className)} style={{padding:"1rem"}} ref={outerRef}>
      <div ref={innerRef} className="w-full bg-white rounded-xl shadow-xl border border-gray-100 flex flex-col overflow-hidden" style={{maxHeight:`calc(100vh - 64px - 2rem)`}}>
        <div ref={contentRef} className="w-full flex-1 flex flex-col overflow-hidden" style={{padding:"0.75rem"}}>
          {children}
        </div>
      </div>
    </div>
  )
}
