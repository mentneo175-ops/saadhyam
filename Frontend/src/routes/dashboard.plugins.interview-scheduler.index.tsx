import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  User,
  Plus,
  ArrowLeft,
  Info,
  Sparkles,
  Briefcase,
  Loader2,
  Trash2,
  Edit3,
  Video,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  X,
  Mail,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

export const Route = createFileRoute("/dashboard/plugins/interview-scheduler/")({
  head: () => ({
    meta: [{ title: "Interview Scheduler — Saadhyam AI" }],
  }),
  component: InterviewSchedulerPage,
});

export interface Interview {
  id: number;
  user_id: number;
  candidate_name: string;
  candidate_email?: string | null;
  interviewer_name: string;
  job_role: string;
  interview_date: string;
  interview_time: string;
  meeting_link?: string | null;
  interview_status: "scheduled" | "completed" | "cancelled" | "rescheduled" | "no_show";
  notes?: string | null;
  confirmation_sent?: boolean;
  reminder_sent?: boolean;
  created_at: string;
  updated_at: string;
}

export interface InterviewSlot {
  id: number;
  user_id: number;
  interview_id?: number | null;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
}

function InterviewSchedulerPage() {
  // Data states
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal states
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSlotOpen, setIsSlotOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    candidate_name: "",
    candidate_email: "",
    interviewer_name: "",
    job_role: "",
    interview_date: "",
    interview_time: "",
    meeting_link: "",
    notes: "",
  });

  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [editForm, setEditForm] = useState({
    candidate_name: "",
    candidate_email: "",
    interviewer_name: "",
    job_role: "",
    interview_date: "",
    interview_time: "",
    meeting_link: "",
    interview_status: "scheduled" as Interview["interview_status"],
    notes: "",
  });

  const [slotForm, setSlotForm] = useState({
    slot_date: "",
    start_time: "",
    end_time: "",
  });

  // Google Calendar Connection states
  const [isGoogleCalConnected, setIsGoogleCalConnected] = useState<boolean>(false);
  const [isCheckingGoogleCal, setIsCheckingGoogleCal] = useState<boolean>(true);

  // Fetch interviews from API
  const fetchInterviews = async () => {
    setIsLoadingInterviews(true);
    try {
      const res = await apiClient.get("/api/interview-scheduler/interviews");
      const list = res.interviews || res.data || res || [];
      setInterviews(Array.isArray(list) ? list : []);
    } catch (error: any) {
      console.error("Failed to fetch interviews:", error);
      toast.error(error?.message || "Failed to load interviews.");
    } finally {
      setIsLoadingInterviews(false);
    }
  };

  // Fetch available slots from API
  const fetchSlots = async () => {
    setIsLoadingSlots(true);
    try {
      const res = await apiClient.get("/api/interview-scheduler/slots");
      setSlots(Array.isArray(res) ? res : []);
    } catch (error: any) {
      console.error("Failed to fetch interview slots:", error);
      toast.error(error?.message || "Failed to load interview slots.");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Check Google Calendar OAuth Status
  const checkGoogleCalStatus = async () => {
    setIsCheckingGoogleCal(true);
    try {
      const res: any = await apiClient.get("/api/interview-scheduler/google-calendar/status");
      setIsGoogleCalConnected(Boolean(res?.connected));
    } catch (error) {
      setIsGoogleCalConnected(false);
    } finally {
      setIsCheckingGoogleCal(false);
    }
  };

  // Initiate Google Calendar OAuth Connect
  const handleConnectGoogleCalendar = async () => {
    try {
      const res: any = await apiClient.get("/api/interview-scheduler/google-calendar/auth-url");
      if (res?.auth_url) {
        window.location.href = res.auth_url;
      }
    } catch (error: any) {
      console.error("Error getting Google Calendar auth URL:", error);
      toast.error("Google Calendar connection failed. Please check your Google Calendar configuration.");
    }
  };

  // Disconnect Google Calendar
  const handleDisconnectGoogleCalendar = async () => {
    try {
      await apiClient.delete("/api/interview-scheduler/google-calendar/disconnect");
      setIsGoogleCalConnected(false);
      toast.success("Google Calendar disconnected.");
    } catch (error: any) {
      toast.error("Failed to disconnect Google Calendar.");
    }
  };

  useEffect(() => {
    fetchInterviews();
    fetchSlots();
    checkGoogleCalStatus();

    // Handle OAuth Callback status & error query parameters returned from redirect
    const urlParams = new URLSearchParams(window.location.search);
    const gcalStatus = urlParams.get("google_calendar");
    const errorMsg = urlParams.get("message");
    const code = urlParams.get("code");

    if (gcalStatus === "connected") {
      toast.success("Google Calendar connected successfully! Real Google Meet links will now be generated automatically.");
      setIsGoogleCalConnected(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (gcalStatus === "error") {
      toast.error(errorMsg || "Google Calendar connection failed. Please check your Google Calendar configuration.");
      setIsGoogleCalConnected(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code) {
      // Fallback direct POST code handling
      const cleanUrl = window.location.origin + window.location.pathname;
      apiClient.post("/api/interview-scheduler/google-calendar/callback", {
        code,
        redirect_uri: cleanUrl
      }).then(() => {
        toast.success("Google Calendar connected successfully! Real Google Meet links will now be generated automatically.");
        setIsGoogleCalConnected(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }).catch((err) => {
        console.error("OAuth callback error:", err);
        toast.error("Google Calendar connection failed. Please check your Google Calendar configuration.");
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }, []);


  // Permissive email validation helper permitting dots and standard email formats
  const isValidEmailAddress = (email: string): boolean => {
    const trimmed = email.trim();
    if (!trimmed) return true; // Optional field: empty candidate_email is valid
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  };

  // Handle Schedule Interview submission (POST)
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCandidateName = scheduleForm.candidate_name.trim();
    const trimmedInterviewerName = scheduleForm.interviewer_name.trim();
    const trimmedJobRole = scheduleForm.job_role.trim();
    const trimmedDate = scheduleForm.interview_date.trim();
    const trimmedTime = scheduleForm.interview_time.trim();
    const trimmedEmail = scheduleForm.candidate_email.trim();

    if (!trimmedCandidateName || !trimmedInterviewerName || !trimmedJobRole || !trimmedDate || !trimmedTime) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (trimmedEmail && !isValidEmailAddress(trimmedEmail)) {
      toast.error("Please enter a valid candidate email address (e.g. name@example.com).");
      return;
    }

    const payload = {
      ...scheduleForm,
      candidate_name: trimmedCandidateName,
      candidate_email: trimmedEmail || null,
      interviewer_name: trimmedInterviewerName,
      job_role: trimmedJobRole,
      interview_date: trimmedDate,
      interview_time: trimmedTime,
      meeting_link: scheduleForm.meeting_link.trim(),
      notes: scheduleForm.notes.trim(),
    };

    setIsSubmitting(true);
    try {
      const res: any = await apiClient.post("/api/interview-scheduler/interviews", payload);
      const isConfirmationSent = res?.confirmation_sent;
      const meetingLink = res?.meeting_link;

      if (!isGoogleCalConnected && !meetingLink) {
        toast.info(
          `Interview scheduled for ${trimmedCandidateName}! Note: Google Calendar is not connected, so no Google Meet link was generated. Connect Google Calendar to enable real Google Meet links.`,
          { duration: 7000 }
        );
      } else if (isConfirmationSent) {
        toast.success(
          `Interview scheduled! Meeting link created, confirmation email & .ics invitation sent to ${trimmedEmail || "candidate"}. 10-min reminder scheduled.`,
          { duration: 6000 }
        );
      } else if (trimmedEmail) {
        toast.info(
          `Interview scheduled & meeting link created (${meetingLink ? "generated" : "saved"}). ⚠️ Email confirmation skipped (configure Email Marketing plugin with SMTP to enable auto-send).`,
          { duration: 7000 }
        );
      } else {
        toast.success(
          `Interview scheduled for ${trimmedCandidateName}! Meeting link: ${meetingLink || "None"}`,
          { duration: 5000 }
        );
      }


      setIsScheduleOpen(false);
      setScheduleForm({
        candidate_name: "",
        candidate_email: "",
        interviewer_name: "",
        job_role: "",
        interview_date: "",
        interview_time: "",
        meeting_link: "",
        notes: "",
      });
      fetchInterviews();
    } catch (error: any) {
      console.error("Failed to schedule interview:", error);
      toast.error(error?.message || "Failed to schedule interview.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (interview: Interview) => {
    setSelectedInterview(interview);
    setEditForm({
      candidate_name: interview.candidate_name || "",
      candidate_email: interview.candidate_email || "",
      interviewer_name: interview.interviewer_name || "",
      job_role: interview.job_role || "",
      interview_date: interview.interview_date || "",
      interview_time: interview.interview_time || "",
      meeting_link: interview.meeting_link || "",
      interview_status: interview.interview_status || "scheduled",
      notes: interview.notes || "",
    });
    setIsEditOpen(true);
  };

  // Handle Edit Submission (PUT)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;

    const trimmedEmail = editForm.candidate_email.trim();
    if (trimmedEmail && !isValidEmailAddress(trimmedEmail)) {
      toast.error("Please enter a valid candidate email address.");
      return;
    }

    const payload = {
      ...editForm,
      candidate_name: editForm.candidate_name.trim(),
      candidate_email: trimmedEmail || null,
      interviewer_name: editForm.interviewer_name.trim(),
      job_role: editForm.job_role.trim(),
      interview_date: editForm.interview_date.trim(),
      interview_time: editForm.interview_time.trim(),
      meeting_link: editForm.meeting_link.trim(),
      notes: editForm.notes.trim(),
    };

    setIsSubmitting(true);
    try {
      await apiClient.put(`/api/interview-scheduler/interviews/${selectedInterview.id}`, payload);
      toast.success("Interview updated successfully!");
      setIsEditOpen(false);
      setSelectedInterview(null);
      fetchInterviews();
    } catch (error: any) {
      console.error("Failed to update interview:", error);
      toast.error(error?.message || "Failed to update interview.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Cancel Interview (DELETE)
  const handleCancelInterview = async (interview: Interview) => {
    if (!confirm(`Are you sure you want to cancel the interview for ${interview.candidate_name}?`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/interview-scheduler/interviews/${interview.id}`);
      toast.success(`Interview for ${interview.candidate_name} has been cancelled.`);
      fetchInterviews();
    } catch (error: any) {
      console.error("Failed to cancel interview:", error);
      toast.error(error?.message || "Failed to cancel interview.");
    }
  };

  // Handle Add Slot Submission (POST)
  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotForm.slot_date || !slotForm.start_time || !slotForm.end_time) {
      toast.error("Please fill in date, start time, and end time.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/api/interview-scheduler/slots", slotForm);
      toast.success("Time slot added successfully!");
      setIsSlotOpen(false);
      setSlotForm({ slot_date: "", start_time: "", end_time: "" });
      fetchSlots();
    } catch (error: any) {
      console.error("Failed to add time slot:", error);
      toast.error(error?.message || "Failed to add time slot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200">Cancelled</Badge>;
      case "rescheduled":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200">Rescheduled</Badge>;
      case "no_show":
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200">No Show</Badge>;
    }
  };

  // Filtered interviews list
  const filteredInterviews = interviews.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.interview_status?.toLowerCase() === statusFilter.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      item.candidate_name?.toLowerCase().includes(query) ||
      item.interviewer_name?.toLowerCase().includes(query) ||
      item.job_role?.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard/plugins">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Marketplace
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">📅 Interview Scheduler</h1>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                AI Powered
              </Badge>
              <Badge variant="outline">HR Category</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Automate interview scheduling with calendar integration, candidate notifications, and interviewer reminders.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsScheduleOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Schedule Interview
          </Button>
        </div>
      </div>

      {/* Google Calendar Connection Status Banner */}
      <Card className={isGoogleCalConnected ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20" : "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20"}>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full shrink-0 ${isGoogleCalConnected ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"}`}>
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">
                  {isGoogleCalConnected ? "Google Calendar Connected" : "Google Calendar Not Connected"}
                </h4>
                {isGoogleCalConnected ? (
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Real Google Meet Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-100 dark:bg-amber-950 dark:text-amber-300">
                    Optional
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isGoogleCalConnected
                  ? "Automatic Google Calendar event & real Google Meet link creation is active for all scheduled interviews."
                  : "Connect Google Calendar to automatically create real Google Meet links for every scheduled interview."}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            {isGoogleCalConnected ? (
              <Button variant="outline" size="sm" onClick={handleDisconnectGoogleCalendar} className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50">
                Disconnect
              </Button>
            ) : (
              <Button size="sm" onClick={handleConnectGoogleCalendar} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Video className="h-4 w-4" />
                Connect Google Calendar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20">
        <CardContent className="flex items-start gap-4 p-4">
          <Info className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              Live HR Interview Management
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Schedule, update, and track interviews in real-time. Use the AI Voice Assistant or commands to trigger scheduling actions automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interviews.filter((i) => i.interview_status === "scheduled").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {interviews.length} total interview record(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Time Slots</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {slots.filter((s) => !s.is_booked).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {slots.length} total slot(s) configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Interviews</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interviews.filter((i) => i.interview_status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">Candidate evaluations finalized</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Interviews Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Scheduled Interviews
              </CardTitle>
              <CardDescription>
                View, filter, edit, and manage candidate interview appointments.
              </CardDescription>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search candidate, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="ghost" size="icon" onClick={() => { fetchInterviews(); fetchSlots(); }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingInterviews ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading interviews...</p>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/30">
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No Interviews Found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                {interviews.length === 0
                  ? "Your interview pipeline is empty. Schedule your first interview to get started."
                  : "No interviews match the selected status filter or search query."}
              </p>
              <Button onClick={() => setIsScheduleOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule Interview
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Interviewer</TableHead>
                    <TableHead>Job Role</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInterviews.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold text-foreground">{item.candidate_name}</div>
                          {item.candidate_email && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {item.candidate_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.interviewer_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.job_role}</Badge>
                      </TableCell>
                      <TableCell>{item.interview_date}</TableCell>
                      <TableCell>{item.interview_time}</TableCell>
                      <TableCell>{renderStatusBadge(item.interview_status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.meeting_link && (
                            <a href={item.meeting_link} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" title="Join Meeting">
                                <Video className="h-4 w-4 text-blue-600" />
                              </Button>
                            </a>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(item)} title="Edit Interview">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleCancelInterview(item)} title="Cancel Interview">
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Slots Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Available Time Slots
              </CardTitle>
              <CardDescription>
                Configure interviewer time slots available for candidate bookings.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsSlotOpen(true)} className="gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add Time Slot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSlots ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">No available slots configured yet.</p>
              <Button size="sm" variant="outline" onClick={() => setIsSlotOpen(true)} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                Configure First Slot
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className={`p-3 rounded-lg border flex flex-col justify-between space-y-2 ${
                    slot.is_booked ? "bg-muted/50 border-muted" : "bg-card border-border shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {slot.slot_date}
                    </span>
                    {slot.is_booked ? (
                      <Badge variant="secondary" className="text-xs">Booked</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 bg-emerald-50">Open</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {slot.start_time} - {slot.end_time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal 1: Schedule Interview (POST) */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule New Interview</DialogTitle>
            <DialogDescription>
              Enter candidate and interviewer details to create a new interview.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleScheduleSubmit} noValidate className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="candidate_name">Candidate Name *</Label>
                <Input
                  id="candidate_name"
                  required
                  placeholder="Rahul Sharma"
                  value={scheduleForm.candidate_name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, candidate_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="candidate_email">Candidate Email</Label>
                <Input
                  id="candidate_email"
                  type="email"
                  placeholder="rahul@example.com"
                  value={scheduleForm.candidate_email}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, candidate_email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interviewer_name">Interviewer Name *</Label>
                <Input
                  id="interviewer_name"
                  required
                  placeholder="Priya Nair"
                  value={scheduleForm.interviewer_name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, interviewer_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_role">Job Role *</Label>
                <Input
                  id="job_role"
                  required
                  placeholder="Backend Developer"
                  value={scheduleForm.job_role}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, job_role: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interview_date">Date *</Label>
                <Input
                  id="interview_date"
                  required
                  type="date"
                  value={scheduleForm.interview_date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, interview_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interview_time">Time *</Label>
                <Input
                  id="interview_time"
                  required
                  type="time"
                  value={scheduleForm.interview_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, interview_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting_link">Meeting Link</Label>
              <Input
                id="meeting_link"
                placeholder="https://meet.google.com/xyz-abc"
                value={scheduleForm.meeting_link}
                onChange={(e) => setScheduleForm({ ...scheduleForm, meeting_link: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Round 1 Technical Interview focus areas..."
                rows={2}
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsScheduleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  "Schedule Interview"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Edit Interview (PUT) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Interview Appointment</DialogTitle>
            <DialogDescription>
              Update candidate, interviewer, status, or date details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} noValidate className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_candidate_name">Candidate Name</Label>
                <Input
                  id="edit_candidate_name"
                  value={editForm.candidate_name}
                  onChange={(e) => setEditForm({ ...editForm, candidate_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_candidate_email">Candidate Email</Label>
                <Input
                  id="edit_candidate_email"
                  type="email"
                  value={editForm.candidate_email}
                  onChange={(e) => setEditForm({ ...editForm, candidate_email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_interviewer_name">Interviewer Name</Label>
                <Input
                  id="edit_interviewer_name"
                  value={editForm.interviewer_name}
                  onChange={(e) => setEditForm({ ...editForm, interviewer_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_job_role">Job Role</Label>
                <Input
                  id="edit_job_role"
                  value={editForm.job_role}
                  onChange={(e) => setEditForm({ ...editForm, job_role: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_interview_date">Date</Label>
                <Input
                  id="edit_interview_date"
                  value={editForm.interview_date}
                  onChange={(e) => setEditForm({ ...editForm, interview_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_interview_time">Time</Label>
                <Input
                  id="edit_interview_time"
                  value={editForm.interview_time}
                  onChange={(e) => setEditForm({ ...editForm, interview_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_status">Status</Label>
              <Select
                value={editForm.interview_status}
                onValueChange={(val) => setEditForm({ ...editForm, interview_status: val as Interview["interview_status"] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_meeting_link">Meeting Link</Label>
              <Input
                id="edit_meeting_link"
                value={editForm.meeting_link}
                onChange={(e) => setEditForm({ ...editForm, meeting_link: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Add Time Slot (POST) */}
      <Dialog open={isSlotOpen} onOpenChange={setIsSlotOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Available Time Slot</DialogTitle>
            <DialogDescription>
              Specify date and time bounds for candidate bookings.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSlotSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="slot_date">Slot Date *</Label>
              <Input
                id="slot_date"
                type="date"
                required
                value={slotForm.slot_date}
                onChange={(e) => setSlotForm({ ...slotForm, slot_date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="time"
                  required
                  value={slotForm.start_time}
                  onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  type="time"
                  required
                  value={slotForm.end_time}
                  onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSlotOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Slot"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
