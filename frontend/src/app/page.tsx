'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Briefcase, 
  FileText, 
  Kanban, 
  Sparkles, 
  TrendingUp, 
  CheckCircle, 
  Award, 
  Zap, 
  Search, 
  Bell, 
  ChevronRight, 
  ShieldCheck, 
  Users, 
  Clock, 
  Layers 
} from 'lucide-react';
import { CareerTrackLogo } from '@/components/brand/career-track-logo';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'resume' | 'jobs' | 'pipeline'>('resume');
  const [resumeScore, setResumeScore] = useState(72);
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  // Auto animate the resume score demo to show interactivity
  useEffect(() => {
    if (activeTab === 'resume') {
      const interval = setTimeout(() => {
        setResumeScore(89);
      }, 800);
      return () => clearTimeout(interval);
    } else {
      setResumeScore(72);
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-primary/10 selection:text-primary overflow-x-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse duration-[8000ms]" />
      <div className="absolute top-[20%] right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-[20%] left-10 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <CareerTrackLogo className="h-10 text-primary" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-950 transition-colors">Features</a>
            <a href="#preview" className="hover:text-slate-950 transition-colors">Platform Demo</a>
            <a href="#stats" className="hover:text-slate-950 transition-colors">Success Rates</a>
            <a href="#pricing" className="hover:text-slate-950 transition-colors">Integrations</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/auth/login" 
              className="text-sm font-medium text-slate-600 hover:text-slate-950 px-4 py-2 rounded-lg hover:bg-slate-100 transition-all"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/register" 
              className="relative group overflow-hidden rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative mx-auto max-w-7xl px-6 pt-24 pb-20 text-center lg:pt-32">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-primary mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-Driven Career Accelerator
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-slate-900"
          >
            Your complete career pipeline,
            <br />
            <span className="bg-gradient-to-r from-primary via-emerald-600 to-teal-600 bg-clip-text text-transparent">
              beautifully organized.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-8 max-w-2xl text-lg text-slate-600 leading-relaxed"
          >
            Build stunning, ATS-optimized resumes, receive direct match scores for top roles, sync applications with client systems, and navigate the path from application to offer.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link 
              href="/auth/register" 
              className="flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary/10 transition-all hover:scale-[1.03] active:scale-[0.97]"
            >
              Build Your Profile Free <ArrowRight className="h-5 w-5" />
            </Link>
            <a 
              href="#preview" 
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-8 py-4 text-base font-semibold text-slate-700 shadow-sm transition-all"
            >
              Explore Live Demo
            </a>
          </motion.div>

          {/* Float stats cards */}
          <div className="relative mt-20 max-w-5xl mx-auto border border-slate-200 rounded-2xl bg-white/60 backdrop-blur-xl p-2 shadow-2xl">
            <div className="absolute -top-6 -left-6 bg-white border border-slate-200 rounded-xl p-4 shadow-xl flex items-center gap-3 animate-bounce duration-[6000ms] z-10">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
                ✓
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500 font-medium">ATS Scan Result</p>
                <p className="text-sm font-bold text-slate-800">Optimized Perfect Match</p>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-6 bg-white border border-slate-200 rounded-xl p-4 shadow-xl flex items-center gap-3 z-10">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500 font-medium">AI Recommendations</p>
                <p className="text-sm font-bold text-slate-800">3 Top Match Roles Found</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {/* Fake Application Dashboard Banner */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-400" />
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-400" />
                  <div className="w-3.5 h-3.5 rounded-full bg-green-400" />
                  <span className="text-xs text-slate-400 ml-4 font-mono">https://careertrack.bendainfotech.com/dashboard</span>
                </div>
                <div className="flex gap-2">
                  <span className="h-2.5 w-12 rounded bg-slate-200" />
                  <span className="h-2.5 w-8 rounded bg-slate-200" />
                </div>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80" 
                alt="Dashboard Overview" 
                className="w-full h-[400px] object-cover opacity-80 mix-blend-multiply"
              />
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section id="features" className="py-24 border-t border-slate-200 bg-slate-50/50 relative">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900">
                Engineered for the Modern Candidate
              </h2>
              <p className="mt-4 text-slate-600">
                CareerTrack unifies every phase of your job search. No more disjointed spreadsheets or untracked applications.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-8 hover:border-slate-300 hover:shadow-md transition-all">
                <div className="mb-6 inline-flex rounded-xl bg-primary/10 p-4 text-primary group-hover:scale-105 transition-all">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Smart Resume Suite</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Build and manage multiple resumes. Get instantly scored against real industry requirements and receive targeted guidance to fix formatting flaws.
                </p>
                <div className="mt-6 flex items-center text-xs font-semibold text-primary hover:text-primary/80 gap-1.5 cursor-pointer">
                  Learn about ATS templates <ChevronRight className="h-3 w-3" />
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-8 hover:border-slate-300 hover:shadow-md transition-all">
                <div className="mb-6 inline-flex rounded-xl bg-primary/10 p-4 text-primary group-hover:scale-105 transition-all">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Benda ATS Sync</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Direct connection with major recruitment portals. Apply with a single click, monitor application status automatically, and match with recommended open roles.
                </p>
                <div className="mt-6 flex items-center text-xs font-semibold text-primary hover:text-primary/80 gap-1.5 cursor-pointer">
                  See partner agencies <ChevronRight className="h-3 w-3" />
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-8 hover:border-slate-300 hover:shadow-md transition-all">
                <div className="mb-6 inline-flex rounded-xl bg-primary/10 p-4 text-primary group-hover:scale-105 transition-all">
                  <Kanban className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Pipeline Tracking</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Drag-and-drop kanban board detailing application stages. Add customized notes, schedule follow-ups, and receive live updates from talent pool curators.
                </p>
                <div className="mt-6 flex items-center text-xs font-semibold text-primary hover:text-primary/80 gap-1.5 cursor-pointer">
                  View tracking workflow <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Interactive Platform Preview Showcase */}
        <section id="preview" className="py-24 bg-white relative">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold sm:text-4xl text-slate-900">
                Experience the Power Inside
              </h2>
              <p className="mt-4 text-slate-600">
                Interactive preview of our core dashboards. Click on the categories below to witness the sleek, professional workspace.
              </p>
            </div>

            {/* Selector tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {[
                { id: 'resume', label: 'Resume Builder', icon: FileText },
                { id: 'jobs', label: 'Recommended Jobs', icon: Briefcase },
                { id: 'pipeline', label: 'Pipeline Tracker', icon: Kanban },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold border transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Display Dashboard mockup depending on state */}
            <div className="border border-slate-200 bg-slate-50/50 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-xl relative overflow-hidden min-h-[500px]">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
              
              <AnimatePresence mode="wait">
                {activeTab === 'resume' && (
                  <motion.div
                    key="resume-prev"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="grid md:grid-cols-12 gap-8 items-center"
                  >
                    {/* Fake Editor */}
                    <div className="md:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                        <span className="text-xs font-bold text-slate-400 tracking-wider">RESUME WORKSPACE</span>
                        <span className="text-xs text-primary font-bold animate-pulse">● Saving changes</span>
                      </div>
                      
                      {/* Name input simulation */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Full Name</label>
                          <div className="h-9 px-3 rounded bg-slate-50 border border-slate-200/80 text-xs flex items-center font-medium text-slate-700">
                            Sarah Jenkins
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Professional Summary</label>
                          <div className="p-3 rounded bg-slate-50 border border-slate-200/80 text-xs leading-relaxed text-slate-600 font-mono">
                            Senior Front-End Architect with 6+ years of expertise in React, Next.js, and TypeScript. Driven to deliver robust, pixel-perfect user experiences...
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400">Core Expertise Keywords</label>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {['React', 'Next.js', 'TypeScript', 'Tailwind', 'GraphQL', 'Webpack'].map(kw => (
                              <span key={kw} className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-mono">
                                + {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Scoring results */}
                    <div className="md:col-span-5 bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center text-center shadow-md">
                      <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 mb-6 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/80">
                        <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                        AI Feedback Engine
                      </div>
                      
                      {/* Circle Progress bar */}
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                          <circle cx="72" cy="72" r="62" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                          <circle 
                            cx="72" 
                            cy="72" 
                            r="62" 
                            stroke="var(--color-primary)" 
                            strokeWidth="12" 
                            fill="transparent" 
                            strokeDasharray={390}
                            strokeDashoffset={390 - (390 * resumeScore) / 100}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="flex flex-col items-center">
                          <span className="text-3xl font-extrabold tracking-tight text-slate-900">{resumeScore}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">ATS Score</span>
                        </div>
                      </div>

                      <div className="mt-6 w-full space-y-3.5 text-left">
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-800">Critical keywords found</span>
                            <p className="text-[11px] text-slate-500">React, Next.js, and TypeScript included correctly.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          {resumeScore >= 85 ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                          ) : (
                            <span className="h-4 w-4 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-[10px] font-bold mt-0.5">!</span>
                          )}
                          <div>
                            <span className="font-bold text-slate-800">Formatting structure score</span>
                            <p className="text-[11px] text-slate-500">
                              {resumeScore >= 85 
                                ? 'Clean single-column standard parser layout verified.' 
                                : 'Suggestion: Remove two-column layouts for optimal parser indexing.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setResumeScore(resumeScore === 89 ? 72 : 89)}
                        className="mt-6 text-xs text-primary font-bold hover:underline"
                      >
                        {resumeScore === 89 ? 'Reset Demo' : 'Optimize Formatting'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'jobs' && (
                  <motion.div
                    key="jobs-prev"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI Job Compatibility Filter
                      </h3>
                      <span className="text-xs text-slate-400">Updated hourly from Benda ATS</span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { title: 'Senior React Engineer', company: 'Benda Infotech', match: '98%', location: 'Remote', salary: '$120k - $145k', skills: ['React', 'NextJS', 'TypeScript'] },
                        { title: 'Full-Stack Developer', company: 'ATS Client Corp', match: '92%', location: 'Hybrid / NYC', salary: '$110k - $130k', skills: ['NodeJS', 'React', 'MongoDB'] },
                        { title: 'Solutions Architect', company: 'Global Solutions', match: '87%', location: 'Onsite', salary: '$160k - $190k', skills: ['System Design', 'Cloud', 'NodeJS'] },
                        { title: 'Frontend UI Lead', company: 'Design Partners', match: '81%', location: 'Remote', salary: '$115k - $135k', skills: ['CSS', 'React', 'Figma'] },
                      ].map((job, idx) => (
                        <div 
                          key={idx}
                          className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-slate-800">{job.title}</h4>
                                <p className="text-xs text-slate-500">{job.company} • {job.location}</p>
                              </div>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                {job.match} Match
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-3">
                              {job.skills.map(s => (
                                <span key={s} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200/80 text-[10px] text-slate-500">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4 text-xs">
                            <span className="font-semibold text-slate-600">{job.salary}</span>
                            <button className="text-primary hover:text-primary/80 font-bold flex items-center gap-1">
                              Apply Now <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'pipeline' && (
                  <motion.div
                    key="pipeline-prev"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <h3 className="font-bold text-slate-800">Active Application Board</h3>
                      <span className="text-xs text-slate-400">Drag to transition between stages</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {/* Column 1 */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Applied</span>
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">2</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm cursor-grab">
                          <p className="text-xs font-bold text-slate-800">Senior React Architect</p>
                          <p className="text-[10px] text-slate-500">Benda Infotech</p>
                          <div className="flex justify-between items-center mt-3 text-[10px]">
                            <span className="text-slate-400">1d ago</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold">ATS Synced</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm opacity-50">
                          <p className="text-xs font-bold text-slate-800">Software Engineer</p>
                          <p className="text-[10px] text-slate-500">Scale Technologies</p>
                        </div>
                      </div>

                      {/* Column 2 */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Interviewing</span>
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">1</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-primary/20 shadow-sm cursor-grab relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-slate-800">Front-End Developer</p>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                          </div>
                          <p className="text-[10px] text-slate-500">Enterprise Solutions</p>
                          <div className="mt-3 p-2 bg-slate-50 rounded text-[10px] text-slate-500 border border-slate-100">
                            📅 Technical Panel on June 22
                          </div>
                        </div>
                      </div>

                      {/* Column 3 */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Offers</span>
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">1</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white border-emerald-500/30 shadow-sm cursor-grab border border-dashed relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                          <p className="text-xs font-bold text-slate-800">Staff Architect</p>
                          <p className="text-[10px] text-slate-500">Stellar SaaS Ltd</p>
                          <div className="flex justify-between items-center mt-3 text-[10px]">
                            <span className="text-emerald-600 font-bold">$148k / yr</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold">Congrats!</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Statistical Metrics Banner */}
        <section id="stats" className="py-20 border-y border-slate-200 bg-white relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="mx-auto max-w-7xl px-6 relative">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 text-center">
              {[
                { number: '94%', label: 'ATS Parser Pass Rate', desc: 'Resumes successfully indexed by enterprise applicant tracking software.' },
                { number: '18 Days', label: 'Average Time to Offer', desc: 'Shortened cycle from profile curation to client interview and offer letter.' },
                { number: '14,000+', label: 'Candidates Placed', desc: 'Active users connected to tech companies and consulting firms globally.' },
                { number: '97.2%', label: 'Satisfaction Rating', desc: 'Positive feedback from candidates on job-matching precision.' },
              ].map((stat, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="text-4xl sm:text-5xl font-extrabold text-primary tracking-tight">
                    {stat.number}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">{stat.label}</h3>
                  <p className="text-xs text-slate-500 max-w-[240px] mx-auto leading-relaxed">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Verified Badges & Integrations */}
        <section className="py-24 bg-slate-50/50 relative">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-1.5 text-xs text-primary font-bold bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                  <Award className="h-4 w-4" /> Earn Professional Badges
                </div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-900">
                  Certify Your Skillset
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  CareerTrack offers built-in tech assessment testing. Complete timed challenges, earn digital credentials, and display verified verification markers directly on your profile page.
                </p>
                <div className="space-y-3.5">
                  {[
                    'Automated score uploads to Benda Recruitment Pools',
                    'Increases job matching alignment score by 35%',
                    'Verified skill badges exportable to PDF Resumes',
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-slate-600">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">✓</div>
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-lg relative">
                <div className="absolute top-4 right-4 text-xs font-bold text-slate-400">TIMED ASSESSMENT</div>
                <div className="space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
                      JS
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">JavaScript Core Concepts</h4>
                      <p className="text-xs text-slate-500">20 Questions • 30 Minutes</p>
                    </div>
                  </div>
                  <div className="h-2 rounded bg-slate-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-emerald-400 w-3/4 rounded" />
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Progress: 75% Complete</span>
                    <span className="font-bold text-slate-800">Time Left: 08:44</span>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-6">
                    <p className="text-xs text-slate-400 mb-4 font-semibold">Sample Question:</p>
                    <p className="text-xs font-mono text-slate-600 p-3 rounded bg-slate-50 border border-slate-200/80 leading-relaxed mb-4">
                      {`const promise = new Promise((resolve) => resolve('success'));\nconsole.log(promise); // What is printed?`}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                      <div className="p-3 rounded border border-slate-200 bg-slate-50 text-slate-500 cursor-pointer">"success" string</div>
                      <div className="p-3 rounded border border-primary bg-primary/5 text-primary cursor-pointer">Promise object in fulfilled state</div>
                      <div className="p-3 rounded border border-slate-200 bg-slate-50 text-slate-500 cursor-pointer">undefined</div>
                      <div className="p-3 rounded border border-slate-200 bg-slate-50 text-slate-500 cursor-pointer">Runtime Error</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Global Call to Action (CTA) */}
        <section id="cta" className="py-24 bg-white relative border-t border-slate-200">
          <div className="mx-auto max-w-5xl px-6">
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 px-8 py-16 text-center shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 [mask-image:radial-gradient(circle_at_center,white_30%,transparent_70%)]" />
              
              <div className="relative space-y-6 max-w-2xl mx-auto">
                <Sparkles className="h-10 w-10 text-primary mx-auto animate-spin duration-[8000ms]" />
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
                  Step Into Your Next Career Stage Today
                </h2>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  Join thousands of developers, designers, and managers securing interviews and monitoring their recruitment progress inside Benda Infotech client platforms.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
                  <Link 
                    href="/auth/register" 
                    className="px-8 py-4 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg shadow-xl shadow-primary/10 transition-all hover:scale-[1.03]"
                  >
                    Build Profile
                  </Link>
                  <Link 
                    href="/auth/login" 
                    className="px-8 py-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-lg shadow-sm transition-all"
                  >
                    Enter Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-xs">
          <div className="space-y-4 col-span-2 md:col-span-1">
            <CareerTrackLogo className="h-8 text-primary" />
            <p className="text-slate-500 leading-relaxed max-w-[200px]">
              AI-driven candidate tracking, resume assessment, and placement workflow suite.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2.5 text-slate-500">
              <li><Link href="/resume/templates" className="hover:text-slate-900">Resume Templates</Link></li>
              <li><Link href="/skill-check" className="hover:text-slate-900">Skill Checks</Link></li>
              <li><Link href="/jobs" className="hover:text-slate-900">Job Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-4">System Integration</h4>
            <ul className="space-y-2.5 text-slate-500">
              <li><a href="#" className="hover:text-slate-900">Benda ATS API</a></li>
              <li><a href="#" className="hover:text-slate-900">Resume Scorer Proxy</a></li>
              <li><a href="#" className="hover:text-slate-900">Enterprise Talent Pool</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-4">Corporate</h4>
            <p className="text-slate-500 leading-relaxed">
              Powered by Benda Infotech.<br />
              All rights reserved &copy; {new Date().getFullYear()}.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
