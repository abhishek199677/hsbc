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
  summary: string;
  url?: string;
  technologies?: string[];
}

export interface ParsedEducation {
  degree: string;
  institution: string;
  year: string;
  grade?: string;
  details?: string;
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
  educationDetails: ParsedEducation[];
  currentCompany: string | null;
  summary: string | null;
  candidateSummary: string | null;
  strengths: string | null;
  linkedinUrl: string | null;
  workExperience: ParsedWorkExperience[];
  projects: ParsedProject[];
  topProjects: string[];
  keyAchievements: string[];
  certifications: string[];
  languages: string[];
  noticePeriod: string | null;
  whatDrivesYou: string | null;
  jobType: string | null;
  preferredLocation: string | null;
  suggestedRoles: string[];
  bestFitRole: string | null;
}
