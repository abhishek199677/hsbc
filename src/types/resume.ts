export interface ParsedWorkExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ParsedProject {
  name: string;
  description: string;
  url?: string;
  technologies?: string[];
}

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
  linkedinUrl: string | null;
  workExperience: ParsedWorkExperience[];
  projects: ParsedProject[];
  keyAchievements: string[];
  certifications: string[];
  languages: string[];
}
