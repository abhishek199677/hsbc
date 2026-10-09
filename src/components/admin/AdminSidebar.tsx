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
  FileText,
  Terminal,
} from "lucide-react";

interface AdminSidebarProps {
  user: { name: string | null; email: string; role: string } | null;
  organization: { name: string | null; logoUrl: string | null; plan: string } | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

const mainNavigation = [
  { id: "overview", name: "Dashboard", icon: LayoutDashboard },
  { id: "job-seekers", name: "Job Seekers", icon: Users },
  { id: "job-requests", name: "Job Requests", icon: FileText },
  { id: "interviews", name: "Interviews", icon: Calendar },
  { id: "agency", name: "Agency", icon: Briefcase },
];

const secondaryNavigation = [
  { id: "candidates", name: "Candidates", icon: Users },
  { id: "analytics", name: "Analytics", icon: BarChart3 },
  { id: "login-logs", name: "Login Logs", icon: ClipboardList },
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

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 64;

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
      void Promise.resolve().then(() => setMobileOpen(false));
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

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#09090b] border-r border-[#27272a]">
      <div className="flex items-center justify-between px-4 h-16 border-b border-[#27272a]">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <img
            src="/hireright-icon.svg"
            alt="HireRight"
            className="w-8 h-8 rounded-lg"
          />
          {!collapsed && (
            <span className="text-sm font-bold text-[#fafafa] truncate">
              {organization?.name || "Admin"}
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="items-center justify-center w-7 h-7 text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b] rounded-lg transition-colors"
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
          className="flex items-center justify-center w-7 h-7 text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b] rounded-lg transition-colors"
          style={{ display: isDesktop ? "none" : "flex" }}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="mb-2">
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-[#a1a1aa]">
              Main
            </p>
          )}
          {mainNavigation.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 text-sm font-medium transition-all duration-150",
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                  isActive
                    ? "bg-[#a78bfa]/10 text-[#a78bfa] border-l-2 border-[#a78bfa] rounded-lg"
                    : "text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b] border-l-2 border-transparent rounded-lg"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-[#a78bfa]" : "text-[#a1a1aa]"
                  )}
                />
                {!collapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </div>

        <div className="border-t border-[#27272a] my-3" />

        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-[#a1a1aa]">
              Management
            </p>
          )}
          {secondaryNavigation.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 text-sm font-medium transition-all duration-150",
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                  isActive
                    ? "bg-[#a78bfa]/10 text-[#a78bfa] border-l-2 border-[#a78bfa] rounded-lg"
                    : "text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b] border-l-2 border-transparent rounded-lg"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-[#a78bfa]" : "text-[#a1a1aa]"
                  )}
                />
                {!collapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-[#27272a] px-3 py-4 space-y-3">
        {!collapsed && (
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#18181b] transition-colors rounded-lg"
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <span>Back to Site</span>
          </Link>
        )}

        <div
          className={cn(
            "flex items-center gap-3 p-2 bg-[#18181b] border border-[#27272a] rounded-lg",
            collapsed && "justify-center"
          )}
        >
          <div className="h-9 w-9 bg-[#a78bfa] rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#fafafa] truncate">
                {user?.name || "Admin User"}
              </p>
              <p className="text-xs text-[#a1a1aa] truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {user?.role && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-[#a78bfa]/20 text-[#a78bfa] capitalize rounded-md">
                    {user.role}
                  </span>
                )}
                {organization?.name && organization.name.toLowerCase() !== (user?.email || "").toLowerCase() && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-[#18181b] text-[#a1a1aa] border border-[#27272a] rounded-md min-w-0 max-w-full">
                    <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{organization.name}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#09090b" }}>
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

      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            backgroundColor: "rgba(0,0,0,0.8)",
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        ref={sidebarRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: SIDEBAR_WIDTH,
          zIndex: 50,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 200ms ease-in-out",
        }}
      >
        {sidebarContent}
      </div>

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
        {!isDesktop && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
              height: 56,
              background: "#09090b",
              borderBottom: "1px solid #27272a",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setMobileOpen(true)}
              style={{
                padding: 8,
                marginLeft: -8,
                color: "#a1a1aa",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              aria-label="Open menu"
            >
              <Menu style={{ width: 20, height: 20 }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LayoutDashboard style={{ width: 14, height: 14, color: "white" }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>
                {organization?.name || "Admin"}
              </span>
            </div>
            <div style={{ width: 36 }} />
          </div>
        )}

        <main style={{ flex: 1, overflowY: "auto", background: "#09090b" }}>
          <div style={{ padding: isDesktop ? 32 : 24 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
