"use client";

const companies = [
  { name: "TATA", color: "#6366f1" },
  { name: "Wipro", color: "#818cf8" },
  { name: "Infosys", color: "#a78bfa" },
  { name: "Accenture", color: "#c084fc" },
  { name: "Amazon", color: "#f472b6" },
  { name: "Deloitte", color: "#34d399" },
  { name: "Reliance", color: "#fbbf24" },
  { name: "HDFC Bank", color: "#60a5fa" },
  { name: "TCS", color: "#f97316" },
  { name: "Google", color: "#22c55e" },
  { name: "Microsoft", color: "#3b82f6" },
  { name: "Flipkart", color: "#eab308" },
];

export default function CompanyLogos() {
  return (
    <section className="py-16 bg-[#0a0a1a] border-y border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500 mb-10 uppercase tracking-wider font-medium">
          Powering Confident Hiring Decisions for Top Companies
        </p>
      </div>

      {/* Marquee container */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0a1a] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0a1a] to-transparent z-10 pointer-events-none" />

        {/* Scrolling track */}
        <div className="flex animate-marquee">
          {/* Duplicate for seamless loop */}
          {[...companies, ...companies].map((company, i) => (
            <div
              key={`${company.name}-${i}`}
              className="flex-shrink-0 mx-6 md:mx-10"
            >
              <div className="glass rounded-2xl px-8 py-4 flex items-center justify-center hover:bg-white/5 transition-all duration-300 cursor-pointer group min-w-[160px]">
                <span
                  className="text-xl md:text-2xl font-bold opacity-30 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110"
                  style={{ color: company.color }}
                >
                  {company.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
