"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, ChevronDown, Menu, X, Shield, Building2, Users, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user, organization, logout } = useAuth();

  const solutions = [
    { name: "For Job Seekers", href: "/profile", icon: Users, description: "Build your profile and get matched" },
    { name: "Recruiter Dashboard", href: "/admin", icon: Building2, description: "Manage hiring efficiently" },
    { name: "For Government", href: "/government", icon: Shield, description: "Verified background screening" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[rgba(6,6,10,0.85)] backdrop-blur-xl border-b border-[#1e1e28]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8 lg:gap-12">
            <Link href="/" className="flex items-center group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-[#a78bfa] to-[#8b5cf6] rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#06060a]" />
                </div>
                <span className="text-lg font-bold text-[#f8f8fc] tracking-tight hidden sm:block">Techcitta</span>
              </div>
            </Link>
            <div className="hidden xl:flex items-center gap-1">
              <Link
                href="/profile"
                className="text-sm font-medium text-[#8b8ba0] hover:text-[#f8f8fc] px-4 py-2 hover:bg-[#13131a] rounded-lg transition-all duration-200"
              >
                For Job Seekers
              </Link>
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown("solutions")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 text-sm font-medium text-[#8b8ba0] hover:text-[#f8f8fc] px-4 py-2 hover:bg-[#13131a] rounded-lg transition-all duration-200">
                  Solutions
                  <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === "solutions" ? "rotate-180" : ""}`} />
                </button>
                {activeDropdown === "solutions" && (
                  <div className="absolute top-full left-0 w-72 bg-[#13131a] border border-[#1e1e28] shadow-2xl py-2 mt-1 rounded-xl">
                    {solutions.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-[#1e1e28] transition-colors duration-200 border-l-2 border-transparent hover:border-[#a78bfa]"
                      >
                        <div className="w-10 h-10 bg-[#a78bfa]/10 flex items-center justify-center flex-shrink-0 rounded-lg border border-[#a78bfa]/15">
                          <item.icon className="w-5 h-5 text-[#a78bfa]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#f8f8fc]">{item.name}</p>
                          <p className="text-xs text-[#8b8ba0]">{item.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link
                href="/government"
                className="text-sm font-medium text-[#8b8ba0] hover:text-[#f8f8fc] px-4 py-2 hover:bg-[#13131a] rounded-lg transition-all duration-200"
              >
                Government
              </Link>
              <Link
                href="/enterprise"
                className="text-sm font-medium text-[#8b8ba0] hover:text-[#f8f8fc] px-4 py-2 hover:bg-[#13131a] rounded-lg transition-all duration-200"
              >
                Enterprise
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {(user.role === "employer" || user.role === "admin") && (
                  <Link href="/admin" className="text-sm font-medium text-[#8b8ba0] hover:text-[#f8f8fc] px-3 py-2 hover:bg-[#13131a] rounded-lg transition-all duration-200">
                    Recruiter Dashboard
                  </Link>
                )}
                {user.role === "jobseeker" && (
                  <Link href="/profile" className="text-sm font-medium text-[#8b8ba0] hover:text-[#f8f8fc] px-3 py-2 hover:bg-[#13131a] rounded-lg transition-all duration-200">
                    My Profile
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link href="/admin" className="hidden xl:block text-sm font-medium text-[#8b8ba0] hover:text-[#f8f8fc] px-3 py-2 hover:bg-[#13131a] rounded-lg transition-all duration-200">
                    Admin Dashboard
                  </Link>
                )}
                <span className="hidden 2xl:block text-sm text-[#8b8ba0]">{user.name || user.email}</span>
                {organization?.name && (
                  <span className="hidden xl:block max-w-[160px] truncate px-2.5 py-1 bg-[#13131a] text-[#8b8ba0] text-xs border border-[#1e1e28] rounded-lg">
                    {organization.name}
                  </span>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-sm text-[#8b8ba0] hover:text-[#ef4444] px-3 py-2 hover:bg-[#ef4444]/10 rounded-lg transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="flex items-center gap-1 text-sm text-[#8b8ba0] hover:text-[#f8f8fc] px-3 py-2 hover:bg-[#13131a] rounded-lg transition-all duration-200">
                  <Globe className="w-4 h-4" />
                  India
                  <ChevronDown className="w-4 h-4" />
                </button>
                <Link
                  href="/login"
                  className="text-sm font-medium text-[#8b8ba0] hover:text-[#f8f8fc] px-4 py-2 hover:bg-[#13131a] rounded-lg transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] text-[#06060a] px-6 py-2 text-sm font-semibold rounded-lg hover:shadow-[0_0_24px_rgba(167,139,250,0.3)] transition-all duration-300"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
          <button
            className="xl:hidden p-2 text-[#8b8ba0] hover:text-[#f8f8fc]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#13131a] border-t border-[#1e1e28]">
          <div className="px-4 py-4 space-y-2">
            <Link href="/profile" className="block text-sm font-medium text-[#8b8ba0] hover:text-[#f8f8fc] px-3 py-2 hover:bg-[#1e1e28] rounded-lg transition-all duration-200">For Job Seekers</Link>
            <Link href="/government" className="block text-sm font-medium text-[#8b8ba0] hover:text-[#f8f8fc] px-3 py-2 hover:bg-[#1e1e28] rounded-lg transition-all duration-200">Government</Link>
            <Link href="/enterprise" className="block text-sm font-medium text-[#8b8ba0] hover:text-[#f8f8fc] px-3 py-2 hover:bg-[#1e1e28] rounded-lg transition-all duration-200">Enterprise</Link>
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link href="/admin" className="block text-sm font-medium text-[#8b8ba0] hover:text-[#f8f8fc] px-3 py-2 hover:bg-[#1e1e28] rounded-lg transition-all duration-200">Admin Dashboard</Link>
                )}
                <button onClick={logout} className="block text-sm font-medium text-[#ef4444] px-3 py-2 hover:bg-[#ef4444]/10 rounded-lg transition-all duration-200">Logout</button>
              </>
            ) : (
              <>
                <hr className="my-2 border-[#1e1e28]" />
                <Link href="/login" className="block text-sm font-medium text-[#8b8ba0] hover:text-[#f8f8fc] px-3 py-2 hover:bg-[#1e1e28] rounded-lg transition-all duration-200">Sign In</Link>
                <Link href="/signup" className="block bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] text-[#06060a] px-4 py-2 text-sm font-semibold text-center rounded-lg transition-all duration-300">
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
