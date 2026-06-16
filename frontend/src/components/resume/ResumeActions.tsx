'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ButtonLink } from '@/components/ui/link-button';
import {
  Download,
  Edit3,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  Copy,
  Trash2,
} from 'lucide-react';

export interface ResumeActionsProps {
  resumeId: string;
  resumeTitle: string;
  isViewable: boolean;
  isTogglingViewable: boolean;
  isDownloading: boolean;
  isDeleting: boolean;
  isDuplicating: boolean;
  onView: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}

export function ResumeActions({
  resumeId,
  resumeTitle,
  isViewable,
  isTogglingViewable,
  isDownloading,
  isDeleting,
  isDuplicating,
  onView,
  onEdit,
  onDownload,
  onDuplicate,
  onDelete,
  onToggleVisibility,
}: ResumeActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button size="sm" variant="outline" onClick={onView} disabled={!resumeId}>
              <Eye className="mr-1 h-4 w-4" />
              View
            </Button>
          }
        />
        <TooltipContent>View resume</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button size="sm" variant="outline" onClick={onEdit} disabled={!resumeId}>
              <Edit3 className="mr-1 h-4 w-4" />
              Edit
            </Button>
          }
        />
        <TooltipContent>Edit in Resume Builder</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="sm"
              variant={isViewable ? 'default' : 'outline'}
              onClick={onToggleVisibility}
              disabled={!resumeId || isTogglingViewable}
            >
              {isTogglingViewable ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : isViewable ? (
                <EyeOff className="mr-1 h-4 w-4" />
              ) : (
                <Eye className="mr-1 h-4 w-4" />
              )}
              {isViewable ? 'Visible to recruiters' : 'Hidden from recruiters'}
            </Button>
          }
        />
        <TooltipContent>
          {isViewable ? 'Hide from recruiters' : 'Make visible to recruiters'}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="sm"
              variant="outline"
              onClick={onDownload}
              disabled={!resumeId || isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1 h-4 w-4" />
              )}
              {isDownloading ? 'Downloading' : 'Download'}
            </Button>
          }
        />
        <TooltipContent>Download PDF</TooltipContent>
      </Tooltip>

      <ButtonLink href={`/resume/score?id=${resumeId}`} size="sm" variant="outline">
        <ExternalLink className="mr-1 h-4 w-4" />
        Score
      </ButtonLink>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="sm"
              variant="ghost"
              onClick={onDuplicate}
              disabled={!resumeId || isDuplicating}
            >
              {isDuplicating ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Copy className="mr-1 h-4 w-4" />
              )}
              Duplicate
            </Button>
          }
        />
        <TooltipContent>Duplicate resume</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={!resumeId || isDeleting}
              onClick={onDelete}
            >
              {isDeleting ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-1 h-4 w-4" />
              )}
              Delete
            </Button>
          }
        />
        <TooltipContent>Delete &quot;{resumeTitle}&quot;</TooltipContent>
      </Tooltip>
    </div>
  );
}
