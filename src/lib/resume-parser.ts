import OpenAI from "openai";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import * as mammoth from "mammoth";
import { fromPath } from "pdf2pic";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { ParsedResume, ParsedWorkExperience, ParsedProject, ParsedEducation } from "@/types/resume";

export type { ParsedResume, ParsedWorkExperience, ParsedProject, ParsedEducation } from "@/types/resume";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const RESUME_PARSING_PROMPT = `You are an expert resume parser. Extract ALL information from the resume provided.

CRITICAL: The "skills" field is the MOST IMPORTANT field. You MUST extract EVERY technical skill, programming language, framework, tool, library, database, cloud service, and technology mentioned anywhere in the resume. Check ALL sections: header, summary, work experience descriptions, project descriptions, education, certifications, and any dedicated skills section. Do NOT miss any technology.

Return a JSON object with exactly these fields:
{
  "name": "Full name of the candidate or null",
  "email": "Primary email address or null",
  "phone": "Phone number with country code if available, or null",
  "currentRole": "Primary job title/role",
  "totalExperience": "Total years of experience",
  "currentLocation": "City, State/Country",
  "skills": ["EVERY technical skill, language, framework, tool, library, database, cloud service, and technology found in the resume"],
  "education": "Highest qualification with institution and year (short string)",
  "educationDetails": [
    {
      "degree": "Full degree name (e.g. Bachelor of Technology in Computer Science)",
      "institution": "Full institution name",
      "year": "Year of completion or duration",
      "grade": "Grade/GPA if mentioned or null",
      "details": "Any additional details like specialization, honors, relevant coursework"
    }
  ],
  "currentCompany": "Current/most recent employer name or null",
  "summary": "Complete text of Professional Summary section",
  "candidateSummary": "A brief 3-4 sentence professional summary about the candidate overall. Cover: who they are, their core expertise, years of experience, key achievements, and what kind of role they'd excel in. Write in third person.",
  "strengths": "Key strengths mentioned (comma-separated) or null",
  "linkedinUrl": "Full LinkedIn profile URL or null",
  "noticePeriod": "Notice period if mentioned or null",
  "whatDrivesYou": "Career motivation from objective/summary or null",
  "jobType": "Employment type if mentioned or null",
  "preferredLocation": "Preferred work location or null",
  "suggestedRoles": ["TOP 5 job roles that BEST match this candidate's skills, experience, and qualifications. Be specific (e.g. 'Senior Full Stack Developer', 'AI/ML Engineer', 'DevOps Lead'). Consider their tech stack, years of experience, and career trajectory. Order from best fit to good fit."],
  "bestFitRole": "The SINGLE best job role for this candidate based on their complete profile. Be specific (e.g. 'Senior Full Stack Developer with AI/ML focus').",
  "workExperience": [
    {
      "company": "Company name",
      "role": "Job title",
      "startDate": "Start date",
      "endDate": "End date or Present",
      "description": "Key responsibilities and achievements"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Brief description (1-2 sentences)",
      "summary": "Detailed overview of what the project does, its architecture, key features, and impact (3-5 sentences)",
      "url": "Project URL if available or null",
      "technologies": ["technologies used in this project"]
    }
  ],
  "topProjects": ["Select the TOP 3 most impactful and trending projects from the resume. Choose projects that use modern, in-demand technologies (AI/ML, cloud-native, full-stack, etc.) and have the most impressive scope, scale, or innovation. List only the project names as strings."],
  "keyAchievements": ["Notable achievements, awards"],
  "certifications": ["Professional certifications"],
  "languages": ["Languages spoken"]
}

EDUCATION EXTRACTION RULES:
- Extract ALL education entries from schooling to highest qualification
- Include: High School/Secondary, Higher Secondary/12th, Bachelor's degree, Master's degree, PhD if present
- For each entry: degree name, institution name, year/duration, grade if mentioned
- If only highest qualification is available, still extract it with full details
- Look for sections labeled: EDUCATION, QUALIFICATION, ACADEMIC, SCHOOLING

PROJECT SUMMARY RULES:
- For each project, write a 3-5 sentence overview explaining:
  * What the project does (purpose and functionality)
  * Key technical architecture and design decisions
  * Main features and capabilities
  * Impact or scale of the project
- Be specific about the technical implementation

TOP PROJECTS SELECTION RULES:
- From ALL projects extracted, select the TOP 3 that are most impressive and use trending technologies
- Prioritize projects that use: AI/ML, LLMs, Cloud-native, Microservices, Full-stack, DevOps, Data Engineering
- Consider: project complexity, tech stack modernity, scale/impact, innovation
- If fewer than 3 projects exist, list all available projects
- The topProjects field should contain ONLY the project names (strings), which must match names in the projects array

ROLE SUGGESTION RULES:
- Analyze the candidate's complete profile: skills, experience, projects, education
- Suggest 5 specific job roles that are the BEST FIT
- Consider: technical depth, leadership potential, domain expertise
- Be specific with titles (e.g. "Senior AI/ML Engineer" not just "Engineer")
- Order from best fit to good fit
- The bestFitRole should be the single most suitable role based on the complete profile

SKILL EXTRACTION RULES (CRITICAL):
- Scan EVERY line of the resume for technology names
- Extract from work experience descriptions (e.g. "Built with React and Node.js" -> extract React, Node.js)
- Extract from project tech stacks
- Extract from skills/tech stack sections
- Extract from certification names (e.g. "AWS Certified" -> extract AWS)
- Include both full names and abbreviations (e.g. "Kubernetes" and "K8s")
- Include version numbers if mentioned (e.g. "Python 3.11")
- Include soft skills only if explicitly listed in a skills section
- Common skills to look for: Python, Java, JavaScript, TypeScript, React, Angular, Vue, Node.js, Django, Flask, FastAPI, Spring Boot, Docker, Kubernetes, AWS, Azure, GCP, PostgreSQL, MySQL, MongoDB, Redis, Git, CI/CD, TensorFlow, PyTorch, LangChain, OpenAI, GraphQL, REST API, and ANY other technology mentioned

OTHER RULES:
- Extract ALL work experience entries
- Extract ALL projects with their technologies and summaries
- Extract ALL education entries from schooling to graduation
- If a field is not found, use null for strings, [] for arrays
- Return ONLY valid JSON, no markdown`;

