import Link from "next/link";
import { Globe, Mail, Phone, MapPin, Sparkles, Shield, Lock, CheckCircle } from "lucide-react";

const footerLinks = {
  "Platform": [
    { name: "Background Screening", href: "/profile" },
    { name: "AI Interview", href: "/interview/room" },
    { name: "Talent Matching", href: "/signup" },
    { name: "Analytics Dashboard", href: "/admin" },
    { name: "API Documentation", href: "/api-docs" },
  ],
  "Solutions": [
    { name: "For Enterprises", href: "/enterprise" },
    { name: "For Recruiters", href: "/admin" },
    { name: "For Job Seekers", href: "/profile" },
    { name: "Government", href: "/government" },
    { name: "Healthcare", href: "/enterprise" },
  ],
  "Resources": [
    { name: "Pricing", href: "/pricing" },
    { name: "Case Studies", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Help Center", href: "#" },
    { name: "Status Page", href: "#" },
  ],
  "Company": [
    { name: "About Us", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Contact Sales", href: "/enterprise" },
    { name: "Partner Program", href: "#" },
    { name: "Press Kit", href: "#" },
  ],
  "Legal": [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "DPA", href: "/dpa" },
    { name: "Cookie Policy", href: "#" },
    { name: "GDPR Compliance", href: "#" },
    { name: "Security", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#06060a] border-t border-[#1e1e28]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center mb-5 w-fit">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-[#a78bfa] to-[#8b5cf6] rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#06060a]" />
                </div>
                <span className="text-xl font-bold text-[#f8f8fc] tracking-tight">Techcitta</span>
              </div>
            </Link>
            <p className="text-sm text-[#8b8ba0] mb-6 max-w-xs leading-relaxed">
              AI-powered background screening platform trusted by 1,200+ enterprises worldwide. Making hiring decisions with certainty.
            </p>

            {/* Contact */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-[#8b8ba0]">
                <Mail className="w-4 h-4" />
                <span className="text-sm">enterprise@techcitta.com</span>
              </div>
              <div className="flex items-center gap-3 text-[#8b8ba0]">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+1 (888) 555-TECH</span>
              </div>
              <div className="flex items-center gap-3 text-[#8b8ba0]">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">San Francisco, CA & Bangalore, India</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Shield, label: "SOC 2" },
                { icon: Lock, label: "GDPR" },
                { icon: CheckCircle, label: "ISO 27001" },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13131a] border border-[#1e1e28] rounded-lg"
                >
                  <badge.icon className="w-3.5 h-3.5 text-[#22c55e]" />
                  <span className="text-[11px] text-[#8b8ba0] font-medium">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold mb-4 text-[#f8f8fc]">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-[#8b8ba0] hover:text-[#a78bfa] transition-colors duration-200">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-[#1e1e28] mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#8b8ba0]">
              &copy; 2026 Techcitta. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-[#8b8ba0] hover:text-[#a78bfa] transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-[#8b8ba0] hover:text-[#a78bfa] transition-colors">
                Terms
              </Link>
              <Link href="/dpa" className="text-sm text-[#8b8ba0] hover:text-[#a78bfa] transition-colors">
                DPA
              </Link>
              <a href="#" className="text-sm text-[#8b8ba0] hover:text-[#a78bfa] transition-colors">
                Security
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
