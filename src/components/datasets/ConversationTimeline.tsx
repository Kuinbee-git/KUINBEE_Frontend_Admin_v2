"use client";

import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge, getDatasetStatusSemantic, formatStatusLabel } from "@/components/shared/StatusBadge";

interface Message {
  id: string;
  author: string;
  authorType: "platform" | "supplier";
  timestamp: string;
  content: string;
  relatedStatus?: string;
}

interface ConversationTimelineProps {
  conversation: Message[];
  onAddNote: (note: string) => void;
}

export function ConversationTimeline({ conversation, onAddNote }: ConversationTimelineProps) {
  const [newNote, setNewNote] = useState("");

  const handleSubmit = () => {
    if (newNote.trim()) {
      onAddNote(newNote);
      setNewNote("");
    }
  };

  return (
    <div
      className="p-6 rounded-lg"
      style={{
        backgroundColor: "var(--bg-base)",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 className="mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
        <MessageCircle className="w-5 h-5" />
        Conversation ({conversation.length})
      </h2>

      {/* Add Note Form */}
      <div className="mb-6">
        <Label className="mb-2 block" style={{ color: "var(--text-primary)" }}>
          Add Note
        </Label>
        <div className="space-y-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note or comment..."
            rows={3}
            className="w-full"
            style={{
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              borderColor: "var(--border-default)",
            }}
          />
          <Button
            onClick={handleSubmit}
            disabled={!newNote.trim()}
            style={{
              backgroundColor: "var(--state-info)",
              color: "#FFFFFF",
            }}
          >
            <Send className="w-4 h-4 mr-2" />
            Send Note
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {conversation.map((message) => (
          <div
            key={message.id}
            className="p-4 rounded-lg"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderWidth: "1px",
              borderColor: "var(--border-default)",
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                  {message.author}
                </span>
                <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>
                  ({message.authorType === "platform" ? "Platform Admin" : "Supplier"})
                </span>
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {new Date(message.timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {message.relatedStatus && (
              <div className="mb-2">
                <StatusBadge
                  status={formatStatusLabel(message.relatedStatus)}
                  semanticType={getDatasetStatusSemantic(message.relatedStatus)}
                />
              </div>
            )}
            <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
              {message.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