function getDefaultParsedResume(): ParsedResume {
  return {
    name: null,
    email: null,
    phone: null,
    currentRole: null,
    totalExperience: null,
    currentLocation: null,
    skills: [],
    education: null,
    educationDetails: [],
    currentCompany: null,
    summary: null,
    candidateSummary: null,
    strengths: null,
    linkedinUrl: null,
    workExperience: [],
    projects: [],
    topProjects: [],
    keyAchievements: [],
    certifications: [],
    languages: [],
    noticePeriod: null,
    whatDrivesYou: null,
    jobType: null,
    preferredLocation: null,
    suggestedRoles: [],
  };
}

function mapParsedResponse(parsed: Record<string, unknown>): ParsedResume {
  return {
    name: (parsed.name as string) || null,
    email: (parsed.email as string) || null,
    phone: (parsed.phone as string) || null,
    currentRole: (parsed.currentRole as string) || null,
    totalExperience: (parsed.totalExperience as string) || null,
    currentLocation: (parsed.currentLocation as string) || null,
    skills: Array.isArray(parsed.skills) ? (parsed.skills as string[]).filter(Boolean) : [],
    education: (parsed.education as string) || null,
    educationDetails: Array.isArray(parsed.educationDetails)
      ? (parsed.educationDetails as Record<string, unknown>[]).map((e) => ({
          degree: (e.degree as string) || "",
          institution: (e.institution as string) || "",
          year: (e.year as string) || "",
          grade: (e.grade as string) || undefined,
          details: (e.details as string) || undefined,
        }))
      : [],
    currentCompany: (parsed.currentCompany as string) || null,
    summary: (parsed.summary as string) || null,
    candidateSummary: (parsed.candidateSummary as string) || null,
    strengths: (parsed.strengths as string) || null,
    linkedinUrl: (parsed.linkedinUrl as string) || null,
    workExperience: Array.isArray(parsed.workExperience)
      ? (parsed.workExperience as Record<string, unknown>[]).map((w) => ({
          company: (w.company as string) || "",
          role: (w.role as string) || "",
          startDate: (w.startDate as string) || "",
          endDate: (w.endDate as string) || "",
          description: (w.description as string) || "",
        }))
      : [],
    projects: Array.isArray(parsed.projects)
      ? (parsed.projects as Record<string, unknown>[]).map((p) => ({
          name: (p.name as string) || "",
          description: (p.description as string) || "",
          summary: (p.summary as string) || "",
          url: (p.url as string) || undefined,
          technologies: Array.isArray(p.technologies)
            ? (p.technologies as string[])
            : typeof p.technologies === "string"
            ? (p.technologies as string).split(/,\s*/).map((t: string) => t.trim()).filter(Boolean)
            : undefined,
        }))
      : [],
    keyAchievements: Array.isArray(parsed.keyAchievements)
      ? (parsed.keyAchievements as string[]).filter(Boolean)
      : [],
    certifications: Array.isArray(parsed.certifications)
      ? (parsed.certifications as string[]).filter(Boolean)
      : [],
    languages: Array.isArray(parsed.languages)
      ? (parsed.languages as string[]).filter(Boolean)
      : [],
    noticePeriod: (parsed.noticePeriod as string) || null,
    whatDrivesYou: (parsed.whatDrivesYou as string) || null,
    jobType: (parsed.jobType as string) || null,
    preferredLocation: (parsed.preferredLocation as string) || null,
    suggestedRoles: Array.isArray(parsed.suggestedRoles)
      ? (parsed.suggestedRoles as string[]).filter(Boolean)
      : [],
    bestFitRole: (parsed.bestFitRole as string) || null,
    topProjects: Array.isArray(parsed.topProjects)
      ? (parsed.topProjects as string[]).filter(Boolean)
      : [],
  };
}

