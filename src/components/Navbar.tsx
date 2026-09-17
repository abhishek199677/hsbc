"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Globe, ChevronDown, Menu, X, Shield, Building2, Users, LogOut, Sparkles, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user, organization, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const solutions = [
    { name: "For Job Seekers", href: "/profile", icon: Users, description: "Build your profile and get matched" },
    { name: "Recruiter Dashboard", href: "/admin", icon: Building2, description: "Manage hiring efficiently" },
    { name: "For Government", href: "/government", icon: Shield, description: "Verified background screening" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8 lg:gap-12">
            <Link href="/" className="flex items-center group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground tracking-tight hidden sm:block">Techcitta</span>
              </div>
            </Link>
            <div className="hidden xl:flex items-center gap-1">
              <Link
                href="/profile"
                className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 hover:bg-surface rounded-lg transition-all duration-200"
              >
                For Job Seekers
              </Link>
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown("solutions")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 hover:bg-surface rounded-lg transition-all duration-200">
                  Solutions
                  <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === "solutions" ? "rotate-180" : ""}`} />
                </button>
                {activeDropdown === "solutions" && (
                  <div className="absolute top-full left-0 w-72 bg-surface border border-border shadow-2xl py-2 mt-1 rounded-xl">
                    {solutions.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-surface-hover transition-colors duration-200 border-l-2 border-transparent hover:border-primary"
                      >
                        <div className="w-10 h-10 bg-primary/10 flex items-center justify-center flex-shrink-0 rounded-lg border border-primary/15">
                          <item.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link
                href="/government"
                className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 hover:bg-surface rounded-lg transition-all duration-200"
              >
                Government
              </Link>
              <Link
                href="/enterprise"
                className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 hover:bg-surface rounded-lg transition-all duration-200"
              >
                Enterprise
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-surface rounded-lg transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                {(user.role === "employer" || user.role === "admin") && (
                  <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 hover:bg-surface rounded-lg transition-all duration-200">
                    Recruiter Dashboard
                  </Link>
                )}
                {user.role === "jobseeker" && (
                  <Link href="/profile" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 hover:bg-surface rounded-lg transition-all duration-200">
                    My Profile
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link href="/admin" className="hidden xl:block text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 hover:bg-surface rounded-lg transition-all duration-200">
                    Admin Dashboard
                  </Link>
                )}
                <span className="hidden 2xl:block text-sm text-muted-foreground">{user.name || user.email}</span>
                {organization?.name && (
                  <span className="hidden xl:block max-w-[160px] truncate px-2.5 py-1 bg-surface text-muted-foreground text-xs border border-border rounded-lg">
                    {organization.name}
                  </span>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive px-3 py-2 hover:bg-destructive/10 rounded-lg transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-3 py-2 hover:bg-surface rounded-lg transition-all duration-200">
                  <Globe className="w-4 h-4" />
                  India
                  <ChevronDown className="w-4 h-4" />
                </button>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground px-4 py-2 hover:bg-surface rounded-lg transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground px-6 py-2 text-sm font-semibold rounded-lg hover:shadow-[0_0_24px_rgba(167,139,250,0.3)] transition-all duration-300"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
          <button
            className="xl:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="xl:hidden bg-surface border-t border-border">
          <div className="px-4 py-4 space-y-2">
            {/* Mobile Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 hover:bg-surface-hover rounded-lg transition-all duration-200 w-full"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            <Link href="/profile" className="block text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 hover:bg-surface-hover rounded-lg transition-all duration-200">For Job Seekers</Link>
            <Link href="/government" className="block text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 hover:bg-surface-hover rounded-lg transition-all duration-200">Government</Link>
            <Link href="/enterprise" className="block text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 hover:bg-surface-hover rounded-lg transition-all duration-200">Enterprise</Link>
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link href="/admin" className="block text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 hover:bg-surface-hover rounded-lg transition-all duration-200">Admin Dashboard</Link>
                )}
                <button onClick={logout} className="block text-sm font-medium text-destructive px-3 py-2 hover:bg-destructive/10 rounded-lg transition-all duration-200">Logout</button>
              </>
            ) : (
              <>
                <hr className="my-2 border-border" />
                <Link href="/login" className="block text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 hover:bg-surface-hover rounded-lg transition-all duration-200">Sign In</Link>
                <Link href="/signup" className="block bg-gradient-to-r from-primary to-primary-hover text-primary-foreground px-4 py-2 text-sm font-semibold text-center rounded-lg transition-all duration-300">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
