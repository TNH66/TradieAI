"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CopyPublicLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable - the input is still selectable/copyable manually.
    }
  }

  return (
    <div className="flex gap-2">
      <Input readOnly value={url} onFocus={(e) => e.target.select()} className="flex-1 text-sm" />
      <Button type="button" variant="secondary" onClick={handleCopy}>
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}