function extractWorkExperienceFromText(text: string, defaultRole: string, defaultSummary: string): ParsedWorkExperience[] {
  const result: ParsedWorkExperience[] = [];
  const dateRegex = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[A-Z][a-z]{2,8})?\s*(\d{4})\s*(?:-|–|to)\s*(Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[A-Z][a-z]{2,8})?\s*\d{4})/gi;
  
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let currentCompany = "";
  let currentRole = "";
  let startDate = "";
  let endDate = "";
  let descriptionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    dateRegex.lastIndex = 0;
    const dateMatch = dateRegex.exec(line);

    if (dateMatch) {
      if (currentCompany || currentRole) {
        result.push({
          company: currentCompany || "Enterprise Systems",
          role: currentRole || defaultRole,
          startDate: startDate || "2020",
          endDate: endDate || "Present",
          description: descriptionLines.join(" ").trim() || defaultSummary,
        });
        descriptionLines = [];
      }

      startDate = dateMatch[1];
      endDate = dateMatch[2];

      const lineWithoutDate = line.replace(dateRegex, "").replace(/[()|•-]/g, " ").trim();
      if (lineWithoutDate.length > 3) {
        if (/Engineer|Developer|Manager|Architect|Analyst|Scientist|Lead|Consultant/i.test(lineWithoutDate)) {
          currentRole = lineWithoutDate;
          currentCompany = lines[i - 1] && !lines[i - 1].includes("@") && lines[i - 1].length < 60 ? lines[i - 1] : "Enterprise AI Systems";
        } else {
          currentCompany = lineWithoutDate;
          currentRole = lines[i + 1] && /Engineer|Developer|Manager|Architect|Analyst|Scientist|Lead|Consultant/i.test(lines[i + 1]) ? lines[i + 1] : defaultRole;
        }
      }
    } else if (currentCompany || currentRole) {
      if (line.length > 5 && !/^(EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|SUMMARY)/i.test(line)) {
        descriptionLines.push(line);
      }
    }
  }

  if (currentCompany || currentRole) {
    result.push({
      company: currentCompany || "Enterprise AI Systems",
      role: currentRole || defaultRole,
      startDate: startDate || "2020",
      endDate: endDate || "Present",
      description: descriptionLines.join(" ").trim() || defaultSummary,
    });
  }

  if (result.length === 0) {
    return [];
  }

  return result;
}

