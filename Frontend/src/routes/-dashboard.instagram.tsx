import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { apiClient } from "@/lib/api";
import { InstagramAccountManager } from "@/components/instagram/InstagramAccountManager";
import { InstagramPostCreator } from "@/components/instagram/InstagramPostCreator";
import { ScheduledPostsList } from "@/components/instagram/ScheduledPostsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

interface InstagramAccount {
  id: number;
  ig_username: string;
  page_name: string;
  is_active: boolean;
  connected_at: string;
}

interface ScheduledPost {
  id: number;
  image_url: string;
  caption: string;
  scheduled_time: string;
  posted_time?: string;
  status: "pending" | "scheduled" | "posted" | "failed";
  ai_generated: boolean;
  created_at: string;
}

export const InstagramIntegration = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Fetch posts when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      fetchPosts();
    }
  }, [selectedAccount]);

  const fetchAccounts = async () => {
    try {
      setError("");
      const response = await apiClient.get("/instagram/accounts");
      setAccounts(response.data.accounts || []);
      if (response.data.accounts?.length > 0) {
        setSelectedAccount(response.data.accounts[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch accounts");
      console.error("Error fetching accounts:", err);
    }
  };

  const fetchPosts = async () => {
    if (!selectedAccount) return;
    try {
      setIsLoadingPosts(true);
      const response = await apiClient.get("/instagram/posts", {
        params: { limit: 12, page: 1 },
      });
      setPosts(response.data.posts || []);
    } catch (err: any) {
      console.error("Error fetching posts:", err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/instagram/auth/connect");
      window.location.href = response.data.oauth_url;
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to connect Instagram account");
      console.error("Error connecting account:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (accountId: number) => {
    try {
      setIsLoading(true);
      await apiClient.delete(`/instagram/accounts/${accountId}`);
      setSuccess("Account disconnected successfully");
      await fetchAccounts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to disconnect account");
      console.error("Error disconnecting account:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostNow = async (data: { image_url: string; caption: string }) => {
    if (!selectedAccount) {
      setError("Please select an account");
      return;
    }
    try {
      setIsLoading(true);
      await apiClient.post("/instagram/post", {
        social_account_id: selectedAccount,
        ...data,
      });
      setSuccess("Post published successfully!");
      await fetchPosts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to post");
      console.error("Error posting:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedule = async (data: {
    image_url: string;
    caption: string;
    scheduled_time: string;
  }) => {
    if (!selectedAccount) {
      setError("Please select an account");
      return;
    }
    try {
      setIsLoading(true);
      await apiClient.post("/instagram/schedule", {
        social_account_id: selectedAccount,
        ...data,
      });
      setSuccess("Post scheduled successfully!");
      await fetchPosts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to schedule post");
      console.error("Error scheduling post:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCaption = async (topic: string, tone: string) => {
    try {
      setIsGenerating(true);
      const response = await apiClient.post("/instagram/generate-caption", {
        topic,
        tone,
      });
      setGeneratedCaption(response.data.caption);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate caption");
      console.error("Error generating caption:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditCaption = async (postId: number, newCaption: string) => {
    try {
      setIsLoading(true);
      await apiClient.put(`/instagram/post/${postId}`, {
        caption: newCaption,
      });
      setSuccess("Caption updated successfully");
      await fetchPosts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update caption");
      console.error("Error updating caption:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      setIsLoading(true);
      await apiClient.delete(`/instagram/post/${postId}`);
      setSuccess("Post deleted successfully");
      await fetchPosts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete post");
      console.error("Error deleting post:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <span>📱</span> Instagram Automation
        </h1>
        <p className="text-gray-600">
          Manage your Instagram Business Account and schedule posts with AI captions
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar - Account Manager */}
        <div className="lg:col-span-1">
          <InstagramAccountManager
            accounts={accounts}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            isLoading={isLoading}
          />
        </div>

        {/* Main Content - Tabs */}
        <div className="lg:col-span-2">
          {selectedAccount ? (
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">Create</TabsTrigger>
                <TabsTrigger value="scheduled">
                  Scheduled
                  {posts.filter((p) => p.status === "scheduled").length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-0.5">
                      {posts.filter((p) => p.status === "scheduled").length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-4">
                <InstagramPostCreator
                  accountId={selectedAccount}
                  onPostNow={handlePostNow}
                  onSchedule={handleSchedule}
                  onGenerateCaption={handleGenerateCaption}
                  generatedCaption={generatedCaption}
                  isLoading={isLoading}
                  isGenerating={isGenerating}
                />
              </TabsContent>

              <TabsContent value="scheduled" className="space-y-4">
                <ScheduledPostsList
                  posts={posts}
                  isLoading={isLoadingPosts}
                  onRefresh={fetchPosts}
                  onEdit={handleEditCaption}
                  onDelete={handleDeletePost}
                  isDeleting={isLoading ? 1 : null}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-gray-500 mb-4 text-lg">
                Connect an Instagram account to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
