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
  { id: "candidates", name: "Candidates", icon: Users },
  { id: "interviews", name: "Interviews", icon: Calendar },
  { id: "analytics", name: "Analytics", icon: BarChart3 },
  { id: "feedback", name: "Feedback", icon: MessageSquare },
  { id: "team", name: "Team", icon: UserPlus },
  { id: "proctoring", name: "Proctoring", icon: Shield },
  { id: "settings", name: "Settings", icon: Settings },
];

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminSidebar({
  user,
  organization,
  activeTab,
  onTabChange,
  children,
}: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const sidebarInner = (
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
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
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
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
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
              <div className="flex items-center gap-2 mt-1">
                {user?.role && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300 capitalize">
                    {user.role}
                  </span>
                )}
                {organization?.name && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 text-gray-300">
                    <Building2 className="w-2.5 h-2.5" />
                    {organization.name}
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {sidebarInner}
      </div>

      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarInner}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {organization?.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt={organization.name || "Logo"}
                className="h-7 w-auto"
              />
            ) : (
              <div className="h-7 w-7 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                {organization?.name?.[0] || "H"}
              </div>
            )}
            <span className="text-sm font-semibold text-gray-900">
              {organization?.name || "Admin"}
            </span>
          </div>
          <div className="w-9" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
