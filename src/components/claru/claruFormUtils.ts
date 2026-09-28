import type { ClaruConsent, ClaruFileType } from '@/types';

export const claruConsentLabels: Record<keyof ClaruConsent, string> = {
  worker_consent_obtained: 'Worker consent has been obtained',
  site_or_employer_permission_obtained: 'Site or employer permission has been obtained',
  required_consent_or_notice_process_followed: 'Required consent or notice process was followed',
  footage_unedited: 'The footage is unedited except for permitted splitting or rewrapping',
};

export const claruAcceptByType: Record<ClaruFileType, string | undefined> = {
  video: '.mp4,video/mp4',
  inputs: '.csv,text/csv',
  frames: '.csv,text/csv',
  video_right: '.mp4,video/mp4',
  calibration: '.json,application/json',
  other: undefined,
};

export function validClaruAxis(value: string): boolean {
  const groups = [...value.trim().toUpperCase()].map((letter) =>
    ['RL', 'UD', 'FB'].findIndex((axis) => axis.includes(letter))
  );
  return groups.length === 3 && !groups.includes(-1) && new Set(groups).size === 3;
}

export function claruFileError(file: File, role: ClaruFileType): string | null {
  if (!file.size) return `${file.name} is empty. Select a complete file.`;
  if (file.name.length > 255 || /[\r\n]/.test(file.name) || file.name !== file.name.trim())
    return 'Use a filename of at most 255 characters without line breaks or leading/trailing spaces.';
  if ((role === 'video' || role === 'video_right') && !file.name.toLowerCase().endsWith('.mp4'))
    return `${file.name} must be an MP4 video.`;
  if (role === 'inputs' && file.size > 67_108_864)
    return 'Motion-sensor inputs cannot exceed 64 MiB.';
  return null;
}
