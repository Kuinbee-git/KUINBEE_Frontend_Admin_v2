'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, MessageSquare, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  useAnswerDatasetQuestion,
  useDatasetQuestions,
  useDeleteDatasetQuestion,
  useQuestionDatasets,
} from '@/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import type { DatasetQuestion } from '@/types';
import { cn } from '@/lib/utils';

const positivePage = (value: string | null) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

export default function AdminQuestionsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') ?? '';
  const debouncedSearch = useDebounce(searchQuery, 350);
  const page = positivePage(searchParams.get('page'));
  const questionPage = positivePage(searchParams.get('questionPage'));
  const selectedFromUrl = searchParams.get('dataset');
  const pageSize = 10;
  const questionPageSize = 20;

  const listQuery = useQuestionDatasets({
    page,
    pageSize,
    q: debouncedSearch || undefined,
  });
  const datasets = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items]);
  const selectedDataset =
    datasets.find((item) => item.datasetId === selectedFromUrl) ?? datasets[0] ?? null;
  const selectedDatasetId = selectedDataset?.datasetId ?? '';
  const questionsQuery = useDatasetQuestions(selectedDatasetId, {
    page: questionPage,
    pageSize: questionPageSize,
  });
  const questions = questionsQuery.data?.items ?? [];

  const answerMutation = useAnswerDatasetQuestion(selectedDatasetId);
  const deleteMutation = useDeleteDatasetQuestion(selectedDatasetId);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<DatasetQuestion | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) next.delete(key);
        else next.set(key, value);
      });
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const totalDatasetPages = Math.max(
    1,
    Math.ceil((listQuery.data?.pagination.total ?? 0) / pageSize)
  );
  const totalQuestionPages = Math.max(
    1,
    Math.ceil((questionsQuery.data?.total ?? 0) / questionPageSize)
  );

  const submitAnswer = async (questionId: string) => {
    const answer = (answerDrafts[questionId] ?? '').trim();
    if (!answer || answer.length > 5000) return;
    try {
      await answerMutation.mutateAsync({ questionId, answer });
      setAnswerDrafts((current) => ({ ...current, [questionId]: '' }));
    } catch {
      // The mutation hook presents the error and preserves the draft.
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteReason.trim().length < 3) return;
    try {
      await deleteMutation.mutateAsync({
        questionId: deleteTarget.id,
        data: { reason: deleteReason.trim() },
      });
      setDeleteTarget(null);
      setDeleteReason('');
    } catch {
      // The mutation hook presents the error and keeps the confirmation open.
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6">
      <div className="mb-6">
        <h1>Questions</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
          Answer marketplace questions and remove inappropriate content with a recorded reason.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}>
          <CardHeader>
            <CardTitle>Datasets with questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
                aria-hidden="true"
              />
              <Input
                type="search"
                aria-label="Search datasets with questions"
                placeholder="Search datasets"
                value={searchQuery}
                onChange={(event) =>
                  updateUrl({
                    q: event.target.value.trimStart() || null,
                    page: null,
                    dataset: null,
                    questionPage: null,
                  })
                }
                className="pl-9"
              />
            </div>

            {listQuery.isLoading ? (
              <div className="space-y-2" aria-label="Loading datasets">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-lg bg-[var(--bg-hover)]" />
                ))}
              </div>
            ) : listQuery.isError ? (
              <div className="py-8 text-center">
                <AlertCircle className="mx-auto h-7 w-7 text-destructive" aria-hidden="true" />
                <p className="mt-2 font-medium">Could not load datasets</p>
                <Button
                  className="mt-3"
                  size="sm"
                  variant="outline"
                  onClick={() => listQuery.refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : datasets.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare
                  className="mx-auto h-7 w-7"
                  style={{ color: 'var(--text-muted)' }}
                  aria-hidden="true"
                />
                <p className="mt-2 font-medium">No datasets found</p>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {debouncedSearch
                    ? 'Try a different search.'
                    : 'No marketplace questions need review.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {datasets.map((item) => {
                  const isActive = item.datasetId === selectedDatasetId;
                  return (
                    <button
                      key={item.datasetId}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => updateUrl({ dataset: item.datasetId, questionPage: null })}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                        isActive ? 'bg-[var(--nav-active-bg)]' : 'hover:bg-[var(--bg-hover)]'
                      )}
                      style={{
                        borderColor: isActive ? 'var(--nav-active)' : 'var(--border-default)',
                      }}
                    >
                      <p className="truncate text-sm font-medium">{item.datasetTitle}</p>
                      <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {item.questionCount} question{item.questionCount === 1 ? '' : 's'}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {!listQuery.isLoading && totalDatasetPages > 1 ? (
              <div
                className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Page {page} of {totalDatasetPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || listQuery.isFetching}
                    onClick={() =>
                      updateUrl({
                        page: page - 1 > 1 ? String(page - 1) : null,
                        dataset: null,
                        questionPage: null,
                      })
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalDatasetPages || listQuery.isFetching}
                    onClick={() =>
                      updateUrl({ page: String(page + 1), dataset: null, questionPage: null })
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-default)' }}>
          <CardHeader>
            <CardTitle>{selectedDataset?.datasetTitle ?? 'Question inbox'}</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDataset ? (
              <div className="py-12 text-center">
                <MessageSquare
                  className="mx-auto h-8 w-8"
                  style={{ color: 'var(--text-muted)' }}
                  aria-hidden="true"
                />
                <p className="mt-3" style={{ color: 'var(--text-muted)' }}>
                  Select a dataset to review its questions.
                </p>
              </div>
            ) : questionsQuery.isLoading ? (
              <div className="space-y-3" aria-label="Loading questions">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-36 animate-pulse rounded-lg bg-[var(--bg-hover)]" />
                ))}
              </div>
            ) : questionsQuery.isError ? (
              <div className="py-12 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />
                <p className="mt-3 font-medium">Could not load questions</p>
                <Button className="mt-4" variant="outline" onClick={() => questionsQuery.refetch()}>
                  Try again
                </Button>
              </div>
            ) : questions.length === 0 ? (
              <p className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                No questions remain for this dataset.
              </p>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => {
                  const draft = answerDrafts[question.id] ?? '';
                  return (
                    <article
                      key={question.id}
                      className="rounded-lg border p-4"
                      style={{
                        borderColor: 'var(--border-default)',
                        backgroundColor: 'var(--bg-surface)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{question.question}</p>
                          <time
                            className="mt-1 block text-xs"
                            style={{ color: 'var(--text-muted)' }}
                            dateTime={question.createdAt}
                          >
                            {new Date(question.createdAt).toLocaleString()}
                          </time>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(question)}
                          aria-label="Delete question"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>

                      {question.answers.length ? (
                        <div className="mt-4 space-y-2">
                          {question.answers.map((answer) => (
                            <div
                              key={answer.id}
                              className="rounded-md border p-3"
                              style={{
                                borderColor: 'var(--border-default)',
                                backgroundColor: 'var(--bg-base)',
                              }}
                            >
                              <p className="text-sm">{answer.answer}</p>
                              <time
                                className="mt-1 block text-xs"
                                style={{ color: 'var(--text-muted)' }}
                                dateTime={answer.createdAt}
                              >
                                {new Date(answer.createdAt).toLocaleString()}
                              </time>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Input
                          value={draft}
                          maxLength={5000}
                          aria-label={`Answer question: ${question.question}`}
                          placeholder="Write an answer"
                          onChange={(event) =>
                            setAnswerDrafts((current) => ({
                              ...current,
                              [question.id]: event.target.value,
                            }))
                          }
                        />
                        <Button
                          className="shrink-0"
                          disabled={!draft.trim() || answerMutation.isPending}
                          onClick={() => submitAnswer(question.id)}
                        >
                          {answerMutation.isPending &&
                          answerMutation.variables?.questionId === question.id
                            ? 'Sending…'
                            : 'Answer'}
                        </Button>
                      </div>
                    </article>
                  );
                })}

                {totalQuestionPages > 1 ? (
                  <div
                    className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderColor: 'var(--border-default)' }}
                  >
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Page {questionPage} of {totalQuestionPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={questionPage <= 1 || questionsQuery.isFetching}
                        onClick={() =>
                          updateUrl({
                            questionPage: questionPage - 1 > 1 ? String(questionPage - 1) : null,
                          })
                        }
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={questionPage >= totalQuestionPages || questionsQuery.isFetching}
                        onClick={() => updateUrl({ questionPage: String(questionPage + 1) })}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete question</DialogTitle>
            <DialogDescription>
              This removes the question and all of its answers. The moderation action will be
              audited.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="question-delete-reason">Reason</Label>
            <Textarea
              id="question-delete-reason"
              value={deleteReason}
              maxLength={1000}
              placeholder="Explain why this question is being removed."
              onChange={(event) => setDeleteReason(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteReason.trim().length < 3 || deleteMutation.isPending}
              onClick={confirmDelete}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
