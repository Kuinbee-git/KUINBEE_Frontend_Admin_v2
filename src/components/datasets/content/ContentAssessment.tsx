'use client';
import { useState } from 'react';
import type { DatasetContentAssessmentBody } from '@kuinbee/dataset-preparation-contracts';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type {
  AdminDatasetAssessment,
  AdminDatasetReview,
} from '@/services/dataset-content.service';
import type { DatasetReviewCommand } from '@/lib/datasets/dataset-review-commands';
import { KDTS_LABELS } from '@/services/kdts.service';
import { ReviewFacts } from './ContentReviewFacts';
const box = {
  background: 'var(--bg-base)',
  borderColor: 'var(--border-default)',
  color: 'var(--text-primary)',
};
export function ContentAssessment({
  state,
  contentId,
  target,
  current,
  actorId,
  disabled,
  execute,
}: {
  state: Pick<AdminDatasetReview['state'], 'datasetId' | 'workflowRevision' | 'publishedContentId'>;
  contentId: string;
  target: 'REVIEWED' | 'PUBLISHED';
  current: AdminDatasetAssessment['assessment'];
  actorId: string;
  disabled: boolean;
  execute: (command: DatasetReviewCommand, replay?: boolean) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false),
    [note, setNote] = useState('');
  const keys = ['Q', 'L', 'P', 'U', 'F'] as const;
  const [scores, setScores] = useState<Record<(typeof keys)[number], string>>({
    Q: current ? String(current.Q) : '',
    L: current ? String(current.L) : '',
    P: current ? String(current.P) : '',
    U: current ? String(current.U) : '',
    F: current ? String(current.F) : '',
  });
  const valid = keys.every((key) => /^(100|[0-9]{1,2})$/.test(scores[key]));
  const publishedToo = state.publishedContentId === contentId;
  const label = target === 'PUBLISHED' ? 'published' : 'submitted';
  async function save() {
    if (disabled || !valid) return;
    const body: DatasetContentAssessmentBody = {
      requestId: crypto.randomUUID(),
      expectedWorkflowRevision: state.workflowRevision,
      expectedContentId: contentId,
      target,
      Q: Number(scores.Q),
      L: Number(scores.L),
      P: Number(scores.P),
      U: Number(scores.U),
      F: Number(scores.F),
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    await execute({ kind: 'ASSESS', datasetId: state.datasetId, actorId, body });
    setEditing(false);
  }
  return (
    <div className="space-y-4">
      <p className="text-sm">
        Assessment covers{' '}
        {current?.scope.uploadedComponents
          .map((value) => (value === 'FULL' ? 'uploaded full material' : 'uploaded sample'))
          .join(' and ') ?? 'the uploaded components of this submission'}
        . The represented collection remains supplier declared. A sample assessment does not inspect
        unseen full material.
      </p>
      <ReviewFacts
        rows={[
          ['Current ' + label + ' assessment', current ? current.finalScore : 'Not assessed'],
          ['Assessed at', current ? new Date(current.createdAt).toLocaleString() : null],
          ...keys.map((key) => [KDTS_LABELS[key].name, current?.[key]] as const),
          ['Assessment note', current?.note],
        ]}
      />
      {publishedToo && (
        <p className="text-sm">
          This assessment targets the current published content. Saving a Legal &amp; Compliance
          score below 60 withdraws its current publication.
        </p>
      )}
      {!editing ? (
        <Button variant="outline" disabled={disabled} onClick={() => setEditing(true)}>
          Assess {label} material
        </Button>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save().catch(() => {});
          }}
        >
          <div className="grid gap-3 sm:grid-cols-5">
            {keys.map((key) => (
              <label htmlFor={target + '-score-' + key} className="text-sm" key={key}>
                {KDTS_LABELS[key].name}
                <input
                  id={target + '-score-' + key}
                  aria-label={KDTS_LABELS[key].name + ' score'}
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  required
                  disabled={disabled}
                  value={scores[key]}
                  onChange={(event) =>
                    setScores((previous) => ({ ...previous, [key]: event.target.value }))
                  }
                  className="w-full mt-1 p-2 rounded border"
                  style={box}
                />
              </label>
            ))}
          </div>
          <label htmlFor={target + '-assessment-note'} className="block text-sm">
            Assessment note
            <Textarea
              id={target + '-assessment-note'}
              aria-label={
                target === 'PUBLISHED' ? 'Published assessment note' : 'Submitted assessment note'
              }
              maxLength={4000}
              disabled={disabled}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={disabled || !valid}>
              Save {label} assessment
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              onClick={() => setEditing(false)}
            >
              Cancel assessment
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
