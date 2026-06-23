"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { profileService } from "@/services/profile.service";
import { resumeService } from "@/services/resume.service";
import { useAuthStore } from "@/store/auth.store";
import { RESUME_BUILDER_URL } from "@/constants";
import type { CandidateProfileUser } from "@/types";

/* ─── Resume Builder shape (autofill) ───────────────────── */
interface ResumePersonalInfo {
  fullName?: string;
  phone?: string;
  location?: string;
  city?: string;
  state?: string;
  linkedin?: string;
  headline?: string;
}

interface ResumeExperience {
  company?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  bullets?: string[];
}

interface ResumeEducation {
  institution?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
}

interface ResumeData {
  personalInfo?: ResumePersonalInfo;
  experience?: ResumeExperience[];
  education?: ResumeEducation[];
  skills?: string[];
}

function parseYear(date?: string): number | undefined {
  if (!date) return undefined;
  const y = new Date(date).getFullYear();
  return Number.isNaN(y) ? undefined : y;
}

/* ─── SVG Icons ─────────────────────────────────────────── */
function Icon({ k, size = 16 }: { k: string; size?: number }) {
  const icons: Record<string, React.ReactNode> = {
    user:     <><circle cx="12" cy="8" r="3.5" /><path d="M4 20a8 8 0 0 1 16 0" /></>,
    mail:     <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" /></>,
    phone:    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 11a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.09 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />,
    location: <><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
    linkedin: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></>,
    briefcase:<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5h6v2M3 13h18" /></>,
    grad:     <><path d="m12 3 8 4.5v5M4 7.5 12 3l8 4.5" /><path d="M12 12 4 7.5v5L12 17l8-4.5v-5" /></>,
    cert:     <><rect x="3" y="3" width="18" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>,
    plus:     <path d="M12 5v14M5 12h14" />,
    trash:    <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" /></>,
    check:    <path d="M20 6 9 17l-5-5" />,
    spark:    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />,
    globe:    <><circle cx="12" cy="12" r="9" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
    eye:      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
    save:     <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8" />,
    arrow:    <path d="M5 12h14M12 5l7 7-7 7" />,
    camera:   <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
    file:     <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      {icons[k] ?? null}
    </svg>
  );
}

function getInitials(name?: string) {
  if (!name) return "U";
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("") || "U";
}

/* ─── Progress Ring ─────────────────────────────────────── */
function ProgressRing({ pct }: { pct: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <svg className="cp-ring" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--cp-border)" strokeWidth="8" />
      <circle
        cx="44" cy="44" r={r} fill="none"
        stroke="var(--cp-green)" strokeWidth="8"
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 44 44)"
      />
    </svg>
  );
}

/* ─── Section wrapper ───────────────────────────────────── */
function Section({ icon, title, action, children }: {
  icon: string; title: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="cp-section">
      <div className="cp-section-header">
        <div className="cp-section-title-row">
          <span className="cp-section-icon"><Icon k={icon} size={15} /></span>
          <h2 className="cp-section-title">{title}</h2>
        </div>
        {action}
      </div>
      <div className="cp-section-body">{children}</div>
    </div>
  );
}

/* ─── Form field ────────────────────────────────────────── */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="cp-field">
      <label className="cp-label">{label}{required && <span className="cp-required">*</span>}</label>
      {children}
    </div>
  );
}

/* ─── Skill tag input ───────────────────────────────────── */
function SkillsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addSkill(raw: string) {
    const trimmed = raw.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(input); }
    if (e.key === "Backspace" && !input && value.length) onChange(value.slice(0, -1));
  }

  return (
    <div className="cp-skills-wrap" onClick={() => inputRef.current?.focus()}>
      {value.map(skill => (
        <span key={skill} className="cp-skill-tag">
          {skill}
          <button type="button" onClick={() => onChange(value.filter(s => s !== skill))} aria-label={`Remove ${skill}`}>×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        className="cp-skills-input"
        placeholder={value.length === 0 ? "Type a skill and press Enter or comma…" : ""}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addSkill(input); }}
      />
    </div>
  );
}

