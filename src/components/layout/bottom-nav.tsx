
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, Users, Bell, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import React from "react"; // Import React for React.Fragment

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function BottomNav() {
  const pathname = usePathname();

  const regularNavItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/friends", label: "Friends", icon: Users },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile/me", label: "Profile", icon: UserCircle },
  ];

  const startMatchItem: NavItem = { href: "/start-match", label: "Start Match", icon: Swords };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border shadow-t-lg md:hidden z-50 h-16">
      <ul className="flex justify-around items-center h-full px-1">
        {regularNavItems.map((item, index) => {
          const isActive = pathname === item.href ||
                           (item.href === "/dashboard" && pathname.startsWith("/dashboard")) ||
                           (item.href === "/profile/me" && pathname.startsWith("/profile"));

          const itemContent = (
            <>
              <item.icon
                className={cn(
                  "h-6 w-6 mb-0.5 transition-colors",
                  isActive ? "text-primary text-glow-primary" : "text-muted-foreground hover:text-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs transition-colors",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </>
          );

          // Spacer logic for the central lifted button
          // We expect 4 regular items. Spacer after 2nd item (index 1).
          if (index === 1) { // After "Friends"
            return (
              <React.Fragment key={item.href + "_fragment"}>
                <li key={item.href} className="flex-1 text-center">
                  <Link href={item.href} className="flex flex-col items-center justify-center p-2 rounded-md">
                    {itemContent}
                  </Link>
                </li>
                <li key="spacer" className="w-14 h-full" aria-hidden="true" />
              </React.Fragment>
            );
          }

          return (
            <li key={item.href} className="flex-1 text-center">
              <Link href={item.href} className="flex flex-col items-center justify-center p-2 rounded-md">
                {itemContent}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Lifted "Start Match" Button */}
      <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <Link
          href={startMatchItem.href}
          className={cn(
            "flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full glow-primary",
            "hover:bg-primary/90 transition-colors",
            (pathname === startMatchItem.href || pathname.startsWith(startMatchItem.href + "/")) && "ring-2 ring-offset-background ring-offset-2 ring-primary"
          )}
          aria-label={startMatchItem.label}
        >
          <startMatchItem.icon className="h-8 w-8" />
        </Link>
      </div>
    </nav>
  );
}
