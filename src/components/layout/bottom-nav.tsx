"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, Users, Bell, UserCircle, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/start-match", label: "Start Match", icon: Swords },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile/me", label: "Profile", icon: UserCircle },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border shadow-t-lg md:hidden z-50">
      <ul className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/dashboard" && pathname.startsWith("/(app)"));
          return (
            <li key={item.href}>
              <Link href={item.href} className="flex flex-col items-center justify-center p-2 rounded-md">
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
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
