'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateClaruBatch } from '@/hooks/api/useClaru';
import type { ClaruProject } from '@/types';

interface ClaruCreateBatchDialogProps {
  projects: ClaruProject[];
  disabled?: boolean;
}

const emptyForm = {
  name: '',
  projectId: '',
  batchRef: '',
  country: 'IN',
  collectorId: '',
  siteId: '',
  device: '',
  mount: '',
};

export function ClaruCreateBatchDialog({
  projects,
  disabled = false,
}: ClaruCreateBatchDialogProps) {
  const router = useRouter();
  const mutation = useCreateClaruBatch();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId),
    [form.projectId, projects]
  );

  const openDialog = () => {
    const onlyProject = projects[0];
    if (!form.projectId && projects.length === 1 && onlyProject) {
      setForm((current) => ({ ...current, projectId: onlyProject.id }));
    }
    setOpen(true);
  };

  const update = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError('Enter a clear batch name.');
      return;
    }
    if (!selectedProject) {
      setError('Choose an active Claru project.');
      return;
    }
    const country = form.country.trim().toUpperCase();
    if (country && !/^[A-Z]{2}$/.test(country)) {
      setError('Country must use a two-letter ISO code, such as IN.');
      return;
    }

    const defaults = {
      ...(country ? { country } : {}),
      ...(form.collectorId.trim() ? { collectorId: form.collectorId.trim() } : {}),
      ...(form.siteId.trim() ? { siteId: form.siteId.trim() } : {}),
      ...(form.device.trim() ? { device: form.device.trim() } : {}),
      ...(form.mount.trim() ? { mount: form.mount.trim() } : {}),
    };

    mutation.mutate(
      {
        name,
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        ...(form.batchRef.trim() ? { batchRef: form.batchRef.trim() } : {}),
        ...(Object.keys(defaults).length > 0 ? { defaults } : {}),
      },
      {
        onSuccess: (batch) => {
          setOpen(false);
          setForm(emptyForm);
          router.push(`/dashboard/claru/batches/${batch.id}`);
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!mutation.isPending) setOpen(next);
      }}
    >
      <Button onClick={openDialog} disabled={disabled}>
        <Plus aria-hidden="true" />
        New delivery batch
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create delivery batch</DialogTitle>
          <DialogDescription>
            Group related clips under one Claru project and prefill their shared capture details.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="claru-batch-name">Batch name</Label>
              <Input
                id="claru-batch-name"
                value={form.name}
                maxLength={160}
                onChange={(event) => update('name', event.target.value)}
                placeholder="September kitchen capture — Day 3"
                autoFocus
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="claru-project">Claru project</Label>
              <Select value={form.projectId} onValueChange={(value) => update('projectId', value)}>
                <SelectTrigger id="claru-project">
                  <SelectValue placeholder="Choose an active project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem value={project.id} key={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProject ? (
                <p className="text-xs text-[var(--text-muted)]">
                  Clips must be {selectedProject.clipLength.minSeconds / 60}–
                  {selectedProject.clipLength.maxSeconds / 60} minutes. Contract v
                  {selectedProject.contractVersion}.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="claru-batch-ref">Batch reference</Label>
              <Input
                id="claru-batch-ref"
                value={form.batchRef}
                maxLength={200}
                onChange={(event) => update('batchRef', event.target.value)}
                placeholder="CLR-2026-009-DAY-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claru-country">Country code</Label>
              <Input
                id="claru-country"
                value={form.country}
                maxLength={2}
                onChange={(event) => update('country', event.target.value.toUpperCase())}
                placeholder="IN"
              />
            </div>
          </div>

          <div className="border-t pt-5" style={{ borderColor: 'var(--border-default)' }}>
            <p className="text-sm font-semibold">Shared capture defaults</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              These values prefill every new clip and remain editable before submission.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="claru-collector">Collector ID</Label>
                <Input
                  id="claru-collector"
                  value={form.collectorId}
                  maxLength={200}
                  onChange={(event) => update('collectorId', event.target.value)}
                  placeholder="CLR-COL-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claru-site">Site ID</Label>
                <Input
                  id="claru-site"
                  value={form.siteId}
                  maxLength={200}
                  onChange={(event) => update('siteId', event.target.value)}
                  placeholder="CLR-SITE-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claru-device">Capture device</Label>
                <Input
                  id="claru-device"
                  value={form.device}
                  maxLength={300}
                  onChange={(event) => update('device', event.target.value)}
                  placeholder="GoPro HERO12 Black"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claru-mount">Mount</Label>
                <Input
                  id="claru-mount"
                  value={form.mount}
                  maxLength={200}
                  onChange={(event) => update('mount', event.target.value)}
                  placeholder="Head mounted"
                />
              </div>
            </div>
          </div>

          {error ? (
            <p
              className="rounded-md border px-3 py-2 text-sm"
              role="alert"
              style={{
                backgroundColor: 'var(--status-error-bg)',
                borderColor: 'var(--status-error-border)',
                color: 'var(--status-error)',
              }}
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || projects.length === 0}>
              {mutation.isPending ? 'Creating…' : 'Create batch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
