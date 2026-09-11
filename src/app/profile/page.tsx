"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import StepIndicator from "@/components/StepIndicator";
import { useAuth } from "@/contexts/AuthContext";
import {
  Upload, FileText, CheckCircle, ChevronLeft, ArrowRight, Shield, Lock, Eye, Clock,
  Plus, Trash2, Briefcase, Code, Award, GraduationCap, Sparkles, ExternalLink, Tag
} from "lucide-react";
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
  const { user, token, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [resumeParsed, setResumeParsed] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

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

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    if (validationError) setValidationError(null);
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
    if (!user || !token) return;
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
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
  }, [user, token]);

  const saveProfile = async (stepUpdate?: number): Promise<boolean> => {
    if (!token) return false;
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
    if (!e.target.files || !e.target.files[0] || !token) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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

            if (parsed.summary) {
              updated.aboutYou = parsed.summary;
              filled.push("Professional Summary");
            }
            if (parsed.currentRole) {
              updated.currentRole = parsed.currentRole;
              filled.push("Current Role");
            }
            if (parsed.totalExperience) {
              updated.totalExperience = parsed.totalExperience;
              filled.push("Experience");
            }
            if (parsed.currentLocation) {
              updated.currentLocation = parsed.currentLocation;
              filled.push("Location");
            }
            if (parsed.skills?.length > 0) {
              updated.skills = parsed.skills.join(", ");
              setSkillsList(parsed.skills);
              filled.push(`${parsed.skills.length} Technical Skills`);
            }
            if (parsed.currentCompany) {
              updated.currentCompany = parsed.currentCompany;
              filled.push("Current Company");
            }
            if (parsed.education) {
              updated.education = parsed.education;
              filled.push("Education");
            }
            if (parsed.strengths) {
              updated.strengths = parsed.strengths;
              filled.push("Strengths");
            }
            if (parsed.linkedinUrl) {
              updated.linkedinUrl = parsed.linkedinUrl;
              filled.push("LinkedIn");
            }
            if (parsed.workExperience?.length > 0) {
              updated.workExperience = JSON.stringify(parsed.workExperience);
              setWorkExpList(parsed.workExperience);
              filled.push(`${parsed.workExperience.length} Work Experience Cards`);
            }
            if (parsed.projects?.length > 0) {
              updated.projects = JSON.stringify(parsed.projects);
              setProjectsList(parsed.projects);
              filled.push(`${parsed.projects.length} Project & Tech Stack Cards`);
            }
            if (parsed.keyAchievements?.length > 0) {
              updated.keyAchievements = JSON.stringify(parsed.keyAchievements);
              setAchievementsList(parsed.keyAchievements);
              filled.push("Highlights & Achievements");
            }
            if (parsed.certifications?.length > 0) {
              updated.certifications = JSON.stringify(parsed.certifications);
              setCertificationsList(parsed.certifications);
              filled.push(`${parsed.certifications.length} Certifications`);
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
          }
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const renderStep1 = () => (
    <div className="space-y-8">
      {/* Upload Resume Box */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            1. Upload Resume for Instant AI Auto-Fill
          </h3>
          <button className="text-sm text-indigo-600 flex items-center gap-1 hover:text-indigo-800 font-medium">
            <Eye className="w-4 h-4" /> AI Resume Parsing Active
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-32 h-40 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-100">
            <FileText className="w-16 h-16 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-2">Upload your resume (PDF, DOCX, or Image)</h4>
            <p className="text-sm text-gray-500 mb-4">
              All your skills, professional summary, work history, tech stacks, projects, and certifications will be auto-parsed into your profile without manual entry!
            </p>
            <div
              className="drop-zone border-2 border-dashed border-indigo-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors bg-indigo-50/50"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("resume-upload")?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center py-4">
                  <svg className="animate-spin h-8 w-8 text-indigo-600 mb-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-sm font-medium text-indigo-900">AI Parsing your resume...</p>
                  <p className="text-xs text-indigo-600 mt-1">Extracting technical skills, projects, and work experience</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-800">Drag & drop your resume here</p>
                  <p className="text-xs text-gray-500 my-1">or click to browse files</p>
                  <span className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors mt-2 shadow-sm">
                    Browse Resume File
                  </span>
                  <p className="text-xs text-gray-500 mt-2">Supports PDF, DOC, DOCX, PNG, JPG (Max 5MB)</p>
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
              <div className="mt-3 flex items-center gap-2 text-green-700 bg-green-50 p-2.5 rounded-lg border border-green-200">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{formData.resumeFileName}</span>
              </div>
            )}

            {resumeParsed && autoFilledFields.length > 0 && (
              <div className="mt-4 p-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 text-white rounded-2xl shadow-lg border border-indigo-400">
                <div className="flex items-center gap-2 font-bold text-base mb-1">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                  ✨ Resume Auto-Parsed & Fields Highlighted!
                </div>
                <p className="text-xs text-indigo-100 mb-3 font-medium">
                  The following sections were extracted from your resume and automatically populated with high-contrast emphasis into form boxes below:
                </p>
                <div className="flex flex-wrap gap-2">
                  {autoFilledFields.map((field) => (
                    <span key={field} className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-bold border border-white/40 shadow-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Professional Summary Box */}
      <div className={`bg-white rounded-2xl border-2 p-6 shadow-sm transition-all ${formData.aboutYou ? "border-indigo-400 ring-4 ring-indigo-500/15 bg-gradient-to-b from-indigo-50/30 to-white" : "border-gray-200"}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            2. Professional Summary
          </h3>
          {formData.aboutYou && (
            <span className="text-xs bg-indigo-600 text-white font-bold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> ✨ Highlighted Auto-Fill
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4 font-medium">Auto-extracted from your resume. Feel free to edit or refine it.</p>
        <textarea
          className="w-full border-2 border-indigo-200 rounded-xl p-4 text-sm font-bold text-gray-900 resize-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white leading-relaxed shadow-xs placeholder-gray-400"
          rows={5}
          placeholder="Professional summary will be automatically filled when you upload your resume..."
          value={formData.aboutYou}
          onChange={(e) => updateFormData({ aboutYou: e.target.value })}
        />
        <div className="flex justify-between items-center mt-2 text-xs font-semibold text-indigo-800">
          <span>✨ Editable box • Synced with AI interviewer</span>
          <span>{formData.aboutYou.length} characters</span>
        </div>
      </div>

      {/* Current Role Snapshot */}
      <div className={`bg-white rounded-2xl border-2 p-6 shadow-sm transition-all ${formData.currentRole ? "border-indigo-400 ring-4 ring-indigo-500/15 bg-gradient-to-b from-indigo-50/30 to-white" : "border-gray-200"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">3. Role Snapshot & Overview</h3>
          {(formData.currentRole || formData.totalExperience || formData.currentLocation) && (
            <span className="text-xs bg-indigo-600 text-white font-bold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> ✨ Auto-Filled
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Current / Target Role</label>
            <input
              type="text"
              className="w-full border-2 border-indigo-300 rounded-xl p-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-indigo-50/40 shadow-2xs"
              placeholder="e.g. Senior AI Engineer"
              value={formData.currentRole}
              onChange={(e) => updateFormData({ currentRole: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Total Experience</label>
            <input
              type="text"
              className="w-full border-2 border-indigo-300 rounded-xl p-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-indigo-50/40 shadow-2xs"
              placeholder="e.g. 10+ years"
              value={formData.totalExperience}
              onChange={(e) => updateFormData({ totalExperience: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Current Location</label>
            <input
              type="text"
              className="w-full border-2 border-indigo-300 rounded-xl p-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-indigo-50/40 shadow-2xs"
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
      <div className={`bg-white rounded-2xl border-2 p-6 shadow-sm transition-all ${skillsList.length > 0 ? "border-indigo-400 ring-4 ring-indigo-500/15" : "border-gray-200"}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-600" />
            Technical Skills & Tech Stacks
          </h3>
          <span className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full font-bold shadow-2xs flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" /> {skillsList.length} Skills Extracted
          </span>
        </div>
        <p className="text-sm text-gray-600 font-medium mb-4">
          All programming languages, frameworks, databases, and tools parsed from your resume.
        </p>

        {/* Skill Tag Chips */}
        <div className="flex flex-wrap gap-2 mb-4 p-4 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 rounded-2xl border-2 border-indigo-200 min-h-[70px] items-center">
          {skillsList.length === 0 ? (
            <p className="text-sm text-gray-500 font-medium italic">No skills extracted yet. Upload a resume or add skills below.</p>
          ) : (
            skillsList.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs hover:scale-105 transition-all group"
              >
                <Tag className="w-3.5 h-3.5 text-indigo-200" />
                {skill}
                <button
                  onClick={() => removeSkillTag(skill)}
                  className="hover:text-red-300 transition-colors ml-1 font-bold text-sm"
                  title="Remove skill"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>

        {/* Add Skill Input */}
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border-2 border-indigo-200 rounded-xl p-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white"
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
            className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Skill
          </button>
        </div>
      </div>

      {/* Work Experience Cards */}
      <div className={`bg-white rounded-2xl border-2 p-6 shadow-sm transition-all ${workExpList.length > 0 ? "border-indigo-400 ring-4 ring-indigo-500/15" : "border-gray-200"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Work Experience History
            </h3>
            <p className="text-sm text-gray-600 font-medium mt-1">Auto-extracted job titles, companies, durations, and responsibilities.</p>
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
            className="text-xs bg-indigo-600 text-white hover:bg-indigo-700 font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Experience
          </button>
        </div>

        {workExpList.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50">
            <Briefcase className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">No work experience entries yet</p>
            <p className="text-xs text-gray-500 mt-1">Upload your resume to automatically fill this section.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {workExpList.map((exp, idx) => (
              <div key={idx} className="border-2 border-indigo-300 rounded-2xl p-5 bg-gradient-to-br from-indigo-50/40 to-purple-50/20 shadow-xs hover:border-indigo-500 transition-all space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-indigo-600 text-white font-bold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-300" /> Experience #{idx + 1} • Auto-Filled
                  </span>
                  <button
                    onClick={() => {
                      const updated = workExpList.filter((_, i) => i !== idx);
                      updateWorkExperienceList(updated);
                    }}
                    className="text-red-500 hover:text-red-700 bg-white p-1.5 rounded-lg border border-red-200 transition-colors shadow-2xs"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Company</label>
                    <input
                      type="text"
                      className="w-full border-2 border-indigo-200 rounded-xl p-3 text-sm font-bold text-gray-900 bg-white shadow-2xs focus:ring-2 focus:ring-indigo-600"
                      value={exp.company}
                      onChange={(e) => {
                        const updated = [...workExpList];
                        updated[idx].company = e.target.value;
                        updateWorkExperienceList(updated);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Role / Job Title</label>
                    <input
                      type="text"
                      className="w-full border-2 border-indigo-200 rounded-xl p-3 text-sm font-bold text-gray-900 bg-white shadow-2xs focus:ring-2 focus:ring-indigo-600"
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
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Start Date</label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-900 bg-white"
                      value={exp.startDate}
                      onChange={(e) => {
                        const updated = [...workExpList];
                        updated[idx].startDate = e.target.value;
                        updateWorkExperienceList(updated);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">End Date</label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-900 bg-white"
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
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Responsibilities & Achievements</label>
                  <textarea
                    className="w-full border-2 border-indigo-200 rounded-xl p-3 text-xs font-semibold text-gray-900 bg-white leading-relaxed resize-none shadow-2xs"
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
      <div className={`bg-white rounded-2xl border-2 p-6 shadow-sm transition-all ${projectsList.length > 0 ? "border-indigo-400 ring-4 ring-indigo-500/15" : "border-gray-200"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-600" />
              Projects & Tech Stacks
            </h3>
            <p className="text-sm text-gray-600 font-medium mt-1">Key projects and technologies extracted from your resume.</p>
          </div>
          <button
            onClick={() => {
              const updated = [
                ...projectsList,
                { name: "New Project", description: "Brief description of the project...", technologies: ["React", "TypeScript"] },
              ];
              updateProjectsList(updated);
            }}
            type="button"
            className="text-xs bg-indigo-600 text-white hover:bg-indigo-700 font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Project
          </button>
        </div>

        {projectsList.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50">
            <Code className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">No project entries yet</p>
            <p className="text-xs text-gray-500 mt-1">Upload your resume to automatically fill this section.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {projectsList.map((proj, idx) => (
              <div key={idx} className="border-2 border-indigo-300 rounded-2xl p-5 bg-gradient-to-br from-indigo-50/40 to-purple-50/20 shadow-xs hover:border-indigo-500 transition-all space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-indigo-600 text-white font-bold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-300" /> Project #{idx + 1} • Auto-Filled
                  </span>
                  <button
                    onClick={() => {
                      const updated = projectsList.filter((_, i) => i !== idx);
                      updateProjectsList(updated);
                    }}
                    className="text-red-500 hover:text-red-700 bg-white p-1.5 rounded-lg border border-red-200 transition-colors shadow-2xs"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Project Title</label>
                  <input
                    type="text"
                    className="w-full border-2 border-indigo-200 rounded-xl p-3 text-sm font-bold text-gray-900 bg-white shadow-2xs focus:ring-2 focus:ring-indigo-600"
                    value={proj.name}
                    onChange={(e) => {
                      const updated = [...projectsList];
                      updated[idx].name = e.target.value;
                      updateProjectsList(updated);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    className="w-full border-2 border-indigo-200 rounded-xl p-3 text-xs font-semibold text-gray-900 bg-white leading-relaxed resize-none shadow-2xs"
                    rows={2}
                    value={proj.description}
                    onChange={(e) => {
                      const updated = [...projectsList];
                      updated[idx].description = e.target.value;
                      updateProjectsList(updated);
                    }}
                  />
                </div>

                {/* Tech Stack Tags for Project */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Tech Stack Used</label>
                  <input
                    type="text"
                    className="w-full border-2 border-indigo-200 rounded-xl p-3 text-xs font-bold text-indigo-900 bg-indigo-50/30"
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
      <div className="bg-white rounded-2xl border-2 border-indigo-300 p-6 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              Education & Qualification
            </h3>
            {formData.education && (
              <span className="text-xs bg-indigo-600 text-white font-bold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Auto-Filled
              </span>
            )}
          </div>
          <input
            type="text"
            className="w-full border-2 border-indigo-300 rounded-xl p-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-600 bg-indigo-50/40 shadow-2xs"
            placeholder="e.g. B.Tech in Computer Science, IIT Delhi, 2020"
            value={formData.education}
            onChange={(e) => updateFormData({ education: e.target.value })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              Certifications & Credentials
            </h4>
            <button
              onClick={() => {
                const updated = [...certificationsList, "AWS Certified Solutions Architect"];
                updateCertificationsList(updated);
              }}
              type="button"
              className="text-xs bg-indigo-600 text-white hover:bg-indigo-700 font-bold px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Certification
            </button>
          </div>

          <div className="space-y-2.5">
            {certificationsList.length === 0 ? (
              <p className="text-xs text-gray-500 font-medium italic">No certifications extracted yet.</p>
            ) : (
              certificationsList.map((cert, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    className="flex-1 border-2 border-indigo-300 rounded-xl p-3 text-xs font-bold text-gray-900 bg-indigo-50/30 shadow-2xs"
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
                    className="text-red-500 hover:text-red-700 bg-white p-2.5 rounded-xl border border-red-200 shadow-2xs transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="bg-white rounded-xl border p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Preferences</h3>
      <p className="text-sm text-gray-500 mb-6">What kind of opportunities are you looking for?</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Job Type</label>
          <select
            className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Salary Range</label>
          <input
            type="text"
            className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. ₹15-20 LPA"
            value={formData.salaryRange}
            onChange={(e) => updateFormData({ salaryRange: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Location</label>
          <select
            className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
          <div className="flex gap-4 mt-2">
            {["Remote", "Hybrid", "On-site"].map((mode) => (
              <label key={mode} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="workMode"
                  className="w-4 h-4 text-indigo-600"
                  checked={formData.workMode === mode}
                  onChange={() => updateFormData({ workMode: mode })}
                />
                <span className="text-sm text-gray-700">{mode}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="bg-white rounded-xl border p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Interview Preparation</h3>
      <p className="text-sm text-gray-500 mb-6">Get ready for your 15-minute AI-powered interview.</p>
      <div className="space-y-4">
        <div className="bg-indigo-50 rounded-xl p-4">
          <h4 className="font-medium text-indigo-900 mb-2">What to expect:</h4>
          <ul className="space-y-2 text-sm text-indigo-800">
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Technical questions based on your resume & tech stacks</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Behavioral assessment</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Live coding challenge in WebRTC room</li>
          </ul>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Interview Date</label>
          <input
            type="date"
            className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
            value={formData.preferredDate}
            onChange={(e) => updateFormData({ preferredDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time Slot</label>
          <select
            className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
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
    <div className="bg-white rounded-xl border p-6 text-center py-12 shadow-sm">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">All Set! You&apos;re Good to Go! 🎉</h3>
      <p className="text-gray-500 mb-6">We&apos;re looking forward to your interview. Get ready to showcase your best self.</p>
      <div className="bg-green-50 rounded-xl p-4 max-w-md mx-auto">
        <p className="text-sm text-green-800">Your profile is complete and your AI interview is scheduled. You&apos;ll receive a confirmation email shortly.</p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2:
        return (
          <div className="bg-white rounded-xl border p-6 space-y-6 shadow-sm">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Great! Your resume is uploaded and parsed! 🎉</h3>
              <p className="text-gray-500">All your tech stacks, projects, skills, and work experience have been auto-filled.</p>
            </div>
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
      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="p-4 bg-white border-b flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4 text-green-600" />
            Your data is safe with us
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-indigo-600">{user?.name?.charAt(0) || "U"}</span>
            </div>
            <span className="text-sm font-medium">Hi, {user?.name || "User"} 👋</span>
          </div>
        </div>
        <StepIndicator steps={steps} currentStep={currentStep} />
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Let&apos;s Build Your Profile 👋</h2>
            <p className="text-gray-500 mt-1">Upload your resume to auto-fill all skills, projects, and work experience!</p>
          </div>

          {renderCurrentStep()}

          {validationError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mt-4">
              {validationError}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
              Save & Exit
            </button>
            <div className="flex items-center gap-2">
              {saving && <span className="text-sm text-gray-500">Saving...</span>}
              <button
                onClick={handleNext}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
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
