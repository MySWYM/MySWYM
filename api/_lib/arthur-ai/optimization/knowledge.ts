/**
 * Bibliothèque de connaissances coaching (F3).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { arthurLog } from "../logging.js";

export interface KnowledgeSnippet {
  id?: string;
  topic: string;
  title: string;
  content: string;
  tags?: string[];
  intent_hints?: string[];
  priority?: number;
}

/** Matching simple intent / mots-clés → snippets actifs. */
export async function fetchRelevantKnowledge(
  admin: SupabaseClient,
  input: { intent?: string | null; message?: string | null; limit?: number },
): Promise<KnowledgeSnippet[]> {
  const limit = Math.min(5, Math.max(1, input.limit || 2));
  try {
    const { data, error } = await admin
      .from("ai_knowledge_snippets")
      .select("id, topic, title, content, tags, intent_hints, priority")
      .eq("active", true)
      .order("priority", { ascending: false })
      .limit(40);

    if (error || !data?.length) {
      if (error) arthurLog("warn", "knowledge_fetch_failed", { code: error.code });
      return [];
    }

    const intent = (input.intent || "").toLowerCase();
    const msg = (input.message || "").toLowerCase();
    const scored = data.map((s) => {
      let score = s.priority || 0;
      const hints = (s.intent_hints || []) as string[];
      if (intent && hints.includes(intent)) score += 40;
      for (const tag of (s.tags || []) as string[]) {
        if (msg.includes(String(tag).toLowerCase())) score += 15;
      }
      if (msg.includes(String(s.topic).replace(/_/g, " "))) score += 10;
      return { s, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(({ s }) => ({
      id: s.id,
      topic: s.topic,
      title: s.title,
      content: s.content,
      tags: s.tags || [],
      intent_hints: s.intent_hints || [],
      priority: s.priority,
    }));
  } catch (err) {
    arthurLog("warn", "knowledge_fetch_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return [];
  }
}

export function formatKnowledgeForContext(snippets: KnowledgeSnippet[]): string {
  if (!snippets.length) return "";
  return snippets
    .map((s) => `[${s.topic}] ${s.title}: ${s.content}`)
    .join("\n");
}
