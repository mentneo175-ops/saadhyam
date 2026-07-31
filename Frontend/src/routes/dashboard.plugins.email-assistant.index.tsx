import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Sparkles, Loader2, Copy, CheckCircle, Send, Mail, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import * as PluginAPI from "@/lib/pluginsApi";

export const Route = createFileRoute("/dashboard/plugins/email-assistant/")({
  head: () => ({
    meta: [{ title: "AI Email Assistant — Saadhyam AI" }],
  }),
  component: EmailAssistantPage,
});

function EmailAssistantPage() {
  const [activeTab, setActiveTab] = useState<"compose" | "suggest">("compose");

  // Compose states
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [purpose, setPurpose] = useState("general");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Medium");
  const [newPoint, setNewPoint] = useState("");
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [isLoadingCompose, setIsLoadingCompose] = useState(false);
  const [composeResult, setComposeResult] = useState<{
    subject: string;
    body: string;
    wordCount: number;
  } | null>(null);
  const [copiedCompose, setCopiedCompose] = useState(false);

  // Suggest states
  const [originalEmail, setOriginalEmail] = useState("");
  const [responseType, setResponseType] = useState("detailed");
  const [suggestTone, setSuggestTone] = useState("Professional");
  const [isLoadingSuggest, setIsLoadingSuggest] = useState(false);
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([]);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState<number | null>(null);
  const [copiedSuggestIndex, setCopiedSuggestIndex] = useState<number | null>(null);

  const addKeyPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPoint.trim()) {
      setKeyPoints([...keyPoints, newPoint.trim()]);
      setNewPoint("");
    }
  };

  const removeKeyPoint = (index: number) => {
    setKeyPoints(keyPoints.filter((_, i) => i !== index));
  };

  const handleCompose = async () => {
    if (!subject.trim()) {
      toast.error("Subject is required to compose email");
      return;
    }

    setIsLoadingCompose(true);
    try {
      const res = await PluginAPI.executePluginAction<{
        success: boolean;
        subject: string;
        body: string;
        word_count: number;
        error?: string;
      }>("ai_productivity_email_assistant", "compose_email", {
        subject,
        recipient_context: recipient,
        recipient: recipient,
        tone,
        purpose,
        length,
        key_points: keyPoints,
      });

      if (res.success && res.result?.success) {
        setComposeResult({
          subject: res.result.subject,
          body: res.result.body,
          wordCount: res.result.word_count,
        });
        toast.success("Email composed successfully!");
      } else {
        const errMsg = res.result?.error || res.error || "Composition failed";
        toast.error(errMsg);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Composition failed");
    } finally {
      setIsLoadingCompose(false);
    }
  };

  const handleSuggest = async () => {
    if (!originalEmail.trim()) {
      toast.error("Please paste the original email content first");
      return;
    }

    setIsLoadingSuggest(true);
    setSelectedResponseIndex(null);
    try {
      const res = await PluginAPI.executePluginAction<{
        success: boolean;
        responses: string[];
        error?: string;
      }>("ai_productivity_email_assistant", "suggest_response", {
        original_email: originalEmail,
        response_type: responseType,
        tone: suggestTone,
      });

      if (res.success && res.result?.success) {
        setSuggestedResponses(res.result.responses);
        toast.success("Response suggestions generated!");
      } else {
        const errMsg = res.result?.error || res.error || "Failed to generate suggestions";
        toast.error(errMsg);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate suggestions");
    } finally {
      setIsLoadingSuggest(false);
    }
  };

  const handleCopyText = async (text: string, type: "compose" | number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "compose") {
        setCopiedCompose(true);
        setTimeout(() => setCopiedCompose(false), 2000);
      } else {
        setCopiedSuggestIndex(type);
        setTimeout(() => setCopiedSuggestIndex(null), 2000);
      }
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy text");
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl space-y-6">
      {/* Back Button */}
      <div className="mb-2">
        <Link to="/dashboard/plugins" aria-label="Back to Plugin Marketplace">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Plugin Marketplace
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="text-5xl">📧</div>
          <div>
            <h1 className="text-3xl font-bold">AI Email Assistant</h1>
            <p className="text-purple-100 mt-1">Compose professional emails and respond to inquiries with AI-powered support.</p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab("compose")}
          className={`pb-4 px-2 font-semibold text-base transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "compose"
              ? "border-purple-600 text-purple-600 dark:text-purple-400 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Send className="w-4 h-4" />
          Compose Email
        </button>
        <button
          onClick={() => setActiveTab("suggest")}
          className={`pb-4 px-2 font-semibold text-base transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "suggest"
              ? "border-purple-600 text-purple-600 dark:text-purple-400 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Mail className="w-4 h-4" />
          Suggest Response
        </button>
      </div>

      {activeTab === "compose" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Card */}
          <Card className="lg:col-span-5 shadow-lg border border-gray-200/50 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure details to generate your email draft.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Name / Context</Label>
                <Input
                  id="recipient"
                  placeholder="e.g. Alice Smith, Client Partner"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="e.g. Partnership Proposal"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger id="purpose">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="meeting_request">Meeting Request</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger id="tone">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                      <SelectItem value="Formal">Formal</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="length">Length</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger id="length">
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Short">Short</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Key Points Input */}
              <div className="space-y-2">
                <Label>Key Points</Label>
                <form onSubmit={addKeyPoint} className="flex gap-2">
                  <Input
                    placeholder="e.g. Flexible timing next week"
                    value={newPoint}
                    onChange={(e) => setNewPoint(e.target.value)}
                  />
                  <Button type="submit" size="icon" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </form>

                {keyPoints.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 max-h-36 overflow-y-auto p-1.5 bg-muted/40 rounded-lg">
                    {keyPoints.map((point, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 bg-white dark:bg-slate-800 text-xs px-2.5 py-1 rounded-full shadow-sm border border-gray-100 dark:border-slate-700"
                      >
                        <span className="truncate max-w-[150px]">{point}</span>
                        <button
                          type="button"
                          onClick={() => removeKeyPoint(index)}
                          className="text-red-500 hover:text-red-700 ml-1 shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleCompose}
                disabled={isLoadingCompose}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg"
              >
                {isLoadingCompose ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Email...
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

          {/* Result Card */}
          <Card className="lg:col-span-7 shadow-lg border border-gray-200/50 dark:border-slate-800 h-full min-h-[450px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Generated Draft</CardTitle>
                <CardDescription>Your AI-composed email will appear here.</CardDescription>
              </div>
              {composeResult && (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-full font-semibold">
                    {composeResult.wordCount} words
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleCopyText(composeResult.body, "compose")}
                  >
                    {copiedCompose ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {composeResult ? (
                <div className="space-y-4">
                  <div className="p-3 bg-muted/40 rounded-lg border">
                    <span className="font-semibold text-xs text-muted-foreground block mb-0.5">SUBJECT</span>
                    <span className="text-sm font-medium">{composeResult.subject}</span>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-xl border min-h-[300px] whitespace-pre-wrap text-sm leading-relaxed font-sans">
                    {composeResult.body}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-muted-foreground space-y-2">
                  <Send className="w-12 h-12 stroke-[1.5] text-gray-300 dark:text-slate-700" />
                  <p className="font-medium">No Draft Generated Yet</p>
                  <p className="text-xs max-w-xs">Fill out the configuration settings on the left and click "Generate Email" to begin.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Request Form */}
          <Card className="lg:col-span-5 shadow-lg border border-gray-200/50 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Inbound Email Details</CardTitle>
              <CardDescription>Paste an email and select how you want to respond.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="originalEmail">Original Email Content *</Label>
                <Textarea
                  id="originalEmail"
                  placeholder="Paste the incoming email here..."
                  value={originalEmail}
                  onChange={(e) => setOriginalEmail(e.target.value)}
                  className="min-h-[150px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responseType">Response Type</Label>
                  <Select value={responseType} onValueChange={setResponseType}>
                    <SelectTrigger id="responseType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="quick">Quick</SelectItem>
                      <SelectItem value="accept">Accept Invitation</SelectItem>
                      <SelectItem value="decline">Decline Offer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suggestTone">Tone</Label>
                  <Select value={suggestTone} onValueChange={setSuggestTone}>
                    <SelectTrigger id="suggestTone">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Friendly">Friendly</SelectItem>
                      <SelectItem value="Formal">Formal</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSuggest}
                disabled={isLoadingSuggest}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg"
              >
                {isLoadingSuggest ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing & Generating Suggestions...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Suggest Replies
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Suggestions Display */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Suggested Replies
            </h2>

            {suggestedResponses.length > 0 ? (
              <div className="space-y-4">
                {suggestedResponses.map((reply, index) => (
                  <Card
                    key={index}
                    onClick={() => setSelectedResponseIndex(index)}
                    className={`cursor-pointer transition-all duration-300 relative group overflow-hidden border-2 ${
                      selectedResponseIndex === index
                        ? "border-purple-600 dark:border-purple-400 bg-purple-50/20 dark:bg-purple-950/20 shadow-md scale-[1.01]"
                        : "border-gray-200/50 dark:border-slate-800 hover:border-purple-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                        Option {index + 1}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(reply, index);
                        }}
                      >
                        {copiedSuggestIndex === index ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200">
                      {reply}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-lg border border-gray-200/50 dark:border-slate-800 min-h-[300px] flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                <Mail className="w-12 h-12 stroke-[1.5] text-gray-300 dark:text-slate-700 mb-2" />
                <p className="font-medium">No Reply Suggestions Yet</p>
                <p className="text-xs max-w-xs">Paste an incoming message in the text area on the left and click "Suggest Replies" to see response recommendations.</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
