"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, ChevronDown, Menu, X, Shield, Building2, Users, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user, logout } = useAuth();

  const solutions = [
    { name: "For Job Seekers", href: "/profile", icon: Users, description: "Build your profile and get matched" },
    { name: "For Employers", href: "/employer", icon: Building2, description: "Manage hiring efficiently" },
    { name: "For Government", href: "/government", icon: Shield, description: "Verified background screening" },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center">
              <img src="/logo.jpeg" alt="HireRight" className="h-10 w-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/profile" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                For Job Seekers
              </Link>
              <div 
                className="relative"
                onMouseEnter={() => setActiveDropdown("solutions")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                  Solutions
                  <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === "solutions" ? "rotate-180" : ""}`} />
                </button>
                {activeDropdown === "solutions" && (
                  <div className="absolute top-full left-0 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 mt-1">
                    {solutions.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link href="/government" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Government
              </Link>
              <Link href="/enterprise" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                Enterprise
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {user.role === "employer" || user.role === "admin" ? (
                  <Link href="/employer" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                    Employer Dashboard
                  </Link>
                ) : (
                  <Link href="/profile" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                    My Profile
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link href="/admin" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                    Admin Dashboard
                  </Link>
                )}
                <span className="text-sm text-gray-500">{user.name || user.email}</span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  <Globe className="w-4 h-4" />
                  India
                  <ChevronDown className="w-4 h-4" />
                </button>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            <Link href="/profile" className="block text-sm font-medium text-gray-700">For Job Seekers</Link>
            <Link href="/employer" className="block text-sm font-medium text-gray-700">For Employers</Link>
            <Link href="/government" className="block text-sm font-medium text-gray-700">Government</Link>
            <Link href="/enterprise" className="block text-sm font-medium text-gray-700">Enterprise</Link>
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link href="/admin" className="block text-sm font-medium text-gray-700">Admin Dashboard</Link>
                )}
                <button
                  onClick={logout}
                  className="block text-sm font-medium text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <hr className="my-2" />
                <Link href="/login" className="block text-sm font-medium text-gray-700">Sign In</Link>
                <Link href="/signup" className="block bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium text-center">
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
