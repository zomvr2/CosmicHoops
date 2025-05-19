
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Swords, Users, Bell, UserCircle, LogOut, Settings, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/start-match", label: "Start Match", icon: Swords },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const userNavItems: NavItem[] = [
 { href: "/profile/me", label: "Profile", icon: UserCircle },
 // { href: "/settings", label: "Settings", icon: Settings }, // Example for future
];


export function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border fixed top-0 left-0 h-full z-40 p-4 space-y-6">
      <div className="px-2 pt-2">
        <Link href="/dashboard">
          <Logo size="small" />
        </Link>
      </div>
      
      <nav className="flex-grow space-y-2">
        <p className="px-4 text-xs text-muted-foreground uppercase tracking-wider">Main</p>
        {mainNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} legacyBehavior>
              <a
                className={cn(
                  "flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 ease-in-out",
                  isActive
                    ? "bg-primary/20 text-primary font-semibold shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "")} />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
         <p className="px-4 text-xs text-muted-foreground uppercase tracking-wider">User</p>
        {userNavItems.map((item) => {
           const isActive = pathname.startsWith(item.href);
           return (
            <Link key={item.href} href={item.href} legacyBehavior>
              <a
                className={cn(
                  "flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 ease-in-out",
                  isActive
                    ? "bg-primary/20 text-primary font-semibold shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "")} />
                <span>{item.label}</span>
              </a>
            </Link>
           );
        })}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex items-center justify-start space-x-3 px-4 py-2.5 text-foreground/70 hover:bg-muted hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Logout</p>
          </TooltipContent>
        </Tooltip>
        {user && (
          <div className="px-2 py-2 border-t border-border mt-2 text-sm text-muted-foreground flex items-center space-x-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.photoURL || `https://placehold.co/40x40.png?text=${user.displayName?.[0] || 'U'}`} alt={user.displayName || 'User Avatar'} />
              <AvatarFallback>{user.displayName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="font-semibold text-foreground truncate">@{user.displayName || "User"}</p>
              <p className="truncate text-xs">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

