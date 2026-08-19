"use client";

import { Star, Quote } from "lucide-react";
import { useGlare } from "@/lib/useGlare";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Software Engineer at Google",
    avatar: "PS",
    gradient: "from-rose-500 to-pink-500",
    rating: 5,
    text: "HireRight's AI interview prepared me perfectly. The adaptive questions matched my experience level, and the feedback helped me identify exactly what to improve. Landed my dream job within 2 weeks!",
  },
  {
    name: "Rahul Verma",
    role: "Data Scientist at Microsoft",
    avatar: "RV",
    gradient: "from-indigo-500 to-purple-500",
    rating: 5,
    text: "The coding challenges were spot-on — not too easy, not too hard. The real-time voice interview felt natural, like talking to a senior engineer. Best interview prep I've ever used.",
  },
  {
    name: "Ananya Patel",
    role: "Product Manager at Amazon",
    avatar: "AP",
    gradient: "from-emerald-500 to-green-500",
    rating: 5,
    text: "As a fresher, I was nervous about interviews. HireRight's AI asked the right questions about my projects and fundamentals. The personalized study plan was a game-changer.",
  },
  {
    name: "Vikram Singh",
    role: "Senior DevOps at Flipkart",
    avatar: "VS",
    gradient: "from-amber-500 to-orange-500",
    rating: 5,
    text: "Even with 7 years of experience, I learned something new. The system design questions were challenging, and the proctoring gave my employer confidence in the results.",
  },
  {
    name: "Deepa Nair",
    role: "ML Engineer at Tesla",
    avatar: "DN",
    gradient: "from-blue-500 to-cyan-500",
    rating: 5,
    text: "The background verification was seamless. My verified profile got me 3x more interview calls. The AI matching connected me with roles that actually fit my skills.",
  },
  {
    name: "Arjun Reddy",
    role: "Full Stack Developer at Stripe",
    avatar: "AR",
    gradient: "from-purple-500 to-fuchsia-500",
    rating: 5,
    text: "I've used many interview platforms. HireRight is different — it actually adapts to how you perform. Got detailed feedback on my coding approach that I still use today.",
  },
];

export default function Testimonials() {
  const { onMouseMove } = useGlare<HTMLDivElement>();

  return (
    <section className="py-24 bg-[#0a0a1a] relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-[20%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-[20%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 glass rounded-full text-sm font-medium mb-4 text-indigo-400">
            Success Stories
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            <span className="text-white">Loved by </span>
            <span className="gradient-text">10,000+</span>
            <span className="text-white"> Professionals</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            See how HireRight helped candidates land their dream roles
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" onMouseMove={onMouseMove}>
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="glass-card card-glare rounded-2xl p-6 relative group"
            >
              {/* Quote icon */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-white/5 group-hover:text-indigo-500/20 transition-colors" />

              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Text */}
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${testimonial.gradient} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                  <p className="text-xs text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stat */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 glass rounded-full px-6 py-3">
            <div className="flex -space-x-2">
              {["PS", "RV", "AP", "VS", "DN"].map((initials, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-[#0a0a1a] flex items-center justify-center text-white text-[10px] font-bold"
                >
                  {initials}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-current" />
              ))}
            </div>
            <span className="text-sm text-gray-400">
              <span className="font-semibold text-white">4.9/5</span> average rating
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
