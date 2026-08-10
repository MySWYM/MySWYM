/**
 * Bibliothèque de connaissances coaching (F3) + produit MySWYM builtin.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { arthurLog } from "../logging.js";
import { matchBuiltinKnowledge } from "../knowledge/myswym-product.js";

export interface KnowledgeSnippet {
  id?: string;
  topic: string;
  title: string;
  content: string;
  tags?: string[];
  intent_hints?: string[];
  priority?: number;
}

/** Matching simple intent / mots-clés → snippets actifs (+ fallback builtin). */
export async function fetchRelevantKnowledge(
  admin: SupabaseClient,
  input: { intent?: string | null; message?: string | null; limit?: number },
): Promise<KnowledgeSnippet[]> {
  const limit = Math.min(5, Math.max(1, input.limit || 3));
  const builtin = matchBuiltinKnowledge(
    input.message || "",
    input.intent,
    limit,
  );

  try {
    const { data, error } = await admin
      .from("ai_knowledge_snippets")
      .select("id, topic, title, content, tags, intent_hints, priority")
      .eq("active", true)
      .order("priority", { ascending: false })
      .limit(40);

    if (error || !data?.length) {
      if (error) arthurLog("warn", "knowledge_fetch_failed", { code: error.code });
      return builtin;
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
    const fromDb = scored.slice(0, limit).map(({ s }) => ({
      id: s.id,
      topic: s.topic,
      title: s.title,
      content: s.content,
      tags: s.tags || [],
      intent_hints: s.intent_hints || [],
      priority: s.priority,
    }));

    const seen = new Set<string>();
    const merged: KnowledgeSnippet[] = [];
    for (const s of [...fromDb, ...builtin]) {
      const key = `${s.topic}::${s.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(s);
      if (merged.length >= limit) break;
    }
    return merged;
  } catch (err) {
    arthurLog("warn", "knowledge_fetch_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return builtin;
  }
}

export function formatKnowledgeForContext(snippets: KnowledgeSnippet[]): string {
  if (!snippets.length) return "";
  return snippets
    .map((s) => `[${s.topic}] ${s.title}: ${s.content}`)
    .join("\n");
}
