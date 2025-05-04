"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, X, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Z_INDEX, LAYOUT_DIMENSIONS, DEFAULT_AVATAR_PATH, HOSPITAL_LOGO_PATH } from "@/lib/constants"

// ==================== APP HEADER ====================

interface AppHeaderProps {
  // Remove props related to sidebar toggle
  // isSidebarOpen: boolean
  // onToggleSidebar: () => void
}

export function AppHeader({}: AppHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-card border-b border-border/60" style={{ zIndex: Z_INDEX.header }}>
      <div className="container flex h-16 items-center justify-between px-4" style={{ height: `${LAYOUT_DIMENSIONS.HEADER_HEIGHT}px` }}>
        <HospitalLogo />

        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="rounded-md" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={DEFAULT_AVATAR_PATH} alt="User avatar" />
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
      <img src={HOSPITAL_LOGO_PATH} alt="BWH Logo" className="h-12 w-auto" />
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
      const headerHeight = LAYOUT_DIMENSIONS.HEADER_HEIGHT; // fixed header
      const outerPadding = 32; // 1rem top + bottom -> convert to use padding constant if available
      const maxHeight = windowHeight - headerHeight - outerPadding;
      const contentHeight = contentRef.current.scrollHeight + 24; // include inner padding 0.75*2 -> use padding constant if available
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
    <div className={cn(
        "fixed top-16 left-0 z-30",
        "transition-all ease-in-out",
        !isOpen && "-translate-x-full",
        className
      )}
      style={{
        top: `${LAYOUT_DIMENSIONS.HEADER_HEIGHT}px`, 
        width: `${LAYOUT_DIMENSIONS.SIDEBAR_WIDTH}px`, 
        zIndex: Z_INDEX.sidebar,
        padding: LAYOUT_DIMENSIONS.SIDEBAR_PADDING_Y, // Use Y padding for overall outer padding
        transitionDuration: `${LAYOUT_DIMENSIONS.SIDEBAR_TRANSITION_MS}ms`,
        maxHeight: `calc(100vh - ${LAYOUT_DIMENSIONS.HEADER_HEIGHT}px - ${LAYOUT_DIMENSIONS.SIDEBAR_PADDING_Y} * 2)` // Ensure max height respects padding
      }}
      ref={outerRef}>
      <div ref={innerRef} className="w-full bg-white rounded-xl shadow-xl border border-gray-100 flex flex-col overflow-hidden" 
        style={{
            maxHeight: `calc(100vh - ${LAYOUT_DIMENSIONS.HEADER_HEIGHT}px - (${LAYOUT_DIMENSIONS.SIDEBAR_PADDING_Y} + ${LAYOUT_DIMENSIONS.SIDEBAR_PADDING_Y}))`
        }}>
        <div ref={contentRef} className="w-full flex-1 flex flex-col overflow-hidden" 
          style={{padding: LAYOUT_DIMENSIONS.SIDEBAR_PADDING_X}}>
          {children}
        </div>
      </div>
    </div>
  )
}
