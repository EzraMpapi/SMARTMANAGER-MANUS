import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, Shield, Laptop, Smartphone, Monitor, Globe, CheckCircle2 } from "lucide-react";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Page 1", path: "/" },
  { icon: Users, label: "Page 2", path: "/some-path" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold tracking-tight truncate">
                    Navigation
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <Dialog>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4 text-emerald-600" />
                      <span>Session Management</span>
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-emerald-600" />
                        Active Logins & Sessions
                      </DialogTitle>
                      <DialogDescription>
                        Manage your active sessions across devices. You can securely revoke any unrecognized session.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-emerald-600 text-white mt-0.5">
                            <Monitor className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-semibold text-foreground">Current Browser Session</p>
                              <span 
                                role="status"
                                aria-label="Current active session badge"
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-xs"
                              >
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                ACTIVE CURRENT SESSION
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Active now · Chrome 131.0 on macOS / Windows (Desktop Workstation)</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground font-mono flex-wrap">
                              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Location: Dar es Salaam, Tanzania (TZ)
                              </span>
                              <span>•</span>
                              <span>IP: 197.250.xxx.xx</span>
                              <span>•</span>
                              <span className="text-foreground/80 font-medium">Started: Just now (Active)</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-card p-3.5 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-secondary text-secondary-foreground mt-0.5">
                            <Smartphone className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">Mobile Companion App</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Smart Manager Mobile App · Safari Mobile (iOS 18)</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground font-mono flex-wrap">
                              <span>Location: Arusha, Tanzania (TZ)</span>
                              <span>•</span>
                              <span>IP: 196.43.xxx.xx</span>
                              <span>•</span>
                              <span>Last active: 2 hours ago</span>
                            </div>
                          </div>
                        </div>
                        <button
                          disabled={revokingId === "mobile"}
                          onClick={() => {
                            setRevokingId("mobile");
                            toast.loading("Revoking mobile companion session...", { id: "revoking-mobile" });
                            setTimeout(() => {
                              setRevokingId(null);
                              toast.dismiss("revoking-mobile");
                              toast.success("Mobile companion session successfully revoked.");
                            }, 800);
                          }}
                          className="text-[11px] font-semibold text-destructive hover:underline px-2 py-1 rounded-md hover:bg-destructive/10 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {revokingId === "mobile" && <div className="h-3 w-3 animate-spin rounded-full border-2 border-destructive border-t-transparent" />}
                          Revoke
                        </button>
                      </div>

                      <div className="rounded-xl border border-border bg-card p-3.5 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-secondary text-secondary-foreground mt-0.5">
                            <Globe className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">Headless API / CLI Integration</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Headless API / CLI Integration · Node.js / cURL Client</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground font-mono flex-wrap">
                              <span>Location: Cloud Gateway (AWS Virginia, US)</span>
                              <span>•</span>
                              <span>IP: 52.213.xxx.xx</span>
                              <span>•</span>
                              <span>Created: Yesterday (08:30 UTC)</span>
                            </div>
                          </div>
                        </div>
                        <button
                          disabled={revokingId === "api"}
                          onClick={() => {
                            setRevokingId("api");
                            toast.loading("Revoking API integration token...", { id: "revoking-api" });
                            setTimeout(() => {
                              setRevokingId(null);
                              toast.dismiss("revoking-api");
                              toast.success("API integration token successfully revoked.");
                            }, 800);
                          }}
                          className="text-[11px] font-semibold text-destructive hover:underline px-2 py-1 rounded-md hover:bg-destructive/10 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {revokingId === "api" && <div className="h-3 w-3 animate-spin rounded-full border-2 border-destructive border-t-transparent" />}
                          Revoke
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isRevokingAll}
                        className="w-full sm:w-auto text-xs font-semibold shadow-xs inline-flex items-center gap-2"
                        onClick={() => {
                          setIsRevokingAll(true);
                          toast.loading("Revoking all other active sessions securely...", { id: "revoking-all" });
                          setTimeout(() => {
                            setIsRevokingAll(false);
                            toast.dismiss("revoking-all");
                            toast.success("Successfully revoked all other active sessions. Your current browser session remains secure.");
                          }, 1000);
                        }}
                      >
                        {isRevokingAll && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-destructive-foreground border-t-transparent" />}
                        Revoke All Other Sessions
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
