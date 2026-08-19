"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  MessageSquare,
  UserPlus,
  Shield,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ExternalLink,
  Building2,
  Briefcase,
  Activity,
  ClipboardList,
} from "lucide-react";

interface AdminSidebarProps {
  user: { name: string | null; email: string; role: string } | null;
  organization: { name: string | null; logoUrl: string | null; plan: string } | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

const navigation = [
  { id: "overview", name: "Overview", icon: LayoutDashboard },
  { id: "agency", name: "Agency", icon: Briefcase },
  { id: "candidates", name: "Candidates", icon: Users },
  { id: "interviews", name: "Interviews", icon: Calendar },
  { id: "login-logs", name: "Login Logs", icon: ClipboardList },
  { id: "analytics", name: "Analytics", icon: BarChart3 },
  { id: "openai-metrics", name: "API Metrics", icon: Activity },
  { id: "feedback", name: "Feedback", icon: MessageSquare },
  { id: "team", name: "Team", icon: UserPlus },
  { id: "proctoring", name: "Proctoring", icon: Shield },
  { id: "enterprise", name: "Enterprise", icon: Building2 },
  { id: "settings", name: "Settings", icon: Settings },
];

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const SIDEBAR_WIDTH = 256;
const SIDEBAR_COLLAPSED_WIDTH = 68;

export default function AdminSidebar({
  user,
  organization,
  activeTab,
  onTabChange,
  children,
}: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setMobileOpen(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  const handleNav = (tab: string) => {
    onTabChange(tab);
    setMobileOpen(false);
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  const planColors: Record<string, string> = {
    free: "bg-gray-500/20 text-gray-300",
    starter: "bg-blue-500/20 text-blue-300",
    pro: "bg-indigo-500/20 text-indigo-300",
    enterprise: "bg-amber-500/20 text-amber-300",
  };

  const planLabel = organization?.plan
    ? organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)
    : "Free";

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          {organization?.logoUrl ? (
            <img
              src={organization.logoUrl}
              alt={organization.name || "Logo"}
              className="h-8 w-auto flex-shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
              {organization?.name?.[0] || "H"}
            </div>
          )}
          {!collapsed && (
            <span className="text-sm font-semibold truncate">
              {organization?.name || "Admin"}
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          style={{ display: isDesktop ? "flex" : "none" }}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              collapsed && "rotate-180"
            )}
          />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          style={{ display: isDesktop ? "none" : "flex" }}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-white" : "text-gray-400"
                )}
              />
              {!collapsed && <span>{item.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/10 px-3 py-4 space-y-3">
        {!collapsed && (
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <span>Back to Site</span>
          </Link>
        )}

        {/* User info */}
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg p-2 bg-white/5",
            collapsed && "justify-center"
          )}
        >
          <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-xs font-semibold">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {user?.name || "Admin User"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {user?.role && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300 capitalize">
                    {user.role}
                  </span>
                )}
                {organization?.name && organization.name.toLowerCase() !== (user?.email || "").toLowerCase() && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 text-gray-300 min-w-0 max-w-full">
                    <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{organization.name}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Plan badge */}
        {!collapsed && organization?.plan && (
          <div className="px-3">
            <span
              className={cn(
                "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
                planColors[organization.plan] || planColors.free
              )}
            >
              {planLabel} Plan
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f9fafb" }}>
      {/* Desktop sidebar - fixed position */}
      <div
        style={{
          display: isDesktop ? "block" : "none",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: sidebarWidth,
          zIndex: 30,
          transition: "width 300ms ease-in-out",
          overflow: "hidden",
        }}
      >
        {sidebarContent}
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        ref={sidebarRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 256,
          zIndex: 50,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 200ms ease-in-out",
        }}
      >
        {sidebarContent}
      </div>

      {/* Main content area - offset by sidebar width on desktop */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          marginLeft: isDesktop ? sidebarWidth : 0,
          transition: "margin-left 300ms ease-in-out",
        }}
      >
        {/* Mobile top bar */}
        {!isDesktop && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
              height: 56,
              background: "white",
              borderBottom: "1px solid #e5e7eb",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setMobileOpen(true)}
              style={{
                padding: 8,
                marginLeft: -8,
                borderRadius: 6,
                color: "#4b5563",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              aria-label="Open menu"
            >
              <Menu style={{ width: 20, height: 20 }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {organization?.logoUrl ? (
                <img
                  src={organization.logoUrl}
                  alt={organization.name || "Logo"}
                  style={{ height: 28, width: "auto" }}
                />
              ) : (
                <div
                  style={{
                    height: 28,
                    width: 28,
                    borderRadius: 6,
                    background: "#4f46e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "white",
                  }}
                >
                  {organization?.name?.[0] || "H"}
                </div>
              )}
              <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                {organization?.name || "Admin"}
              </span>
            </div>
            <div style={{ width: 36 }} />
          </div>
        )}

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ padding: isDesktop ? 32 : 24 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
