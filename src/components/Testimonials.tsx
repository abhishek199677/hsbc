"use client";

import { Star, Quote, ArrowRight, TrendingUp, Clock, Users, Building2 } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "VP of Talent Acquisition",
    company: "Fortune 500 Tech Company",
    companyLogo: "TC",
    quote: "Techcitta reduced our average time-to-hire from 23 days to 8 days. The AI accuracy is remarkable — we've eliminated almost all false positives in our screening process.",
    metrics: { metric: "65%", label: "Faster hiring" },
    rating: 5,
  },
  {
    name: "Michael Torres",
    role: "Head of HR Operations",
    company: "Global Financial Services",
    companyLogo: "FS",
    quote: "The integration with our Workday ATS was seamless. Our recruiters now spend 85% less time on manual verification tasks. The ROI was evident within the first quarter.",
    metrics: { metric: "85%", label: "Time saved" },
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Chief People Officer",
    company: "Leading Healthcare Provider",
    companyLogo: "HC",
    quote: "Compliance was our biggest concern. Techcitta's GDPR and HIPAA compliance gave us confidence to scale globally while maintaining the highest security standards.",
    metrics: { metric: "100%", label: "Compliance rate" },
    rating: 5,
  },
];

const stats = [
  { value: "1,200+", label: "Enterprise clients", icon: Building2 },
  { value: "10M+", label: "Verifications completed", icon: Users },
  { value: "99.7%", label: "Accuracy rate", icon: TrendingUp },
  { value: "48hr", label: "Average turnaround", icon: Clock },
];

export default function Testimonials() {
  return (
    <section className="py-28 bg-[#06060a] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1e1e28] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1e1e28] to-transparent" />
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-[#f5c542]/[0.015] rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-[#13131a] border border-[#1e1e28]">
            <Star className="w-4 h-4 text-[#f5c542]" />
            <span className="text-sm text-[#8b8ba0] font-medium">Trusted by industry leaders</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
            <span className="text-[#f8f8fc]">See what our</span>
            <br />
            <span className="bg-gradient-to-r from-[#f5c542] to-[#fbbf24] bg-clip-text text-transparent">enterprise clients</span>
            <span className="text-[#f8f8fc]"> say</span>
          </h2>
          <p className="text-[#8b8ba0] text-lg leading-relaxed">
            Real results from organizations that transformed their hiring with Techcitta.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-[#13131a] border border-[#1e1e28] rounded-2xl p-7 relative group hover:border-[#a78bfa]/20 transition-all duration-500"
            >
              {/* Quote icon */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-[#1e1e28] group-hover:text-[#a78bfa]/10 transition-colors duration-500" />

              {/* Stars */}
              <div className="flex items-center gap-1 mb-5">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[#f59e0b] fill-current" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[#8b8ba0] text-sm leading-[1.8] mb-6 relative">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Metric highlight */}
              <div className="flex items-center gap-3 p-4 bg-[#0f0f16] border border-[#1e1e28] rounded-xl mb-6">
                <p className="text-3xl font-bold text-[#a78bfa]">{testimonial.metrics.metric}</p>
                <p className="text-sm text-[#8b8ba0]">{testimonial.metrics.label}</p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#a78bfa]/20 to-[#8b5cf6]/20 rounded-xl flex items-center justify-center text-sm font-bold text-[#a78bfa] border border-[#a78bfa]/10">
                  {testimonial.companyLogo}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#f8f8fc]">{testimonial.name}</p>
                  <p className="text-xs text-[#8b8ba0]">{testimonial.role}</p>
                  <p className="text-xs text-[#a78bfa]">{testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="bg-[#13131a] border border-[#1e1e28] rounded-2xl p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-10 h-10 bg-[#a78bfa]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-5 h-5 text-[#a78bfa]" />
                </div>
                <p className="text-3xl font-bold text-[#f8f8fc] tracking-tight">{stat.value}</p>
                <p className="text-sm text-[#8b8ba0] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
