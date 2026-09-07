import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { extractJsonFromText, validateGeneratedQuote } from "@/lib/ai/quote-schema";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

interface RequestBody {
  jobDescription?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    // Each call costs real money and takes a few seconds - a generous but
    // real cap protects against runaway client bugs or abuse.
    if (!checkRateLimit(`ai-quote:${user.id}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "You've hit the generation limit for this hour. Please try again later or enter the quote manually." },
        { status: 429 }
      );
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("default_labour_rate, default_callout_fee, trade")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "Business profile not found." }, { status: 400 });
    }

    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const jobDescription = String(body.jobDescription ?? "").trim();
    if (!jobDescription) {
      return NextResponse.json({ error: "Describe the job before generating a quote." }, { status: 400 });
    }
    if (jobDescription.length > 4000) {
      return NextResponse.json({ error: "That description is too long." }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not configured.");
      return NextResponse.json(
        { error: "AI quote generation isn't configured yet. Please use manual entry for now." },
        { status: 503 }
      );
    }

    const systemPrompt = buildSystemPrompt({
      defaultLabourRate: Number(business.default_labour_rate) || 0,
      defaultCalloutFee: Number(business.default_callout_fee) || 0,
      trade: business.trade ?? "trade",
    });

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: jobDescription }],
      }),
    });

    if (!anthropicResponse.ok) {
      console.error("Anthropic API error:", anthropicResponse.status, await anthropicResponse.text());
      return NextResponse.json(
        { error: "Something went wrong generating the quote. Please try again or enter it manually." },
        { status: 502 }
      );
    }

    const anthropicData = await anthropicResponse.json();
    const textBlock = (anthropicData.content ?? []).find((block: any) => block.type === "text");

    if (!textBlock?.text) {
      return NextResponse.json(
        { error: "The AI didn't return a usable response. Please try again or enter it manually." },
        { status: 502 }
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = extractJsonFromText(textBlock.text);
    } catch {
      return NextResponse.json(
        { error: "The AI's response couldn't be read. Please try again or enter it manually." },
        { status: 502 }
      );
    }

    const validation = validateGeneratedQuote(parsedJson);
    if (!validation.ok) {
      console.error("AI quote validation failed:", validation.error);
      return NextResponse.json(
        { error: "The AI's response didn't look right, so nothing was pre-filled. Please try again or enter it manually." },
        { status: 502 }
      );
    }

    return NextResponse.json({ quote: validation.data });
  } catch (err) {
    console.error("Unexpected error in /api/ai/generate-quote:", err);
    return NextResponse.json(
      { error: "Something went wrong creating your quote. Please try again." },
      { status: 500 }
    );
  }
}
