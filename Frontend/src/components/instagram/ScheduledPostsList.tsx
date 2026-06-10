import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, CheckCircle2, AlertCircle, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";

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

interface ScheduledPostsListProps {
  posts: ScheduledPost[];
  isLoading?: boolean;
  onRefresh: () => void;
  onEdit: (postId: number, newCaption: string) => void;
  onDelete: (postId: number) => void;
  isDeleting?: number | null;
}

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending", icon: Clock },
  scheduled: { color: "bg-blue-100 text-blue-800", label: "Scheduled", icon: Clock },
  posted: { color: "bg-green-100 text-green-800", label: "Posted", icon: CheckCircle2 },
  failed: { color: "bg-red-100 text-red-800", label: "Failed", icon: AlertCircle },
};

export const ScheduledPostsList: React.FC<ScheduledPostsListProps> = ({
  posts,
  isLoading = false,
  onRefresh,
  onEdit,
  onDelete,
  isDeleting = null,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState("");

  const handleEditClick = (post: ScheduledPost) => {
    setEditingId(post.id);
    setEditCaption(post.caption);
  };

  const handleSaveEdit = (postId: number) => {
    onEdit(postId, editCaption);
    setEditingId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Scheduled Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-500 mb-4">No scheduled posts yet</p>
            <p className="text-sm text-gray-400">Create a post and schedule it to see it here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Scheduled Posts ({posts.length})
          </CardTitle>
          <CardDescription>Manage your scheduled Instagram posts</CardDescription>
        </div>
        <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const StatusIcon = statusConfig[post.status].icon;
            const isEditing = editingId === post.id;

            return (
              <div
                key={post.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow dark:border-slate-800"
              >
                {/* Image */}
                <div className="relative w-full pt-[100%] bg-gray-100 overflow-hidden dark:bg-slate-800">
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <Badge className={`absolute top-2 right-2 ${statusConfig[post.status].color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig[post.status].label}
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Caption */}
                  <div>
                    {isEditing ? (
                      <textarea
                        className="w-full p-2 border border-gray-300 rounded text-sm resize-none dark:border-slate-700"
                        rows={3}
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        disabled={post.status === "posted" || post.status === "failed"}
                      />
                    ) : (
                      <p className="text-sm text-gray-700 line-clamp-3 dark:text-slate-300">
                        {post.caption || "No caption"}
                      </p>
                    )}
                  </div>

                  {/* AI Badge */}
                  {post.ai_generated && (
                    <Badge variant="secondary" className="text-xs w-fit">
                      ✨ AI Generated
                    </Badge>
                  )}

                  {/* Date/Time */}
                  <div className="text-xs text-gray-600 space-y-1">
                    {post.scheduled_time && (
                      <p>
                        <span className="font-semibold">Scheduled:</span>{" "}
                        {format(new Date(post.scheduled_time), "PPp")}
                      </p>
                    )}
                    {post.posted_time && (
                      <p>
                        <span className="font-semibold">Posted:</span>{" "}
                        {format(new Date(post.posted_time), "PPp")}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Created:</span>{" "}
                      {format(new Date(post.created_at), "PPp")}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSaveEdit(post.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          disabled={post.status === "posted"}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        {post.status !== "posted" && post.status !== "failed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(post)}
                            className="flex-1"
                            disabled={isDeleting === post.id}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={
                                post.status === "posted" ||
                                post.status === "failed" ||
                                isDeleting === post.id
                              }
                              className="flex-1"
                            >
                              {isDeleting === post.id && (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              )}
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this scheduled post. This action cannot
                              be undone.
                            </AlertDialogDescription>
                            <div className="flex justify-end gap-2">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(post.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
