'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  ChevronRight,
  Clock3,
  GraduationCap,
  Layers,
  Loader2,
  Monitor,
  Palette,
  Smartphone,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { coursesService, CourseItem } from '@/services/courses.service';
import { cn } from '@/lib/utils';
import { isAxiosError } from 'axios';

const FALLBACK_CATEGORIES = [
  'Software Development',
  'Data Science & Analytics',
  'Business & Management',
  'Design',
  'HR & Enterprise Systems',
  'Finance',
  'Engineering',
];

function getCourseIcon(imageKey: CourseItem['imageKey']) {
  if (imageKey === 'uiux') return Palette;
  if (imageKey === 'app') return Smartphone;
  return Monitor;
}

function getCourseAccent(imageKey: CourseItem['imageKey']) {
  if (imageKey === 'uiux') return 'from-violet-500/15 to-fuchsia-500/10 text-violet-700';
  if (imageKey === 'app') return 'from-emerald-500/15 to-teal-500/10 text-emerald-700';
  return 'from-blue-500/15 to-sky-500/10 text-blue-700';
}

function CourseCard({
  course,
  onView,
  opening,
}: {
  course: CourseItem;
  onView: (slug: string) => void;
  opening: string | null;
}) {
  const Icon = getCourseIcon(course.imageKey);
  const accent = getCourseAccent(course.imageKey);
  const isOpening = opening === course.slug;

  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-sm transition-shadow hover:shadow-md">
      <div className={cn('bg-gradient-to-br px-5 py-6', accent)}>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 shadow-sm">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <CardContent className="flex h-full flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide">
            {course.category}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {course.level}
          </Badge>
        </div>
        <h3 className="line-clamp-2 text-lg font-bold text-slate-900">{course.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
          {course.description}
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {course.duration}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            {course.level}
          </span>
        </div>
        <Button
          className="mt-5 w-full"
          onClick={() => onView(course.slug)}
          disabled={isOpening}
        >
          {isOpening ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening...
            </>
          ) : (
            <>
              View Course
              <ChevronRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CoursesPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openingSlug, setOpeningSlug] = useState<string | null>(null);
  const [openError, setOpenError] = useState('');

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['course-categories'],
    queryFn: coursesService.getCategories,
    retry: false,
  });

  const categoryOptions = useMemo(() => {
    const merged = [...new Set([...categories, ...FALLBACK_CATEGORIES])];
    return merged.sort((a, b) => a.localeCompare(b));
  }, [categories]);

  const {
    data: courses = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['courses', activeCategory],
    queryFn: () =>
      coursesService.listCourses(activeCategory === 'all' ? undefined : activeCategory),
    retry: false,
  });

  const handleViewCourse = async (slug: string) => {
    setOpenError('');
    setOpeningSlug(slug);
    try {
      await coursesService.openCoursePdf(slug);
    } catch (err) {
      setOpenError(
        isAxiosError(err)
          ? err.response?.data?.message || 'Unable to open course PDF.'
          : 'Unable to open course PDF.'
      );
    } finally {
      setOpeningSlug(null);
    }
  };

  const loadError = error
    ? isAxiosError(error)
      ? error.response?.data?.message || 'Unable to load courses.'
      : 'Unable to load courses.'
    : '';

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Courses"
        description="Explore Benda Infotech training programs and open course brochures."
        action={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" />
            {isFetching && !isLoading ? 'Refreshing...' : `${courses.length} courses`}
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <BookOpen className="h-4 w-4 text-primary" />
          Browse by category
        </div>
        <Select
          value={activeCategory}
          onValueChange={(value) => setActiveCategory(value ?? "all")}
        >
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categoryOptions.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(loadError || openError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError || openError}
        </div>
      )}

      {isLoading || categoriesLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-28 w-full rounded-none" />
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <BookOpen className="mb-4 h-10 w-10 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900">No courses found</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Try another category or check that the Benda Infotech course service is running.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onView={handleViewCourse}
              opening={openingSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
