'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Edit2, Save, X, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getDatasetKdts,
  createOrUpdateKdts,
  updateKdtsHistory,
  calculateKdtsScore,
  formatKdtsScore,
  KDTS_LABELS,
} from '@/services/kdts.service';
import type {
  DatasetKdtsGetResponse,
  KdtsBreakdown,
  AdminKdtsUpsertBody,
  AdminKdtsUpdateBody,
  AdminKdtsUpdateResponse,
} from '@/types';
import { getFriendlyErrorMessage } from '@/lib/utils/error.utils';
import { datasetsKeys } from '@/hooks/api/useDatasets';
import { formatDate } from '@/utils/date.utils';
import { toast } from 'sonner';

interface KdtsScorePanelProps {
  datasetId: string;
  canEdit?: boolean;
}

const EMPTY_BREAKDOWN: KdtsBreakdown = { Q: 0, L: 0, P: 0, U: 0, F: 0 };

export function KdtsScorePanel({ datasetId, canEdit = false }: KdtsScorePanelProps) {
  const queryClient = useQueryClient();
  const [kdts, setKdts] = useState<DatasetKdtsGetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<KdtsBreakdown>(EMPTY_BREAKDOWN);
  const [note, setNote] = useState('');

  const loadKdts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDatasetKdts(datasetId);
      setKdts(data);
      setFormData(data.breakdown ?? EMPTY_BREAKDOWN);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    void loadKdts();
  }, [loadKdts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body: AdminKdtsUpsertBody = {
        Q: formData.Q,
        L: formData.L,
        P: formData.P,
        U: formData.U,
        F: formData.F,
        note: note.trim() || 'Updated KDTS score',
      };
      const response = await createOrUpdateKdts(datasetId, body);
      setKdts((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentScore: response.dataset.kdtsScore,
          breakdown: formData,
          history: [response.history, ...(prev.history ?? [])],
          updatedAt: response.history.createdAt,
        };
      });
      setIsEditing(false);
      setNote('');
      void queryClient.invalidateQueries({ queryKey: datasetsKeys.detail(datasetId) });
      void queryClient.invalidateQueries({ queryKey: datasetsKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: datasetsKeys.audit(datasetId) });
      if (response.dataset.autoDelisted) {
        toast.warning('Dataset automatically unpublished', {
          description: 'Its Legal & Compliance score is below the sellability threshold of 60.',
        });
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card
        className="overflow-hidden"
        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading KDTS data...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Empty / Error ──────────────────────────────────────────────────────────
  if (!kdts) {
    return (
      <Card
        className="overflow-hidden"
        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
      >
        <CardContent className="pt-6">
          {error ? (
            <div
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{
                backgroundColor: 'var(--status-error-bg)',
                border: '1px solid var(--status-error-border)',
              }}
            >
              <AlertCircle
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: 'var(--state-error)' }}
              />
              <p className="text-sm" style={{ color: 'var(--state-error)' }}>
                {error}
              </p>
              <Button className="ml-auto" size="sm" variant="outline" onClick={loadKdts}>
                Retry
              </Button>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No KDTS data available.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Main Score Card ──────────────────────────────────────────────────── */}
      <Card
        className="overflow-hidden"
        style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
      >
        <CardHeader
          className="border-b flex-row items-center justify-between space-y-0"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <CardTitle style={{ color: 'var(--text-primary)' }}>KDTS Score</CardTitle>
          {canEdit && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              style={{ color: 'var(--state-info)' }}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </CardHeader>

        <CardContent className="pt-5">
          {/* Error banner */}
          {error && (
            <div
              className="flex items-start gap-3 p-3 rounded-lg mb-4"
              style={{
                backgroundColor: 'var(--status-error-bg)',
                border: '1px solid var(--status-error-border)',
              }}
            >
              <AlertCircle
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: 'var(--state-error)' }}
              />
              <p className="text-sm" style={{ color: 'var(--state-error)' }}>
                {error}
              </p>
            </div>
          )}

          {isEditing ? (
            /* ── Edit Form ──────────────────────────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {(Object.keys(KDTS_LABELS) as Array<keyof typeof KDTS_LABELS>).map((key) => (
                  <div key={key} className="min-w-0">
                    <div className="flex flex-col gap-0.5 mb-1.5 min-w-0">
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        {key}
                      </span>
                      <span
                        className="text-xs leading-tight truncate"
                        title={KDTS_LABELS[key].shortName}
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {KDTS_LABELS[key].shortName}
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="1"
                      aria-label={`${key} — ${KDTS_LABELS[key].shortName}`}
                      value={formData[key] === 0 ? '' : String(formData[key])}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [key]: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-md text-sm"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-default)',
                      }}
                    />
                  </div>
                ))}
              </div>

              {formData.L < 60 ? (
                <div
                  className="flex items-start gap-2 rounded-lg p-3 text-sm"
                  style={{
                    backgroundColor: 'var(--status-error-bg)',
                    border: '1px solid var(--status-error-border)',
                    color: 'var(--state-error)',
                  }}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <p>
                    A Legal &amp; Compliance score below 60 makes this dataset unsellable. Saving
                    this score automatically unpublishes a currently published dataset.
                  </p>
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="kdts-note"
                  className="text-sm font-medium mb-1 block"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Note
                </label>
                <input
                  id="kdts-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={1000}
                  placeholder="Optional note about this update..."
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)',
                  }}
                />
              </div>

              {/* Live score preview */}
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: 'var(--status-info-bg)',
                  border: '1px solid var(--status-info-border)',
                }}
              >
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  New Score:{' '}
                  <span className="font-semibold" style={{ color: 'var(--state-info)' }}>
                    {formatKdtsScore(calculateKdtsScore(formData))}
                  </span>
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(kdts.breakdown ?? EMPTY_BREAKDOWN);
                    setNote('');
                  }}
                  disabled={submitting}
                  style={{
                    backgroundColor: 'var(--bg-hover)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  style={{
                    backgroundColor: 'var(--state-info)',
                    color: 'var(--brand-on-primary)',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* ── Read View ──────────────────────────────────────────────────── */
            <>
              {/* Current score headline */}
              <div className="mb-5">
                {kdts.currentScore ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold" style={{ color: 'var(--state-info)' }}>
                      {kdts.currentScore}
                    </span>
                    <span className="text-lg" style={{ color: 'var(--text-muted)' }}>
                      / 100
                    </span>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Not yet scored
                  </p>
                )}
                {kdts.updatedAt && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Last updated: {new Date(kdts.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Breakdown grid */}
              {kdts.breakdown ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {(Object.keys(KDTS_LABELS) as Array<keyof typeof KDTS_LABELS>).map((key) => (
                    <div
                      key={key}
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      <p
                        className="text-xs font-medium uppercase tracking-wide mb-1"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {key}
                      </p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {kdts.breakdown![key]}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {KDTS_LABELS[key].shortName}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="p-4 rounded-lg text-center"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                >
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No breakdown data available
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── History Timeline ──────────────────────────────────────────────────── */}
      {(kdts.history?.length ?? 0) > 0 && (
        <Card
          className="overflow-hidden"
          style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
        >
          <CardHeader className="border-b" style={{ borderColor: 'var(--border-default)' }}>
            <CardTitle style={{ color: 'var(--text-primary)' }}>Scoring History</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {kdts.history?.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Score:{' '}
                        <span style={{ color: 'var(--state-info)' }}>{entry.finalScore}</span>
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {entry.admin?.name || 'Unknown Admin'} &bull;{' '}
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {canEdit && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditingHistoryId(editingHistoryId === entry.id ? null : entry.id)
                        }
                        style={{ color: 'var(--state-info)' }}
                        aria-label={`Edit KDTS review from ${formatDate(entry.createdAt)}`}
                      >
                        <Edit2 className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>

                  {/* Breakdown row */}
                  {entry.breakdown && (
                    <div className="grid grid-cols-5 gap-1.5 mb-2">
                      {(Object.keys(entry.breakdown) as Array<keyof KdtsBreakdown>).map((key) => (
                        <div
                          key={key}
                          className="text-center px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: 'var(--bg-hover)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <span className="font-semibold">{key}</span> {entry.breakdown[key]}
                        </div>
                      ))}
                    </div>
                  )}

                  {entry.note && (
                    <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                      &ldquo;{entry.note}&rdquo;
                    </p>
                  )}

                  {canEdit && editingHistoryId === entry.id && (
                    <EditHistoryForm
                      historyId={entry.id}
                      initialBreakdown={entry.breakdown ?? EMPTY_BREAKDOWN}
                      initialNote={entry.note}
                      onSuccess={(response) => {
                        void queryClient.invalidateQueries({
                          queryKey: datasetsKeys.detail(datasetId),
                        });
                        void queryClient.invalidateQueries({ queryKey: datasetsKeys.lists() });
                        void queryClient.invalidateQueries({
                          queryKey: datasetsKeys.audit(datasetId),
                        });
                        if (response.dataset.autoDelisted) {
                          toast.warning('Dataset automatically unpublished', {
                            description:
                              'Its Legal & Compliance score is below the sellability threshold of 60.',
                          });
                        }
                        setEditingHistoryId(null);
                        loadKdts();
                      }}
                      onCancel={() => setEditingHistoryId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================
// Edit History Form Component
// ============================================

interface EditHistoryFormProps {
  historyId: string;
  initialBreakdown: KdtsBreakdown;
  initialNote: string | null;
  onSuccess: (response: AdminKdtsUpdateResponse) => void;
  onCancel: () => void;
}

function EditHistoryForm({
  historyId,
  initialBreakdown,
  initialNote,
  onSuccess,
  onCancel,
}: EditHistoryFormProps) {
  const [formData, setFormData] = useState(initialBreakdown);
  const originalNote = initialNote ?? '';
  const [note, setNote] = useState(originalNote);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const updates: AdminKdtsUpdateBody = {};
      let hasChanges = false;

      if (note !== originalNote) {
        updates.note = note.trim() || null;
        hasChanges = true;
      }

      (Object.keys(formData) as Array<keyof KdtsBreakdown>).forEach((key) => {
        if (formData[key] !== initialBreakdown[key]) {
          updates[key] = formData[key];
          hasChanges = true;
        }
      });

      if (!hasChanges) {
        setError('No changes to save');
        setSubmitting(false);
        return;
      }

      const response = await updateKdtsHistory(historyId, updates);
      onSuccess(response);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 p-3 rounded-lg space-y-3"
      style={{
        backgroundColor: 'var(--status-info-bg)',
        border: '1px solid var(--status-info-border)',
      }}
    >
      {error && (
        <div
          className="flex items-start gap-2 p-2 rounded"
          style={{
            backgroundColor: 'var(--status-error-bg)',
            border: '1px solid var(--status-error-border)',
          }}
        >
          <AlertCircle
            className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
            style={{ color: 'var(--state-error)' }}
          />
          <p className="text-xs" style={{ color: 'var(--state-error)' }}>
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-5 gap-2">
        {(Object.keys(formData) as Array<keyof KdtsBreakdown>).map((key) => (
          <input
            key={key}
            type="number"
            min={0}
            max={100}
            step="1"
            aria-label={`${key} score`}
            value={formData[key] === 0 ? '' : String(formData[key])}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, [key]: parseInt(e.target.value, 10) || 0 }))
            }
            className="px-2 py-1 rounded text-xs"
            style={{
              backgroundColor: 'var(--bg-base)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
            }}
            placeholder={key}
          />
        ))}
      </div>

      <input
        type="text"
        aria-label="History update note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
        placeholder="Update note..."
        className="w-full px-2 py-1 rounded text-xs"
        style={{
          backgroundColor: 'var(--bg-base)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
        }}
      />

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={submitting}
          style={{
            backgroundColor: 'var(--bg-hover)',
            color: 'var(--text-primary)',
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={submitting}
          style={{
            backgroundColor: 'var(--state-info)',
            color: 'var(--brand-on-primary)',
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-3 h-3 mr-1" />
              Update
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
