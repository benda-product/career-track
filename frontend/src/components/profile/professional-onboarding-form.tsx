'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { profileService } from '@/services/profile.service';
import type { CandidateProfileUser } from '@/types';

const AGE_OPTIONS = ['18-24', '25-30', '31-35', '36-40', '40+'];
const VISA_OPTIONS = ['H-1B', 'F-1', 'J-1', 'L-1', 'Green Card', 'US Citizen', 'Other'];
const EXPERIENCE_BANDS = [
  { value: 'Fresher 0', label: 'Less than 1 year (Fresher)' },
  { value: '1', label: '1 year' },
  { value: '2', label: '2 years' },
  { value: '3', label: '3 years' },
  { value: '4', label: '4 years' },
  { value: '5', label: '5 years' },
  { value: '6', label: '6 years' },
  { value: '7', label: '7 years' },
  { value: '8', label: '8 years' },
  { value: '8+', label: '8+ years' },
];
const MAJOR_SKILLS = [
  'Web Development',
  'Java Developer',
  'Data Analyst',
  'Business Intelligence',
  'Business Analyst',
  'Data Science',
  'Cloud Computing',
  'DevOps Engineer',
  'Mobile App Development',
  'Machine Learning',
  'AI/Deep Learning',
  'Cybersecurity',
  'UI/UX Design',
  'Full Stack Developer',
  'Software Engineering',
  'Project Management',
  'Game Development',
  'Blockchain Developer',
  'AR/VR Development',
  'Database Administrator',
  'Digital Marketing',
  'Other',
];

type DomainExperience = { domain: string; yearsOfExperience: number };