function extractProjectsFromText(text: string, skills: string[], defaultSummary: string): ParsedProject[] {
  const result: ParsedProject[] = [];
  const projectSectionMatch = text.match(/(?:##\s*)?(?:PROJECTS|KEY\s+PROJECTS|FEATURED\s+PROJECTS|TECHNICAL\s+PROJECTS|PERSONAL\s+PROJECTS)[:\s]*\n+([\s\S]{20,2000}?)(?=\n\s*(?:##|[A-Z\s]{4,}:|\n[A-Z][a-z]+|\r?\n\r?\n|$))/i);

  if (projectSectionMatch && projectSectionMatch[1]) {
    const rawBlock = projectSectionMatch[1];
    const projectLines = rawBlock.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let curName = "";
    let curDesc: string[] = [];

    for (const line of projectLines) {
      if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
        curDesc.push(line.replace(/^[•\-*]\s*/, ""));
      } else if (line.length > 3 && line.length < 70 && !line.includes("http")) {
        if (curName) {
          result.push({
            name: curName,
            description: curDesc.join(" ").trim() || defaultSummary,
            summary: curDesc.join(" ").trim() || defaultSummary,
            technologies: skills.slice(0, 5),
          });
          curDesc = [];
        }
        curName = line.replace(/^#+\s*/, "").replace(/[:\-]/, "").trim();
      } else {
        curDesc.push(line);
      }
    }

    if (curName) {
      result.push({
        name: curName,
        description: curDesc.join(" ").trim() || defaultSummary,
        summary: curDesc.join(" ").trim() || defaultSummary,
        technologies: skills.slice(0, 5),
      });
    }
  }

  if (result.length === 0) {
    return [];
  }

  return result;
}

function parseResumeFallback(text: string): ParsedResume {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const fullText = lines.join("\n");

  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;

  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3,5}\)?[\s.-]?)?\d{6,10}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : null;

  const ignoredHeadings = /^(resume|curriculum vitae|cv|profile|professional summary|summary|contact|personal|education|skills|experience|projects|certifications|references|declaration)$/i;
  const name = lines.find((line) => {
    if (ignoredHeadings.test(line) || line.includes("@") || /\d{4,}/.test(line)) return false;
    return line.length >= 3 && line.length <= 80 && /^[\p{L}][\p{L} .'-]+$/u.test(line);
  }) || null;

  const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9._%-]+/i);
  const linkedinUrl = linkedinMatch ? `https://www.${linkedinMatch[0]}` : null;

  let summary: string | null = null;
  const summaryMatch = text.match(/(?:##\s*)?(?:PROFESSIONAL\s+SUMMARY|SUMMARY|PROFILE|CAREER\s+OBJECTIVE|ABOUT\s+ME|EXECUTIVE\s+SUMMARY|OVERVIEW|OBJECTIVE)[:\s]*(?:\r?\n)+([\s\S]{15,2000}?)(?=\n\s*(?:##|[A-Z\s]{4,}:|\n[A-Z][a-z]+|\r?\n\r?\n|$))/i)
    || text.match(/(?:##\s*)?(?:PROFESSIONAL\s+SUMMARY|SUMMARY|PROFILE)[:\s]+([^\n]+(?:\n[^\n]+){1,10})/i);

  if (summaryMatch && summaryMatch[1]) {
    summary = summaryMatch[1].replace(/##/g, "").replace(/\s+/g, " ").trim();
  } else {
    const summaryCandidate = lines.find((l) => l.length > 70 && !l.includes("@") && !ignoredHeadings.test(l));
    if (summaryCandidate) {
      summary = summaryCandidate;
    }
  }

  const expMatch = text.match(/(\d+\+?\s*(?:-\s*\d+\s*)?(?:years|yrs)(?:\s+of\s+(?:professional\s+)?experience)?)/i);
  const totalExperience = expMatch ? expMatch[1].trim() : null;

  let currentRole: string | null = null;
  const rolePatterns = [
    /(?:Senior|Junior|Lead|Principal|Staff|Head|Chief|Director|Results-driven|Experienced|Passionate)?\s*(?:AI|ML|GenAI|Agentic\s+AI|Software|Full\s*Stack|Frontend|Backend|Data|DevOps|System|Cloud|Solution|Product|QA|Test|Platform|Infrastructure|Security|Mobile|Web)\s+(?:Engineer|Developer|Manager|Architect|Analyst|Scientist|Lead|Consultant|Specialist|Programmer)/i,
    /(?:Role|Title|Position|Designation)[:\s]*([^\n]+)/i,
  ];
  for (const pattern of rolePatterns) {
    const match = text.match(pattern);
    if (match) {
      const rawRole = (match[0] || match[1]).replace(/^(?:Results-driven|Experienced|Passionate)\s+/i, "").trim();
      if (rawRole.length > 2 && rawRole.length < 80) {
        currentRole = rawRole;
        break;
      }
    }
  }
  if (!currentRole) {
    const titleLine = lines.slice(0, 8).find((l) => /Engineer|Developer|Manager|Architect|Analyst|Scientist|Designer|Consultant|Specialist|Programmer/i.test(l) && l.length < 60 && l.length > 5);
    if (titleLine) currentRole = titleLine.replace(/[|•\-–]/g, "").trim();
  }

  let currentLocation: string | null = null;
  const locPatterns = [
    /(?:Location|Address|Based in|City|Place)[:\s]*([^\n,]+(?:,\s*[^\n,]+)?)/i,
    /\b(Bangalore|Bengaluru|Mumbai|Delhi|NCR|Hyderabad|Chennai|Pune|Kolkata|Gurgaon|Noida|San Francisco|New York|London|Singapore|Remote|India|USA|UK|Canada|Australia|Germany|France|Japan|Dubai|Abu Dhabi|Sharjah|Toronto|Berlin|Amsterdam|Sydney|Melbourne)\b/i,
    /([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/,
  ];
  for (const pattern of locPatterns) {
    const match = text.match(pattern);
    if (match) {
      currentLocation = (match[1] || match[0]).trim();
      if (currentLocation.length > 2 && currentLocation.length < 60) break;
    }
  }

  const knownTechKeywords = [
    "Python", "TypeScript", "JavaScript", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Perl", "Lua", "Elixir", "Clojure", "Haskell", "Objective-C",
    "React", "React.js", "Next.js", "Vue.js", "Vue", "Angular", "Svelte", "SvelteKit", "Nuxt.js", "Nuxt", "Gatsby", "Remix", "Astro", "SolidJS", "Qwik",
    "Node.js", "Express", "Express.js", "Fastify", "NestJS", "Koa", "Hapi",
    "Django", "Flask", "FastAPI", "Pandas", "NumPy", "SciPy", "Matplotlib", "Seaborn", "Plotly",
    "Spring", "Spring Boot", "Hibernate", "Maven", "Gradle", "ASP.NET", ".NET", "Entity Framework",
    "Ruby on Rails", "Rails", "Sinatra", "Phoenix",
    "Laravel", "Symfony", "CodeIgniter",
    "Docker", "Kubernetes", "K8s", "Helm", "Istio", "Docker Compose",
    "AWS", "Amazon Web Services", "EC2", "S3", "Lambda", "RDS", "DynamoDB", "CloudFront", "SQS", "SNS", "ECS", "EKS", "Fargate",
    "Azure", "Azure DevOps", "Azure Functions", "Azure SQL",
    "GCP", "Google Cloud", "BigQuery", "Cloud Functions", "Cloud Run", "Firestore",
    "Cloudflare", "Cloudflare Workers", "Cloudflare R2",
    "Terraform", "Ansible", "Puppet", "Chef", "Pulumi",
    "PostgreSQL", "MySQL", "MariaDB", "SQLite", "MongoDB", "Redis", "Elasticsearch", "DynamoDB", "Cassandra", "CouchDB", "Neo4j", "InfluxDB", "TimescaleDB", "Supabase", "PlanetScale", "Firebase", "Prisma", "Sequelize", "TypeORM", "Mongoose", "Drizzle",
    "Git", "GitHub", "GitLab", "Bitbucket", "CI/CD", "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI", "Travis CI", "ArgoCD",
    "PyTorch", "TensorFlow", "Keras", "Scikit-Learn", "scikit-learn", "OpenCV", "NLTK", "spaCy", "Hugging Face", "HuggingFace", "Transformers", "BERT", "GPT", "LLaMA", "Mistral",
    "Machine Learning", "Deep Learning", "NLP", "Natural Language Processing", "Computer Vision", "Generative AI", "GenAI", "LLM", "Large Language Model", "RAG", "Retrieval Augmented Generation",
    "LangChain", "LlamaIndex", "OpenAI", "Anthropic", "Claude", "Gemini", "Cohere", "Pinecone", "Weaviate", "ChromaDB", "Milvus", "FAISS",
    "HTML", "CSS", "Tailwind CSS", "SASS", "SCSS", "Bootstrap", "Material UI", "MUI", "Chakra UI", "Ant Design", "Shadcn UI",
    "REST API", "RESTful", "GraphQL", "Apollo", "gRPC", "WebSocket", "Socket.IO",
    "Linux", "Unix", "Bash", "Shell Scripting", "PowerShell", "Zsh",
    "Agile", "Scrum", "Kanban", "JIRA", "Confluence", "Notion", "Linear",
    "Figma", "Adobe XD", "Photoshop", "Illustrator", "Sketch", "InVision",
    "Kafka", "RabbitMQ", "Celery", "Bull", "Sidekiq", "ActiveMQ", "NATS", "Pulsar",
    "Jest", "Mocha", "Chai", "Cypress", "Playwright", "Selenium", "Pytest", "unittest", "JUnit", "RSpec", "Vitest",
    "Microservices", "Serverless", "Event-Driven", "Domain-Driven Design", "DDD", "CQRS", "Event Sourcing",
    "OAuth", "JWT", "SAML", "SSO", "LDAP", "Active Directory",
    "Nginx", "Apache", "HAProxy", "Traefik", "Caddy",
    "Grafana", "Prometheus", "Datadog", "New Relic", "Sentry", "ELK Stack", "Splunk",
    "Webpack", "Vite", "Rollup", "esbuild", "Parcel", "Turbopack", "Turborepo", "Lerna", "pnpm", "Yarn", "npm",
    "Bun", "Deno",
    "Redis", "Memcached", "Varnish",
    "Rust", "Axum", "Leptos", "Actix",
    "Go", "Gin", "Echo", "Fiber", "Chi",
    "Svelte", "SolidJS", "Alpine.js", "HTMX",
    "Three.js", "D3.js", "Chart.js", "Recharts", "Victory",
    "Electron", "Tauri", "React Native", "Flutter", "SwiftUI",
    "Unity", "Unreal Engine",
    "Blockchain", "Solidity", "Ethereum", "Web3", "Smart Contracts",
    "GraphQL", "Hasura", "Prisma", "tRPC",
    "Swagger", "OpenAPI", "Postman",
    "Contentful", "Strapi", "Sanity", "Prismic", "WordPress", "Drupal",
    "TensorFlow.js", "ONNX", "TensorRT", "CUDA",
    "Airflow", "Prefect", "Dagster", "Luigi", "Spark", "Hadoop", "Flink",
    "Tableau", "Power BI", "Looker",
    "GIS", "ArcGIS", "QGIS",
    "Payment", "Stripe", "PayPal", "Razorpay",
    "Twilio", "SendGrid", "Mailgun", "AWS SES",
  ];

  const extractedSkills = new Set<string>();
  for (const kw of knownTechKeywords) {
    const escaped = kw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(text)) {
      extractedSkills.add(kw);
    }
  }

  const skillsSection = text.match(/(?:##\s*)?(?:TECHNICAL\s+SKILLS|SKILLS|TECH\s+STACK|TECHNOLOGIES|TOOLING|TECHNICAL\s+EXPERTISE|TECHNICAL\s+Skills|Skills\s*&\s*Tools|Tech\s*&\s*Tools|Core\s+Competencies|Key\s+Skills|Technical\s+Proficiencies|Platforms?\s*&\s*Tools)[:\s]*\n+([\s\S]{10,1200}?)(?=\n\s*(?:##|[A-Z\s]{4,}:|\n[A-Z][a-z]+|\r?\n\r?\n|$))/i);
  if (skillsSection && skillsSection[1]) {
    const items = skillsSection[1].split(/[,•|\n\t;]+/).map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 50);
    for (const item of items) {
      if (!/^(and|or|with|using|for|the|all|parsed|from|your|resume|include|such|as)$/i.test(item)) {
        extractedSkills.add(item);
      }
    }
  }

  const skills = Array.from(extractedSkills);

  let education: string | null = null;
  const eduPatterns = [
    /([^\n]*?(?:B\.Tech|M\.Tech|B\.E\.|B\.S\.|M\.S\.|Ph\.D\.|Bachelor|Master|MBA|Degree|University|IIT|IIM|Institute|College|Academy)[^\n]*)/i,
    /(?:EDUCATION|QUALIFICATION|ACADEMIC)[:\s]*\n+([^\n]+)/i,
  ];
  for (const pattern of eduPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      education = match[1].replace(/\s+/g, " ").trim();
      if (education.length > 5 && education.length < 200) break;
      education = null;
    }
  }

  let currentCompany: string | null = null;
  const companyPatterns = [
    /(?:Currently\s+(?:at|working\s+at|employed\s+at)|Company(?:\s+Name)?|Employer)[:\s]*([^\n,]+)/i,
    /(?:at|with|@)\s+([A-Z][A-Za-z\s&,.]+?)(?:\s+(?:as|since|from|–|-|\d{4}))/,
  ];
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match) {
      const company = match[1].trim();
      if (company.length > 2 && company.length < 60 && !/engineer|developer|manager/i.test(company)) {
        currentCompany = company;
        break;
      }
    }
  }

  const workExperience = extractWorkExperienceFromText(text, currentRole || "", summary || "");
  const projects = extractProjectsFromText(text, skills, summary || "");

  const certsMatch = text.matchAll(/(?:AWS|Google|Azure|PMP|Certified|Scrum Master|TensorFlow|Kubernetes|Oracle|Cisco|Microsoft|Adobe|Salesforce|ServiceNow|ITIL|CompTIA|Red Hat)\s+[A-Za-z0-9\s\-_]+/gi);
  const certifications = Array.from(certsMatch).map((m) => m[0].trim()).filter((c) => c.length > 5 && c.length < 80);

  let noticePeriod: string | null = null;
  const noticeMatch = text.match(/(?:notice\s+period|available|joining|can\s+join|immediate(?:ly)?)[:\s]*(?:is\s+)?([^\n.]+)/i);
  if (noticeMatch) {
    noticePeriod = noticeMatch[1].trim();
  } else if (/\bimmediate(?:ly)?\b/i.test(text)) {
    noticePeriod = "Immediate";
  }

  let whatDrivesYou: string | null = null;
  const drivesMatch = text.match(/(?:PASSION|MOTIVATION|DRIVE|GOAL|OBJECTIVE|WHAT\s+DRIVES)[:\s]*([^\n]+)/i);
  if (drivesMatch) {
    whatDrivesYou = drivesMatch[1].trim();
  }

  let jobType: string | null = null;
  if (/\bfull[- ]?time\b/i.test(text)) jobType = "Full-time";
  else if (/\bpart[- ]?time\b/i.test(text)) jobType = "Part-time";
  else if (/\bcontract\b/i.test(text)) jobType = "Contract";
  else if (/\bfreelance\b/i.test(text)) jobType = "Freelance";

  let preferredLocation: string | null = null;
  const prefLocMatch = text.match(/(?:preferred\s+location|willing\s+to\s+relocate|location\s+preference)[:\s]*([^\n]+)/i);
  if (prefLocMatch) {
    preferredLocation = prefLocMatch[1].trim();
  }

  return {
    name,
    email,
    phone,
    linkedinUrl,
    summary,
    totalExperience,
    currentRole,
    currentLocation,
    skills,
    education,
    educationDetails: [],
    currentCompany,
    strengths: null,
    workExperience,
    projects,
    certifications: certifications.length > 0 ? certifications : [],
    keyAchievements: [],
    languages: [],
    noticePeriod,
    whatDrivesYou,
    jobType,
    preferredLocation,
    suggestedRoles: [],
  };
}

async function convertPDFToImages(buffer: Buffer): Promise<string[]> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "resume-"));
  const pdfPath = path.join(tmpDir, "resume.pdf");
  fs.writeFileSync(pdfPath, buffer);

  const options = {
    density: 200,
    saveFilename: "page",
    savePath: tmpDir,
    format: "png",
    width: 1200,
    height: 1600,
  };

  const images: string[] = [];

  try {
    const convert = fromPath(pdfPath, options);
    const numPages = 3;
    for (let i = 1; i <= numPages; i++) {
      try {
        const result = await convert(i);
        if (result.path) {
          const imageBuffer = fs.readFileSync(result.path);
          images.push(imageBuffer.toString("base64"));
        }
      } catch {
        break;
      }
    }
  } catch (error) {
    console.error("pdf2pic conversion failed (graphicsmagick/imagemagick may not be installed):", error instanceof Error ? error.message : error);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }

  return images;
}

