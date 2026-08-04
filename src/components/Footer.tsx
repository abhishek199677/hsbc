import Link from "next/link";
import { Globe, MessageSquare, Users, Share2, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  "For Job Seekers": [
    { name: "Create Profile", href: "/signup" },
    { name: "Background Checks", href: "/profile" },
    { name: "AI Interview", href: "/interview/live" },
    { name: "Career Resources", href: "#" },
    { name: "Success Stories", href: "#" },
  ],
  "For Employers": [
    { name: "Admin Dashboard", href: "/admin" },
    { name: "Talent Search", href: "/admin" },
    { name: "Verification Services", href: "/admin" },
    { name: "Enterprise Solutions", href: "/enterprise" },
    { name: "Pricing", href: "#" },
  ],
  "Company": [
    { name: "About Us", href: "#" },
    { name: "Government Solutions", href: "/government" },
    { name: "Careers", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Contact Us", href: "#" },
  ],
  "Legal": [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "#" },
    { name: "GDPR Compliance", href: "#" },
    { name: "Security", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <img src="/logo.jpeg" alt="HireRight" className="h-10 w-auto" />
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm">
              AI-powered background screening platform trusted by top employers worldwide. 
              Right People. Right Decisions.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400">
                <Mail className="w-4 h-4" />
                <span className="text-sm">care@hreright.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+91 1800-123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Bangalore, India</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold mb-4 text-white">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2026 HireRight. All rights reserved. Talent to Talent.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors">
                <Users className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors">
                <Share2 className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
