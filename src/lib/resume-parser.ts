import OpenAI from "openai";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import * as mammoth from "mammoth";
import { fromPath } from "pdf2pic";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  currentRole: string | null;
  totalExperience: string | null;
  currentLocation: string | null;
  skills: string[];
  education: string | null;
  currentCompany: string | null;
  summary: string | null;
  strengths: string | null;
}

const RESUME_PARSING_PROMPT = `You are an expert resume parser. Extract structured information from the resume image(s) provided.
Return a JSON object with these fields:
- name: Full name of the candidate
- email: Email address
- phone: Phone number
- currentRole: Current job title/position
- totalExperience: Total years of experience (format: "3-5 years" or "5+ years" based on what you can determine)
- currentLocation: City, State/Country
- skills: Array of technical and soft skills found
- education: Highest education qualification
- currentCompany: Current employer name
- summary: Brief professional summary (1-2 sentences)
- strengths: Key strengths mentioned (comma-separated)

If a field is not found, use null. Return ONLY valid JSON, no other text.`;

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
  };
}

function parseResumeFallback(text: string): ParsedResume {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;
  const phone = text.match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3,5}\)?[\s.-]?)?\d{6,10}/)?.[0]?.trim() || null;
  const ignoredHeadings = /^(resume|curriculum vitae|cv|profile|professional summary|summary)$/i;
  const name = lines.find((line) => {
    if (ignoredHeadings.test(line) || line.includes("@") || /\d{4,}/.test(line)) return false;
    return line.length >= 3 && line.length <= 80 && /^[\p{L}][\p{L} .'-]+$/u.test(line);
  }) || null;

  return {
    ...getDefaultParsedResume(),
    name,
    email,
    phone,
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

  const convert = fromPath(pdfPath, options);
  const images: string[] = [];

  try {
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
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  return images;
}

async function parseImageWithVision(base64Images: string[]): Promise<ParsedResume> {
  try {
    const content: any[] = [
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
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const contentText = response.choices[0]?.message?.content;
    if (!contentText) {
      return getDefaultParsedResume();
    }

    const jsonMatch = contentText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return getDefaultParsedResume();
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      name: parsed.name || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
      currentRole: parsed.currentRole || null,
      totalExperience: parsed.totalExperience || null,
      currentLocation: parsed.currentLocation || null,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      education: parsed.education || null,
      currentCompany: parsed.currentCompany || null,
      summary: parsed.summary || null,
      strengths: parsed.strengths || null,
    };
  } catch (error) {
    console.error("Vision parsing failed:", error);
    return getDefaultParsedResume();
  }
}

async function parseTextWithAI(text: string): Promise<ParsedResume> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: RESUME_PARSING_PROMPT },
        { role: "user", content: `Parse this resume:\n\n${text.slice(0, 8000)}` },
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return getDefaultParsedResume();

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return getDefaultParsedResume();

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      name: parsed.name || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
      currentRole: parsed.currentRole || null,
      totalExperience: parsed.totalExperience || null,
      currentLocation: parsed.currentLocation || null,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      education: parsed.education || null,
      currentCompany: parsed.currentCompany || null,
      summary: parsed.summary || null,
      strengths: parsed.strengths || null,
    };
  } catch (error) {
    console.error("Text AI parsing failed:", error);
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

export async function parseResume(
  buffer: Buffer,
  filename: string
): Promise<ParsedResume> {
  const ext = filename.toLowerCase().split(".").pop() || "";

  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp") {
    const base64 = buffer.toString("base64");
    return parseImageWithVision([base64]);
  }

  if (ext === "pdf") {
    const text = await extractTextFromPDF(buffer);

    if (text.trim().length < 200) {
      const images = await convertPDFToImages(buffer);
      if (images.length > 0) {
        return parseImageWithVision(images);
      }
    }

    const fallback = parseResumeFallback(text);
    const parsed = await parseTextWithAI(text);

    return {
      name: parsed.name || fallback.name,
      email: parsed.email || fallback.email,
      phone: parsed.phone || fallback.phone,
      currentRole: parsed.currentRole,
      totalExperience: parsed.totalExperience,
      currentLocation: parsed.currentLocation,
      skills: parsed.skills,
      education: parsed.education,
      currentCompany: parsed.currentCompany,
      summary: parsed.summary,
      strengths: parsed.strengths,
    };
  }

  if (ext === "docx" || ext === "doc") {
    const text = await extractTextFromDOCX(buffer);

    if (text.trim().length < 100) {
      return getDefaultParsedResume();
    }

    const fallback = parseResumeFallback(text);
    const parsed = await parseTextWithAI(text);

    return {
      name: parsed.name || fallback.name,
      email: parsed.email || fallback.email,
      phone: parsed.phone || fallback.phone,
      currentRole: parsed.currentRole,
      totalExperience: parsed.totalExperience,
      currentLocation: parsed.currentLocation,
      skills: parsed.skills,
      education: parsed.education,
      currentCompany: parsed.currentCompany,
      summary: parsed.summary,
      strengths: parsed.strengths,
    };
  }

  const text = buffer.toString("utf-8");
  return parseTextWithAI(text);
}