
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, Users, Bell, UserCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  action?: () => void; // Optional action for items like logout
}

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth(); 
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

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
          const isActive =
            (item.href === "/dashboard" && pathname === item.href) || // Exact match for dashboard
            (item.href !== "/dashboard" && pathname.startsWith(item.href)); // StartsWith for others like /profile or /friends

          let itemContent;

          if (item.label === "Profile") {
            itemContent = (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "group flex flex-col items-center justify-center p-2 rounded-md w-full h-full",
                      "focus-visible:ring-0 focus-visible:ring-offset-0" // Minimal focus appearance
                    )}
                    aria-label={item.label}
                  >
                    <item.icon 
                      className={cn(
                        "h-6 w-6 mb-0.5 transition-colors",
                        isActive ? "text-primary text-glow-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs transition-colors",
                        isActive ? "text-primary font-medium" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="center" className="mb-2 w-40">
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile/me" className="w-full flex items-center">
                      <UserCircle className="mr-2 h-4 w-4" /> View Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer flex items-center">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          } else {
            // Standard rendering for other items
            itemContent = (
              <Link href={item.href} className="group flex flex-col items-center justify-center p-2 rounded-md w-full h-full">
                <item.icon
                  className={cn(
                    "h-6 w-6 mb-0.5 transition-colors",
                    isActive ? "text-primary text-glow-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs transition-colors",
                    isActive ? "text-primary font-medium" : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          }
          
          if (index === 1) { // After "Friends" to make space for central button
            return (
              <React.Fragment key={item.href + "_fragment"}>
                <li className="flex-1 text-center h-full">{itemContent}</li>
                <li key="spacer" className="w-14 h-full" aria-hidden="true" />
              </React.Fragment>
            );
          }

          return (
            <li key={item.href} className="flex-1 text-center h-full">
              {itemContent}
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
