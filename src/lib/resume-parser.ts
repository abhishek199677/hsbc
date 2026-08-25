import OpenAI from "openai";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import * as mammoth from "mammoth";
import { fromPath } from "pdf2pic";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { ParsedResume } from "@/types/resume";

export type { ParsedResume, ParsedWorkExperience, ParsedProject } from "@/types/resume";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const RESUME_PARSING_PROMPT = `You are an expert resume parser. Extract structured information from the resume provided (text or image).
Handle ALL resume formats: structured, unstructured, tabular, OCR-scanned, and image-based resumes.
When data is in tables, extract from tables. When data is in free-form text, extract from paragraphs.

Return a JSON object with exactly these fields:
{
  "name": "Full name of the candidate or null",
  "email": "Primary email address or null",
  "phone": "Phone number with country code if available, or null",
  "currentRole": "Most recent job title/position or null",
  "totalExperience": "Total years of experience (e.g. '3-5 years', '5+ years', '10+ years') or null",
  "currentLocation": "City, State/Country or null",
  "skills": ["Array of technical skills", "programming languages", "tools", "frameworks", "soft skills"],
  "education": "Highest qualification with institution and year if available (e.g. 'B.Tech Computer Science, IIT Delhi, 2018') or null",
  "currentCompany": "Current/most recent employer name or null",
  "summary": "Professional summary or career objective (2-3 sentences) or null",
  "strengths": "Key strengths mentioned (comma-separated) or null",
  "linkedinUrl": "Full LinkedIn profile URL (https://linkedin.com/in/...) or null",
  "workExperience": [
    {
      "company": "Company name",
      "role": "Job title",
      "startDate": "Start date (e.g. 'Jan 2020', '2020-01', 'Jan 2020 - Present')",
      "endDate": "End date or 'Present' if current",
      "description": "Key responsibilities and achievements in 1-2 sentences"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Brief description of the project",
      "url": "Project URL if available or null",
      "technologies": ["technologies", "used"]
    }
  ],
  "keyAchievements": ["Notable achievements, awards, certifications, or accomplishments"],
  "certifications": ["Professional certifications like AWS Certified, PMP, etc."],
  "languages": ["Languages spoken with proficiency if mentioned"]
}

Rules:
- Extract ALL work experience entries in chronological order (most recent first)
- Extract ALL projects mentioned in the resume
- For skills, include both technical and soft skills
- For keyAchievements, include awards, recognitions, patents, publications, and notable accomplishments
- If a field is not found, use null for strings, [] for arrays, and [] for arrays of objects
- For tabular data (e.g. columns for Company, Role, Duration), extract each row as a workExperience entry
- For OCR/image resumes, read all text visible in the image
- Return ONLY valid JSON, no markdown, no other text`;

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
    currentCompany: null,
    summary: null,
    strengths: null,
    linkedinUrl: null,
    workExperience: [],
    projects: [],
    keyAchievements: [],
    certifications: [],
    languages: [],
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
    currentCompany: (parsed.currentCompany as string) || null,
    summary: (parsed.summary as string) || null,
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
          url: (p.url as string) || undefined,
          technologies: Array.isArray(p.technologies) ? (p.technologies as string[]) : undefined,
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
  };
}

