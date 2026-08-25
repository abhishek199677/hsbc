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
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          {organization?.logoUrl ? (
            <img
              src={organization.logoUrl}
              alt={organization.name || "Logo"}
              className="h-8 w-auto flex-shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">
              {organization?.name?.[0] || "H"}
            </div>
          )}
          {!collapsed && (
            <span className="text-sm font-semibold text-gray-900 truncate">
              {organization?.name || "Admin"}
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
          className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          style={{ display: isDesktop ? "none" : "flex" }}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="mb-2">
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
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
                  "w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-blue-600" : "text-gray-400"
                  )}
                />
                {!collapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </div>

        <div className="border-t border-gray-100 my-3" />

        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
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
                  "w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150",
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-blue-600" : "text-gray-400"
                  )}
                />
                {!collapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-gray-100 px-3 py-4 space-y-3">
        {!collapsed && (
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <span>Back to Site</span>
          </Link>
        )}

        <div
          className={cn(
            "flex items-center gap-3 rounded-lg p-2 bg-gray-50",
            collapsed && "justify-center"
          )}
        >
          <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || "Admin User"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {user?.role && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 capitalize">
                    {user.role}
                  </span>
                )}
                {organization?.name && organization.name.toLowerCase() !== (user?.email || "").toLowerCase() && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 min-w-0 max-w-full">
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
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f9fafb" }}>
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
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
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
                    background: "#2563eb",
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

        <main style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ padding: isDesktop ? 32 : 24 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