/* ─── Add button ────────────────────────────────────────── */
function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="cp-add-btn" onClick={onClick}>
      <Icon k="plus" size={14} /> {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export function CandidateProfilePage() {
  const [profile, setProfile] = useState<CandidateProfileUser | null>(null);
  const [completion, setCompletion] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "experience" | "education" | "certifications">("personal");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const updateAuthUser = useAuthStore((s) => s.updateUser);

  useEffect(() => {
    profileService
      .getProfile()
      .then((r) => {
        setProfile(r.user);
        setCompletion(r.profileCompletion || 0);
        setSkills(r.user.skills || []);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load profile');
      })
      .finally(() => setLoading(false));
  }, []);

  function up<K extends keyof CandidateProfileUser>(key: K, val: CandidateProfileUser[K]) {
    setProfile(p => p ? { ...p, [key]: val } : null);
  }

  async function autofillFromResume() {
    try {
      setAutofilling(true); setSaved(""); setError("");
      const resumes = await resumeService.getResumes() as Array<{ id?: string; isDefault?: boolean }>;
      const resumeMeta = resumes.find(r => r.isDefault) || resumes[0];
      if (!resumeMeta?.id) {
        setError("No resume found. Create a resume in Resume Builder first.");
        return;
      }
      const resume = await resumeService.getResume(resumeMeta.id) as ResumeData;
      const pi = resume.personalInfo || {};

      setProfile(p => {
        if (!p) return null;
        const n = { ...p };
        if (pi.fullName) n.fullName = pi.fullName;
        if (pi.phone) n.phoneNumber = pi.phone;
        if (pi.linkedin) n.linkedinProfile = pi.linkedin;
        if (pi.headline) n.designation = pi.headline;
        if (pi.location || pi.city) {
          n.location = {
            country: p.location?.country || "",
            state: pi.state || p.location?.state || "",
            city: pi.city || pi.location || p.location?.city || "",
          };
        }
        if (resume.experience?.length) {
          n.workExperiences = resume.experience.map(exp => ({
            company: exp.company || "",
            designation: exp.title || "",
            startDate: exp.startDate || "",
            endDate: exp.current ? undefined : exp.endDate,
            currentlyWorking: exp.current ?? false,
            description: (exp.bullets || []).join("\n"),
          }));
          const current = resume.experience.find(e => e.current);
          if (current?.company) n.currentCompany = current.company;
        }
        if (resume.education?.length) {
          n.educations = resume.education.map(edu => ({
            degree: edu.degree || "",
            specialization: edu.field || "",
            institute: edu.institution || "",
            startYear: parseYear(edu.startDate),
            endYear: parseYear(edu.endDate),
          }));
        }
        return n;
      });
      if (resume.skills?.length) setSkills(resume.skills);
      setSaved("Profile auto-filled from resume — review and save.");
    } catch (e: unknown) {
      setError("Autofill failed: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setAutofilling(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (!profile.fullName && !profile.name) { setError("Full Name is required"); return; }
    if (!profile.phoneNumber && !profile.phone) { setError("Phone Number is required"); return; }
    setSaving(true); setSaved(""); setError("");
    try {
      const r = await profileService.updateProfile({ ...profile, skills });
      setProfile(r.user); setCompletion(r.profileCompletion);
      setSaved("Profile updated successfully!");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setSaved("");
    setError("");

    try {
      const response = await profileService.uploadProfilePhoto(file);
      setProfile(response.user);
      setCompletion(response.profileCompletion || 0);
      if (response.user.profilePhoto) {
        updateAuthUser({ avatar: response.user.profilePhoto });
      }
      setSaved("Profile photo updated.");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          "Failed to upload profile photo"
      );
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  function addExp()  { setProfile(p => p ? { ...p, workExperiences: [...(p.workExperiences||[]), { company:"", designation:"", startDate:"", currentlyWorking:true, description:"" }] } : null); setActiveTab("experience"); }
  function addEdu()  { setProfile(p => p ? { ...p, educations: [...(p.educations||[]), { degree:"", specialization:"", institute:"", startYear:new Date().getFullYear(), endYear:new Date().getFullYear() }] } : null); setActiveTab("education"); }
  function addCert() { setProfile(p => p ? { ...p, certifications: [...(p.certifications||[]), { name:"", issuingOrganization:"", issueDate:"", credentialId:"" }] } : null); setActiveTab("certifications"); }

  if (loading) return (
    <div className="cp-loading">
      <div className="cp-loading-ring" />
      <p>Loading profile…</p>
    </div>
  );

  if (!profile) return (
    <div className="cp-alert cp-alert--error" style={{ margin: '2rem' }}>
      {error || 'Failed to load profile'}
    </div>
  );

  const TABS = [
    { id: "personal",        label: "Personal Info",    icon: "user" },
    { id: "experience",      label: "Experience",       icon: "briefcase",  count: profile.workExperiences?.length },
    { id: "education",       label: "Education",        icon: "grad",       count: profile.educations?.length },
    { id: "certifications",  label: "Certifications",   icon: "cert",       count: profile.certifications?.length },
  ] as const;

  return (
    <div className="cp-shell">
      <form onSubmit={handleSubmit} noValidate>

        <div className="cp-header-card">
          <div className="cp-cover-banner" />
          <div className="cp-header-info">
            <div className="cp-avatar-container">
              <div className="cp-avatar">
                {profile.profilePhoto ? (
                  <img
                    src={profile.profilePhoto}
                    alt={profile.fullName || profile.name || "Profile photo"}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                  />
                ) : (
                  getInitials(profile.fullName || profile.name)
                )}
                <button
                  type="button"
                  className="cp-avatar-upload"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  aria-label="Upload profile photo"
                >
                  <Icon k="camera" size={18} />
                  <span>{uploadingPhoto ? "Uploading…" : "Upload"}</span>
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => void handlePhotoUpload(e)}
                />
              </div>
              <div className="cp-avatar-ring-wrap">
                <ProgressRing pct={completion} />
              </div>
            </div>
            <div className="cp-header-meta">
              <h1 className="cp-header-name">{profile.fullName || profile.name || "Your Name"}</h1>
              <p className="cp-header-title">
                {profile.designation || "Add your designation"}
                {profile.currentCompany && ` at ${profile.currentCompany}`}
              </p>
              <div className="cp-header-badges">
                {profile.openToWork && <span className="cp-badge cp-badge--green">Open to Work</span>}
                {profile.emailVerified && <span className="cp-badge cp-badge--blue">Email Verified</span>}
                <span className="cp-strength-badge">Profile Strength: {completion}%</span>
              </div>
            </div>
            <div className="cp-header-actions">
              <button type="button" className="cp-autofill-btn" onClick={autofillFromResume} disabled={autofilling}>
                <Icon k="spark" size={14} />
                {autofilling ? "Autofilling…" : "Autofill from Resume"}
              </button>
              <button type="submit" className="cp-save-btn" disabled={saving}>
                <Icon k="save" size={15} />
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="cp-alert cp-alert--error">
            <Icon k="spark" size={15} /> {error}
            <button type="button" onClick={() => setError("")}>×</button>
          </div>
        )}
        {saved && (
          <div className="cp-alert cp-alert--success">
            <Icon k="check" size={15} /> {saved}
            <button type="button" onClick={() => setSaved("")}>×</button>
          </div>
        )}

        <div className="cp-grid-layout">

          <div className="cp-sidebar-col">

            <div className="cp-strength-card">
              <div className="cp-strength-header">
                <span className="cp-strength-title">Profile Strength</span>
                <span className="cp-strength-label">{completion >= 80 ? "Strong" : completion >= 50 ? "Good" : "Weak"}</span>
              </div>
              <div className="cp-strength-progress-track">
                <div className="cp-strength-progress-fill" style={{ width: `${completion}%` }} />
              </div>
              <p className="cp-strength-desc">
                {completion < 50
                  ? "Add education, work history, and skills to stand out to recruiters."
                  : completion < 85
                  ? "You are doing great! Complete missing certifications or experience to reach 100%."
                  : "Excellent profile! Your resume is ready for top job matches."}
              </p>
            </div>

            <div className="cp-sidebar-card">
              <h2 className="cp-sidebar-card-title">Contact Details</h2>
              <div className="cp-aside-info-row">
                <Icon k="mail" size={16} />
                <span>{profile.email}</span>
              </div>
              {(profile.phoneNumber || profile.phone) && (
                <div className="cp-aside-info-row">
                  <Icon k="phone" size={16} />
                  <span>{profile.phoneNumber || profile.phone}</span>
                </div>
              )}
              {(profile.location?.city || profile.location?.country) && (
                <div className="cp-aside-info-row">
                  <Icon k="location" size={16} />
                  <span>{[profile.location.city, profile.location.state, profile.location.country].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {profile.linkedinProfile && (
                <div className="cp-aside-info-row">
                  <Icon k="linkedin" size={16} />
                  <a href={profile.linkedinProfile} target="_blank" rel="noopener noreferrer" className="cp-aside-link">LinkedIn Profile</a>
                </div>
              )}
            </div>

            {skills.length > 0 && (
              <div className="cp-sidebar-card">
                <h2 className="cp-sidebar-card-title">Core Skills</h2>
                <div className="cp-skill-pills">
                  {skills.slice(0, 12).map(s => <span key={s} className="cp-skill-pill">{s}</span>)}
                  {skills.length > 12 && <span className="cp-skill-pill cp-skill-pill--more">+{skills.length - 12} more</span>}
                </div>
              </div>
            )}

            <div className="cp-sidebar-card">
              <h2 className="cp-sidebar-card-title">Resume Builder</h2>
              <div className="cp-aside-info-row">
                <Icon k="file" size={16} />
                <a href={RESUME_BUILDER_URL} target="_blank" rel="noopener noreferrer" className="cp-aside-link">
                  Open Resume Builder
                </a>
              </div>
              <div className="cp-aside-info-row">
                <Icon k="briefcase" size={16} />
                <Link href="/resume" className="cp-aside-link">Manage Resumes</Link>
              </div>
            </div>
          </div>

          <div className="cp-form-panel">

            <div className="cp-tabs" role="tablist">
              {TABS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t.id}
                  className={`cp-tab${activeTab === t.id ? " cp-tab--active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  <Icon k={t.icon} size={14} />
                  {t.label}
                  {"count" in t && t.count != null && t.count > 0 && (
                    <span className="cp-tab-count">{t.count}</span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === "personal" && (
              <>
                <Section icon="user" title="Personal Information">
                  <div className="cp-grid cp-grid-3">
                    <Field label="Full Name" required>
                      <input className="cp-input" placeholder="John Doe"
                        value={profile.fullName || profile.name || ""}
                        onChange={e => up("fullName", e.target.value)} required />
                    </Field>
                    <Field label="Email Address">
                      <input className="cp-input cp-input--disabled" value={profile.email} disabled />
                    </Field>
                    <Field label="Phone Number" required>
                      <input className="cp-input" placeholder="+91 98765 43210"
                        value={profile.phoneNumber || profile.phone || ""}
                        onChange={e => up("phoneNumber", e.target.value)} required />
                    </Field>
                  </div>
                  <div className="cp-grid cp-grid-3" style={{ marginTop: "1.25rem" }}>
                    <Field label="LinkedIn URL">
                      <input className="cp-input" placeholder="https://linkedin.com/in/..."
                        value={profile.linkedinProfile || profile.portfolioLinks?.linkedin || ""}
                        onChange={e => up("linkedinProfile", e.target.value)} />
                    </Field>
                    <Field label="City">
                      <input className="cp-input" placeholder="Mumbai"
                        value={profile.location?.city || ""}
                        onChange={e => up("location", { ...(profile.location || { country: "", state: "" }), city: e.target.value })} />
                    </Field>
                    <Field label="State">
                      <input className="cp-input" placeholder="Maharashtra"
                        value={profile.location?.state || ""}
                        onChange={e => up("location", { ...(profile.location || { country: "", city: "" }), state: e.target.value })} />
                    </Field>
                  </div>
                  <div className="cp-grid cp-grid-3" style={{ marginTop: "1.25rem" }}>
                    <Field label="Country">
                      <input className="cp-input" placeholder="India"
                        value={profile.location?.country || ""}
                        onChange={e => up("location", { ...(profile.location || { state: "", city: "" }), country: e.target.value })} />
                    </Field>
                  </div>
                </Section>

                <Section icon="briefcase" title="Professional Details">
                  <div className="cp-grid cp-grid-3">
                    <Field label="Current Company">
                      <input className="cp-input" placeholder="e.g. Google"
                        value={profile.currentCompany || ""}
                        onChange={e => up("currentCompany", e.target.value)} />
                    </Field>
                    <Field label="Current Designation">
                      <input className="cp-input" placeholder="e.g. Senior Software Engineer"
                        value={profile.designation || ""}
                        onChange={e => up("designation", e.target.value)} />
                    </Field>
                    <Field label="Total Experience (Years)">
                      <input type="number" className="cp-input" placeholder="5" min={0} max={50}
                        value={profile.totalExperienceYears || ""}
                        onChange={e => up("totalExperienceYears", +e.target.value)} />
                    </Field>
                  </div>
                </Section>

                <Section icon="spark" title="Skills">
                  <p className="cp-hint">Press Enter or comma after each skill to add it</p>
                  <SkillsInput value={skills} onChange={setSkills} />
                </Section>
              </>
            )}

            {activeTab === "experience" && (
              <Section icon="briefcase" title="Work Experience" action={<AddBtn label="Add Experience" onClick={addExp} />}>
                {(profile.workExperiences || []).length === 0 ? (
                  <div className="cp-empty">
                    <span className="cp-empty-icon"><Icon k="briefcase" size={22} /></span>
                    <p className="cp-empty-title">No experience added yet</p>
                    <p className="cp-empty-sub">Add your work history to improve your profile strength.</p>
                    <button type="button" className="cp-add-btn" onClick={addExp}><Icon k="plus" size={14} /> Add Experience</button>
                  </div>
                ) : (
                  <div className="cp-exp-list">
                    {(profile.workExperiences || []).map((exp, i) => (
                      <div key={i} className="cp-exp-card">
                        <div className="cp-exp-timeline-dot" />
                        <div className="cp-exp-content">
                          <div className="cp-exp-card-header">
                            <div className="cp-exp-card-logo">
                              {exp.company ? exp.company.slice(0, 2).toUpperCase() : "CO"}
                            </div>
                            <div className="cp-exp-card-title">
                              <input className="cp-input cp-input--title" placeholder="Designation / Role"
                                value={exp.designation}
                                onChange={e => {
                                  const n = [...(profile.workExperiences||[])]; n[i] = {...n[i], designation: e.target.value};
                                  up("workExperiences", n);
                                }} />
                              <input className="cp-input cp-input--sub" placeholder="Company Name"
                                value={exp.company}
                                onChange={e => {
                                  const n = [...(profile.workExperiences||[])]; n[i] = {...n[i], company: e.target.value};
                                  up("workExperiences", n);
                                }} />
                            </div>
                            <button type="button" className="cp-remove-btn" aria-label="Remove" onClick={() =>
                              up("workExperiences", (profile.workExperiences||[]).filter((_,idx)=>idx!==i))
                            }><Icon k="trash" size={14} /></button>
                          </div>
                          <div className="cp-exp-dates">
                            <div className="cp-date-field">
                              <label className="cp-label-xs">Start Date</label>
                              <input type="date" className="cp-input cp-input--date"
                                value={exp.startDate ? new Date(exp.startDate).toISOString().split("T")[0] : ""}
                                onChange={e => {
                                  const n = [...(profile.workExperiences||[])]; n[i] = {...n[i], startDate: e.target.value};
                                  up("workExperiences", n);
                                }} />
                            </div>
                            {!exp.currentlyWorking && (
                              <div className="cp-date-field">
                                <label className="cp-label-xs">End Date</label>
                                <input type="date" className="cp-input cp-input--date"
                                  value={exp.endDate ? new Date(exp.endDate).toISOString().split("T")[0] : ""}
                                  onChange={e => {
                                    const n = [...(profile.workExperiences||[])]; n[i] = {...n[i], endDate: e.target.value};
                                    up("workExperiences", n);
                                  }} />
                              </div>
                            )}
                            <label className="cp-checkbox-label">
                              <input type="checkbox" checked={exp.currentlyWorking}
                                onChange={e => {
                                  const n = [...(profile.workExperiences||[])]; n[i] = {...n[i], currentlyWorking: e.target.checked};
                                  up("workExperiences", n);
                                }} />
                              <span>Currently working here</span>
                            </label>
                          </div>
                          <textarea className="cp-input cp-input--textarea" rows={3}
                            placeholder="Describe your responsibilities and achievements…"
                            value={exp.description}
                            onChange={e => {
                              const n = [...(profile.workExperiences||[])]; n[i] = {...n[i], description: e.target.value};
                              up("workExperiences", n);
                            }} />
                        </div>
                      </div>
                    ))}
                    <button type="button" className="cp-add-btn cp-add-btn--wide" onClick={addExp}>
                      <Icon k="plus" size={14} /> Add Another Experience
                    </button>
                  </div>
                )}
              </Section>
            )}

            {activeTab === "education" && (
              <Section icon="grad" title="Education" action={<AddBtn label="Add Education" onClick={addEdu} />}>
                {(profile.educations || []).length === 0 ? (
                  <div className="cp-empty">
                    <span className="cp-empty-icon"><Icon k="grad" size={22} /></span>
                    <p className="cp-empty-title">No education added yet</p>
                    <p className="cp-empty-sub">Add your educational background to strengthen your profile.</p>
                    <button type="button" className="cp-add-btn" onClick={addEdu}><Icon k="plus" size={14} /> Add Education</button>
                  </div>
                ) : (
                  <div className="cp-edu-list">
                    {(profile.educations || []).map((edu, i) => (
                      <div key={i} className="cp-edu-card">
                        <div className="cp-edu-card-header">
                          <div className="cp-edu-icon"><Icon k="grad" size={16} /></div>
                          <div className="cp-edu-fields">
                            <div className="cp-grid cp-grid-3">
                              <Field label="Degree">
                                <input className="cp-input" placeholder="B.Tech / MBA / M.Sc"
                                  value={edu.degree}
                                  onChange={e => {
                                    const n = [...(profile.educations||[])]; n[i] = {...n[i], degree: e.target.value};
                                    up("educations", n);
                                  }} />
                              </Field>
                              <Field label="Specialization">
                                <input className="cp-input" placeholder="Computer Science"
                                  value={edu.specialization}
                                  onChange={e => {
                                    const n = [...(profile.educations||[])]; n[i] = {...n[i], specialization: e.target.value};
                                    up("educations", n);
                                  }} />
                              </Field>
                              <Field label="Institute">
                                <input className="cp-input" placeholder="IIT Bombay"
                                  value={edu.institute}
                                  onChange={e => {
                                    const n = [...(profile.educations||[])]; n[i] = {...n[i], institute: e.target.value};
                                    up("educations", n);
                                  }} />
                              </Field>
                            </div>
                            <div className="cp-grid cp-grid-3" style={{ marginTop: "1rem" }}>
                              <Field label="Start Year">
                                <input type="number" className="cp-input" placeholder="2018" min={1950} max={2030}
                                  value={edu.startYear || ""}
                                  onChange={e => {
                                    const n = [...(profile.educations||[])]; n[i] = {...n[i], startYear: +e.target.value};
                                    up("educations", n);
                                  }} />
                              </Field>
                              <Field label="End Year">
                                <input type="number" className="cp-input" placeholder="2022" min={1950} max={2030}
                                  value={edu.endYear || ""}
                                  onChange={e => {
                                    const n = [...(profile.educations||[])]; n[i] = {...n[i], endYear: +e.target.value};
                                    up("educations", n);
                                  }} />
                              </Field>
                            </div>
                          </div>
                          <button type="button" className="cp-remove-btn" aria-label="Remove" onClick={() =>
                            up("educations", (profile.educations||[]).filter((_,idx)=>idx!==i))
                          }><Icon k="trash" size={14} /></button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="cp-add-btn cp-add-btn--wide" onClick={addEdu}>
                      <Icon k="plus" size={14} /> Add Another Education
                    </button>
                  </div>
                )}
              </Section>
            )}

            {activeTab === "certifications" && (
              <Section icon="cert" title="Certifications" action={<AddBtn label="Add Certification" onClick={addCert} />}>
                {(profile.certifications || []).length === 0 ? (
                  <div className="cp-empty">
                    <span className="cp-empty-icon"><Icon k="cert" size={22} /></span>
                    <p className="cp-empty-title">No certifications added yet</p>
                    <p className="cp-empty-sub">Certifications boost your profile visibility with recruiters.</p>
                    <button type="button" className="cp-add-btn" onClick={addCert}><Icon k="plus" size={14} /> Add Certification</button>
                  </div>
                ) : (
                  <div className="cp-cert-list">
                    {(profile.certifications || []).map((cert, i) => (
                      <div key={i} className="cp-cert-card">
                        <div className="cp-cert-icon"><Icon k="cert" size={15} /></div>
                        <div className="cp-cert-fields">
                          <div className="cp-grid cp-grid-3">
                            <Field label="Certification Name">
                              <input className="cp-input" placeholder="AWS Solutions Architect"
                                value={cert.name}
                                onChange={e => {
                                  const n = [...(profile.certifications||[])]; n[i] = {...n[i], name: e.target.value};
                                  up("certifications", n);
                                }} />
                            </Field>
                            <Field label="Issuing Organization">
                              <input className="cp-input" placeholder="Amazon Web Services"
                                value={cert.issuingOrganization}
                                onChange={e => {
                                  const n = [...(profile.certifications||[])]; n[i] = {...n[i], issuingOrganization: e.target.value};
                                  up("certifications", n);
                                }} />
                            </Field>
                            <Field label="Issue Date">
                              <input type="date" className="cp-input"
                                value={cert.issueDate ? new Date(cert.issueDate).toISOString().split("T")[0] : ""}
                                onChange={e => {
                                  const n = [...(profile.certifications||[])]; n[i] = {...n[i], issueDate: e.target.value};
                                  up("certifications", n);
                                }} />
                            </Field>
                          </div>
                          <div className="cp-grid cp-grid-3" style={{ marginTop: "1rem" }}>
                            <Field label="Credential ID (optional)">
                              <input className="cp-input" placeholder="ABC123XYZ"
                                value={cert.credentialId || ""}
                                onChange={e => {
                                  const n = [...(profile.certifications||[])]; n[i] = {...n[i], credentialId: e.target.value};
                                  up("certifications", n);
                                }} />
                            </Field>
                            <Field label="Expiry Date (optional)">
                              <input type="date" className="cp-input"
                                value={cert.expiryDate ? new Date(cert.expiryDate).toISOString().split("T")[0] : ""}
                                onChange={e => {
                                  const n = [...(profile.certifications||[])]; n[i] = {...n[i], expiryDate: e.target.value};
                                  up("certifications", n);
                                }} />
                            </Field>
                          </div>
                        </div>
                        <button type="button" className="cp-remove-btn" aria-label="Remove" onClick={() =>
                          up("certifications", (profile.certifications||[]).filter((_,idx)=>idx!==i))
                        }><Icon k="trash" size={14} /></button>
                      </div>
                    ))}
                    <button type="button" className="cp-add-btn cp-add-btn--wide" onClick={addCert}>
                      <Icon k="plus" size={14} /> Add Another Certification
                    </button>
                  </div>
                )}
              </Section>
            )}

            <div className="cp-bottom-bar">
              {error && <p className="cp-bottom-error">{error}</p>}
              {saved && <p className="cp-bottom-success">{saved}</p>}
              <button type="submit" className="cp-save-btn" disabled={saving}>
                <Icon k="save" size={15} />
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
