"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, LayoutGrid, Loader2 } from "lucide-react";

const BENDA_HUB_URL = process.env.NEXT_PUBLIC_BENDA_URL || "http://localhost:3004";

const ADMIN_CONSOLES = [
  {
    id: "benda",
    label: "Platform Console",
    shortLabel: "Benda Admin",
    description: "Ecosystem administration",
    logo: null as string | null,
    href: `${BENDA_HUB_URL}/admin`,
  },
  {
    id: "career-track",
    label: "Career Track Admin",
    shortLabel: "Career Track",
    description: "Candidate platform administration",
    logo: "/images/logos/career-track.png",
    href: `${BENDA_HUB_URL}/admin/launch?product=CAREER_TRACK&redirect=${encodeURIComponent("/admin")}`,
  },
  {
    id: "ats",
    label: "Talent Desk Admin",
    shortLabel: "Talent Desk",
    description: "ATS jobs, recruiters & hiring",
    logo: "/images/logos/talent-desk.png",
    href: `${BENDA_HUB_URL}/admin/launch?product=ATS&redirect=${encodeURIComponent("/admin")}`,
  },
  {
    id: "resume-builder",
    label: "Resume AI Admin",
    shortLabel: "Resume AI",
    description: "Resume builder administration",
    logo: "/images/logos/resume-ai.png",
    href: `${BENDA_HUB_URL}/admin/launch?product=RESUME_BUILDER&redirect=${encodeURIComponent("/admin")}`,
  },
  {
    id: "skillcheck",
    label: "SkillCheck Admin",
    shortLabel: "SkillCheck",
    description: "Assessments & user management",
    logo: "/images/logos/skillcheck.png",
    href: `${BENDA_HUB_URL}/admin/launch?product=HORG&redirect=${encodeURIComponent("/dashboard?tab=users")}`,
  },
];

type Props = {
  currentId: string;
  className?: string;
};

export function EcosystemAdminConsoleSwitcher({ currentId, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = ADMIN_CONSOLES.find((item) => item.id === currentId) || ADMIN_CONSOLES[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleSelect = (target: (typeof ADMIN_CONSOLES)[number]) => {
    if (target.id === currentId || loadingId) return;
    setLoadingId(target.id);
    window.location.href = target.href;
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full max-w-[240px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-left shadow-sm transition hover:border-[#015DC0]/30"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-50">
          {current.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.logo} alt="" className="h-6 w-6 object-contain" />
          ) : (
            <LayoutGrid size={16} className="text-[#015DC0]" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-slate-900">{current.shortLabel}</span>
          <span className="block truncate text-[10px] text-slate-500">Admin console</span>
        </span>
        <ChevronDown size={14} className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-[300px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#015DC0]">Switch admin console</p>
          </div>
          <ul className="max-h-[320px] overflow-y-auto p-1.5">
            {ADMIN_CONSOLES.map((target) => {
              const isCurrent = target.id === currentId;
              const isLoading = loadingId === target.id;
              return (
                <li key={target.id}>
                  <button
                    type="button"
                    disabled={isCurrent || Boolean(loadingId)}
                    onClick={() => handleSelect(target)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                      isCurrent ? "bg-blue-50 text-[#015DC0]" : "hover:bg-slate-50 disabled:opacity-60"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-slate-100">
                      {target.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={target.logo} alt="" className="h-7 w-7 object-contain" />
                      ) : (
                        <LayoutGrid size={16} className="text-[#015DC0]" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{target.label}</span>
                      <span className="block truncate text-xs text-slate-500">{target.description}</span>
                    </span>
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin text-[#015DC0]" />
                    ) : isCurrent ? (
                      <Check size={14} className="text-[#015DC0]" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
