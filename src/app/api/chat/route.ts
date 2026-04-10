import { NextRequest } from "next/server";
import { embedQuery, getChatModel } from "@/lib/gemini";
import { getQdrantClient } from "@/lib/qdrant";
import { QDRANT_COLLECTION } from "@/lib/constants";
import type { Message, FilterState, SlidePayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages,
      filters,
    }: { messages: Message[]; filters?: FilterState } = body;

    if (!messages?.length) {
      return Response.json({ error: "messages is required" }, { status: 400 });
    }

    const userMessage = messages[messages.length - 1].content;

    // Embed and retrieve context
    const vector = await embedQuery(userMessage);
    const client = getQdrantClient();
    const hits = await client.search(QDRANT_COLLECTION, {
      vector,
      limit: 8,
      with_payload: true,
      filter: buildFilter(filters),
    });

    const context = hits
      .map((h) => {
        const p = h.payload as unknown as SlidePayload;
        return `[${p.startup_name} — ${p.slide_type}]\n${p.embedding_text}`;
      })
      .join("\n\n---\n\n");

    const systemPrompt = `You are an expert analyst of startup pitch decks with access to a knowledge base of startups.
Answer questions using ONLY the provided context from the knowledge base.
If the answer is not in the context, say so clearly — do not invent information.
Always cite which startup(s) your information comes from.

CONTEXT FROM KNOWLEDGE BASE:
${context}`;

    const model = getChatModel();
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role as "user" | "model",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history,
      systemInstruction: systemPrompt,
    });

    const result = await chat.sendMessageStream(userMessage);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("/api/chat error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildFilter(filters?: FilterState) {
  const must: object[] = [];
  if (filters?.funding_stage?.length) {
    must.push({ key: "funding_stage", match: { any: filters.funding_stage } });
  }
  if (filters?.country?.length) {
    must.push({ key: "country", match: { any: filters.country } });
  }
  if (filters?.sector?.length) {
    must.push({ key: "sector", match: { any: filters.sector } });
  }
  return must.length > 0 ? { must } : undefined;
}
