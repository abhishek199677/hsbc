/**
 * Resume Parser using OpenAI
 * Extracts structured data from PDF/DOC/DOCX resumes
 */

import OpenAI from "openai";

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

/**
 * Parse resume text content using OpenAI
 */
export async function parseResumeWithAI(text: string): Promise<ParsedResume> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert resume parser. Extract structured information from the resume text provided.
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

If a field is not found, use null. Return ONLY valid JSON, no other text.`
        },
        {
          role: "user",
          content: `Parse this resume:\n\n${text.slice(0, 8000)}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return getDefaultParsedResume();
    }

    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
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
    console.error("Resume parsing failed:", error);
    return getDefaultParsedResume();
  }
}

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

/**
 * Extract text from PDF buffer (basic extraction)
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Basic PDF text extraction - reads text content between stream objects
  // For production, use a library like pdf-parse or pdf2json
  const text = buffer.toString("utf-8");
  
  // Try to extract readable text from PDF
  const lines: string[] = [];
  const textMatches = text.match(/\(([^)]+)\)/g);
  
  if (textMatches) {
    for (const match of textMatches) {
      const cleaned = match.slice(1, -1).trim();
      if (cleaned.length > 1 && !cleaned.match(/^[\x00-\x08\x0B\x0C\x0E-\x1F]+$/)) {
        lines.push(cleaned);
      }
    }
  }
  
  return lines.join("\n");
}

/**
 * Extract text from DOCX buffer (basic extraction)
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  // DOCX is a ZIP file containing XML
  // For basic extraction, look for text content in the XML
  const text = buffer.toString("utf-8");
  
  // Extract text from XML tags
  const textMatches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
  if (!textMatches) return "";
  
  const lines = textMatches.map(match => {
    const content = match.match(/<w:t[^>]*>([^<]+)<\/w:t>/);
    return content?.[1] || "";
  }).filter(t => t.trim().length > 0);
  
  return lines.join(" ");
}

/**
 * Parse resume from file buffer
 */
export async function parseResume(
  buffer: Buffer,
  filename: string
): Promise<ParsedResume> {
  const ext = filename.toLowerCase().split(".").pop();
  
  let text = "";
  
  if (ext === "pdf") {
    text = await extractTextFromPDF(buffer);
  } else if (ext === "docx" || ext === "doc") {
    text = await extractTextFromDOCX(buffer);
  } else {
    // Try as plain text
    text = buffer.toString("utf-8");
  }
  
  if (!text || text.trim().length < 50) {
    // If text extraction failed, return defaults
    return getDefaultParsedResume();
  }
  
  return parseResumeWithAI(text);
}
