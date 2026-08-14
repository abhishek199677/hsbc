"use client";

const companies = [
  { name: "TATA", color: "#1f3864" },
  { name: "wipro", color: "#0057b8" },
  { name: "Infosys", color: "#007cc3" },
  { name: "accenture", color: "#a100ff" },
  { name: "amazon", color: "#ff9900" },
  { name: "Deloitte.", color: "#86bc25" },
  { name: "Reliance", color: "#d42a2a" },
  { name: "HDFC Bank", color: "#004b8d" },
];

export default function CompanyLogos() {
  return (
    <section className="py-16 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500 mb-8 uppercase tracking-wider font-medium">
          Powering Confident Hiring Decisions for Top Companies
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {companies.map((company) => (
            <div
              key={company.name}
              className="text-2xl md:text-3xl font-bold opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-pointer hover:scale-110 hover:-translate-y-1 transition-transform"
              style={{ color: company.color, filter: "drop-shadow(0 0 0 transparent)" }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = `drop-shadow(0 4px 16px ${company.color}55)`)}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "drop-shadow(0 0 0 transparent)")}
            >
              {company.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
