import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Copy,
  CheckCircle,
  Send,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { generateStoreEmailAssistant } from "@/lib/storeApi";

const PURPOSE_SUGGESTIONS = [
  "Attendance",
  "Meeting",
  "Leave / HR",
  "Follow-up",
  "Reminder",
  "Project Update",
  "Customer / Client",
  "Interview / Recruitment",
  "Sales",
  "Announcement",
  "Feedback",
  "Information Request",
];

export const Route = createFileRoute("/dashboard/store/email-assistant")({
  head: () => ({
    meta: [{ title: "Store ΓÇö AI Email Assistant ΓÇö Saadhyam AI" }],
  }),
  component: StoreEmailAssistantPage,
});

function StoreEmailAssistantPage() {
  // Compose form states
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Medium");
  const [signature, setSignature] = useState("The Saadhyam Team");
  const [isLoadingCompose, setIsLoadingCompose] = useState(false);
  const [composeResult, setComposeResult] = useState<{
    subject: string;
    body: string;
    wordCount: number;
  } | null>(null);
  const [copiedCompose, setCopiedCompose] = useState(false);

  const handleCompose = async () => {
    if (!subject.trim()) {
      toast.error("Subject is required to compose email");
      return;
    }

    setIsLoadingCompose(true);
    try {
      const res = await generateStoreEmailAssistant({
        recipient: recipient || "Colleague",
        subject,
        purpose: purpose.trim() || "General",
        tone,
        length,
        signature: signature || "The Saadhyam Team",
      });

      if (res.success && res.body) {
        setComposeResult({
          subject: res.subject,
          body: res.body,
          wordCount: res.word_count,
        });
        toast.success("Email composed successfully!");
      } else {
        const errMsg = res.error || res.message || "Composition failed";
        toast.error(errMsg);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Composition failed");
    } finally {
      setIsLoadingCompose(false);
    }
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCompose(true);
      setTimeout(() => setCopiedCompose(false), 2000);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy text");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            to="/dashboard/store"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
          >
            <ShoppingBag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Store
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">AI Email Assistant</span>
        </div>

        <Link to="/dashboard/store">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Button>
        </Link>
      </div>

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner">
              ≡ƒôº
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold tracking-tight">AI Email Assistant</h1>
                <Badge className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm border-0">
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  Store Solution
                </Badge>
              </div>
              <p className="text-purple-100 text-sm md:text-base max-w-2xl">
                Generate high-converting, context-aware email drafts with proper structure, tone, and formatting.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Composition Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Card: Input Parameters */}
        <Card className="lg:col-span-5 shadow-lg border-2 border-gray-100 dark:border-slate-800 rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Compose Email Parameters
            </CardTitle>
            <CardDescription>
              Configure context and parameters for your AI email generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipient */}
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient / Audience</Label>
              <Input
                id="recipient"
                placeholder="e.g. John, HR Manager or Prospective Client"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="e.g. Attendance Submission Reminder"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-xl font-medium"
                required
              />
            </div>

            {/* Purpose / Context */}
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose / Context</Label>
              <Input
                id="purpose"
                placeholder="e.g. Remind John to submit August attendance by Friday"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="rounded-xl"
              />
              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground font-medium mr-1">
                  Suggestions:
                </span>
                {PURPOSE_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setPurpose(suggestion)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                      purpose === suggestion
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-muted/50 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-300 border-border/60 hover:border-purple-300 dark:hover:border-purple-800"
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone & Length Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="tone" className="rounded-xl">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Friendly">Friendly</SelectItem>
                    <SelectItem value="Formal">Formal</SelectItem>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Concise">Concise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="length">Length</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger id="length" className="rounded-xl">
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Short">Short</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Signature */}
            <div className="space-y-2">
              <Label htmlFor="signature">Signature</Label>
              <Input
                id="signature"
                placeholder="e.g. The Saadhyam Team"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Generate Action Button */}
            <Button
              onClick={handleCompose}
              disabled={isLoadingCompose}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/20 transition-all mt-4"
            >
              {isLoadingCompose ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Email with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right Card: Generated Email Output */}
        <Card className="lg:col-span-7 shadow-lg border-2 border-gray-100 dark:border-slate-800 rounded-3xl h-full min-h-[500px] flex flex-col justify-between">
          <div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-xl font-bold">Generated Email Draft</CardTitle>
                <CardDescription>
                  Your formatted, context-aware email draft will appear below.
                </CardDescription>
              </div>
              {composeResult && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold px-3 py-1 rounded-full text-xs"
                  >
                    {composeResult.wordCount} words
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyText(composeResult.body)}
                    className="rounded-xl gap-1.5"
                  >
                    {copiedCompose ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Email
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-6">
              {composeResult ? (
                <div className="space-y-4">
                  {/* Subject Line */}
                  <div className="p-4 bg-muted/40 rounded-2xl border border-gray-200/60 dark:border-slate-800">
                    <span className="font-bold text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider block mb-1">
                      Subject
                    </span>
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      {composeResult.subject}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 bg-muted/20 rounded-2xl border border-gray-200/60 dark:border-slate-800 min-h-[340px] whitespace-pre-wrap text-sm md:text-base leading-relaxed font-sans text-gray-800 dark:text-slate-200 shadow-inner">
                    {composeResult.body}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[380px] text-center text-muted-foreground space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto text-2xl">
                    <Send className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    No Draft Generated Yet
                  </h3>
                  <p className="text-sm max-w-sm">
                    Enter the recipient, subject, and key points on the left, then click &ldquo;Generate Email&rdquo; to compose with AI.
                  </p>
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}