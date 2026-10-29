'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { downloadCustomServiceSample } from '@/services/custom-collection.service';
import type { CustomCollectionSampleFile } from '@/types/custom-collection.types';

export function ServiceSampleFiles({
  serviceId,
  revisionId,
  files = [],
}: {
  serviceId: string;
  revisionId: string;
  files?: CustomCollectionSampleFile[];
}) {
  const actor = useAuthStore((state) => state.user?.id);
  const active = useRef(true);
  const currentActor = useRef(actor);
  useEffect(() => {
    active.current = true;
    currentActor.current = actor;
    return () => {
      active.current = false;
      currentActor.current = undefined;
    };
  }, [actor, revisionId]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function download(file: CustomCollectionSampleFile) {
    const startedActor = actor;
    setBusy(file.id);
    setError(null);
    try {
      const result = await downloadCustomServiceSample(serviceId, revisionId, file.id);
      if (!active.current || currentActor.current !== startedActor) return;
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.fileName;
      link.rel = 'noopener';
      link.click();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download this sample.');
    } finally {
      if (active.current) setBusy(null);
    }
  }
  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-semibold">Sample files</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Review these exact files with this service revision. Only approved, published samples are
          available to buyers.
        </p>
      </div>
      {!files.length ? (
        <p className="text-sm text-muted-foreground">No sample files attached.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex flex-col justify-between gap-3 rounded-md border p-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 gap-2">
                <FileText className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="break-all text-sm font-medium">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(Number(file.sizeBytes) / 1_000_000).toFixed(2)} MB ·{' '}
                    {file.status === 'READY' ? 'Uploaded' : 'Upload incomplete'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={Boolean(busy) || file.status !== 'READY'}
                onClick={() => void download(file)}
              >
                {busy === file.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download sample
              </Button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
