
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, Users, Bell, LogOut, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

const DEFAULT_AVATAR_URL = "https://i.imgur.com/nkcoOPE.jpeg";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const startMatchItem: NavItem = { href: "/start-match", label: "Start Match", icon: Swords };


export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  const renderNavItem = (item: NavItem, isStartMatchSpecial: boolean = false) => {
    const isActive = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/start-match" && pathname.startsWith(item.href));
    const isActuallyStartMatch = item.label === "Start Match";

    return (
      <Link key={item.href} href={item.href} legacyBehavior>
        <a
          className={cn(
            "flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 ease-in-out",
            isActive
              ? "bg-primary/20 text-primary font-semibold shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
              : isActuallyStartMatch 
                ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary" 
                : "text-foreground/70 hover:bg-muted hover:text-foreground",
            isActuallyStartMatch && isActive && "ring-2 ring-offset-background ring-offset-1 ring-primary-foreground/50" // Special active state for start match
          )}
        >
          <item.icon className={cn("h-5 w-5", isActive && !isActuallyStartMatch ? "text-primary" : isActuallyStartMatch ? "text-primary-foreground" : "")} />
          <span className={cn(isActuallyStartMatch ? "text-primary-foreground" : "")}>{item.label}</span>
        </a>
      </Link>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border fixed top-0 left-0 h-full z-40 p-4">
      <div className="px-2 pt-2 mb-4"> 
        <Link href="/dashboard">
          <Logo size="small" />
        </Link>
      </div>

      {user && (
        <div className="px-1 py-3 mb-2 text-sm text-muted-foreground flex items-center justify-between hover:bg-muted/50 rounded-lg group transition-colors">
            <Link href="/profile/me" className="flex items-center space-x-3 flex-grow overflow-hidden cursor-pointer pl-1 py-1">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.photoURL || DEFAULT_AVATAR_URL} alt={user.displayName || 'User Avatar'} />
                  <AvatarFallback>{user.displayName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <p className="font-semibold text-foreground truncate">@{user.displayName || "User"}</p>
                  <p className="truncate text-xs">{user.email}</p>
                </div>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition-opacity hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  aria-label="Open user menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-48">
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      
      <Separator className="my-2" />
      
      <nav className="flex-grow space-y-1.5 pt-2">
        {mainNavItems.map((item) => renderNavItem(item))}
      </nav>

      <div className="mt-auto space-y-2 pt-2">
        {renderNavItem(startMatchItem, true)}
      </div>
    </aside>
  );
}
