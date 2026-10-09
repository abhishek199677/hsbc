import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ToastProvider from "@/components/ToastProvider";
import CrispChat from "@/components/CrispChat";
import FeedbackWidget from "@/components/FeedbackWidget";
import Branding from "@/components/Branding";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HireRight - Talent to Talent",
  description: "Your Journey to the Right Opportunity Starts Here. Background screening you can trust.",
  manifest: "/manifest.json",
  icons: {
    icon: "/hireright-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HireRight",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('stitch-theme');
                if (t === 'light' || t === 'dark') {
                  document.documentElement.classList.add(t);
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground" suppressHydrationWarning>
        <Providers>
          <ToastProvider />
          <CrispChat />
          <Branding />
          {children}
          <FeedbackWidget />
        </Providers>
      </body>
    </html>
  );
}
