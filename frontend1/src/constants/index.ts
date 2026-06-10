export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api/v1';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5003';

export const APPLICATION_STAGES = [
  { value: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { value: 'screening', label: 'Screening', color: 'bg-yellow-500' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-purple-500' },
  { value: 'interview', label: 'Interview', color: 'bg-orange-500' },
  { value: 'offer', label: 'Offer', color: 'bg-green-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
  { value: 'hired', label: 'Hired', color: 'bg-emerald-600' },
] as const;

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/profile', label: 'Profile', icon: 'User' },
  { href: '/resume', label: 'Resume', icon: 'FileText' },
  { href: '/jobs', label: 'Jobs', icon: 'Briefcase' },
  { href: '/applications', label: 'Applications', icon: 'Kanban' },
  { href: '/notifications', label: 'Notifications', icon: 'Bell' },
  { href: '/settings', label: 'Settings', icon: 'Settings' },
] as const;

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
export const REMOTE_OPTIONS = ['Remote', 'Hybrid', 'On-site'];