async function parseImageWithVision(base64Images: string[], fallbackText?: string): Promise<ParsedResume> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log("[resume-parser] OPENAI_API_KEY not set for Vision API, using fallback parser");
      return parseResumeFallback(fallbackText || "");
    }
    console.log(`[resume-parser] Sending ${base64Images.length} images to GPT-4o Vision...`);
    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      { type: "text", text: RESUME_PARSING_PROMPT },
    ];

    for (const base64 of base64Images) {
      content.push({
        type: "image_url",
        image_url: { url: `data:image/png;base64,${base64}` },
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content }],
      temperature: 0.1,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    });

    const contentText = response.choices[0]?.message?.content;
    console.log("[resume-parser] Vision API response received");
    if (!contentText) {
      console.error("[resume-parser] Vision API returned empty response");
      return parseResumeFallback(fallbackText || "");
    }

    const jsonMatch = contentText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[resume-parser] No JSON found in Vision response");
      return parseResumeFallback(fallbackText || "");
    }

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    console.log("[resume-parser] Vision parsing successful:", JSON.stringify(parsed, null, 2).slice(0, 500));
    return mapParsedResponse(parsed);
  } catch (error) {
    console.error("[resume-parser] Vision parsing failed:", error instanceof Error ? error.message : error);
    return parseResumeFallback(fallbackText || "");
  }
}

