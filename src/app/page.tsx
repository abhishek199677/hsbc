import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CompanyLogos from "@/components/CompanyLogos";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import VideoSection from "@/components/VideoSection";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <CompanyLogos />
      <Features />
      <HowItWorks />
      <Testimonials />
      <VideoSection />
      <CTA />
      <Footer />
    </main>
  );
}
