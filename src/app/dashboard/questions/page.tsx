"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  answerDatasetQuestion,
  deleteDatasetQuestion,
  getDatasetQuestions,
  getDatasets,
} from "@/services/datasets.service";
import type { DatasetListItem } from "@/types/dataset.types";

type QuestionItem = {
  id: string;
  question: string;
  createdAt: string;
  answers: Array<{ id: string; answer: string; createdAt: string }>;
};

type QuestionBucket = {
  datasetItem: DatasetListItem;
  questions: QuestionItem[];
};

export default function AdminQuestionsPage() {
  const [loading, setLoading] = useState(true);
  const [buckets, setBuckets] = useState<QuestionBucket[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const datasetsResponse = await getDatasets({ page: 1, pageSize: 100 });
      const datasets = datasetsResponse.items;
      
      const questionBuckets = await Promise.all(
        datasets.map(async (datasetItem) => {
          try {
            const questionResponse = await getDatasetQuestions(datasetItem.dataset.id);
            return {
              datasetItem,
              questions: questionResponse.items || [],
            } as QuestionBucket;
          } catch {
            return {
              datasetItem,
              questions: [],
            } as QuestionBucket;
          }
        })
      );

      const filtered = questionBuckets.filter((b) => b.questions.length > 0);
      setBuckets(filtered);
      if (!selectedDatasetId && filtered.length > 0) {
        setSelectedDatasetId(filtered[0].datasetItem.dataset.id);
      }
    } catch (error) {
       console.error("Error fetching questions data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selected = useMemo(
    () => buckets.find((b) => b.datasetItem.dataset.id === selectedDatasetId) || null,
    [buckets, selectedDatasetId]
  );

  const handleAnswer = async (questionId: string) => {
    const answer = (answerDrafts[questionId] || "").trim();
    if (!answer) return;

    try {
      setAnsweringQuestionId(questionId);
      await answerDatasetQuestion(questionId, { answer });
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: "" }));
      await fetchData();
    } finally {
      setAnsweringQuestionId(null);
    }
  };

  const handleDelete = async (questionId: string) => {
    try {
      setDeletingQuestionId(questionId);
      await deleteDatasetQuestion(questionId);
      await fetchData();
    } finally {
      setDeletingQuestionId(null);
    }
  };

  return (
    <div className="p-6">
      <h1 style={{ color: "var(--text-primary)" }} className="mb-2 text-2xl font-bold">
        Questions
      </h1>
      <p style={{ color: "var(--text-muted)" }} className="mb-6">
        Dataset-grouped question inbox. Answer questions or delete inappropriate content.
      </p>

      {loading ? (
        <Card style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
          <CardContent className="p-6">
            <p style={{ color: "var(--text-muted)" }}>Loading questions...</p>
          </CardContent>
        </Card>
      ) : buckets.length === 0 ? (
        <Card style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
          <CardContent className="p-6">
            <p style={{ color: "var(--text-muted)" }}>No marketplace datasets with questions right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
            <CardHeader>
              <CardTitle>Datasets with Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {buckets.map((bucket) => {
                const isActive = bucket.datasetItem.dataset.id === selectedDatasetId;
                return (
                  <button
                    key={bucket.datasetItem.dataset.id}
                    onClick={() => setSelectedDatasetId(bucket.datasetItem.dataset.id)}
                    className="w-full text-left rounded-lg p-3 border"
                    style={{
                      backgroundColor: isActive ? "var(--bg-hover)" : "var(--bg-surface)",
                      borderColor: "var(--border-default)",
                    }}
                  >
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {bucket.datasetItem.dataset.title}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {bucket.questions.length} question{bucket.questions.length === 1 ? "" : "s"}
                    </p>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
            <CardHeader>
              <CardTitle>{selected?.datasetItem.dataset.title || "Questions"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selected?.questions.map((question) => (
                <div key={question.id} className="rounded-lg border p-4" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{question.question}</p>
                  <p className="text-xs mt-1 mb-3" style={{ color: "var(--text-muted)" }}>
                    {new Date(question.createdAt).toLocaleString()}
                  </p>

                  {question.answers.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {question.answers.map((answer) => (
                        <div key={answer.id} className="rounded-md p-3 border" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-base)" }}>
                          <p className="text-sm" style={{ color: "var(--text-primary)" }}>{answer.answer}</p>
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                            {new Date(answer.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className="flex-1 h-10 px-3 rounded-md border text-sm"
                      style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}
                      placeholder="Write an answer..."
                      value={answerDrafts[question.id] || ""}
                      onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [question.id]: e.target.value }))}
                    />
                    <Button
                      onClick={() => handleAnswer(question.id)}
                      disabled={answeringQuestionId === question.id || !(answerDrafts[question.id] || "").trim()}
                    >
                      {answeringQuestionId === question.id ? "Sending..." : "Answer"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(question.id)}
                      disabled={deletingQuestionId === question.id}
                    >
                      {deletingQuestionId === question.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