export function ProfessionalOnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [existingResumeName, setExistingResumeName] = useState('');
  const [otherSkill, setOtherSkill] = useState('');
  const [otherVisa, setOtherVisa] = useState('');
  const [otherMajorSkill, setOtherMajorSkill] = useState('');
  const [newDomain, setNewDomain] = useState({ domain: '', yearsOfExperience: '' });
  const [form, setForm] = useState({
    fullName: '',
    age: '18-24',
    summary: '',
    phoneNumber: '',
    locationText: '',
    majorSkill: '',
    visaStatus: 'Other',
    skills: [] as string[],
    totalExperienceBand: 'Fresher 0',
    collageName: '',
    degree: '',
    startYear: '',
    endYear: '',
    domainExperiences: [] as DomainExperience[],
    isWorking: false,
    willingToRelocate: false,
    courses: [] as string[],
  });

  useEffect(() => {
    profileService
      .getProfile()
      .then((res) => {
        const user = res.user;
        const edu = user.educations?.[0];
        setForm({
          fullName: user.fullName || user.name || '',
          age: user.age || '18-24',
          summary: user.summary || '',
          phoneNumber: user.phoneNumber || user.phone || '',
          locationText: user.locationText || [user.location?.city, user.location?.state, user.location?.country].filter(Boolean).join(', '),
          majorSkill: user.majorSkill || '',
          visaStatus: user.visaStatus || 'Other',
          skills: user.technicalSkills?.length ? user.technicalSkills : user.skills || [],
          totalExperienceBand: user.totalExperienceBand || 'Fresher 0',
          collageName: edu?.institute || '',
          degree: edu?.degree || '',
          startYear: edu?.startYear ? String(edu.startYear) : '',
          endYear: edu?.endYear ? String(edu.endYear) : '',
          domainExperiences: user.domainExperiences || [],
          isWorking: user.isWorking ?? false,
          willingToRelocate: user.willingToRelocate ?? false,
          courses: user.courses || [],
        });
        setExistingResumeName(user.resumeFileName || '');
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [router]);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addSkill() {
    const skill = otherSkill.trim();
    if (!skill || form.skills.includes(skill)) return;
    updateField('skills', [...form.skills, skill]);
    setOtherSkill('');
  }

  function removeSkill(skill: string) {
    updateField('skills', form.skills.filter((s) => s !== skill));
  }

  function addDomainExperience() {
    if (!newDomain.domain.trim() || !newDomain.yearsOfExperience) return;
    updateField('domainExperiences', [
      ...form.domainExperiences,
      { domain: newDomain.domain.trim(), yearsOfExperience: Number(newDomain.yearsOfExperience) },
    ]);
    setNewDomain({ domain: '', yearsOfExperience: '' });
  }

  function removeDomainExperience(index: number) {
    updateField('domainExperiences', form.domainExperiences.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.fullName.trim() || !form.locationText.trim()) {
      setError('Name and location are required.');
      return;
    }

    const majorSkill =
      form.majorSkill === 'Other' ? otherMajorSkill.trim() || 'Other' : form.majorSkill;
    const visaStatus = form.visaStatus === 'Other' ? otherVisa.trim() || 'Other' : form.visaStatus;

    setSaving(true);
    try {
      const payload: Partial<CandidateProfileUser> & Record<string, unknown> = {
        fullName: form.fullName.trim(),
        age: form.age,
        summary: form.summary,
        phoneNumber: form.phoneNumber,
        locationText: form.locationText.trim(),
        location: { city: form.locationText.trim(), state: '', country: '' },
        majorSkill,
        visaStatus,
        technicalSkills: form.skills,
        skills: form.skills,
        totalExperienceBand: form.totalExperienceBand,
        isWorking: form.isWorking,
        willingToRelocate: form.willingToRelocate,
        courses: form.courses,
        domainExperiences: form.domainExperiences,
        professionalProfileCompleted: true,
        educations: form.collageName || form.degree
          ? [{
              institute: form.collageName,
              degree: form.degree,
              specialization: '',
              startYear: form.startYear ? Number(form.startYear) : undefined,
              endYear: form.endYear ? Number(form.endYear) : undefined,
            }]
          : [],
      };

      await profileService.updateProfile(payload);

      if (resumeFile) {
        await profileService.uploadResume(resumeFile);
      }

      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6 pb-10">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Professional Information</h1>
        <p className="text-sm text-slate-500">
          Complete your profile once in Career Track. It syncs to SkillCheck for assessments.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="age">Age</Label>
            <select id="age" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.age} onChange={(e) => updateField('age', e.target.value)}>
              {AGE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={form.phoneNumber} onChange={(e) => updateField('phoneNumber', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="summary">Bio</Label>
            <Textarea id="summary" rows={4} value={form.summary} onChange={(e) => updateField('summary', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="location">Current Location</Label>
            <Input id="location" value={form.locationText} onChange={(e) => updateField('locationText', e.target.value)} placeholder="e.g. New York, NY" required />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Career & Visa</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="experienceBand">Total Experience (years)</Label>
            <select id="experienceBand" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.totalExperienceBand} onChange={(e) => updateField('totalExperienceBand', e.target.value)}>
              {EXPERIENCE_BANDS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="majorSkill">Major Skill</Label>
            <select id="majorSkill" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.majorSkill} onChange={(e) => updateField('majorSkill', e.target.value)}>
              <option value="">Select major skill</option>
              {MAJOR_SKILLS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {form.majorSkill === 'Other' && (
              <Input className="mt-2" placeholder="Specify major skill" value={otherMajorSkill} onChange={(e) => setOtherMajorSkill(e.target.value)} />
            )}
          </div>
          <div>
            <Label htmlFor="visaStatus">Visa Status</Label>
            <select id="visaStatus" className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.visaStatus} onChange={(e) => updateField('visaStatus', e.target.value)}>
              {VISA_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {form.visaStatus === 'Other' && (
              <Input className="mt-2" placeholder="Specify visa status" value={otherVisa} onChange={(e) => setOtherVisa(e.target.value)} />
            )}
          </div>
          <div className="md:col-span-2">
            <Label>Skills</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.skills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="text-slate-500 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input value={otherSkill} onChange={(e) => setOtherSkill(e.target.value)} placeholder="Add a skill" />
              <Button type="button" variant="outline" onClick={addSkill}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most Recent Qualification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="collageName">College / Institute</Label>
            <Input id="collageName" value={form.collageName} onChange={(e) => updateField('collageName', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="degree">Degree</Label>
            <Input id="degree" value={form.degree} onChange={(e) => updateField('degree', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="startYear">Start Year</Label>
            <Input id="startYear" type="number" value={form.startYear} onChange={(e) => updateField('startYear', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="endYear">End Year</Label>
            <Input id="endYear" type="number" value={form.endYear} onChange={(e) => updateField('endYear', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domain Experience</CardTitle>
          <CardDescription>Add domain-specific experience entries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Domain (e.g. Data Analyst)" value={newDomain.domain} onChange={(e) => setNewDomain((p) => ({ ...p, domain: e.target.value }))} />
            <Input type="number" min="0" placeholder="Years" value={newDomain.yearsOfExperience} onChange={(e) => setNewDomain((p) => ({ ...p, yearsOfExperience: e.target.value }))} />
          </div>
          <Button type="button" variant="outline" onClick={addDomainExperience}>Add Experience</Button>
          {form.domainExperiences.length > 0 && (
            <ul className="space-y-2">
              {form.domainExperiences.map((exp, index) => (
                <li key={`${exp.domain}-${index}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span><strong>{exp.domain}</strong>: {exp.yearsOfExperience} years</span>
                  <button type="button" onClick={() => removeDomainExperience(index)} className="text-slate-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium">Are you currently working?</span>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={form.isWorking === true} onChange={() => updateField('isWorking', true)} /> Yes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={form.isWorking === false} onChange={() => updateField('isWorking', false)} /> No
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input id="relocate" type="checkbox" checked={form.willingToRelocate} onChange={(e) => updateField('willingToRelocate', e.target.checked)} />
            <Label htmlFor="relocate">Willing to relocate</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resume Upload</CardTitle>
          <CardDescription>Upload your resume (PDF or DOCX, max 5MB).</CardDescription>
        </CardHeader>
        <CardContent>
          {existingResumeName && !resumeFile && (
            <p className="mb-3 text-sm text-slate-600">Current resume: {existingResumeName}</p>
          )}
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 px-4 py-6 hover:bg-slate-50">
            <Upload className="h-5 w-5 text-slate-500" />
            <span className="text-sm text-slate-600">
              {resumeFile ? resumeFile.name : 'Choose resume file'}
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            />
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save & Continue'}
        </Button>
      </div>
    </form>
  );
}
