"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  answerDatasetQuestion,
  deleteDatasetQuestion,
  getDatasetsWithQuestions,
  getDatasetQuestions,
} from "@/services/datasets.service";
import type { DatasetQuestion, DatasetQuestionDataset } from "@/types/dataset.types";

export default function AdminQuestionsPage() {
  const [loading, setLoading] = useState(true);
  const [datasetsWithQuestions, setDatasetsWithQuestions] = useState<DatasetQuestionDataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [questionsByDatasetId, setQuestionsByDatasetId] = useState<Record<string, DatasetQuestion[]>>({});
  const [loadingQuestionsForDatasetId, setLoadingQuestionsForDatasetId] = useState<string | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const fetchDatasetList = async (preferredDatasetId?: string | null) => {
    const listResponse = await getDatasetsWithQuestions({ page: 1, pageSize: 100 });
    const items = listResponse.items || [];
    setDatasetsWithQuestions(items);

    if (items.length === 0) {
      setSelectedDatasetId(null);
      return null;
    }

    const preferredExists = preferredDatasetId
      ? items.some((item) => item.datasetId === preferredDatasetId)
      : false;
    const nextSelectedId = preferredExists && preferredDatasetId
      ? preferredDatasetId
      : items[0].datasetId;
    setSelectedDatasetId(nextSelectedId);
    return nextSelectedId;
  };

  const fetchQuestionsForDataset = async (datasetId: string) => {
    setLoadingQuestionsForDatasetId(datasetId);
    try {
      const questionResponse = await getDatasetQuestions(datasetId);
      setQuestionsByDatasetId((prev) => ({
        ...prev,
        [datasetId]: questionResponse.items || [],
      }));
    } finally {
      setLoadingQuestionsForDatasetId((current) => (current === datasetId ? null : current));
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const nextSelectedId = await fetchDatasetList(selectedDatasetId);
      if (nextSelectedId) {
        await fetchQuestionsForDataset(nextSelectedId);
      }
    } catch (error) {
       console.error("Error fetching questions data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const selected = useMemo(() => {
    if (!selectedDatasetId) return null;
    return datasetsWithQuestions.find((item) => item.datasetId === selectedDatasetId) || null;
  }, [datasetsWithQuestions, selectedDatasetId]);

  const selectedQuestions = selectedDatasetId ? questionsByDatasetId[selectedDatasetId] || [] : [];

  const handleSelectDataset = async (datasetId: string) => {
    setSelectedDatasetId(datasetId);
    if (!questionsByDatasetId[datasetId]) {
      await fetchQuestionsForDataset(datasetId);
    }
  };

  const refreshAfterMutation = async () => {
    const nextSelectedId = await fetchDatasetList(selectedDatasetId);
    if (!nextSelectedId) {
      setQuestionsByDatasetId({});
      return;
    }
    await fetchQuestionsForDataset(nextSelectedId);
  };

  const handleAnswer = async (questionId: string) => {
    const answer = (answerDrafts[questionId] || "").trim();
    if (!answer) return;

    try {
      setAnsweringQuestionId(questionId);
      await answerDatasetQuestion(questionId, { answer });
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: "" }));
      await refreshAfterMutation();
    } finally {
      setAnsweringQuestionId(null);
    }
  };

  const handleDelete = async (questionId: string) => {
    try {
      setDeletingQuestionId(questionId);
      await deleteDatasetQuestion(questionId);
      await refreshAfterMutation();
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
      ) : datasetsWithQuestions.length === 0 ? (
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
              {datasetsWithQuestions.map((datasetItem) => {
                const isActive = datasetItem.datasetId === selectedDatasetId;
                return (
                  <button
                    key={datasetItem.datasetId}
                    onClick={() => {
                      void handleSelectDataset(datasetItem.datasetId);
                    }}
                    className="w-full text-left rounded-lg p-3 border"
                    style={{
                      backgroundColor: isActive ? "var(--bg-hover)" : "var(--bg-surface)",
                      borderColor: "var(--border-default)",
                    }}
                  >
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {datasetItem.datasetTitle}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {datasetItem.questionCount} question{datasetItem.questionCount === 1 ? "" : "s"}
                    </p>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-default)" }}>
            <CardHeader>
              <CardTitle>{selected?.datasetTitle || "Questions"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDatasetId && loadingQuestionsForDatasetId === selectedDatasetId ? (
                <p style={{ color: "var(--text-muted)" }}>Loading dataset questions...</p>
              ) : selectedQuestions.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>No questions in this dataset.</p>
              ) : selectedQuestions.map((question) => (
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
