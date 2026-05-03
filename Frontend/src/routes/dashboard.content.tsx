import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  RefreshCcw,
  Copy,
  Wand2,
  Instagram,
  Mail,
  Megaphone,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/content")({
  head: () => ({ meta: [{ title: "Content Creator — Saadhyam AI" }] }),
  component: ContentStudio,
});

const types = [
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "email", label: "Email", icon: Mail },
  { key: "ad", label: "Ad copy", icon: Megaphone },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];

const tones = ["Friendly", "Professional", "Playful", "Bold"];
const languages = ["English", "Telugu", "Hindi", "Tamil"];

function ContentStudio() {
  const [type, setType] = useState("instagram");
  const [tone, setTone] = useState("Friendly");
  const [language, setLanguage] = useState("English");
  const [prompt, setPrompt] = useState(
    "Promote our new Diwali handbag collection with 30% off this weekend.",
  );
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.generateContent({
        content_type: type,
        tone: tone.toLowerCase(),
        language: language,
        prompt: prompt,
      });

      if (response.success) {
        setOutput(response.content);
        toast.success("Content generated successfully!");
      } else {
        toast.error("Failed to generate content");
      }
    } catch (error: any) {
      console.error("Content generation error:", error);
      toast.error(error.message || "Failed to generate content");

      // Fallback mock data
      setOutput(
        `✨ ${prompt}\n\nGenerated in ${language} with ${tone} tone.\n\n#AI #Content #SaadhyamAI`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard?.writeText(output);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Content Creator"
        subtitle="Generate on-brand content in seconds"
        actions={
          <Button
            variant="hero"
            size="sm"
            onClick={() => {
              setPrompt("");
              setOutput("");
            }}
          >
            <Wand2 size={14} /> New generation
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Input */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-5 space-y-5">
          <div>
            <p className="text-sm font-semibold mb-2">Content type</p>
            <div className="flex gap-2 flex-wrap">
              {types.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                    type === t.key
                      ? "bg-gradient-primary text-primary-foreground border-transparent shadow-soft"
                      : "border-border hover:bg-accent/40"
                  }`}
                >
                  <t.icon size={13} /> {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Tone</p>
            <div className="flex gap-2 flex-wrap">
              {tones.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    tone === t
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted hover:bg-accent/40"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Language</p>
            <div className="flex gap-2 flex-wrap">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    language === lang
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted hover:bg-accent/40"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">What do you want to say?</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="E.g., Promote our new Diwali handbag collection with 30% off this weekend."
              className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition"
            />
          </div>

          <Button
            variant="hero"
            className="w-full"
            size="lg"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate content
              </>
            )}
          </Button>
        </div>

        {/* Output */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">AI output</p>
            {output && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                <Sparkles size={10} /> Generated
              </span>
            )}
          </div>
          <div className="flex-1 rounded-xl bg-gradient-soft border border-border/40 p-4 mb-3 min-h-[300px]">
            {output ? (
              <p className="text-sm leading-relaxed whitespace-pre-line">{output}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your generated content will appear here...
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleCopy}
              disabled={!output}
            >
              <Copy size={13} /> Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
            >
              <RefreshCcw size={13} /> Regenerate
            </Button>
            <Button variant="hero" size="sm" className="flex-1" disabled={!output}>
              Use it →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
