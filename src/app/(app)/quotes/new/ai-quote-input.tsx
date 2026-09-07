"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import type { GeneratedQuote } from "@/lib/ai/quote-schema";

// Minimal ambient typing for the Web Speech API, which isn't in standard DOM lib.
interface SpeechRecognitionResultLike {
  transcript: string;
}
interface SpeechRecognitionEventLike extends Event {
  results: { [index: number]: { [index: number]: SpeechRecognitionResultLike; isFinal: boolean }; length: number };
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export function AiQuoteInput({ onGenerated }: { onGenerated: (quote: GeneratedQuote) => void }) {
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    setVoiceSupported(Boolean(SpeechRecognitionCtor));
  }, []);

  function toggleListening() {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition: SpeechRecognitionLike = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-AU";

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }
      if (finalTranscript) {
        setDescription((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  async function handleGenerate() {
    if (!description.trim()) {
      setError("Describe the job first.");
      return;
    }
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobDescription: description }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again or enter it manually.");
        return;
      }

      onGenerated(data.quote as GeneratedQuote);
    } catch {
      setError("Couldn't reach the server. Please check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Card>
      <label htmlFor="job-description" className="mb-2 block text-sm font-medium text-ink-700">
        Tell us about the job…
      </label>
      <textarea
        id="job-description"
        rows={5}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Customer has a leaking hot water service. Need to replace the tempering valve. Materials should be around $85. About 1.5 hours labour. $120 call-out."
        className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-base text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleListening}
          disabled={!voiceSupported}
          title={voiceSupported ? "Voice input" : "Voice input isn't supported in this browser"}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink-200 text-lg disabled:opacity-40"
        >
          {isListening ? "⏺️" : "🎙️"}
        </button>
        <button
          type="button"
          disabled
          title="Photo attachments are coming soon"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink-200 text-lg opacity-40"
        >
          📷
        </button>
        <div className="flex-1" />
      </div>

      {isListening && <p className="mt-2 text-xs text-brand-700">Listening… tap the mic again to stop.</p>}

      <FormMessage message={error} />

      <Button size="lg" className="mt-4 w-full" isLoading={isGenerating} onClick={handleGenerate}>
        Generate Quote
      </Button>
    </Card>
  );
}
