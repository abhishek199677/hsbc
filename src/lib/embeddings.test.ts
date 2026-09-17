import { describe, it, expect, vi } from "vitest";

vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      constructor() {}
    },
  };
});

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("./openai-usage", () => ({ trackedEmbedding: vi.fn() }));

import { profileToText, jobToText } from "./embeddings";

describe("profileToText", () => {
  it("converts all profile fields to text", () => {
    const text = profileToText({
      currentRole: "Software Engineer",
      totalExperience: "5 years",
      skills: "React, Node.js, TypeScript",
      aboutYou: "Passionate developer",
      education: "B.Tech Computer Science",
      currentCompany: "TechCorp",
      preferredLocation: "Bangalore",
      jobType: "Full-time",
    });
    expect(text).toContain("Role: Software Engineer");
    expect(text).toContain("Experience: 5 years");
    expect(text).toContain("Skills: React, Node.js, TypeScript");
    expect(text).toContain("About: Passionate developer");
    expect(text).toContain("Education: B.Tech Computer Science");
    expect(text).toContain("Company: TechCorp");
    expect(text).toContain("Location: Bangalore");
    expect(text).toContain("Job Type: Full-time");
  });

  it("handles null fields", () => {
    const text = profileToText({
      currentRole: "Developer",
      totalExperience: null,
      skills: null,
    });
    expect(text).toContain("Role: Developer");
    expect(text).not.toContain("Experience");
    expect(text).not.toContain("Skills");
  });

  it("handles undefined fields", () => {
    const text = profileToText({});
    expect(text).toBe("");
  });

  it("joins fields with periods", () => {
    const text = profileToText({
      currentRole: "Dev",
      skills: "JS",
    });
    expect(text).toContain(". ");
  });
});

describe("jobToText", () => {
  it("converts required fields to text", () => {
    const text = jobToText({
      title: "Frontend Developer",
      description: "Build UIs",
    });
    expect(text).toContain("Title: Frontend Developer");
    expect(text).toContain("Description: Build UIs");
  });

  it("converts all optional fields", () => {
    const text = jobToText({
      title: "Backend Developer",
      description: "Build APIs",
      requiredSkills: "Node.js, Python",
      preferredSkills: "Go, Rust",
      location: "Remote",
      experienceLevel: "Senior",
      employmentType: "Full-time",
    });
    expect(text).toContain("Required Skills: Node.js, Python");
    expect(text).toContain("Preferred Skills: Go, Rust");
    expect(text).toContain("Location: Remote");
    expect(text).toContain("Level: Senior");
    expect(text).toContain("Type: Full-time");
  });

  it("handles null optional fields", () => {
    const text = jobToText({
      title: "Dev",
      description: "Code",
      requiredSkills: null,
      preferredSkills: null,
    });
    expect(text).toContain("Title: Dev");
    expect(text).not.toContain("Required Skills");
    expect(text).not.toContain("Preferred Skills");
  });
});
