import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Copy,
  Download,
  RefreshCw,
  Loader2,
  FileText,
  MessageSquare,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";

export const Route = createFileRoute("/dashboard/voice-agent/script-generator")({
  component: ScriptGeneratorPage,
});

interface ScriptData {
  opening_line: string;
  qualification_questions: string[];
  value_proposition: string;
  objection_handling: Record<string, string>;
  closing_line: string;
  follow_up_line: string;
  full_script: string;
}

function ScriptGeneratorPage() {
  const [formData, setFormData] = useState({
    campaign_name: "",
    campaign_goal: "",
    business_context: "",
    offer_details: "",
    target_audience: "",
    call_purpose: "",
    language: "english"
  });

  const [generatedScript, setGeneratedScript] = useState<ScriptData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const generateScript = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem("saadhyam_token");
      const response = await fetch("http://localhost:8000/api/v2/voice-agent/script/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedScript(data.script);
      }
    } catch (error) {
      console.error("Failed to generate script:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const downloadScript = () => {
    if (!generatedScript) return;

    const scriptText = `
AI SALES SCRIPT
Campaign: ${formData.campaign_name}
Language: ${formData.language}
Generated: ${new Date().toLocaleString()}

=====================================
OPENING LINE
=====================================
${generatedScript.opening_line}

=====================================
QUALIFICATION QUESTIONS
=====================================
${generatedScript.qualification_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

=====================================
VALUE PROPOSITION
=====================================
${generatedScript.value_proposition}

=====================================
OBJECTION HANDLING
=====================================
${Object.entries(generatedScript.objection_handling).map(([obj, resp]) => 
  `Objection: ${obj}\nResponse: ${resp}\n`
).join('\n')}

=====================================
CLOSING LINE
=====================================
${generatedScript.closing_line}

=====================================
FOLLOW-UP LINE
=====================================
${generatedScript.follow_up_line}

=====================================
FULL SCRIPT
=====================================
${generatedScript.full_script}
`;

    const blob = new Blob([scriptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `script_${formData.campaign_name.replace(/\s+/g, '_')}.txt`;
    a.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Script Generator
          </h1>
          <p className="text-gray-600 mt-1">
            Generate professional sales scripts powered by AI
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.href = "/dashboard/voice-agent"}
        >
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} className="text-purple-600" />
                Campaign Details
              </CardTitle>
              <CardDescription>
                Provide information about your campaign to generate a tailored script
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="campaign_name">Campaign Name *</Label>
                <Input
                  id="campaign_name"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({...formData, campaign_name: e.target.value})}
                  placeholder="e.g., Diwali Offer Campaign"
                />
              </div>

              <div>
                <Label htmlFor="campaign_goal">Campaign Goal *</Label>
                <Input
                  id="campaign_goal"
                  value={formData.campaign_goal}
                  onChange={(e) => setFormData({...formData, campaign_goal: e.target.value})}
                  placeholder="e.g., Generate 100 qualified leads"
                />
              </div>

              <div>
                <Label htmlFor="business_context">Business Context *</Label>
                <Textarea
                  id="business_context"
                  value={formData.business_context}
                  onChange={(e) => setFormData({...formData, business_context: e.target.value})}
                  placeholder="Describe your business, products, or services..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="offer_details">Offer Details *</Label>
                <Textarea
                  id="offer_details"
                  value={formData.offer_details}
                  onChange={(e) => setFormData({...formData, offer_details: e.target.value})}
                  placeholder="What special offer or promotion are you running?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="target_audience">Target Audience *</Label>
                <Input
                  id="target_audience"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
                  placeholder="e.g., Small business owners, Gym members"
                />
              </div>

              <div>
                <Label htmlFor="call_purpose">Call Purpose *</Label>
                <Input
                  id="call_purpose"
                  value={formData.call_purpose}
                  onChange={(e) => setFormData({...formData, call_purpose: e.target.value})}
                  placeholder="e.g., Schedule demo, Close sale, Gather interest"
                />
              </div>

              <div>
                <Label htmlFor="language">Language *</Label>
                <select
                  id="language"
                  value={formData.language}
                  onChange={(e) => setFormData({...formData, language: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="english">English</option>
                  <option value="hinglish">Hinglish</option>
                  <option value="telugu">Telugu</option>
                  <option value="tamil">Tamil</option>
                  <option value="hindi">Hindi</option>
                </select>
              </div>

              <Button
                onClick={generateScript}
                disabled={isGenerating || !formData.campaign_name || !formData.business_context}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Generating Script...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} className="mr-2" />
                    Generate AI Script
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Generated Script */}
        <div className="space-y-4">
          {!generatedScript && !isGenerating && (
            <Card className="h-full flex items-center justify-center border-2 border-dashed border-gray-300">
              <CardContent className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={32} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Generate
                </h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  Fill in the campaign details and click "Generate AI Script" to create a professional sales script
                </p>
              </CardContent>
            </Card>
          )}

          {isGenerating && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Loader2 size={48} className="mx-auto text-purple-600 animate-spin mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Generating Your Script...
                  </h3>
                  <p className="text-gray-600">
                    AI is crafting a personalized sales script for your campaign
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {generatedScript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={downloadScript}
                  variant="outline"
                  className="flex-1"
                >
                  <Download size={16} className="mr-2" />
                  Download Script
                </Button>
                <Button
                  onClick={generateScript}
                  variant="outline"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Regenerate
                </Button>
              </div>

              {/* Opening Line */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Opening Line</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedScript.opening_line, "opening")}
                    >
                      {copiedSection === "opening" ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {generatedScript.opening_line}
                  </p>
                </CardContent>
              </Card>

              {/* Qualification Questions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Qualification Questions</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(
                        generatedScript.qualification_questions.join('\n'),
                        "questions"
                      )}
                    >
                      {copiedSection === "questions" ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {generatedScript.qualification_questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">{i + 1}</Badge>
                        <span className="text-gray-700">{q}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Value Proposition */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Value Proposition</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedScript.value_proposition, "value")}
                    >
                      {copiedSection === "value" ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {generatedScript.value_proposition}
                  </p>
                </CardContent>
              </Card>

              {/* Objection Handling */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Objection Handling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(generatedScript.objection_handling).map(([objection, response], i) => (
                    <div key={i} className="border-l-4 border-purple-600 pl-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-red-600" />
                          <span className="font-semibold text-gray-900">{objection}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(response, `objection-${i}`)}
                        >
                          {copiedSection === `objection-${i}` ? (
                            <CheckCircle size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </Button>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{response}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Closing Line */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Closing Line</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedScript.closing_line, "closing")}
                    >
                      {copiedSection === "closing" ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {generatedScript.closing_line}
                  </p>
                </CardContent>
              </Card>

              {/* Follow-up Line */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Follow-up Line</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(generatedScript.follow_up_line, "followup")}
                    >
                      {copiedSection === "followup" ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {generatedScript.follow_up_line}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
