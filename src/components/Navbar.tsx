"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, ChevronDown, Menu, X, Shield, Building2, Users, LogOut } from "lucide-react";
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
    <nav className="glass sticky top-0 z-50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8 lg:gap-12">
            <Link href="/" className="flex items-center group">
              <img
                src={organization?.logoUrl || "/logo.png"}
                alt={organization?.name || "HireRight"}
                className="h-9 w-auto rounded-md transition-all duration-300 group-hover:scale-105"
              />
            </Link>
            <div className="hidden xl:flex items-center gap-1">
              <Link
                href="/profile"
                className="text-sm font-medium text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all"
              >
                For Job Seekers
              </Link>
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown("solutions")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
                  Solutions
                  <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === "solutions" ? "rotate-180" : ""}`} />
                </button>
                {activeDropdown === "solutions" && (
                  <div className="absolute top-full left-0 w-72 glass-card rounded-xl shadow-2xl py-2 mt-1">
                    {solutions.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link
                href="/government"
                className="text-sm font-medium text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all"
              >
                Government
              </Link>
              <Link
                href="/enterprise"
                className="text-sm font-medium text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all"
              >
                Enterprise
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {(user.role === "employer" || user.role === "admin") && (
                  <Link href="/admin" className="text-sm font-medium text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
                    Recruiter Dashboard
                  </Link>
                )}
                {user.role === "jobseeker" && (
                  <Link href="/profile" className="text-sm font-medium text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
                    My Profile
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link href="/admin" className="hidden xl:block text-sm font-medium text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
                    Admin Dashboard
                  </Link>
                )}
                <span className="hidden 2xl:block text-sm text-gray-500">{user.name || user.email}</span>
                {organization?.name && (
                  <span className="hidden xl:block max-w-[160px] truncate px-2.5 py-1 bg-white/5 text-gray-400 text-xs rounded-full border border-white/10">
                    {organization.name}
                  </span>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all">
                  <Globe className="w-4 h-4" />
                  India
                  <ChevronDown className="w-4 h-4" />
                </button>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="glare bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
          <button
            className="xl:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="xl:hidden glass-card border-t border-white/5">
          <div className="px-4 py-4 space-y-2">
            <Link href="/profile" className="block text-sm font-medium text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5">For Job Seekers</Link>
            <Link href="/government" className="block text-sm font-medium text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5">Government</Link>
            <Link href="/enterprise" className="block text-sm font-medium text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5">Enterprise</Link>
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link href="/admin" className="block text-sm font-medium text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5">Admin Dashboard</Link>
                )}
                <button onClick={logout} className="block text-sm font-medium text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/10">Logout</button>
              </>
            ) : (
              <>
                <hr className="my-2 border-white/10" />
                <Link href="/login" className="block text-sm font-medium text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5">Sign In</Link>
                <Link href="/signup" className="block bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium text-center">
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
