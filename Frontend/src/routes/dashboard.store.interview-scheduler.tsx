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
  FileText,
  Copy,
  ExternalLink,
  BellRing,
  ShoppingBag,
  CalendarCheck,
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
import {
  getStoreInterviews,
  createStoreInterview,
  updateStoreInterview,
  deleteStoreInterview,
  triggerStoreInterviewReminder,
  getStoreInterviewSlots,
  createStoreInterviewSlot,
  deleteStoreInterviewSlot,
  getStoreGoogleCalendarStatus,
  getStoreGoogleCalendarAuthUrl,
  disconnectStoreGoogleCalendar,
  callbackStoreGoogleCalendar,
  StoreInterview,
  StoreInterviewSlot,
} from "@/lib/storeApi";

export const Route = createFileRoute("/dashboard/store/interview-scheduler")({
  head: () => ({
    meta: [{ title: "Store ΓÇö Interview Scheduler ΓÇö Saadhyam AI" }],
  }),
  component: StoreInterviewSchedulerPage,
});

export function StoreInterviewSchedulerPage() {
  // Data states
  const [interviews, setInterviews] = useState<StoreInterview[]>([]);
  const [slots, setSlots] = useState<StoreInterviewSlot[]>([]);
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

  const [selectedInterview, setSelectedInterview] = useState<StoreInterview | null>(null);
  const [editForm, setEditForm] = useState({
    candidate_name: "",
    candidate_email: "",
    interviewer_name: "",
    job_role: "",
    interview_date: "",
    interview_time: "",
    meeting_link: "",
    interview_status: "scheduled" as StoreInterview["interview_status"],
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

  // Fetch interviews
  const fetchInterviews = async () => {
    setIsLoadingInterviews(true);
    try {
      const list = await getStoreInterviews();
      setInterviews(Array.isArray(list) ? list : []);
    } catch (error: any) {
      console.error("Failed to fetch interviews:", error);
      toast.error(error?.message || "Failed to load interviews.");
    } finally {
      setIsLoadingInterviews(false);
    }
  };

  // Fetch slots
  const fetchSlots = async () => {
    setIsLoadingSlots(true);
    try {
      const list = await getStoreInterviewSlots();
      setSlots(Array.isArray(list) ? list : []);
    } catch (error: any) {
      console.error("Failed to fetch interview slots:", error);
      toast.error(error?.message || "Failed to load interview slots.");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Check Google Calendar connection status
  const checkGoogleCalStatus = async () => {
    setIsCheckingGoogleCal(true);
    try {
      const res = await getStoreGoogleCalendarStatus();
      setIsGoogleCalConnected(!!res.connected);
    } catch (error) {
      console.error("Failed to check Google Calendar status:", error);
      setIsGoogleCalConnected(false);
    } finally {
      setIsCheckingGoogleCal(false);
    }
  };

  // Handle Google Calendar OAuth Connect
  const handleConnectGoogleCal = async () => {
    try {
      const res = await getStoreGoogleCalendarAuthUrl();
      if (res.auth_url) {
        window.location.href = res.auth_url;
      } else {
        toast.error("Could not generate Google Calendar authorization link.");
      }
    } catch (error: any) {
      console.error("Error connecting Google Calendar:", error);
      toast.error(error?.message || "Failed to initialize Google Calendar OAuth.");
    }
  };

  // Handle Google Calendar Disconnect
  const handleDisconnectGoogleCal = async () => {
    try {
      await disconnectStoreGoogleCalendar();
      setIsGoogleCalConnected(false);
      toast.success("Google Calendar disconnected successfully.");
    } catch (error: any) {
      console.error("Error disconnecting Google Calendar:", error);
      toast.error(error?.message || "Failed to disconnect Google Calendar.");
    }
  };

  // Detect OAuth callback code in URL on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");

    if (error) {
      toast.error(`Google Calendar Authorization Failed: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      const redirect_uri = window.location.origin + window.location.pathname;
      toast.loading("Verifying Google Calendar authorization...", { id: "gcal-oauth" });

      callbackStoreGoogleCalendar({ code, redirect_uri })
        .then((res) => {
          if (res.success) {
            toast.success("Google Calendar connected successfully! Google Meet links will now be generated automatically.", { id: "gcal-oauth", duration: 5000 });
            setIsGoogleCalConnected(true);
          } else {
            toast.error(res.message || "Failed to link Google Calendar.", { id: "gcal-oauth" });
          }
        })
        .catch((err: any) => {
          toast.error(err?.message || "Google Calendar authorization exchange failed.", { id: "gcal-oauth" });
        })
        .finally(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          checkGoogleCalStatus();
        });
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
    fetchSlots();
    checkGoogleCalStatus();
  }, []);

  // Handle Schedule Submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCandidateName = scheduleForm.candidate_name.trim();
    const trimmedInterviewerName = scheduleForm.interviewer_name.trim();
    const trimmedJobRole = scheduleForm.job_role.trim();

    if (!trimmedCandidateName || !trimmedInterviewerName || !trimmedJobRole || !scheduleForm.interview_date || !scheduleForm.interview_time) {
      toast.error("Please fill in Candidate Name, Role, Interviewer, Date, and Time.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createStoreInterview({
        candidate_name: trimmedCandidateName,
        candidate_email: scheduleForm.candidate_email.trim() || undefined,
        interviewer_name: trimmedInterviewerName,
        job_role: trimmedJobRole,
        interview_date: scheduleForm.interview_date,
        interview_time: scheduleForm.interview_time,
        meeting_link: scheduleForm.meeting_link.trim() || undefined,
        notes: scheduleForm.notes.trim() || undefined,
      });

      toast.success(
        isGoogleCalConnected
          ? `Interview scheduled! Google Calendar event created with Google Meet link & confirmation email sent.`
          : `Interview scheduled! Confirmation email sent with .ics calendar invite.`,
        { duration: 6000 }
      );
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
      const errMsg = error?.response?.data?.detail || error?.detail || error?.message || "";
      if (errMsg.toLowerCase().includes("reconnect") || errMsg.toLowerCase().includes("expired") || errMsg.includes("401") || errMsg.toLowerCase().includes("authentication")) {
        toast.error("Google Calendar connection expired. Please reconnect Google Calendar and try again.", { duration: 7000 });
        setIsGoogleCalConnected(false);
      } else if (errMsg.toLowerCase().includes("google meet") || errMsg.toLowerCase().includes("permission") || errMsg.toLowerCase().includes("conference")) {
        toast.error("Google Meet link could not be generated. Please check your Google account permissions.", { duration: 7000 });
      } else {
        toast.error(errMsg || "Failed to schedule interview.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (interview: StoreInterview) => {
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

  // Handle Edit/Reschedule Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;

    setIsSubmitting(true);
    try {
      const isDateOrTimeChanged =
        editForm.interview_date !== selectedInterview.interview_date ||
        editForm.interview_time !== selectedInterview.interview_time;

      await updateStoreInterview(selectedInterview.id, {
        candidate_name: editForm.candidate_name.trim(),
        candidate_email: editForm.candidate_email.trim() || undefined,
        interviewer_name: editForm.interviewer_name.trim(),
        job_role: editForm.job_role.trim(),
        interview_date: editForm.interview_date,
        interview_time: editForm.interview_time,
        meeting_link: editForm.meeting_link.trim() || undefined,
        interview_status: isDateOrTimeChanged ? "rescheduled" : editForm.interview_status,
        notes: editForm.notes.trim() || undefined,
      });

      toast.success(
        isDateOrTimeChanged
          ? "Interview rescheduled! Calendar event updated & reschedule email sent to candidate."
          : "Interview updated successfully!"
      );
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

  // Handle Delete/Cancel Interview
  const handleDeleteInterview = async (id: number, candidateName: string) => {
    if (!confirm(`Are you sure you want to cancel the interview for ${candidateName}?`)) {
      return;
    }
    try {
      await deleteStoreInterview(id);
      toast.success("Interview cancelled. Cancellation email and .ics notification dispatched.");
      fetchInterviews();
    } catch (error: any) {
      console.error("Failed to delete interview:", error);
      toast.error(error?.message || "Failed to cancel interview.");
    }
  };

  // Handle Manual Trigger of 10-Min Reminder
  const handleTriggerReminder = async (id: number, candidateName: string) => {
    try {
      toast.loading("Sending reminder email...", { id: `rem-${id}` });
      const res = await triggerStoreInterviewReminder(id);
      if (res.success) {
        toast.success(`Reminder sent to ${candidateName}!`, { id: `rem-${id}` });
        fetchInterviews();
      } else {
        toast.error(res.message || "Failed to send reminder.", { id: `rem-${id}` });
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to trigger reminder.", { id: `rem-${id}` });
    }
  };

  // Handle Create Slot
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotForm.slot_date || !slotForm.start_time || !slotForm.end_time) {
      toast.error("Please enter Date, Start Time, and End Time.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createStoreInterviewSlot({
        slot_date: slotForm.slot_date,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
      });
      toast.success("Interview slot added!");
      setSlotForm({ slot_date: "", start_time: "", end_time: "" });
      fetchSlots();
    } catch (error: any) {
      console.error("Failed to create slot:", error);
      toast.error(error?.message || "Failed to create slot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Slot
  const handleDeleteSlot = async (id: number) => {
    try {
      await deleteStoreInterviewSlot(id);
      toast.success("Slot deleted.");
      fetchSlots();
    } catch (error: any) {
      console.error("Failed to delete slot:", error);
      toast.error(error?.message || "Failed to delete slot.");
    }
  };

  // Copy Meeting Link
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Meeting link copied to clipboard!");
  };

  // Filtered Interviews
  const filteredInterviews = interviews.filter((item) => {
    const matchesStatus =
      statusFilter === "all" ? true : item.interview_status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      item.candidate_name?.toLowerCase().includes(query) ||
      item.candidate_email?.toLowerCase().includes(query) ||
      item.job_role?.toLowerCase().includes(query) ||
      item.interviewer_name?.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  // Calculate quick stats
  const scheduledCount = interviews.filter((i) => i.interview_status === "scheduled").length;
  const rescheduledCount = interviews.filter((i) => i.interview_status === "rescheduled").length;
  const completedCount = interviews.filter((i) => i.interview_status === "completed").length;
  const cancelledCount = interviews.filter((i) => i.interview_status === "cancelled").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/dashboard/store"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Saadhyam Store
        </Link>
      </div>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">≡ƒôà</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Interview Scheduler</h1>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                  <ShoppingBag className="h-3 w-3 mr-1" />
                  Saadhyam Store Solution
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Automated candidate interview scheduling with Google Calendar sync, automatic Google Meet generation, .ics invitations, rescheduling, and automated reminder alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSlotOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Clock className="h-4 w-4" />
            Availability Slots
            {slots.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                {slots.length}
              </Badge>
            )}
          </Button>

          <Button
            size="sm"
            onClick={() => setIsScheduleOpen(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Schedule Interview
          </Button>
        </div>
      </div>

      {/* Google Calendar Connection Status Banner */}
      <Card className="border-border/60 bg-gradient-to-r from-background via-muted/20 to-background shadow-xs">
        <CardContent className="py-4 px-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Google Calendar & Google Meet Integration</h3>
                  {isCheckingGoogleCal ? (
                    <Badge variant="outline" className="text-xs">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Checking...
                    </Badge>
                  ) : isGoogleCalConnected ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected & Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10 text-xs">
                      Not Connected
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isGoogleCalConnected
                    ? "Real Google Calendar events & automatic Google Meet video links are generated instantly on scheduling and updated on rescheduling."
                    : "Connect your Google Calendar account to enable automatic Google Meet video meeting link generation and two-way calendar sync."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isGoogleCalConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectGoogleCal}
                  className="text-xs text-destructive hover:bg-destructive/10"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnectGoogleCal}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Video className="h-3.5 w-3.5 mr-1.5" />
                  Connect Google Calendar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Scheduled</p>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{scheduledCount}</h3>
            </div>
            <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Rescheduled</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{rescheduledCount}</h3>
            </div>
            <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-600">
              <RefreshCw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Completed</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{completedCount}</h3>
            </div>
            <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Bookings</p>
              <h3 className="text-2xl font-bold mt-1">{interviews.length}</h3>
            </div>
            <div className="p-2.5 rounded-full bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">Scheduled Interviews</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Manage upcoming candidate interviews, send reminders, reschedule slots, and inspect video links.
              </CardDescription>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search candidate, role, interviewer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] text-xs h-8">
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

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchInterviews();
                  fetchSlots();
                }}
                className="h-8 px-2.5"
                title="Refresh Interviews"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingInterviews ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingInterviews ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-xs">Loading scheduled interviews...</p>
            </div>
          ) : filteredInterviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground px-4 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-sm font-semibold text-foreground">No interviews found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {searchQuery || statusFilter !== "all"
                  ? "No interviews match your active filter criteria."
                  : "No candidate interviews scheduled yet. Click 'Schedule Interview' to book your first candidate."}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button
                  size="sm"
                  onClick={() => setIsScheduleOpen(true)}
                  className="mt-4 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Schedule Interview
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/40">
                    <TableHead className="text-xs font-semibold">Candidate</TableHead>
                    <TableHead className="text-xs font-semibold">Role & Interviewer</TableHead>
                    <TableHead className="text-xs font-semibold">Date & Time</TableHead>
                    <TableHead className="text-xs font-semibold">Meeting Link</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInterviews.map((interview) => (
                    <TableRow key={interview.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {interview.candidate_name ? interview.candidate_name.charAt(0).toUpperCase() : "C"}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">{interview.candidate_name}</p>
                            {interview.candidate_email && (
                              <p className="text-[11px] text-muted-foreground">{interview.candidate_email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <p className="text-xs font-medium">{interview.job_role}</p>
                        <p className="text-[11px] text-muted-foreground">Interviewer: {interview.interviewer_name}</p>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {interview.interview_date}
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {interview.interview_time}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        {interview.meeting_link ? (
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="h-7 px-2 text-[11px] bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20"
                            >
                              <a href={interview.meeting_link} target="_blank" rel="noreferrer">
                                <Video className="h-3 w-3 mr-1" />
                                Join
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(interview.meeting_link!)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Copy Meeting Link"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">No link</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {interview.interview_status === "scheduled" && (
                          <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/20 text-[10px]">
                            Scheduled
                          </Badge>
                        )}
                        {interview.interview_status === "rescheduled" && (
                          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 text-[10px]">
                            Rescheduled
                          </Badge>
                        )}
                        {interview.interview_status === "completed" && (
                          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 text-[10px]">
                            Completed
                          </Badge>
                        )}
                        {interview.interview_status === "cancelled" && (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            Cancelled
                          </Badge>
                        )}
                        {interview.interview_status === "no_show" && (
                          <Badge variant="destructive" className="text-[10px]">
                            No Show
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {interview.candidate_email && interview.interview_status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTriggerReminder(interview.id, interview.candidate_name)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-600"
                              title="Send 10-Minute Reminder Email"
                            >
                              <BellRing className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(interview)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Edit / Reschedule"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>

                          {interview.interview_status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteInterview(interview.id, interview.candidate_name)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              title="Cancel Interview"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
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

      {/* Schedule Interview Modal */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleScheduleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Schedule Candidate Interview
              </DialogTitle>
              <DialogDescription className="text-xs">
                Enter candidate and interview details. An automated calendar invite (.ics) and Google Meet video link will be provisioned.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="candidate_name" className="text-xs">Candidate Name *</Label>
                  <Input
                    id="candidate_name"
                    required
                    placeholder="e.g. Priya Patel"
                    value={scheduleForm.candidate_name}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, candidate_name: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="candidate_email" className="text-xs">Candidate Email</Label>
                  <Input
                    id="candidate_email"
                    type="email"
                    placeholder="priya@example.com"
                    value={scheduleForm.candidate_email}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, candidate_email: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="job_role" className="text-xs">Job Position / Role *</Label>
                  <Input
                    id="job_role"
                    required
                    placeholder="e.g. Senior Frontend Architect"
                    value={scheduleForm.job_role}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, job_role: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="interviewer_name" className="text-xs">Interviewer Name *</Label>
                  <Input
                    id="interviewer_name"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={scheduleForm.interviewer_name}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, interviewer_name: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="interview_date" className="text-xs">Date *</Label>
                  <Input
                    id="interview_date"
                    type="date"
                    required
                    value={scheduleForm.interview_date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, interview_date: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="interview_time" className="text-xs">Time *</Label>
                  <Input
                    id="interview_time"
                    type="time"
                    required
                    value={scheduleForm.interview_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, interview_time: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="meeting_link" className="text-xs">
                  Meeting Link (Optional)
                </Label>
                <Input
                  id="meeting_link"
                  placeholder={
                    isGoogleCalConnected
                      ? "Leave empty to generate real Google Meet link automatically"
                      : "https://meet.google.com/... or Zoom link"
                  }
                  value={scheduleForm.meeting_link}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meeting_link: e.target.value })}
                  className="text-xs h-8"
                />
                {isGoogleCalConnected && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="h-3 w-3" />
                    Google Calendar active ΓÇö Real Google Meet link will be generated automatically.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="notes" className="text-xs">Notes / Focus Areas</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder="e.g. Focus on System Design, Distributed Systems, and React Architecture."
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  "Confirm & Schedule"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit / Reschedule Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-primary" />
                Reschedule / Edit Interview
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update date, time, or status. Changing the date/time triggers an automated reschedule email and calendar update.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit_candidate_name" className="text-xs">Candidate Name *</Label>
                  <Input
                    id="edit_candidate_name"
                    required
                    value={editForm.candidate_name}
                    onChange={(e) => setEditForm({ ...editForm, candidate_name: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit_candidate_email" className="text-xs">Candidate Email</Label>
                  <Input
                    id="edit_candidate_email"
                    type="email"
                    value={editForm.candidate_email}
                    onChange={(e) => setEditForm({ ...editForm, candidate_email: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit_job_role" className="text-xs">Job Role *</Label>
                  <Input
                    id="edit_job_role"
                    required
                    value={editForm.job_role}
                    onChange={(e) => setEditForm({ ...editForm, job_role: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit_interviewer_name" className="text-xs">Interviewer *</Label>
                  <Input
                    id="edit_interviewer_name"
                    required
                    value={editForm.interviewer_name}
                    onChange={(e) => setEditForm({ ...editForm, interviewer_name: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit_interview_date" className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    New Date *
                  </Label>
                  <Input
                    id="edit_interview_date"
                    type="date"
                    required
                    value={editForm.interview_date}
                    onChange={(e) => setEditForm({ ...editForm, interview_date: e.target.value })}
                    className="text-xs h-8 border-amber-500/40"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit_interview_time" className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    New Time *
                  </Label>
                  <Input
                    id="edit_interview_time"
                    type="time"
                    required
                    value={editForm.interview_time}
                    onChange={(e) => setEditForm({ ...editForm, interview_time: e.target.value })}
                    className="text-xs h-8 border-amber-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit_meeting_link" className="text-xs">Meeting Link</Label>
                  <Input
                    id="edit_meeting_link"
                    value={editForm.meeting_link}
                    onChange={(e) => setEditForm({ ...editForm, meeting_link: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit_status" className="text-xs">Status</Label>
                  <Select
                    value={editForm.interview_status}
                    onValueChange={(val: any) => setEditForm({ ...editForm, interview_status: val })}
                  >
                    <SelectTrigger id="edit_status" className="text-xs h-8">
                      <SelectValue />
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
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit_notes" className="text-xs">Notes</Label>
                <Textarea
                  id="edit_notes"
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save & Update"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Availability Slots Modal */}
      <Dialog open={isSlotOpen} onOpenChange={setIsSlotOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Manage Availability Slots
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define standard interview time windows and availability slots.
            </DialogDescription>
          </DialogHeader>

          {/* Add Slot Form */}
          <form onSubmit={handleCreateSlot} className="border-b border-border pb-4 pt-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px]">Date *</Label>
                <Input
                  type="date"
                  required
                  value={slotForm.slot_date}
                  onChange={(e) => setSlotForm({ ...slotForm, slot_date: e.target.value })}
                  className="text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Start Time *</Label>
                <Input
                  type="time"
                  required
                  value={slotForm.start_time}
                  onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                  className="text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">End Time *</Label>
                <Input
                  type="time"
                  required
                  value={slotForm.end_time}
                  onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                  className="text-xs h-8"
                />
              </div>
            </div>
            <div className="mt-2.5 flex justify-end">
              <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs h-8">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Slot
              </Button>
            </div>
          </form>

          {/* Slot List */}
          <div className="max-h-60 overflow-y-auto pt-2">
            {isLoadingSlots ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                Loading slots...
              </div>
            ) : slots.length === 0 ? (
              <p className="text-xs text-center py-6 text-muted-foreground">No availability slots configured.</p>
            ) : (
              <div className="space-y-2">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{slot.slot_date}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {slot.start_time} ΓÇö {slot.end_time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {slot.is_booked ? (
                        <Badge variant="secondary" className="text-[10px]">Booked</Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Available</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSlotOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}