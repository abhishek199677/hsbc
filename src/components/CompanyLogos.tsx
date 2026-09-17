"use client";

const companies = [
  { name: "HSBC", color: "#DB0011" },
  { name: "TCS", color: "#0066B3" },
  { name: "Infosys", color: "#007CC3" },
  { name: "Wipro", color: "#1B365D" },
  { name: "Google", color: "#4285F4" },
  { name: "Microsoft", color: "#00A4EF" },
  { name: "Amazon", color: "#FF9900" },
  { name: "Deloitte", color: "#86BC25" },
  { name: "Accenture", color: "#A100FF" },
  { name: "Reliance", color: "#D4A843" },
  { name: "HDFC Bank", color: "#004C8F" },
  { name: "Flipkart", color: "#FBE122" },
];

export default function CompanyLogos() {
  return (
    <section className="py-20 bg-background relative border-y border-border">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm text-muted-foreground font-medium tracking-wide uppercase">
            Powering hiring decisions at
          </p>
          <p className="text-2xl font-bold text-foreground mt-2">
            1,200+ leading enterprises
          </p>
        </div>

        {/* Marquee container */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Scrolling track */}
          <div className="flex animate-marquee">
            {/* Duplicate for seamless loop */}
            {[...companies, ...companies].map((company, i) => (
              <div
                key={`${company.name}-${i}`}
                className="flex-shrink-0 mx-4"
              >
                <div className="bg-surface border border-border rounded-xl px-8 py-5 flex items-center justify-center hover:border-primary/20 transition-all duration-500 group min-w-[160px]">
                  <span
                    className="text-xl font-bold opacity-25 group-hover:opacity-90 transition-all duration-500 group-hover:scale-105 tracking-tight"
                    style={{ color: company.color }}
                  >
                    {company.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust statement */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">Fortune 500</span> &bull; <span className="text-foreground font-medium">Global Banks</span> &bull; <span className="text-foreground font-medium">Healthcare Leaders</span> &bull; <span className="text-foreground font-medium">Tech Giants</span>
          </p>
        </div>
      </div>
    </section>
  );
}