function parseResumeFallback(text: string): ParsedResume {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;
  const phone = text.match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3,5}\)?[\s.-]?)?\d{6,10}/)?.[0]?.trim() || null;

  const ignoredHeadings = /^(resume|curriculum vitae|cv|profile|professional summary|summary|contact|personal)$/i;
  const name = lines.find((line) => {
    if (ignoredHeadings.test(line) || line.includes("@") || /\d{4,}/.test(line)) return false;
    return line.length >= 3 && line.length <= 80 && /^[\p{L}][\p{L} .'-]+$/u.test(line);
  }) || null;

  const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9._%-]+/i);
  const linkedinUrl = linkedinMatch ? `https://www.${linkedinMatch[0]}` : null;

  return {
    ...getDefaultParsedResume(),
    name,
    email,
    phone,
    linkedinUrl,
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

async function parseImageWithVision(base64Images: string[]): Promise<ParsedResume> {
  try {
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
      max_tokens: 2500,
      response_format: { type: "json_object" },
    });

    const contentText = response.choices[0]?.message?.content;
    console.log("[resume-parser] Vision API response received");
    if (!contentText) {
      console.error("[resume-parser] Vision API returned empty response");
      return getDefaultParsedResume();
    }

    const jsonMatch = contentText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[resume-parser] No JSON found in Vision response");
      return getDefaultParsedResume();
    }

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    console.log("[resume-parser] Vision parsing successful:", JSON.stringify(parsed, null, 2).slice(0, 500));
    return mapParsedResponse(parsed);
  } catch (error) {
    console.error("[resume-parser] Vision parsing failed:", error instanceof Error ? error.message : error);
    return getDefaultParsedResume();
  }
}

async function parseTextWithAI(text: string): Promise<ParsedResume> {
  try {
    console.log(`[resume-parser] Sending ${text.length} chars to GPT-4o-mini...`);
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: RESUME_PARSING_PROMPT },
        { role: "user", content: `Parse this resume:\n\n${text.slice(0, 12000)}` },
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    console.log("[resume-parser] Text AI response received");
    if (!content) {
      console.error("[resume-parser] Text AI returned empty response");
      return getDefaultParsedResume();
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[resume-parser] No JSON found in text AI response");
      return getDefaultParsedResume();
    }

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    console.log("[resume-parser] Text AI parsing successful:", JSON.stringify(parsed, null, 2).slice(0, 500));
    return mapParsedResponse(parsed);
  } catch (error) {
    console.error("[resume-parser] Text AI parsing failed:", error instanceof Error ? error.message : error);
    return getDefaultParsedResume();
  }
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
  return {
    name: ai.name || fallback.name,
    email: ai.email || fallback.email,
    phone: ai.phone || fallback.phone,
    currentRole: ai.currentRole,
    totalExperience: ai.totalExperience,
    currentLocation: ai.currentLocation || fallback.currentLocation,
    skills: ai.skills.length > 0 ? ai.skills : [],
    education: ai.education,
    currentCompany: ai.currentCompany,
    summary: ai.summary,
    strengths: ai.strengths,
    linkedinUrl: ai.linkedinUrl || fallback.linkedinUrl,
    workExperience: ai.workExperience,
    projects: ai.projects,
    keyAchievements: ai.keyAchievements,
    certifications: ai.certifications,
    languages: ai.languages,
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
    const text = await extractTextFromPDF(buffer);
    console.log(`[resume-parser] Extracted ${text.length} chars of text`);

    if (text.trim().length < 200) {
      console.log("[resume-parser] Text too short, trying image conversion...");
      const images = await convertPDFToImages(buffer);
      if (images.length > 0) {
        console.log(`[resume-parser] Converted ${images.length} pages to images, using Vision API`);
        return parseImageWithVision(images);
      }
      console.log("[resume-parser] Image conversion failed or produced no images");
    }

    console.log("[resume-parser] Using text AI parsing");
    const fallback = parseResumeFallback(text);
    const ai = await parseTextWithAI(text);
    return mergeParsedResults(ai, fallback);
  }

  if (ext === "docx" || ext === "doc") {
    console.log("[resume-parser] DOC/DOCX detected, extracting text...");
    const text = await extractTextFromDOCX(buffer);
    console.log(`[resume-parser] Extracted ${text.length} chars of text`);

    if (text.trim().length < 100) {
      console.log("[resume-parser] Text too short, returning defaults");
      return getDefaultParsedResume();
    }

    const fallback = parseResumeFallback(text);
    const ai = await parseTextWithAI(text);
    return mergeParsedResults(ai, fallback);
  }

  console.log("[resume-parser] Unknown file type, trying text AI parsing");
  const text = buffer.toString("utf-8");
  return parseTextWithAI(text);
}
