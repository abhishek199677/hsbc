"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import StepIndicator from "@/components/StepIndicator";
import { useAuth } from "@/contexts/AuthContext";
import {
  Upload, FileText, CheckCircle, ChevronLeft, ArrowRight, Shield, Lock, Eye, Clock,
  Plus, Trash2, Briefcase, Code, Award, GraduationCap, Sparkles, ExternalLink, Tag, Sun, Moon
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import AIChatbot from "@/components/AIChatbot";
import type { ParsedWorkExperience, ParsedProject } from "@/types/resume";

const steps = [
  { number: 1, label: "Profile", sublabel: "Tell us who you are" },
  { number: 2, label: "Resume", sublabel: "Your expertise" },
  { number: 3, label: "Skills & Projects", sublabel: "Your experience & tech stacks" },
  { number: 4, label: "Preferences", sublabel: "What you're looking for" },
  { number: 5, label: "AI Interview", sublabel: "Schedule assessment" },
  { number: 6, label: "All Set!", sublabel: "You're all set!" },
];

const roles = [
  "Software Engineer", "Full Stack Developer", "Frontend Engineer", "Backend Engineer",
  "Product Manager", "Data Scientist", "UX Designer", "DevOps Engineer", "Business Analyst"
];

const experiences = [
  "0-1 years", "1-3 years", "3-5 years", "5-8 years", "8-12 years", "12+ years"
];

const locations = [
  "Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Chennai", "Pune", "Kolkata", "Remote"
];

const noticePeriods = [
  "Immediate", "15 days", "30 days", "60 days", "90 days"
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [resumeParsed, setResumeParsed] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [isRenderDomain, setIsRenderDomain] = useState(false);

  useEffect(() => {
    setIsRenderDomain(window.location.hostname.includes("render"));
  }, []);

  const [formData, setFormData] = useState({
    resume: null as File | null,
    resumeUrl: "",
    resumeFileName: "",
    aboutYou: "",
    whatDrivesYou: "",
    strengths: "",
    currentRole: "",
    totalExperience: "",
    currentLocation: "",
    noticePeriod: "",
    skills: "",
    currentCompany: "",
    education: "",
    linkedinUrl: "",
    workExperience: "" as string,
    projects: "" as string,
    keyAchievements: "" as string,
    certifications: "" as string,
    languages: "" as string,
    jobType: "",
    salaryRange: "",
    preferredLocation: "",
    workMode: "",
    preferredDate: "",
    preferredTimeSlot: "",
  });

  // Parsed structured lists for interactive form cards
  const [workExpList, setWorkExpList] = useState<ParsedWorkExperience[]>([]);
  const [projectsList, setProjectsList] = useState<ParsedProject[]>([]);
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [certificationsList, setCertificationsList] = useState<string[]>([]);
  const [achievementsList, setAchievementsList] = useState<string[]>([]);
  const [educationDetailsList, setEducationDetailsList] = useState<{degree: string; institution: string; year: string; grade?: string; details?: string}[]>([]);
  const [suggestedRolesList, setSuggestedRolesList] = useState<string[]>([]);
  const [bestFitRole, setBestFitRole] = useState<string>("");
  const [candidateSummary, setCandidateSummary] = useState<string>("");
  const [topProjectsList, setTopProjectsList] = useState<string[]>([]);

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    if (validationError) setValidationError(null);
  };

  const generateAISummary = async () => {
    setGeneratingSummary(true);
    try {
      const response = await fetch("/api/ai/generate-summary", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentRole: formData.currentRole,
          totalExperience: formData.totalExperience,
          currentLocation: formData.currentLocation,
          skills: formData.skills || skillsList.join(", "),
          workExperience: formData.workExperience,
          projects: formData.projects,
          education: formData.education,
          currentCompany: formData.currentCompany,
        }),
      });
      const data = await response.json();
      if (data.success && data.summary) {
        updateFormData({ aboutYou: data.summary });
        setAutoFilledFields((prev) =>
          prev.includes("About You") ? prev : [...prev, "AI Generated Summary"]
        );
      } else {
        setValidationError(data.error || "Failed to generate summary");
      }
    } catch {
      setValidationError("Failed to generate summary. Please try again.");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const progress = Math.round((currentStep / steps.length) * 100);

  // Sync state helpers
  const updateWorkExperienceList = (newList: ParsedWorkExperience[]) => {
    setWorkExpList(newList);
    updateFormData({ workExperience: JSON.stringify(newList) });
  };

  const updateProjectsList = (newList: ParsedProject[]) => {
    setProjectsList(newList);
    updateFormData({ projects: JSON.stringify(newList) });
  };

  const updateSkillsList = (newList: string[]) => {
    setSkillsList(newList);
    updateFormData({ skills: newList.join(", ") });
  };

  const updateCertificationsList = (newList: string[]) => {
    setCertificationsList(newList);
    updateFormData({ certifications: JSON.stringify(newList) });
  };

  const updateAchievementsList = (newList: string[]) => {
    setAchievementsList(newList);
    updateFormData({ keyAchievements: JSON.stringify(newList) });
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch profile data on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/profile", { credentials: "include" });
        const data = await response.json();
        if (cancelled) return;
        if (data.success && data.profile) {
          const p = data.profile;
          setFormData((prev) => ({
            ...prev,
            resumeUrl: p.resumeUrl || "",
            resumeFileName: p.resumeFileName || "",
            aboutYou: p.aboutYou || "",
            whatDrivesYou: p.whatDrivesYou || "",
            strengths: p.strengths || "",
            currentRole: p.currentRole || "",
            totalExperience: p.totalExperience || "",
            currentLocation: p.currentLocation || "",
            noticePeriod: p.noticePeriod || "",
            skills: p.skills || "",
            currentCompany: p.currentCompany || "",
            education: p.education || "",
            linkedinUrl: p.linkedinUrl || "",
            workExperience: p.workExperience || "",
            projects: p.projects || "",
            keyAchievements: p.keyAchievements || "",
            certifications: p.certifications || "",
            languages: p.languages || "",
            jobType: p.jobType || "",
            salaryRange: p.salaryRange || "",
            preferredLocation: p.preferredLocation || "",
            workMode: p.workMode || "",
            preferredDate: p.preferredDate || "",
            preferredTimeSlot: p.preferredTimeSlot || "",
          }));

          // Parse JSON strings into interactive lists
          if (p.skills) {
            setSkillsList(p.skills.split(",").map((s: string) => s.trim()).filter(Boolean));
          }
          if (p.workExperience) {
            try { setWorkExpList(JSON.parse(p.workExperience)); } catch {}
          }
          if (p.projects) {
            try { setProjectsList(JSON.parse(p.projects)); } catch {}
          }
          if (p.certifications) {
            try { setCertificationsList(JSON.parse(p.certifications)); } catch {}
          }
          if (p.keyAchievements) {
            try { setAchievementsList(JSON.parse(p.keyAchievements)); } catch {}
          }

          setCurrentStep(p.step || 1);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const saveProfile = async (stepUpdate?: number): Promise<boolean> => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          resume: undefined,
          step: stepUpdate || currentStep,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        console.error("Failed to save profile:", data.error || "Unknown error");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Failed to save profile:", error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    setUploading(true);
    setParsingError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formDataObj,
      });

      const data = await response.json();
      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          resume: file,
          resumeUrl: data.file.url,
          resumeFileName: data.file.filename,
        }));

        // Auto-fill all profile fields from parsed resume
        if (data.parsedResume) {
          const parsed = data.parsedResume;
          const filled: string[] = [];

          setFormData((prev) => {
            const updated = { ...prev };
            
            const autoFill = (field: keyof typeof updated, value: string, label: string) => {
              if (value && (!updated[field] || String(updated[field]).trim() === "")) {
                (updated as Record<string, unknown>)[field] = value;
                filled.push(label);
              }
            };
            
            autoFill("currentRole", parsed.currentRole, "Current Role");
            autoFill("totalExperience", parsed.totalExperience, "Experience");
            autoFill("currentLocation", parsed.currentLocation, "Location");
            autoFill("currentCompany", parsed.currentCompany, "Company");
            autoFill("education", parsed.education, "Education");
            autoFill("aboutYou", parsed.summary, "About You");
            autoFill("strengths", parsed.strengths, "Strengths");
            autoFill("linkedinUrl", parsed.linkedinUrl, "LinkedIn");
            autoFill("noticePeriod", parsed.noticePeriod, "Notice Period");
            autoFill("whatDrivesYou", parsed.whatDrivesYou, "What Drives You");
            autoFill("jobType", parsed.jobType, "Job Type");
            autoFill("preferredLocation", parsed.preferredLocation, "Preferred Location");
            
            if (parsed.skills?.length > 0) {
              const newSkills = parsed.skills.join(", ");
              if (!updated.skills || updated.skills.trim() === "") {
                updated.skills = newSkills;
                filled.push("Skills");
              } else {
                const existing = new Set(updated.skills.split(",").map((s: string) => s.trim().toLowerCase()));
                const toAdd = parsed.skills.filter((s: string) => !existing.has(s.toLowerCase()));
                if (toAdd.length > 0) {
                  updated.skills = updated.skills + ", " + toAdd.join(", ");
                  filled.push(`Skills (+${toAdd.length} new)`);
                }
              }
            }
            
            if (parsed.workExperience?.length > 0 && (!updated.workExperience || updated.workExperience === "")) {
              updated.workExperience = JSON.stringify(parsed.workExperience);
              setWorkExpList(parsed.workExperience);
              filled.push(`${parsed.workExperience.length} Work Experience Cards`);
            }
            if (parsed.projects?.length > 0 && (!updated.projects || updated.projects === "")) {
              updated.projects = JSON.stringify(parsed.projects);
              setProjectsList(parsed.projects);
              filled.push(`${parsed.projects.length} Project & Tech Stack Cards`);
            }
            if (parsed.keyAchievements?.length > 0 && (!updated.keyAchievements || updated.keyAchievements === "")) {
              updated.keyAchievements = JSON.stringify(parsed.keyAchievements);
              setAchievementsList(parsed.keyAchievements);
              filled.push("Highlights & Achievements");
            }
            if (parsed.certifications?.length > 0 && (!updated.certifications || updated.certifications === "")) {
              updated.certifications = JSON.stringify(parsed.certifications);
              setCertificationsList(parsed.certifications);
              filled.push(`${parsed.certifications.length} Certifications`);
            }
            if (parsed.languages?.length > 0 && (!updated.languages || updated.languages === "")) {
              updated.languages = JSON.stringify(parsed.languages);
              filled.push("Languages");
            }
            if (parsed.educationDetails?.length > 0 && educationDetailsList.length === 0) {
              setEducationDetailsList(parsed.educationDetails);
              filled.push(`${parsed.educationDetails.length} Education Entries`);
            }
            if (parsed.suggestedRoles?.length > 0 && suggestedRolesList.length === 0) {
              setSuggestedRolesList(parsed.suggestedRoles);
              filled.push(`${parsed.suggestedRoles.length} Suggested Roles`);
            }
            if (parsed.bestFitRole) {
              setBestFitRole(parsed.bestFitRole);
              filled.push("Best Fit Role");
            }
            if (parsed.candidateSummary) {
              setCandidateSummary(parsed.candidateSummary);
              filled.push("Candidate Summary");
            }
            if (parsed.topProjects?.length > 0) {
              setTopProjectsList(parsed.topProjects);
              filled.push(`${parsed.topProjects.length} Top Projects`);
            }
            
            return {
              ...updated,
              resume: file,
              resumeUrl: data.file.url,
              resumeFileName: data.file.filename,
            };
          });

          if (filled.length > 0) {
            setResumeParsed(true);
            setAutoFilledFields(filled);
          } else if (data.parsingStatus === "success") {
            // Parsing succeeded but no new fields to fill (all already had data)
            setResumeParsed(true);
            setAutoFilledFields(["Resume uploaded - profile already up to date"]);
          }
        }

        // If inline parsing failed, try re-fetching profile from the API
        // (backend may have saved partial data before the error)
        if (!data.parsedResume && data.parsingStatus === "failed") {
          setParsingError(data.parsingError || "Resume parsing failed. Upload was successful but fields could not be auto-filled.");
          console.log("[upload] Parsing failed, attempting to re-fetch profile from API...");
          try {
            const profileResponse = await fetch("/api/profile", { credentials: "include" });
            const profileData = await profileResponse.json();
            if (profileData.success && profileData.profile) {
              const p = profileData.profile;
              const filled: string[] = [];
              setFormData((prev) => {
                const updated = { ...prev };
                const autoFill = (field: keyof typeof updated, value: string, label: string) => {
                  if (value && (!updated[field] || String(updated[field]).trim() === "")) {
                    (updated as Record<string, unknown>)[field] = value;
                    filled.push(label);
                  }
                };
                autoFill("currentRole", p.currentRole, "Current Role");
                autoFill("totalExperience", p.totalExperience, "Experience");
                autoFill("currentLocation", p.currentLocation, "Location");
                autoFill("currentCompany", p.currentCompany, "Company");
                autoFill("education", p.education, "Education");
                autoFill("aboutYou", p.aboutYou, "About You");
                autoFill("strengths", p.strengths, "Strengths");
                autoFill("linkedinUrl", p.linkedinUrl, "LinkedIn");
                autoFill("noticePeriod", p.noticePeriod, "Notice Period");
                autoFill("whatDrivesYou", p.whatDrivesYou, "What Drives You");
                autoFill("jobType", p.jobType, "Job Type");
                autoFill("preferredLocation", p.preferredLocation, "Preferred Location");
                if (p.skills && (!updated.skills || updated.skills.trim() === "")) {
                  updated.skills = p.skills;
                  filled.push("Skills");
                }
                if (p.workExperience && (!updated.workExperience || updated.workExperience === "")) {
                  updated.workExperience = p.workExperience;
                  try { setWorkExpList(JSON.parse(p.workExperience)); } catch {}
                  filled.push("Work Experience");
                }
                if (p.projects && (!updated.projects || updated.projects === "")) {
                  updated.projects = p.projects;
                  try { setProjectsList(JSON.parse(p.projects)); } catch {}
                  filled.push("Projects");
                }
                if (p.certifications && (!updated.certifications || updated.certifications === "")) {
                  updated.certifications = p.certifications;
                  try { setCertificationsList(JSON.parse(p.certifications)); } catch {}
                  filled.push("Certifications");
                }
                if (p.keyAchievements && (!updated.keyAchievements || updated.keyAchievements === "")) {
                  updated.keyAchievements = p.keyAchievements;
                  try { setAchievementsList(JSON.parse(p.keyAchievements)); } catch {}
                  filled.push("Achievements");
                }
                return updated;
              });
              if (filled.length > 0) {
                setResumeParsed(true);
                setAutoFilledFields(filled);
                setParsingError(null); // Clear error since recovery succeeded
              }
            }
          } catch (fetchErr) {
            console.error("[upload] Failed to re-fetch profile:", fetchErr);
          }
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setParsingError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("dragover");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const syntheticEvent = {
        target: { files: e.dataTransfer.files },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(syntheticEvent);
    }
  };

  const validateStep = (): string | null => {
    switch (currentStep) {
      case 1:
        if (!formData.aboutYou.trim()) return "Please tell us about yourself or upload a resume to auto-fill.";
        if (!formData.currentRole) return "Please enter your current role";
        return null;
      case 3:
        if (!formData.skills.trim() && skillsList.length === 0) return "Please enter your technical skills & tech stacks";
        return null;
      case 4:
        if (!formData.jobType) return "Please select a job type";
        return null;
      default:
        return null;
    }
  };

  const handleNext = async () => {
    const error = validateStep();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);

    if (currentStep === steps.length) {
      const saved = await saveProfile(currentStep);
      if (saved) {
        router.push("/interview");
      }
      return;
    }

    const saved = await saveProfile(currentStep + 1);
    if (saved) {
      setCurrentStep(Math.min(steps.length, currentStep + 1));
    }
  };

  const handlePrev = async () => {
    setValidationError(null);
    const saved = await saveProfile(currentStep - 1);
    if (saved) {
      setCurrentStep(Math.max(1, currentStep - 1));
    }
  };

  const addSkillTag = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skillsList.includes(trimmed)) {
      const updated = [...skillsList, trimmed];
      updateSkillsList(updated);
      setNewSkill("");
    }
  };

  const removeSkillTag = (skillToRemove: string) => {
    const updated = skillsList.filter((s) => s !== skillToRemove);
    updateSkillsList(updated);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-[#e050b0] border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const renderStep1 = () => (
    <div className="space-y-8">
      {/* Upload Resume Box */}
      <div className="bg-surface border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            1. Upload Resume for Instant AI Auto-Fill
          </h3>
          <button className="text-sm font-mono text-secondary flex items-center gap-1 hover:text-primary font-medium uppercase tracking-wider">
            <Eye className="w-4 h-4" /> AI Resume Parsing Active
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-32 h-40 bg-surface flex items-center justify-center flex-shrink-0 border border-border">
            <FileText className="w-16 h-16 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-mono font-bold text-foreground mb-2 uppercase tracking-wider">Upload your resume (PDF, DOCX, or Image)</h4>
            <p className="text-sm font-mono text-muted-foreground mb-4">
              All your skills, professional summary, work history, tech stacks, projects, and certifications will be auto-parsed into your profile without manual entry!
            </p>
            <div
              className="drop-zone border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-[#e050b0] transition-colors bg-surface"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("resume-upload")?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center py-4">
                  <svg className="animate-spin h-8 w-8 text-primary mb-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-sm font-mono font-bold text-primary">AI Parsing your resume...</p>
                  <p className=" text-xs text-muted-foreground mt-1">Extracting technical skills, projects, and work experience</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">Drag & drop your resume here</p>
                  <p className=" text-xs text-muted-foreground my-1">or click to browse files</p>
                  <span className="rounded-lg bg-primary text-foreground px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors mt-2">
                    Browse Resume File
                  </span>
                  <p className=" text-xs text-muted-foreground mt-2">Supports PDF, DOC, DOCX, PNG, JPG (Max 5MB)</p>
                </>
              )}
            </div>
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileUpload}
            />

            {formData.resumeFileName && (
              <div className="mt-3 flex items-center gap-2 text-secondary bg-surface p-2.5 border border-border">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-mono font-bold">{formData.resumeFileName}</span>
              </div>
            )}

            {parsingError && (
              <div className="mt-3 flex items-start gap-2 text-primary bg-surface p-3 border border-border">
                <span className="text-sm font-mono">{parsingError}</span>
              </div>
            )}

            {resumeParsed && autoFilledFields.length > 0 && (
              <div className="mt-4 p-5 bg-surface text-foreground border border-[#e050b0]">
                <div className="flex items-center gap-2 font-mono font-bold text-base mb-1 uppercase tracking-wider">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  Resume Auto-Parsed & Fields Highlighted!
                </div>
                <p className=" text-xs text-muted-foreground mb-3 font-medium">
                  The following sections were extracted from your resume and automatically populated with high-contrast emphasis into form boxes below:
                </p>
                <div className="flex flex-wrap gap-2">
                  {autoFilledFields.map((field) => (
                    <span key={field} className="inline-flex items-center gap-1.5 bg-surface-hover text-foreground text-xs font-mono px-3 py-1 font-bold border border-[#e050b0]">
                      <CheckCircle className="w-3.5 h-3.5 text-secondary" /> {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Professional Summary Box */}
      <div className={`bg-surface border-2 p-6 transition-all ${formData.aboutYou ? "border-[#e050b0] ring-4 ring-[#e050b0]/15" : "border-border"}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            2. Professional Summary
          </h3>
          <div className="flex items-center gap-2">
            {formData.aboutYou && (
              <span className="text-xs font-mono bg-primary text-foreground font-bold px-3 py-1 flex items-center gap-1 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-foreground" /> Highlighted Auto-Fill
              </span>
            )}
            <button
              onClick={generateAISummary}
              disabled={generatingSummary}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#a78bfa] to-[#e050b0] text-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {generatingSummary ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI Auto-Fill
                </>
              )}
            </button>
          </div>
        </div>
        <p className="text-sm font-mono text-muted-foreground mb-4 font-medium">
          {formData.aboutYou
            ? "Auto-extracted from your resume. Feel free to edit or refine it."
            : "Upload a resume or click AI Auto-Fill to generate a professional summary."}
        </p>
        <textarea
          className="w-full border-2 border-border p-4 text-sm font-medium text-foreground resize-none focus:ring-2 focus:ring-[#e050b0] focus:border-[#e050b0] bg-background leading-relaxed placeholder-[#a0a0a0]"
          rows={5}
          placeholder="Professional summary will be automatically filled when you upload your resume or click AI Auto-Fill..."
          value={formData.aboutYou}
          onChange={(e) => updateFormData({ aboutYou: e.target.value })}
        />
        <div className="flex justify-between items-center mt-2 text-xs font-semibold text-primary">
          <span>Editable box - Synced with AI interviewer</span>
          <span>{formData.aboutYou.length} characters</span>
        </div>
      </div>

      {/* Current Role Snapshot */}
      <div className={`bg-surface border-2 p-6 transition-all ${formData.currentRole ? "border-[#e050b0] ring-4 ring-[#e050b0]/15" : "border-border"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">3. Role Snapshot & Overview</h3>
          {(formData.currentRole || formData.totalExperience || formData.currentLocation) && (
            <span className="text-xs font-mono bg-primary text-foreground font-bold px-3 py-1 flex items-center gap-1 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-foreground" /> Auto-Filled
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Current / Target Role</label>
            <input
              type="text"
              className="w-full rounded-lg border border-border p-3 text-sm font-medium text-foreground focus:ring-2 focus:ring-[#e050b0] focus:border-[#e050b0] bg-background"
              placeholder="e.g. Senior AI Engineer"
              value={formData.currentRole}
              onChange={(e) => updateFormData({ currentRole: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Total Experience</label>
            <input
              type="text"
              className="w-full rounded-lg border border-border p-3 text-sm font-medium text-foreground focus:ring-2 focus:ring-[#e050b0] focus:border-[#e050b0] bg-background"
              placeholder="e.g. 10+ years"
              value={formData.totalExperience}
              onChange={(e) => updateFormData({ totalExperience: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Current Location</label>
            <input
              type="text"
              className="w-full rounded-lg border border-border p-3 text-sm font-medium text-foreground focus:ring-2 focus:ring-[#e050b0] focus:border-[#e050b0] bg-background"
              placeholder="e.g. Bangalore, India"
              value={formData.currentLocation}
              onChange={(e) => updateFormData({ currentLocation: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      {/* Technical Skills & Tech Stacks Box */}
      <div className={`bg-surface border-2 p-6 transition-all ${skillsList.length > 0 ? "border-[#e050b0] ring-4 ring-[#e050b0]/15" : "border-border"}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Technical Skills & Tech Stacks
          </h3>
          <span className="text-xs font-mono bg-primary text-foreground px-3 py-1 font-bold flex items-center gap-1 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-foreground" /> {skillsList.length} Skills Extracted
          </span>
        </div>
        <p className="text-sm font-mono text-muted-foreground font-medium mb-4">
          All programming languages, frameworks, databases, and tools parsed from your resume.
        </p>

        {/* Skill Tag Chips */}
        <div className="flex flex-wrap gap-2 mb-4 p-4 bg-background border-2 border-border min-h-[70px] items-center">
          {skillsList.length === 0 ? (
            <p className="text-sm font-mono text-muted-foreground font-medium italic">No skills extracted yet. Upload a resume or add skills below.</p>
          ) : (
            skillsList.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 bg-primary text-foreground text-xs font-mono font-bold px-3.5 py-1.5 hover:bg-primary-hover transition-all group"
              >
                <Tag className="w-3.5 h-3.5 text-foreground" />
                {skill}
                <button
                  onClick={() => removeSkillTag(skill)}
                  className="hover:text-secondary transition-colors ml-1 font-bold text-sm"
                  title="Remove skill"
                >
                  x
                </button>
              </span>
            ))
          )}
        </div>

        {/* Add Skill Input */}
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-lg border border-border p-3 text-sm font-medium text-foreground focus:ring-2 focus:ring-[#e050b0] focus:border-[#e050b0] bg-background"
            placeholder="Add another skill or tech stack (e.g. Docker, Next.js, PyTorch)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkillTag();
              }
            }}
          />
          <button
            onClick={addSkillTag}
            type="button"
            className="rounded-lg bg-primary text-foreground px-5 py-3 text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Skill
          </button>
        </div>
      </div>

      {/* Work Experience Cards */}
      <div className={`bg-surface border-2 p-6 transition-all ${workExpList.length > 0 ? "border-[#e050b0] ring-4 ring-[#e050b0]/15" : "border-border"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Work Experience History
            </h3>
            <p className="text-sm font-mono text-muted-foreground font-medium mt-1">Auto-extracted job titles, companies, durations, and responsibilities.</p>
          </div>
          <button
            onClick={() => {
              const updated = [
                ...workExpList,
                { company: "New Company", role: "Job Title", startDate: "2022", endDate: "Present", description: "Key achievements and duties..." },
              ];
              updateWorkExperienceList(updated);
            }}
            type="button"
            className="rounded-lg text-xs font-medium bg-primary text-foreground hover:bg-primary-hover px-3.5 py-2 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Experience
          </button>
        </div>

        {workExpList.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border bg-background">
            <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No work experience entries yet</p>
            <p className=" text-xs text-muted-foreground mt-1">Upload your resume to automatically fill this section.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {workExpList.map((exp, idx) => (
              <div key={idx} className="border-2 border-border p-5 bg-background hover:border-[#e050b0] transition-all space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono bg-primary text-foreground font-bold px-3 py-1 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-foreground" /> Experience #{idx + 1} - Auto-Filled
                  </span>
                  <button
                    onClick={() => {
                      const updated = workExpList.filter((_, i) => i !== idx);
                      updateWorkExperienceList(updated);
                    }}
                    className="text-primary hover:text-foreground bg-surface p-1.5 border border-border transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Company</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-border p-3 text-sm font-medium text-foreground bg-background focus:ring-2 focus:ring-[#e050b0]"
                      value={exp.company}
                      onChange={(e) => {
                        const updated = [...workExpList];
                        updated[idx].company = e.target.value;
                        updateWorkExperienceList(updated);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role / Job Title</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-border p-3 text-sm font-medium text-foreground bg-background focus:ring-2 focus:ring-[#e050b0]"
                      value={exp.role}
                      onChange={(e) => {
                        const updated = [...workExpList];
                        updated[idx].role = e.target.value;
                        updateWorkExperienceList(updated);
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-border p-2.5 text-xs font-medium text-foreground bg-background"
                      value={exp.startDate}
                      onChange={(e) => {
                        const updated = [...workExpList];
                        updated[idx].startDate = e.target.value;
                        updateWorkExperienceList(updated);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">End Date</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-border p-2.5 text-xs font-medium text-foreground bg-background"
                      value={exp.endDate}
                      onChange={(e) => {
                        const updated = [...workExpList];
                        updated[idx].endDate = e.target.value;
                        updateWorkExperienceList(updated);
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Responsibilities & Achievements</label>
                  <textarea
                    className="w-full border-2 border-border p-3 text-xs font-mono font-semibold text-foreground bg-background leading-relaxed resize-none"
                    rows={3}
                    value={exp.description}
                    onChange={(e) => {
                      const updated = [...workExpList];
                      updated[idx].description = e.target.value;
                      updateWorkExperienceList(updated);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects & Tech Stacks Cards */}
      <div className={`bg-surface border-2 p-6 transition-all ${projectsList.length > 0 ? "border-[#e050b0] ring-4 ring-[#e050b0]/15" : "border-border"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              Projects & Tech Stacks
            </h3>
            <p className="text-sm font-mono text-muted-foreground font-medium mt-1">Key projects and technologies extracted from your resume.</p>
          </div>
          <button
            onClick={() => {
              const updated = [
                ...projectsList,
                { name: "New Project", description: "Brief description of the project...", summary: "Detailed overview of the project...", technologies: ["React", "TypeScript"] },
              ];
              updateProjectsList(updated);
            }}
            type="button"
            className="rounded-lg text-xs font-medium bg-primary text-foreground hover:bg-primary-hover px-3.5 py-2 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Project
          </button>
        </div>

        {projectsList.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border bg-background">
            <Code className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No project entries yet</p>
            <p className=" text-xs text-muted-foreground mt-1">Upload your resume to automatically fill this section.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {projectsList.map((proj, idx) => (
              <div key={idx} className="border-2 border-border p-5 bg-background hover:border-[#e050b0] transition-all space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono bg-primary text-foreground font-bold px-3 py-1 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-foreground" /> Project #{idx + 1} - Auto-Filled
                  </span>
                  <button
                    onClick={() => {
                      const updated = projectsList.filter((_, i) => i !== idx);
                      updateProjectsList(updated);
                    }}
                    className="text-primary hover:text-foreground bg-surface p-1.5 border border-border transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Project Title</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-border p-3 text-sm font-medium text-foreground bg-background focus:ring-2 focus:ring-[#e050b0]"
                    value={proj.name}
                    onChange={(e) => {
                      const updated = [...projectsList];
                      updated[idx].name = e.target.value;
                      updateProjectsList(updated);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
                  <textarea
                    className="w-full border-2 border-border p-3 text-xs font-mono font-semibold text-foreground bg-background leading-relaxed resize-none"
                    rows={2}
                    value={proj.description}
                    onChange={(e) => {
                      const updated = [...projectsList];
                      updated[idx].description = e.target.value;
                      updateProjectsList(updated);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Project Overview</label>
                  <textarea
                    className="w-full border-2 border-border p-3 text-xs font-mono text-muted-foreground bg-background leading-relaxed resize-none"
                    rows={4}
                    placeholder="Detailed overview of what the project does, its architecture, key features, and impact..."
                    value={proj.summary || ""}
                    onChange={(e) => {
                      const updated = [...projectsList];
                      updated[idx].summary = e.target.value;
                      updateProjectsList(updated);
                    }}
                  />
                </div>

                {/* Tech Stack Tags for Project */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tech Stack Used</label>
                  <input
                    type="text"
                    className="w-full border-2 border-border p-3 text-xs font-mono font-bold text-secondary bg-background"
                    placeholder="Comma-separated tech stack (e.g. Next.js, Tailwind, PostgreSQL)"
                    value={proj.technologies ? proj.technologies.join(", ") : ""}
                    onChange={(e) => {
                      const updated = [...projectsList];
                      updated[idx].technologies = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
                      updateProjectsList(updated);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Education & Certifications Box */}
      <div className="bg-surface rounded-lg border border-border p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Education & Qualification
            </h3>
            {formData.education && (
              <span className="text-xs font-mono bg-primary text-foreground font-bold px-3 py-1 flex items-center gap-1 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-foreground" /> Auto-Filled
              </span>
            )}
          </div>
          <input
            type="text"
            className="w-full rounded-lg border border-border p-3.5 text-sm font-medium text-foreground focus:ring-2 focus:ring-[#e050b0] bg-background"
            placeholder="e.g. B.Tech in Computer Science, IIT Delhi, 2020"
            value={formData.education}
            onChange={(e) => updateFormData({ education: e.target.value })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Certifications & Credentials
            </h4>
            <button
              onClick={() => {
                const updated = [...certificationsList, "AWS Certified Solutions Architect"];
                updateCertificationsList(updated);
              }}
              type="button"
              className="rounded-lg text-xs font-medium bg-primary text-foreground hover:bg-primary-hover px-3 py-1.5 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Certification
            </button>
          </div>

          <div className="space-y-2.5">
            {certificationsList.length === 0 ? (
              <p className=" text-xs text-muted-foreground font-medium italic">No certifications extracted yet.</p>
            ) : (
              certificationsList.map((cert, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    className="flex-1 border-2 border-border p-3 text-xs font-medium text-foreground bg-background"
                    value={cert}
                    onChange={(e) => {
                      const updated = [...certificationsList];
                      updated[idx] = e.target.value;
                      updateCertificationsList(updated);
                    }}
                  />
                  <button
                    onClick={() => {
                      const updated = certificationsList.filter((_, i) => i !== idx);
                      updateCertificationsList(updated);
                    }}
                    className="text-primary hover:text-foreground bg-surface p-2.5 border border-border transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Education Details Timeline */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              Complete Education History
            </h4>
            <button
              onClick={() => {
                const updated = [...educationDetailsList, { degree: "", institution: "", year: "", grade: "", details: "" }];
                setEducationDetailsList(updated);
              }}
              type="button"
              className="rounded-lg text-xs font-medium bg-primary text-foreground hover:bg-primary-hover px-3 py-1.5 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Education
            </button>
          </div>

          <div className="space-y-3">
            {educationDetailsList.length === 0 ? (
              <p className=" text-xs text-muted-foreground font-medium italic">No education details extracted yet. Upload your resume to auto-fill.</p>
            ) : (
              educationDetailsList.map((edu, idx) => (
                <div key={idx} className="border border-border p-4 bg-background space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-primary font-bold">Education #{idx + 1}</span>
                    <button
                      onClick={() => {
                        const updated = educationDetailsList.filter((_, i) => i !== idx);
                        setEducationDetailsList(updated);
                      }}
                      className="text-primary hover:text-foreground p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      className="border border-border p-2 text-xs text-foreground bg-background rounded"
                      placeholder="Degree (e.g. B.Tech in CSE)"
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = [...educationDetailsList];
                        updated[idx].degree = e.target.value;
                        setEducationDetailsList(updated);
                      }}
                    />
                    <input
                      type="text"
                      className="border border-border p-2 text-xs text-foreground bg-background rounded"
                      placeholder="Institution"
                      value={edu.institution}
                      onChange={(e) => {
                        const updated = [...educationDetailsList];
                        updated[idx].institution = e.target.value;
                        setEducationDetailsList(updated);
                      }}
                    />
                    <input
                      type="text"
                      className="border border-border p-2 text-xs text-foreground bg-background rounded"
                      placeholder="Year (e.g. 2020)"
                      value={edu.year}
                      onChange={(e) => {
                        const updated = [...educationDetailsList];
                        updated[idx].year = e.target.value;
                        setEducationDetailsList(updated);
                      }}
                    />
                    <input
                      type="text"
                      className="border border-border p-2 text-xs text-foreground bg-background rounded"
                      placeholder="Grade/GPA (optional)"
                      value={edu.grade || ""}
                      onChange={(e) => {
                        const updated = [...educationDetailsList];
                        updated[idx].grade = e.target.value;
                        setEducationDetailsList(updated);
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    className="w-full border border-border p-2 text-xs text-muted-foreground bg-background rounded"
                    placeholder="Additional details (specialization, honors, coursework)"
                    value={edu.details || ""}
                    onChange={(e) => {
                      const updated = [...educationDetailsList];
                      updated[idx].details = e.target.value;
                      setEducationDetailsList(updated);
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Suggested Roles */}
        {suggestedRolesList.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-secondary" />
                AI-Suggested Best Fit Roles
              </h4>
              <span className="text-xs font-mono bg-secondary text-primary-foreground font-bold px-2 py-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Powered
              </span>
            </div>
            <div className="space-y-2">
              {suggestedRolesList.map((role, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg">
                  <span className="text-xs font-mono font-bold text-secondary w-6">#{idx + 1}</span>
                  <span className="text-sm text-foreground font-medium">{role}</span>
                  {idx === 0 && <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full ml-auto">Best Fit</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="bg-surface border border-border p-6">
      <h3 className="text-lg font-mono font-bold text-foreground mb-4 uppercase tracking-wider">Your Preferences</h3>
      <p className="text-sm font-mono text-muted-foreground mb-6">What kind of opportunities are you looking for?</p>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Preferred Job Type</label>
          <select
            className="w-full rounded-lg border border-border p-2.5 text-sm text-foreground bg-background focus:ring-2 focus:ring-[#e050b0]"
            value={formData.jobType}
            onChange={(e) => updateFormData({ jobType: e.target.value })}
          >
            <option value="">Select job type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Freelance">Freelance</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Expected Salary Range</label>
          <input
            type="text"
            className="w-full rounded-lg border border-border p-2.5 text-sm text-foreground bg-background focus:ring-2 focus:ring-[#e050b0]"
            placeholder="e.g. 15-20 LPA"
            value={formData.salaryRange}
            onChange={(e) => updateFormData({ salaryRange: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Preferred Location</label>
          <select
            className="w-full rounded-lg border border-border p-2.5 text-sm text-foreground bg-background focus:ring-2 focus:ring-[#e050b0]"
            value={formData.preferredLocation}
            onChange={(e) => updateFormData({ preferredLocation: e.target.value })}
          >
            <option value="">Select location</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Work Mode</label>
          <div className="flex gap-4 mt-2">
            {["Remote", "Hybrid", "On-site"].map((mode) => (
              <label key={mode} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="workMode"
                  className="w-4 h-4 text-primary"
                  checked={formData.workMode === mode}
                  onChange={() => updateFormData({ workMode: mode })}
                />
                <span className="text-sm font-mono text-foreground">{mode}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="bg-surface border border-border p-6">
      <h3 className="text-lg font-mono font-bold text-foreground mb-4 uppercase tracking-wider">AI Interview Preparation</h3>
      <p className="text-sm font-mono text-muted-foreground mb-6">Get ready for your 15-minute AI-powered interview.</p>
      <div className="space-y-4">
        <div className="bg-background border border-border p-4">
          <h4 className=" font-semibold text-primary mb-2">What to expect:</h4>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-secondary" /> Technical questions based on your resume & tech stacks</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-secondary" /> Behavioral assessment</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-secondary" /> Live coding challenge in WebRTC room</li>
          </ul>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Preferred Interview Date</label>
          <input
            type="date"
            className="w-full rounded-lg border border-border p-2.5 text-sm text-foreground bg-background focus:ring-2 focus:ring-[#e050b0]"
            value={formData.preferredDate}
            onChange={(e) => updateFormData({ preferredDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Preferred Time Slot</label>
          <select
            className="w-full rounded-lg border border-border p-2.5 text-sm text-foreground bg-background focus:ring-2 focus:ring-[#e050b0]"
            value={formData.preferredTimeSlot}
            onChange={(e) => updateFormData({ preferredTimeSlot: e.target.value })}
          >
            <option value="">Select time slot</option>
            <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
            <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
            <option value="Evening (4 PM - 7 PM)">Evening (4 PM - 7 PM)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="bg-surface border border-border p-6 text-center py-12">
      <div className="w-20 h-20 bg-surface border-2 border-[#4dacde] flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-10 h-10 text-secondary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">All Set! You&apos;re Good to Go!</h3>
      <p className="text-muted-foreground font-mono mb-6">We&apos;re looking forward to your interview. Get ready to showcase your best self.</p>
      <div className="bg-background border border-[#4dacde] p-4 max-w-md mx-auto">
        <p className="text-sm font-mono text-secondary">Your profile is complete and your AI interview is scheduled. You&apos;ll receive a confirmation email shortly.</p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2:
        return (
          <div className="space-y-6">
            {/* Success Card */}
            <div className="bg-surface border border-border p-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-surface border-2 border-[#4dacde] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Great! Your resume is uploaded and parsed!</h3>
                <p className="text-muted-foreground font-mono">All your tech stacks, projects, skills, and work experience have been auto-filled.</p>
              </div>
            </div>

            {/* Best Fit Role */}
            {bestFitRole && (
              <div className="bg-surface border-2 border-[#e050b0] p-6 ring-4 ring-[#e050b0]/15">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-secondary" />
                  Best Fit Role
                </h3>
                <p className="text-secondary font-mono font-bold text-xl">{bestFitRole}</p>
                <p className="text-sm text-muted-foreground mt-2">Based on your skills, experience, and project portfolio</p>
              </div>
            )}

            {/* Candidate Summary */}
            {candidateSummary && (
              <div className="bg-surface border-2 border-primary p-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5 text-primary" />
                  AI Candidate Summary
                </h3>
                <p className="text-muted-foreground font-medium leading-relaxed">{candidateSummary}</p>
              </div>
            )}

            {/* Suggested Roles */}
            {suggestedRolesList.length > 0 && (
              <div className="bg-surface border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Suggested Roles
                </h3>
                <div className="flex flex-wrap gap-2">
                  {suggestedRolesList.map((role, i) => (
                    <span key={i} className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 ${i === 0 ? "bg-secondary text-primary-foreground" : "bg-surface-hover text-muted-foreground"}`}>
                      {i === 0 && <Sparkles className="w-3 h-3" />}
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Top 3 Projects */}
            {topProjectsList.length > 0 && (
              <div className="bg-surface border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Code className="w-5 h-5 text-secondary" />
                  Top 3 Trending Projects
                </h3>
                <div className="space-y-3">
                  {topProjectsList.map((projName, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-background border border-border">
                      <span className="text-xs font-mono bg-secondary text-primary-foreground font-bold px-2 py-1">#{i + 1}</span>
                      <span className="text-sm font-medium text-foreground">{projName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Education */}
            {educationDetailsList.length > 0 && (
              <div className="bg-surface border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Education
                </h3>
                <div className="space-y-3">
                  {educationDetailsList.map((edu, i) => (
                    <div key={i} className="p-3 bg-background border border-border">
                      <p className="text-sm font-semibold text-foreground">{edu.degree}</p>
                      <p className="text-xs text-muted-foreground">{edu.institution} {edu.year && `- ${edu.year}`}</p>
                      {edu.grade && <p className="text-xs text-primary">Grade: {edu.grade}</p>}
                      {edu.details && <p className="text-xs text-muted-foreground mt-1">{edu.details}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {certificationsList.length > 0 && (
              <div className="bg-surface border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-secondary" />
                  Certifications
                </h3>
                <div className="space-y-2">
                  {certificationsList.map((cert, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      {cert}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar currentStep={currentStep} progress={progress} />
      <main className="flex-1 bg-background overflow-auto">
        <div className="p-4 bg-surface border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-secondary" />
            Your data is safe with us
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-8 h-8 flex items-center justify-center border border-border hover:bg-surface transition-colors"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-secondary" />
              ) : (
                <Moon className="w-4 h-4 text-primary" />
              )}
            </button>
            <div className="w-8 h-8 bg-primary flex items-center justify-center">
              <span className="text-sm font-mono font-bold text-foreground">{user?.name?.charAt(0) || "U"}</span>
            </div>
            <span className="text-sm font-mono font-medium text-foreground">Hi, {user?.name || "User"}</span>
          </div>
        </div>
        <StepIndicator steps={steps} currentStep={currentStep} />
        <div className="max-w-4xl mx-auto px-4 pb-8">
          {isRenderDomain && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Let&apos;s Build Your Profile</h2>
              <p className="text-muted-foreground font-mono mt-1">Upload your resume to auto-fill all skills, projects, and work experience!</p>
            </div>
          )}

          {renderCurrentStep()}

          {validationError && (
            <div className="mb-4 p-3 bg-surface border border-[#e050b0] font-mono text-primary text-sm mt-4">
              {validationError}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="rounded-lg flex items-center gap-2 px-6 py-3 border border-border text-sm font-medium hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed bg-background text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
              Save & Exit
            </button>
            <div className="flex items-center gap-2">
              {saving && <span className="text-sm font-mono text-muted-foreground">Saving...</span>}
              <button
                onClick={handleNext}
                disabled={saving}
                className="rounded-lg flex items-center gap-2 px-6 py-3 bg-primary text-foreground text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {saving ? "Completing..." : currentStep === steps.length ? "Complete" : "Save & Continue"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <AIChatbot user={{ id: user?.id ?? null, name: user?.name ?? null, email: user?.email ?? null, role: user?.role ?? null }} />
      </main>
    </div>
  );
}
