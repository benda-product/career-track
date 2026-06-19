'use client';

import {
  getCourseModules,
  getDisplayCourse,
  type SkillcheckCertificateData,
} from '@/components/skill-check/skillcheck-certificate-utils';

export function SkillcheckCertificateView({ data }: { data: SkillcheckCertificateData }) {
  const displayCourse = getDisplayCourse(data.course || '', data.category);
  const modulesText = getCourseModules(displayCourse);
  const displayLevel = (data.level || 'hard').toUpperCase();

  return (
    <div id="skillcheck-certificate-print" className="w-full">
      <style>{`
        @font-face {
          font-family: 'Great Vibes';
          src: url('/certificates/GreatVibes-Regular.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
        }
        @media print {
          body * { visibility: hidden; }
          #skillcheck-certificate-print, #skillcheck-certificate-print * { visibility: visible; }
          #skillcheck-certificate-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <div
        className="relative mx-auto w-full overflow-hidden bg-white shadow-sm"
        style={{ aspectRatio: '1123 / 794', maxWidth: 1123 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/certificates/h-org-certificate-bg.jpg"
          alt="Skillcheck certificate"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 text-[#333]">
          <p
            className="absolute left-0 right-0 px-4 text-center text-[#1a1a1a]"
            style={{
              top: '47.8%',
              fontFamily: "'Great Vibes', cursive",
              fontSize: 'clamp(1.75rem, 4.6vw, 3.25rem)',
              lineHeight: 1.1,
            }}
          >
            {data.name}
          </p>

          <p
            className="absolute left-[9%] right-[9%] text-center leading-relaxed text-[#333]"
            style={{
              top: '63%',
              fontSize: 'clamp(0.7rem, 1.25vw, 0.875rem)',
              lineHeight: 1.6,
            }}
          >
            has successfully completed the <strong className="font-bold text-black">{displayCourse} Test</strong>{' '}
            under the Skillcheck program. The assessment covered core modules including {modulesText}. With a
            remarkable score of <strong className="font-bold text-black">{data.score}%</strong>,{' '}
            <strong className="font-bold text-black">{data.name}</strong> has showcased exceptional skills and
            expertise in the field of {displayCourse}.
          </p>

          <p
            className="absolute right-[5.3%] text-right text-[#444]"
            style={{
              bottom: '6.3%',
              fontSize: 'clamp(0.55rem, 0.9vw, 0.625rem)',
              fontFamily: 'Helvetica, Arial, sans-serif',
            }}
          >
            Certificate ID: {data.certificateId} | Issued On : {data.issuedDate} | Difficulty Level:{' '}
            {displayLevel}
          </p>
        </div>
      </div>
    </div>
  );
}