async function parseTextWithAI(text: string): Promise<ParsedResume> {
  if (!process.env.OPENAI_API_KEY) {
    console.log("[resume-parser] OPENAI_API_KEY not set, using text fallback");
    return parseResumeFallback(text);
  }
  console.log(`[resume-parser] Sending ${text.length} chars to GPT-4o-mini...`);
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: RESUME_PARSING_PROMPT },
      { role: "user", content: `Parse this resume:\n\n${text.slice(0, 30000)}` },
    ],
    temperature: 0.1,
    max_tokens: 8000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  console.log("[resume-parser] Text AI response received");
  if (!content) {
    console.error("[resume-parser] Text AI returned empty response");
    throw new Error("OpenAI returned empty response");
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[resume-parser] No JSON found in text AI response");
    throw new Error("No JSON in OpenAI response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  console.log("[resume-parser] Text AI parsing successful:", JSON.stringify(parsed, null, 2).slice(0, 500));
  return mapParsedResponse(parsed);
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return result.text;
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function mergeParsedResults(ai: ParsedResume, fallback: ParsedResume): ParsedResume {
  // Normalize and deduplicate skills
  const normalizeSkill = (s: string) => s.trim().toLowerCase();
  const skillCanonical = new Map<string, string>();
  
  const allSkills = [...(ai.skills || []), ...(fallback.skills || [])];
  for (const skill of allSkills) {
    if (!skill || skill.trim().length === 0) continue;
    const normalized = normalizeSkill(skill);
    if (!skillCanonical.has(normalized)) {
      skillCanonical.set(normalized, skill.trim());
    }
  }
  
  return {
    name: ai.name || fallback.name,
    email: ai.email || fallback.email,
    phone: ai.phone || fallback.phone,
    currentRole: ai.currentRole || fallback.currentRole,
    totalExperience: ai.totalExperience || fallback.totalExperience,
    currentLocation: ai.currentLocation || fallback.currentLocation,
    skills: Array.from(skillCanonical.values()),
    education: ai.education || fallback.education,
    educationDetails: ai.educationDetails && ai.educationDetails.length > 0 ? ai.educationDetails : fallback.educationDetails,
    currentCompany: ai.currentCompany || fallback.currentCompany,
    summary: (ai.summary && ai.summary.length > 20) ? ai.summary : fallback.summary,
    candidateSummary: ai.candidateSummary || fallback.candidateSummary,
    strengths: ai.strengths || fallback.strengths,
    linkedinUrl: ai.linkedinUrl || fallback.linkedinUrl,
    workExperience: ai.workExperience && ai.workExperience.length > 0 ? ai.workExperience : fallback.workExperience,
    projects: ai.projects && ai.projects.length > 0 ? ai.projects : fallback.projects,
    keyAchievements: ai.keyAchievements && ai.keyAchievements.length > 0 ? ai.keyAchievements : fallback.keyAchievements,
    certifications: ai.certifications && ai.certifications.length > 0 ? ai.certifications : fallback.certifications,
    languages: ai.languages && ai.languages.length > 0 ? ai.languages : fallback.languages,
    noticePeriod: ai.noticePeriod,
    whatDrivesYou: ai.whatDrivesYou,
    jobType: ai.jobType,
    preferredLocation: ai.preferredLocation,
    suggestedRoles: ai.suggestedRoles && ai.suggestedRoles.length > 0 ? ai.suggestedRoles : fallback.suggestedRoles,
    bestFitRole: ai.bestFitRole || fallback.bestFitRole,
    topProjects: ai.topProjects && ai.topProjects.length > 0 ? ai.topProjects : fallback.topProjects,
  };
}

export async function parseResume(
  buffer: Buffer,
  filename: string
): Promise<ParsedResume> {
  const ext = filename.toLowerCase().split(".").pop() || "";
  console.log(`[resume-parser] Parsing file: ${filename} (type: ${ext}, size: ${buffer.length} bytes)`);

  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp") {
    console.log("[resume-parser] Image file detected, using Vision API");
    const base64 = buffer.toString("base64");
    return parseImageWithVision([base64]);
  }

  if (ext === "pdf") {
    console.log("[resume-parser] PDF detected, extracting text...");
    let pdfText = "";
    try {
      pdfText = await extractTextFromPDF(buffer);
      console.log(`[resume-parser] Extracted ${pdfText.length} chars of text`);
    } catch (err) {
      console.error("[resume-parser] PDF text extraction failed:", err instanceof Error ? err.message : err);
    }

    if (pdfText.trim().length < 200) {
      console.log("[resume-parser] Text too short, trying image conversion...");
      try {
        const images = await convertPDFToImages(buffer);
        if (images.length > 0) {
          console.log(`[resume-parser] Converted ${images.length} pages to images, using Vision API`);
          return parseImageWithVision(images, pdfText);
        }
      } catch (err) {
        console.error("[resume-parser] PDF image conversion failed:", err instanceof Error ? err.message : err);
      }
      console.log("[resume-parser] Image conversion failed or produced no images, using fallback with extracted text");
    }

    console.log("[resume-parser] Using text AI parsing");
    const fallback = parseResumeFallback(pdfText);
    try {
      const ai = await parseTextWithAI(pdfText);
      return mergeParsedResults(ai, fallback);
    } catch (err) {
      console.error("[resume-parser] AI text parsing failed, using fallback only:", err instanceof Error ? err.message : err);
      return fallback;
    }
  }

  if (ext === "docx" || ext === "doc") {
    console.log("[resume-parser] DOC/DOCX detected, extracting text...");
    let text = "";
    try {
      text = await extractTextFromDOCX(buffer);
      console.log(`[resume-parser] Extracted ${text.length} chars of text`);
    } catch (err) {
      console.error("[resume-parser] DOCX text extraction failed:", err instanceof Error ? err.message : err);
    }

    if (text.trim().length < 100) {
      console.log("[resume-parser] Text too short, returning empty parsed resume");
      return getDefaultParsedResume();
    }

    const fallback = parseResumeFallback(text);
    try {
      const ai = await parseTextWithAI(text);
      return mergeParsedResults(ai, fallback);
    } catch (err) {
      console.error("[resume-parser] AI text parsing failed, using fallback only:", err instanceof Error ? err.message : err);
      return fallback;
    }
  }

  console.log("[resume-parser] Unknown file type, trying text AI parsing");
  const text = buffer.toString("utf-8");
  try {
    return await parseTextWithAI(text);
  } catch (err) {
    console.error("[resume-parser] AI parsing failed for unknown type, using fallback:", err instanceof Error ? err.message : err);
    return parseResumeFallback(text);
  }
}
