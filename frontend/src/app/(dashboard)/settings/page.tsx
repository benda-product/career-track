'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  FileText,
  Gauge,
  Calendar,
  Sparkles,
  Share2,
  Search,
  AlertTriangle,
  Trash2,
  Key,
  Check,
  Info
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

type NotificationKey = 'jobMatches' | 'applicationUpdates' | 'resumeScore' | 'interviewInvites' | 'profileSuggestions';

interface NotificationConfig {
  title: string;
  desc: string;
  icon: typeof Briefcase;
}

const NOTIFICATION_MAP: Record<NotificationKey, NotificationConfig> = {
  jobMatches: {
    title: 'Smart Job Match Alerts',
    desc: 'Receive emails when a new job aligns with your resume or profile capabilities.',
    icon: Briefcase
  },
  applicationUpdates: {
    title: 'Application Progress Updates',
    desc: 'Get instantly notified when recruiters view or update your job application stage.',
    icon: FileText
  },
  resumeScore: {
    title: 'ATS Scorer Guidelines',
    desc: 'Receive suggestions and format validation reminders after running resume scans.',
    icon: Gauge
  },
  interviewInvites: {
    title: 'Interview Schedule Requests',
    desc: 'Get instant alerts when employers request interviews, assessments, or reviews.',
    icon: Calendar
  },
  profileSuggestions: {
    title: 'Profile Optimization Tips',
    desc: 'Receive tips and checklist criteria to help complete and verify profile strength.',
    icon: Sparkles
  }
};

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    jobMatches: true,
    applicationUpdates: true,
    resumeScore: true,
    interviewInvites: true,
    profileSuggestions: false,
  });

  // Password visibility states
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Local notifications toggle handler
  const handleToggleNotification = (key: NotificationKey, checked: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: checked }));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Customize dashboard options, security parameters, and communication guidelines" />

      <Tabs defaultValue="account" className="w-full">
        {/* Styled Tabs Trigger Bar */}
        <TabsList className="grid grid-cols-3 h-11 bg-muted p-1 rounded-xl w-full max-w-md border border-border/50">
          <TabsTrigger value="account" className="text-xs font-bold gap-2 rounded-lg cursor-pointer">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs font-bold gap-2 rounded-lg cursor-pointer">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs font-bold gap-2 rounded-lg cursor-pointer">
            <Lock className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        {/* ACCOUNT SETTINGS TAB */}
        <TabsContent value="account" className="mt-6 space-y-6 focus-visible:outline-none">
          {/* Account Details Card */}
          <Card className="border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <User className="h-4.5 w-4.5 text-primary" />
                Account Information
              </CardTitle>
              <CardDescription className="text-xs">Your standard profile credentials verified on Benda Platform</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">First Name</Label>
                  <Input 
                    defaultValue={user?.firstName} 
                    disabled 
                    className="h-10 bg-slate-50/50 border-slate-200/80 text-sm text-muted-foreground cursor-not-allowed select-none" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Last Name</Label>
                  <Input 
                    defaultValue={user?.lastName} 
                    disabled 
                    className="h-10 bg-slate-50/50 border-slate-200/80 text-sm text-muted-foreground cursor-not-allowed select-none" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Email Address</Label>
                <Input 
                  defaultValue={user?.email} 
                  disabled 
                  className="h-10 bg-slate-50/50 border-slate-200/80 text-sm text-muted-foreground cursor-not-allowed select-none" 
                />
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/40 text-[10px] text-muted-foreground font-semibold">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span>To modify basic profile particulars, head over to the candidate workspace under your profile.</span>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card className="border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Key className="h-4.5 w-4.5 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription className="text-xs">Update your credentials to safeguard assessment results and resumes</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Current password */}
              <div className="space-y-1.5 relative">
                <Label className="text-xs font-semibold text-foreground">Current Password</Label>
                <div className="relative">
                  <Input 
                    type={showCurrentPass ? 'text' : 'password'} 
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Enter current password"
                    className="h-10 border-border/80 text-sm pr-10 focus-visible:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password & Confirm New Password */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 relative">
                  <Label className="text-xs font-semibold text-foreground">New Password</Label>
                  <div className="relative">
                    <Input 
                      type={showNewPass ? 'text' : 'password'} 
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Enter new password"
                      className="h-10 border-border/80 text-sm pr-10 focus-visible:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 relative">
                  <Label className="text-xs font-semibold text-foreground">Confirm New Password</Label>
                  <div className="relative">
                    <Input 
                      type={showConfirmPass ? 'text' : 'password'} 
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Re-enter new password"
                      className="h-10 border-border/80 text-sm pr-10 focus-visible:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground text-muted-foreground transition-colors cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button className="shadow-sm font-semibold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Check className="mr-2 h-4 w-4" />
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone Card */}
          <Card className="border-rose-200 bg-rose-50/20 dark:border-rose-950/30 dark:bg-rose-950/5 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-rose-100/10 border-b border-rose-200/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-800 dark:text-rose-400">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-xs text-rose-700/80 dark:text-rose-400/85 font-medium">Irreversible security actions regarding your candidate records</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed space-y-1">
                <p>Deleting your candidate profile is permanent and will instantly result in the removal of:</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>Your verified certificates list and credentials</li>
                  <li>Your created resumes and ATS match logs</li>
                  <li>Your job application history and messages logs</li>
                </ul>
              </div>
              <div>
                <Button variant="destructive" className="font-semibold gap-1.5 h-10 px-5 shadow-sm">
                  <Trash2 className="h-4 w-4" />
                  Delete Account Permanent
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATION PREFERENCES TAB */}
        <TabsContent value="notifications" className="mt-6 focus-visible:outline-none">
          <Card className="border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Bell className="h-4.5 w-4.5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-xs">Configure alerts and message thresholds for job feeds, ATS scorers, and interviews</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-0">
              {Object.entries(NOTIFICATION_MAP).map(([key, config], index) => {
                const checked = notifications[key as NotificationKey];
                const IconComponent = config.icon;
                const isLast = index === Object.keys(NOTIFICATION_MAP).length - 1;

                return (
                  <div key={key} className={cn("py-4 first:pt-0", !isLast && "border-b border-border/40")}>
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                          <IconComponent className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 space-y-0.5">
                          <h4 className="text-xs font-bold text-foreground leading-snug">{config.title}</h4>
                          <p className="text-[11px] text-muted-foreground leading-normal max-w-lg">{config.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={checked}
                        onCheckedChange={(val) => handleToggleNotification(key as NotificationKey, val)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRIVACY SETTINGS TAB */}
        <TabsContent value="privacy" className="mt-6 focus-visible:outline-none">
          <Card className="border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Lock className="h-4.5 w-4.5 text-primary" />
                Privacy & Visibility Settings
              </CardTitle>
              <CardDescription className="text-xs">Control public document sharing limits and recruiter search crawler access</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-0">
              {/* Option 1: Profile Visibility */}
              <div className="py-4 pt-0 border-b border-border/40">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                      <Eye className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="text-xs font-bold text-foreground leading-snug">Public Recruiter Visibility</h4>
                      <p className="text-[11px] text-muted-foreground leading-normal max-w-lg">
                        Allow hiring managers and verified recruiters on Benda Suite to browse your skills assessment certificates and resume keywords matches.
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked className="mt-1" />
                </div>
              </div>

              {/* Option 2: Show Application Status */}
              <div className="py-4 border-b border-border/40">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                      <Share2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="text-xs font-bold text-foreground leading-snug">Show Application Status Logs</h4>
                      <p className="text-[11px] text-muted-foreground leading-normal max-w-lg">
                        Display active interview stages, tests ratings, and verification badges directly when sharing candidate URLs with external employers.
                      </p>
                    </div>
                  </div>
                  <Switch className="mt-1" />
                </div>
              </div>

              {/* Option 3: Search Engine Indexing */}
              <div className="py-4 pb-0">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                      <Search className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="text-xs font-bold text-foreground leading-snug">Search Engine Crawler Indexing</h4>
                      <p className="text-[11px] text-muted-foreground leading-normal max-w-lg">
                        Allow public search engines (Google, Bing) to scan and list your verified assessments timeline results pages. Disabling hides page indexes.
                      </p>
                    </div>
                  </div>
                  <Switch className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
