"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import StepIndicator from "@/components/StepIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, Calendar, FileText, CheckCircle, ChevronLeft, ChevronRight, ArrowRight, Shield, Lock, Eye, Clock } from "lucide-react";

const steps = [
  { number: 1, label: "Profile", sublabel: "Tell us who you are" },
  { number: 2, label: "Resume", sublabel: "Your expertise" },
  { number: 3, label: "About You", sublabel: "What you're looking for" },
  { number: 4, label: "Availability", sublabel: "Let's get you ready" },
  { number: 5, label: "AI Interview", sublabel: "Let's get you ready" },
  { number: 6, label: "All Set!", sublabel: "You're all set!" },
];

const roles = [
  "Software Engineer", "Product Manager", "Data Scientist", "UX Designer",
  "Marketing Manager", "Sales Executive", "Business Analyst", "DevOps Engineer"
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
    jobType: "",
    salaryRange: "",
    preferredLocation: "",
    workMode: "",
    preferredDate: "",
    preferredTimeSlot: "",
  });

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    if (validationError) setValidationError(null);
  };

  const progress = Math.round((currentStep / steps.length) * 100);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch profile data on mount
  useEffect(() => {
    if (user && token) {
      fetchProfile();
    }
  }, [user, token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.profile) {
        setFormData((prev) => ({
          ...prev,
          resumeUrl: data.profile.resumeUrl || "",
          resumeFileName: data.profile.resumeFileName || "",
          aboutYou: data.profile.aboutYou || "",
          whatDrivesYou: data.profile.whatDrivesYou || "",
          strengths: data.profile.strengths || "",
          currentRole: data.profile.currentRole || "",
          totalExperience: data.profile.totalExperience || "",
          currentLocation: data.profile.currentLocation || "",
          noticePeriod: data.profile.noticePeriod || "",
          skills: data.profile.skills || "",
          currentCompany: data.profile.currentCompany || "",
          education: data.profile.education || "",
          jobType: data.profile.jobType || "",
          salaryRange: data.profile.salaryRange || "",
          preferredLocation: data.profile.preferredLocation || "",
          workMode: data.profile.workMode || "",
          preferredDate: data.profile.preferredDate || "",
          preferredTimeSlot: data.profile.preferredTimeSlot || "",
        }));
        setCurrentStep(data.profile.step || 1);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

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
        console.error("Failed to save profile");
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
        // Save to profile
        await fetch("/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            resumeUrl: data.file.url,
            resumeFileName: file.name,
          }),
        });
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
        if (!formData.aboutYou.trim()) return "Please tell us about yourself";
        if (!formData.whatDrivesYou.trim()) return "Please share what drives you";
        if (!formData.currentRole) return "Please select your current role";
        if (!formData.totalExperience) return "Please select your experience";
        if (!formData.currentLocation) return "Please select your location";
        if (!formData.noticePeriod) return "Please select your notice period";
        return null;
      case 3:
        if (!formData.skills.trim()) return "Please enter your primary skills";
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
    
    // If on the last step, complete and redirect
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderStep1 = () => (
    <div className="space-y-8">
      {/* Upload Resume */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">1. Upload Your Resume</h3>
          <button className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700">
            Why upload? <Eye className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-32 h-40 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-16 h-16 text-indigo-300" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-2">Upload your latest resume to get started</h4>
            <p className="text-sm text-gray-500 mb-4">We&apos;ll use it to understand your background and make the process easier.</p>
            <div
              className="drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("resume-upload")?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <svg className="animate-spin h-8 w-8 text-indigo-600 mb-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-sm text-gray-600">Uploading...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Drag & drop your resume here</p>
                  <p className="text-xs text-gray-500 my-1">or</p>
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                    Browse Files
                  </button>
                  <p className="text-xs text-gray-500 mt-2">Supports PDF, DOC, DOCX (Max 5MB)</p>
                </>
              )}
            </div>
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileUpload}
            />
            {formData.resumeFileName && (
              <div className="mt-3 flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">{formData.resumeFileName}</span>
              </div>
            )}
            <p className="text-xs text-green-600 mt-3 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Your resume is secure and only visible to you.
            </p>
          </div>
        </div>
      </div>

      {/* Tell Us About Yourself */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Tell Us About Yourself</h3>
        <p className="text-sm text-gray-500 mb-6">Help us know you better in a few words.</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Who are you?</label>
            <p className="text-xs text-gray-500 mb-2">Introduce yourself in a few lines.</p>
            <textarea
              className="w-full border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
              placeholder="E.g. I'm a passionate software engineer with 3+ years of experience in building scalable web applications..."
              value={formData.aboutYou}
              onChange={(e) => updateFormData({ aboutYou: e.target.value })}
              maxLength={300}
            />
            <p className="text-xs text-gray-400 text-right">{formData.aboutYou.length}/300</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What drives you?</label>
            <p className="text-xs text-gray-500 mb-2">What motivates you in your career?</p>
            <textarea
              className="w-full border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
              placeholder="E.g. I love solving complex problems, learning new technologies and creating impact through my work..."
              value={formData.whatDrivesYou}
              onChange={(e) => updateFormData({ whatDrivesYou: e.target.value })}
              maxLength={300}
            />
            <p className="text-xs text-gray-400 text-right">{formData.whatDrivesYou.length}/300</p>
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">What are your key strengths?</label>
          <p className="text-xs text-gray-500 mb-2">Share your top 3-5 strengths.</p>
          <textarea
            className="w-full border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            placeholder="E.g. Problem solving, Team collaboration, Attention to detail, Adaptability..."
            value={formData.strengths}
            onChange={(e) => updateFormData({ strengths: e.target.value })}
            maxLength={250}
          />
          <p className="text-xs text-gray-400 text-right">{formData.strengths.length}/250</p>
        </div>
      </div>

      {/* Current Snapshot */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Your Current Snapshot</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
            <select
              className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.currentRole}
                onChange={(e) => updateFormData({ currentRole: e.target.value })}
            >
              <option value="">Select your role</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Experience</label>
            <select
              className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.totalExperience}
                onChange={(e) => updateFormData({ totalExperience: e.target.value })}
            >
              <option value="">Select experience</option>
              {experiences.map((exp) => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
            <select
              className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.currentLocation}
                onChange={(e) => updateFormData({ currentLocation: e.target.value })}
            >
              <option value="">Select location</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notice Period</label>
            <select
              className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.noticePeriod}
                onChange={(e) => updateFormData({ noticePeriod: e.target.value })}
            >
              <option value="">Select notice period</option>
              {noticePeriods.map((period) => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">We respect your privacy</p>
            <p className="text-xs text-gray-500">Your information is protected with industry-leading security. We never share your data without your consent.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Encrypted</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Private</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="bg-white rounded-xl border p-6 space-y-6">
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Great! Your resume is uploaded successfully! 🎉</h3>
        <p className="text-gray-500">Let&apos;s book your 15-minute AI interview. Choose a time that works best for you.</p>
      </div>
      <div className="bg-indigo-50 rounded-xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">✨</span>
        </div>
        <div>
          <p className="text-sm font-medium text-indigo-900">Just 15 minutes to open doors to endless opportunities.</p>
          <p className="text-xs text-indigo-700 mt-1">Our AI interview is designed to understand you better and match you with roles where you can shine.</p>
        </div>
        <div className="flex gap-4 ml-auto">
          <div className="text-center">
            <Clock className="w-6 h-6 text-indigo-600 mx-auto" />
            <p className="text-[10px] text-gray-600 mt-1">15 Min<br/>Interview</p>
          </div>
          <div className="text-center">
            <span className="text-2xl">🧠</span>
            <p className="text-[10px] text-gray-600 mt-1">AI-Powered<br/>Assessment</p>
          </div>
          <div className="text-center">
            <Lock className="w-6 h-6 text-indigo-600 mx-auto" />
            <p className="text-[10px] text-gray-600 mt-1">Secure &<br/>Private</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Experience</h3>
      <p className="text-sm text-gray-500 mb-6">Tell us about your professional background.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Primary Skills</label>
          <input 
            type="text" 
            className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500" 
            placeholder="e.g. JavaScript, React, Node.js"
            value={formData.skills}
            onChange={(e) => updateFormData({ skills: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
          <select 
            className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
            value={formData.totalExperience}
            onChange={(e) => updateFormData({ totalExperience: e.target.value })}
          >
            <option>Select experience</option>
            {experiences.map((exp) => (
              <option key={exp} value={exp}>{exp}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Company</label>
          <input 
            type="text" 
            className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500" 
            placeholder="e.g. Tech Corp"
            value={formData.currentCompany}
            onChange={(e) => updateFormData({ currentCompany: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
          <input 
            type="text" 
            className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500" 
            placeholder="e.g. B.Tech in Computer Science"
            value={formData.education}
            onChange={(e) => updateFormData({ education: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="bg-white rounded-xl border p-6">
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
    <div className="bg-white rounded-xl border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Interview Preparation</h3>
      <p className="text-sm text-gray-500 mb-6">Get ready for your 15-minute AI-powered interview.</p>
      <div className="space-y-4">
        <div className="bg-indigo-50 rounded-xl p-4">
          <h4 className="font-medium text-indigo-900 mb-2">What to expect:</h4>
          <ul className="space-y-2 text-sm text-indigo-800">
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Technical questions based on your resume</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Behavioral assessment</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Problem-solving scenarios</li>
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
    <div className="bg-white rounded-xl border p-6 text-center py-12">
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
      case 2: return renderStep2();
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
        <div className="p-4 bg-white border-b flex items-center justify-between">
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
            <p className="text-gray-500 mt-1">The more we know about you, the better we can match you with the right opportunities.</p>
          </div>
          {renderCurrentStep()}
          {validationError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {validationError}
            </div>
          )}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Save & Exit
            </button>
            <div className="flex items-center gap-2">
              {saving && <span className="text-sm text-gray-500">Saving...</span>}
              <button
                onClick={handleNext}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Completing..." : currentStep === steps.length ? "Complete" : "Save & Continue"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
