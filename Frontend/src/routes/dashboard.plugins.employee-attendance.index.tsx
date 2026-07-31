import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Download,
  Trash2,
  Save,
  Clock,
  Info,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Users,
  Calendar,
  Settings,
  UserCheck,
  TrendingUp,
  FileText,
  AlertCircle,
  Upload,
  Database,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/dashboard/plugins/employee-attendance/")({
  head: () => ({
    meta: [{ title: "Employee Attendance Wizard — Saadhyam AI" }],
  }),
  component: EmployeeAttendancePage,
});

interface AttendanceConfig {
  companyName: string;
  defaultShiftHours: number;
  workWeekDays: string;
  gracePeriod: number;
  overtimeRate: number;
  captureMethod: string;
  overtimeCalculation: boolean;
}

interface AttendanceLog {
  id: string;
  employeeName: string;
  department: string;
  date: string;
  clockIn: string;
  clockOut: string;
  totalHours: number;
  overtimeHours: number;
  status: "Present" | "Absent" | "Late" | "On Leave";
}

interface MasterEmployee {
  employeeId: string;
  employeeName: string;
  department: string;
  designation?: string;
  email?: string;
  phone?: string;
  shift?: string;
  status: string;
}

interface Employee {
  id: string;
  name: string;
  department: string;
  status: "Present" | "Absent" | "Late" | "On Leave";
  clockIn: string;
}

interface ParsedEmployeeRow {
  [key: string]: any;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  employees: Omit<MasterEmployee, "status">[];
}

const DEFAULT_LOGS: AttendanceLog[] = [
  {
    id: "log-1",
    employeeName: "Aarav Sharma",
    department: "Engineering",
    date: "2026-07-30",
    clockIn: "09:05 AM",
    clockOut: "05:30 PM",
    totalHours: 8.4,
    overtimeHours: 0.4,
    status: "Present",
  },
  {
    id: "log-2",
    employeeName: "Priya Patel",
    department: "Marketing",
    date: "2026-07-30",
    clockIn: "09:20 AM",
    clockOut: "05:00 PM",
    totalHours: 7.6,
    overtimeHours: 0.0,
    status: "Late",
  },
  {
    id: "log-3",
    employeeName: "Vikram Singh",
    department: "Sales",
    date: "2026-07-30",
    clockIn: "08:55 AM",
    clockOut: "06:15 PM",
    totalHours: 9.3,
    overtimeHours: 1.3,
    status: "Present",
  },
];

// Reusable validator function
export function validateAndMapEmployees(rows: ParsedEmployeeRow[]): ValidationResult {
  const errors: string[] = [];
  const employees: Omit<MasterEmployee, "status">[] = [];

  if (!rows || rows.length === 0) {
    return { isValid: false, errors: ["The file is empty or contains no records."], employees: [] };
  }

  const headers = Object.keys(rows[0]);

  const idHeader = headers.find(h => ["employee id", "employeeid", "id", "empid"].includes(h.trim().toLowerCase()));
  const nameHeader = headers.find(h => ["employee name", "employeename", "name", "empname"].includes(h.trim().toLowerCase()));
  const deptHeader = headers.find(h => ["department", "dept"].includes(h.trim().toLowerCase()));

  const designationHeader = headers.find(h => ["designation", "role", "title", "job title"].includes(h.trim().toLowerCase()));
  const emailHeader = headers.find(h => ["email", "email address", "emailaddress", "mail"].includes(h.trim().toLowerCase()));
  const phoneHeader = headers.find(h => ["phone", "phone number", "phonenumber", "mobile", "contact"].includes(h.trim().toLowerCase()));
  const shiftHeader = headers.find(h => ["shift", "shift name", "shiftname", "working hours"].includes(h.trim().toLowerCase()));

  if (!idHeader) errors.push("Missing required column: 'Employee ID'");
  if (!nameHeader) errors.push("Missing required column: 'Employee Name'");
  if (!deptHeader) errors.push("Missing required column: 'Department'");

  if (errors.length > 0) {
    return { isValid: false, errors, employees: [] };
  }

  rows.forEach((row, idx) => {
    const employeeId = String(row[idHeader!]).trim();
    const employeeName = String(row[nameHeader!]).trim();
    const department = String(row[deptHeader!]).trim();

    if (!employeeId || !employeeName || !department) {
      errors.push(`Row ${idx + 2}: Required values cannot be empty (Employee ID, Name, and Department are required).`);
      return;
    }

    employees.push({
      employeeId,
      employeeName,
      department,
      designation: designationHeader ? String(row[designationHeader]).trim() : "",
      email: emailHeader ? String(row[emailHeader]).trim() : "",
      phone: phoneHeader ? String(row[phoneHeader]).trim() : "",
      shift: shiftHeader ? String(row[shiftHeader]).trim() : "",
    });
  });

  if (errors.length > 0) {
    return { isValid: false, errors, employees: [] };
  }

  return { isValid: true, errors: [], employees };
}

function EmployeeAttendancePage() {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Configuration settings
  const [companyName, setCompanyName] = useState("Acme Corp");
  const [defaultShiftHours, setDefaultShiftHours] = useState(8);
  const [workWeekDays, setWorkWeekDays] = useState("Monday - Friday");
  const [gracePeriod, setGracePeriod] = useState(15);
  const [overtimeRate, setOvertimeRate] = useState(1.5);
  const [captureMethod, setCaptureMethod] = useState("Web Dashboard");
  const [overtimeCalculation, setOvertimeCalculation] = useState(true);

  // Step 3 Upload states
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [parsedEmployees, setParsedEmployees] = useState<Omit<MasterEmployee, "status">[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSuccessState, setIsSuccessState] = useState(false);
  const [importCount, setImportCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Employee list (Step 4)
  const [registerData, setRegisterData] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // History logs (Step 5)
  const [historyLogs, setHistoryLogs] = useState<AttendanceLog[]>([]);

  // Load configuration and data on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("saadhyam_attendance_config");
      if (savedConfig) {
        const config: AttendanceConfig = JSON.parse(savedConfig);
        setCompanyName(config.companyName || "Acme Corp");
        setDefaultShiftHours(config.defaultShiftHours ?? 8);
        setWorkWeekDays(config.workWeekDays || "Monday - Friday");
        setGracePeriod(config.gracePeriod ?? 15);
        setOvertimeRate(config.overtimeRate ?? 1.5);
        setCaptureMethod(config.captureMethod || "Web Dashboard");
        setOvertimeCalculation(config.overtimeCalculation ?? true);
      }

      const savedHistory = localStorage.getItem("saadhyam_attendance_history");
      if (savedHistory) {
        setHistoryLogs(JSON.parse(savedHistory));
      } else {
        setHistoryLogs(DEFAULT_LOGS);
        localStorage.setItem("saadhyam_attendance_history", JSON.stringify(DEFAULT_LOGS));
      }

      const master = localStorage.getItem("saadhyam_employee_master");
      if (master) {
        const list = JSON.parse(master) as MasterEmployee[];
        const savedOverrides = localStorage.getItem("saadhyam_attendance_register_overrides");
        if (savedOverrides) {
          setRegisterData(JSON.parse(savedOverrides));
        } else {
          const mapped = list.map(emp => ({
            id: emp.employeeId,
            name: emp.employeeName,
            department: emp.department,
            status: "Present" as const,
            clockIn: "09:00 AM"
          }));
          setRegisterData(mapped);
          localStorage.setItem("saadhyam_attendance_register_overrides", JSON.stringify(mapped));
        }
      } else {
        setRegisterData([]);
      }
    } catch (e) {
      console.error("Failed to load local storage attendance config", e);
    }
  }, []);

  // Save config setting
  const handleSaveConfig = (silent = false) => {
    try {
      const config: AttendanceConfig = {
        companyName,
        defaultShiftHours,
        workWeekDays,
        gracePeriod,
        overtimeRate,
        captureMethod,
        overtimeCalculation,
      };
      localStorage.setItem("saadhyam_attendance_config", JSON.stringify(config));
      if (!silent) {
        toast.success("Attendance configuration saved successfully!");
      }
      setCurrentStep(3);
    } catch (e) {
      toast.error("Failed to save configuration settings.");
    }
  };

  // Drag and drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10 MB limit.");
      return;
    }

    setUploadedFile(file.name);
    setValidationErrors([]);
    setParsedEmployees([]);
    setIsSuccessState(false);

    const reader = new FileReader();
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const isCsv = file.name.endsWith(".csv");

    if (isExcel) {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as ParsedEmployeeRow[];

          const result = validateAndMapEmployees(jsonData);
          if (result.isValid) {
            setParsedEmployees(result.employees);
            toast.success("Excel file parsed and validated successfully.");
          } else {
            setValidationErrors(result.errors);
            toast.error("File validation failed.");
          }
        } catch (err) {
          setValidationErrors(["Error parsing Excel file. Please ensure it has a valid format."]);
          toast.error("Failed to parse Excel file.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (isCsv) {
      reader.onload = (e) => {
        try {
          const csvText = e.target?.result as string;
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const result = validateAndMapEmployees(results.data as ParsedEmployeeRow[]);
              if (result.isValid) {
                setParsedEmployees(result.employees);
                toast.success("CSV file parsed and validated successfully.");
              } else {
                setValidationErrors(result.errors);
                toast.error("File validation failed.");
              }
            },
            error: (err) => {
              setValidationErrors([`Error parsing CSV: ${err.message}`]);
              toast.error("Failed to parse CSV file.");
            }
          });
        } catch (err) {
          setValidationErrors(["Error reading CSV file."]);
          toast.error("Failed to read CSV file.");
        }
      };
      reader.readAsText(file);
    } else {
      toast.error("Unsupported file format. Please upload .csv or .xlsx files.");
    }
  };

  // Import parsed employees to LocalStorage
  const handleImportEmployees = () => {
    if (parsedEmployees.length === 0) return;
    try {
      const finalEmployees = parsedEmployees.map(emp => ({
        ...emp,
        status: "Active"
      }));
      localStorage.setItem("saadhyam_employee_master", JSON.stringify(finalEmployees));
      setImportCount(finalEmployees.length);
      setIsSuccessState(true);
      toast.success(`${finalEmployees.length} employees imported successfully!`);

      const mapped = finalEmployees.map(emp => ({
        id: emp.employeeId,
        name: emp.employeeName,
        department: emp.department,
        status: "Present" as const,
        clockIn: "09:00 AM"
      }));
      setRegisterData(mapped);
      localStorage.setItem("saadhyam_attendance_register_overrides", JSON.stringify(mapped));
    } catch (e) {
      toast.error("Failed to store employee directory.");
    }
  };

  // Reset file upload state
  const handleResetUpload = () => {
    setUploadedFile(null);
    setParsedEmployees([]);
    setValidationErrors([]);
    setIsSuccessState(false);
  };

  // Save daily overrides
  const handleSaveRegister = () => {
    try {
      localStorage.setItem("saadhyam_attendance_register_overrides", JSON.stringify(registerData));
      toast.success("Attendance register status overridden successfully!");
      setCurrentStep(5);
    } catch (e) {
      toast.error("Failed to save changes.");
    }
  };

  // Change status of employee
  const handleEmployeeStatusChange = (id: string, newStatus: Employee["status"]) => {
    const updated = registerData.map((emp) => {
      if (emp.id === id) {
        return {
          ...emp,
          status: newStatus,
          clockIn: newStatus === "Absent" || newStatus === "On Leave" ? "-" : emp.clockIn === "-" ? "09:00 AM" : emp.clockIn,
        };
      }
      return emp;
    });
    setRegisterData(updated);
  };

  // Export report to TXT file
  const handleDownloadTxtReport = () => {
    try {
      let content = `==================================================\n`;
      content += `EMPLOYEE ATTENDANCE REPORT: ${companyName}\n`;
      content += `Generated on: ${new Date().toLocaleString()}\n`;
      content += `==================================================\n\n`;
      content += `Configured default Shift: ${defaultShiftHours} hours\n`;
      content += `Grace period: ${gracePeriod} minutes\n`;
      content += `Overtime: ${overtimeCalculation ? `Enabled (${overtimeRate}x)` : "Disabled"}\n\n`;
      content += `ATTENDANCE HISTORY LOGS:\n`;
      content += `--------------------------------------------------\n`;
      content += `Date       | Employee       | Status  | In       | Out      | Total Hrs\n`;
      content += `--------------------------------------------------\n`;

      historyLogs.forEach((log) => {
        content += `${log.date.padEnd(10)} | ${log.employeeName.padEnd(14)} | ${log.status.padEnd(7)} | ${log.clockIn.padEnd(8)} | ${log.clockOut.padEnd(8)} | ${log.totalHours.toFixed(1)} hrs\n`;
      });

      const element = document.createElement("a");
      const file = new Blob([content], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = `attendance-report-${Date.now()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success("TXT attendance report downloaded!");
    } catch (e) {
      toast.error("Failed to download text report.");
    }
  };

  // Export register to CSV
  const handleDownloadCsvRegister = () => {
    try {
      let content = `Employee Name,Department,Status,Clock In\n`;
      registerData.forEach((emp) => {
        content += `"${emp.name}","${emp.department}","${emp.status}","${emp.clockIn}"\n`;
      });

      const element = document.createElement("a");
      const file = new Blob([content], { type: "text/csv" });
      element.href = URL.createObjectURL(file);
      element.download = `attendance-register-${Date.now()}.csv`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success("CSV attendance register downloaded!");
    } catch (e) {
      toast.error("Failed to download CSV register.");
    }
  };

  // Clear logs completely
  const handleClearLogs = () => {
    if (window.confirm("Are you sure you want to clear all history logs? This cannot be undone.")) {
      setHistoryLogs([]);
      localStorage.setItem("saadhyam_attendance_history", JSON.stringify([]));
      toast.success("All attendance logs cleared.");
    }
  };

  // Search filter
  const filteredEmployees = registerData.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dark bg-slate-950 text-slate-100 min-h-[calc(100vh-64px)] py-8 px-4 md:px-8 space-y-6 flex flex-col">
      {/* Back Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/plugins"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Back to plugins"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Employee Attendance
              </h1>
              <span className="bg-purple-900/50 text-purple-300 text-xs px-2.5 py-1 rounded-full border border-purple-800/50 font-semibold animate-pulse-slow">
                Attendance Setup Wizard
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Configure, record, track and review employee check-ins and overtime.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 max-w-max">
          <Info className="h-4 w-4 text-purple-400" />
          <span>Local Configuration Persistence Active</span>
        </div>
      </div>

      {/* Sleek Progress Indicator */}
      <div className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl p-4 md:p-6 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-purple-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-pink-500 animate-ping"></span>
            Step {currentStep} of 5: {
              currentStep === 1 ? "Welcome & Overview" :
                currentStep === 2 ? "Company Config Settings" :
                  currentStep === 3 ? "Employee Data Setup" :
                    currentStep === 4 ? "Review Employee Register" :
                      "Attendance Logs & Export"
            }
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {Math.round((currentStep / 5) * 100)}% Complete
          </span>
        </div>

        {/* Progress Bar & Node Tracker */}
        <div className="relative flex items-center justify-between mt-2">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 z-0"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 z-0 transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          ></div>

          {[1, 2, 3, 4, 5].map((stepNum) => {
            const isCompleted = currentStep > stepNum;
            const isActive = currentStep === stepNum;
            let stepLabel = "";
            if (stepNum === 1) stepLabel = "Welcome";
            else if (stepNum === 2) stepLabel = "Config";
            else if (stepNum === 3) stepLabel = "Setup";
            else if (stepNum === 4) stepLabel = "Register";
            else if (stepNum === 5) stepLabel = "Reports";

            return (
              <div key={stepNum} className="flex flex-col items-center gap-1.5 relative z-10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(stepNum)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${isCompleted
                      ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                      : isActive
                        ? "bg-slate-950 border-pink-500 text-pink-400 scale-110 shadow-lg shadow-pink-500/20"
                        : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                    }`}
                >
                  {isCompleted ? "✓" : stepNum}
                </button>
                <span className={`text-[10px] hidden md:inline font-semibold ${isActive ? "text-pink-400" : isCompleted ? "text-purple-400" : "text-slate-600"}`}>
                  {stepLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full">
        <div className="flex-1 min-h-[380px]">
          {/* STEP 1: WELCOME SCREEN */}
          {currentStep === 1 && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative h-full animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-900/40 text-purple-400 border border-purple-800/40 mb-3 text-3xl">
                  ⏰
                </div>
                <CardTitle className="text-3xl font-extrabold text-slate-100 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Employee Attendance System
                </CardTitle>
                <CardDescription className="text-slate-400 text-base max-w-xl mx-auto mt-2">
                  Track employee attendance, manage shifts, calculate overtime hours, and compile reports from our unified interface.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-6 md:px-12 pb-8">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Included Features</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { title: "Dynamic Shift Duration", desc: "Define standard shifts, weekly schedules and grace periods." },
                      { title: "Employee Data Setup", desc: "Direct directory spreadsheet upload (.csv, .xlsx) parsing." },
                      { title: "Interactive Employee Register", desc: "View all team members and override check-in details." },
                      { title: "Logs & Report Exporters", desc: "Export details into standard CSV or TXT report files." },
                    ].map((feat, idx) => (
                      <div key={idx} className="flex gap-3 p-3 bg-slate-950/50 border border-slate-800/50 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{feat.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{feat.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-50 font-bold px-10 py-6 text-base rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    Configure Settings <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: COMPANY CONFIGURATION */}
          {currentStep === 2 && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>⚙️ System Configuration</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Set standard shift parameters, grace limits, and specify how clock-in timestamps are captured.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName" className="text-sm font-semibold text-slate-300">
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="e.g. Acme Corp"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="defaultShiftHours" className="text-sm font-semibold text-slate-300">
                      Standard Shift Length (Hours)
                    </Label>
                    <Input
                      id="defaultShiftHours"
                      type="number"
                      value={defaultShiftHours}
                      onChange={(e) => setDefaultShiftHours(parseInt(e.target.value) || 8)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="workWeekDays" className="text-sm font-semibold text-slate-300">
                      Standard Work Week Days
                    </Label>
                    <Select value={workWeekDays} onValueChange={setWorkWeekDays}>
                      <SelectTrigger id="workWeekDays" className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue placeholder="Select work week" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-905 border-slate-800 text-slate-100">
                        <SelectItem value="Monday - Friday">Monday - Friday</SelectItem>
                        <SelectItem value="Monday - Saturday">Monday - Saturday</SelectItem>
                        <SelectItem value="Seven Days">Seven Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gracePeriod" className="text-sm font-semibold text-slate-300">
                      Late Grace Period (Minutes)
                    </Label>
                    <Input
                      id="gracePeriod"
                      type="number"
                      value={gracePeriod}
                      onChange={(e) => setGracePeriod(parseInt(e.target.value) || 15)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="captureMethod" className="text-sm font-semibold text-slate-300">
                      Attendance Capture Method
                    </Label>
                    <Select value={captureMethod} onValueChange={setCaptureMethod}>
                      <SelectTrigger id="captureMethod" className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue placeholder="Select capture method" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-905 border-slate-800 text-slate-100">
                        <SelectItem value="Web Dashboard">Web Dashboard</SelectItem>
                        <SelectItem value="Biometric API Integration">Biometric API Integration</SelectItem>
                        <SelectItem value="Mobile App QR Code Scanner">Mobile App QR Code Scanner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="overtimeRate" className="text-sm font-semibold text-slate-300">
                      Overtime Rate Multiplier
                    </Label>
                    <Input
                      id="overtimeRate"
                      type="number"
                      step="0.1"
                      value={overtimeRate}
                      onChange={(e) => setOvertimeRate(parseFloat(e.target.value) || 1.5)}
                      className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500"
                      disabled={!overtimeCalculation}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-slate-200">Calculate Overtime Hours</Label>
                    <p className="text-xs text-slate-400">Track hours worked beyond the default shift length.</p>
                  </div>
                  <Switch
                    checked={overtimeCalculation}
                    onCheckedChange={setOvertimeCalculation}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => handleSaveConfig(false)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-50 font-bold px-6 shadow-md transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save & Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: EMPLOYEE DATA SETUP */}
          {currentStep === 3 && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <Database className="w-6 h-6 text-purple-400" />
                  <span>Employee Data Setup</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Import your employee directory before tracking attendance. This database is shared across future HR modules.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Drag & Drop Area / Upload Options */}
                {!uploadedFile && !isSuccessState && (
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={handleFileClick}
                    className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 text-center ${isDragOver
                        ? "border-pink-500 bg-pink-950/10"
                        : "border-slate-800 bg-slate-950/40 hover:border-purple-500 hover:bg-slate-950/80"
                      }`}
                  >
                    <Upload className="w-12 h-12 text-slate-500 mb-4 animate-bounce" />
                    <h3 className="text-lg font-bold text-slate-200">Drag & drop your files here</h3>
                    <p className="text-sm text-slate-400 mt-1 mb-6">or click to browse from files</p>

                    <div className="flex gap-3 justify-center mb-6">
                      <Button type="button" size="sm" variant="secondary" className="bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-850">
                        Upload CSV
                      </Button>
                      <Button type="button" size="sm" variant="secondary" className="bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-850">
                        Upload Excel
                      </Button>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      <p>Supported formats: CSV (.csv), Excel (.xlsx)</p>
                      <p>Maximum size: 10 MB</p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Validation Errors State */}
                {validationErrors.length > 0 && !isSuccessState && (
                  <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-6 h-6 shrink-0" />
                      <h3 className="font-bold text-lg">File Validation Errors</h3>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 max-h-[150px] overflow-y-auto">
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-2">
                        {validationErrors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={handleResetUpload} className="bg-slate-950 border border-slate-800 text-slate-200 hover:bg-slate-900">
                        Upload Another File
                      </Button>
                    </div>
                  </div>
                )}

                {/* Preview Table State */}
                {parsedEmployees.length > 0 && validationErrors.length === 0 && !isSuccessState && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-slate-200">Employee Preview</h3>
                        <p className="text-xs text-slate-400">Showing first 10 of {parsedEmployees.length} employees found.</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-400" onClick={handleResetUpload}>
                        Clear File
                      </Button>
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-[260px] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-slate-900">
                          <TableRow className="border-slate-800">
                            <TableHead className="text-slate-300">Employee ID</TableHead>
                            <TableHead className="text-slate-300">Employee Name</TableHead>
                            <TableHead className="text-slate-300">Department</TableHead>
                            <TableHead className="text-slate-300">Designation</TableHead>
                            <TableHead className="text-slate-300">Email</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedEmployees.slice(0, 10).map((emp, idx) => (
                            <TableRow key={idx} className="border-slate-850 hover:bg-slate-900/30">
                              <TableCell className="font-mono text-xs text-slate-200">{emp.employeeId}</TableCell>
                              <TableCell className="font-semibold text-slate-200">{emp.employeeName}</TableCell>
                              <TableCell className="text-slate-300 text-xs">{emp.department}</TableCell>
                              <TableCell className="text-slate-400 text-xs">{emp.designation || "-"}</TableCell>
                              <TableCell className="text-slate-400 text-xs font-mono">{emp.email || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                      <Button variant="outline" onClick={handleResetUpload} className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleImportEmployees}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-50 font-bold px-6 shadow-md transition-all flex items-center gap-2"
                      >
                        <Database className="w-4 h-4" /> Import Employees
                      </Button>
                    </div>
                  </div>
                )}

                {/* Success State */}
                {isSuccessState && (
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-950 border border-slate-850 rounded-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-900/40 text-purple-400 border border-purple-800/40 mb-2">
                      <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>

                    <h3 className="text-2xl font-extrabold text-slate-100 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      ✓ {importCount} Employees Imported Successfully
                    </h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      Employee directory created successfully. This data will now be used across all HR plugins.
                    </p>

                    <div className="pt-4 flex gap-3">
                      <Button onClick={handleResetUpload} variant="outline" className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800">
                        Upload Again
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(4)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-50 font-bold px-8 shadow-md"
                      >
                        Continue →
                      </Button>
                    </div>
                  </div>
                )}

                {/* Empty Upload State Hint when file not set */}
                {!uploadedFile && !isSuccessState && (
                  <div className="flex flex-col items-center justify-center min-h-[160px] text-center text-slate-500 border border-dashed border-slate-800 rounded-xl p-8">
                    <FileSpreadsheet className="w-12 h-12 stroke-[1] text-slate-700 mb-3" />
                    <p className="font-semibold text-slate-400">No Employees Imported Yet</p>
                    <p className="text-xs max-w-sm mt-1">
                      Upload a CSV or Excel file to begin managing attendance.
                    </p>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-800/50 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  >
                    Back to Config
                  </Button>

                  {registerData.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(4)}
                      className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                    >
                      Skip to Register
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 4: ATTENDANCE REGISTER */}
          {currentStep === 4 && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>📋 Team Attendance Register</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Search and adjust shift statuses for individual team members manually for today's logs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {registerData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-800 rounded-2xl text-center space-y-4 bg-slate-950/40">
                    <AlertCircle className="w-12 h-12 text-pink-500 animate-pulse" />
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-200">No employees available</h3>
                      <p className="text-sm text-slate-400 max-w-xs mx-auto">
                        Return to Employee Data Setup to import employees before marking attendance logs.
                      </p>
                    </div>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-50 font-bold px-6 shadow-lg"
                    >
                      Import Employees
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Input
                        placeholder="Search by employee name or department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-purple-500"
                      />
                    </div>

                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-slate-900">
                          <TableRow className="border-slate-800">
                            <TableHead className="text-slate-300">Employee Name</TableHead>
                            <TableHead className="text-slate-300">Department</TableHead>
                            <TableHead className="text-slate-300">Clock In</TableHead>
                            <TableHead className="text-slate-300">Override Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEmployees.length > 0 ? (
                            filteredEmployees.map((emp) => (
                              <TableRow key={emp.id} className="border-slate-850 hover:bg-slate-900/30">
                                <TableCell className="font-semibold text-slate-200">{emp.name}</TableCell>
                                <TableCell className="text-slate-400 text-xs">{emp.department}</TableCell>
                                <TableCell className="font-mono text-xs text-slate-300">{emp.clockIn}</TableCell>
                                <TableCell>
                                  <Select
                                    value={emp.status}
                                    onValueChange={(val: Employee["status"]) =>
                                      handleEmployeeStatusChange(emp.id, val)
                                    }
                                  >
                                    <SelectTrigger className="h-8 w-28 bg-slate-900 border-slate-800 text-xs text-slate-200">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                      <SelectItem value="Present">Present</SelectItem>
                                      <SelectItem value="Absent">Absent</SelectItem>
                                      <SelectItem value="Late">Late</SelectItem>
                                      <SelectItem value="On Leave">On Leave</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-6 text-slate-500">
                                No employees match your search query
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-4 border-t border-slate-800/50">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                    className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  >
                    Back to Setup
                  </Button>

                  {registerData.length > 0 && (
                    <Button
                      onClick={handleSaveRegister}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-50 font-bold px-6 shadow-md transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Save & View Reports
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 5: REPORTS & LOGS HISTORY */}
          {currentStep === 5 && (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <span>📊 Attendance History & Reports</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  View statistics, audit detailed attendance records, and export files.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Logs</div>
                    <div className="text-2xl font-bold text-slate-200">{historyLogs.length} days</div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Avg Shift</div>
                    <div className="text-2xl font-bold text-slate-200">
                      {(historyLogs.reduce((acc, curr) => acc + curr.totalHours, 0) / Math.max(1, historyLogs.filter(l => l.totalHours > 0).length)).toFixed(1)} hrs
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Late Count</div>
                    <div className="text-2xl font-bold text-pink-400">
                      {historyLogs.filter((log) => log.status === "Late").length} runs
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Overtime</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {historyLogs.reduce((acc, curr) => acc + curr.overtimeHours, 0).toFixed(1)} hrs
                    </div>
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-[220px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-slate-900">
                      <TableRow className="border-slate-800">
                        <TableHead className="text-slate-300">Date</TableHead>
                        <TableHead className="text-slate-300">Employee</TableHead>
                        <TableHead className="text-slate-300">In / Out</TableHead>
                        <TableHead className="text-slate-300">Hours</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyLogs.length > 0 ? (
                        historyLogs.map((log) => (
                          <TableRow key={log.id} className="border-slate-850 hover:bg-slate-900/30">
                            <TableCell className="font-mono text-xs text-slate-300">{log.date}</TableCell>
                            <TableCell className="font-semibold text-slate-200 text-xs">{log.employeeName}</TableCell>
                            <TableCell className="font-mono text-[11px] text-slate-400">
                              {log.clockIn} - {log.clockOut}
                            </TableCell>
                            <TableCell className="font-mono text-xs font-semibold text-slate-300">
                              {log.totalHours.toFixed(1)} hrs
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] py-0.5 ${log.status === "Present"
                                    ? "bg-emerald-950/40 border-emerald-900/40 text-emerald-400"
                                    : log.status === "Late"
                                      ? "bg-amber-950/40 border-amber-900/40 text-amber-400"
                                      : "bg-red-950/40 border-red-900/40 text-red-400"
                                  }`}
                              >
                                {log.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                            No attendance history logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    onClick={handleDownloadTxtReport}
                    className="flex-1 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4 text-purple-400" />
                    Download TXT Report
                  </Button>

                  <Button
                    onClick={handleDownloadCsvRegister}
                    className="flex-1 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-purple-400" />
                    Download CSV Register
                  </Button>

                  <Button
                    onClick={handleClearLogs}
                    variant="ghost"
                    className="text-slate-400 hover:text-red-400 hover:bg-red-950/20"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear Logs
                  </Button>
                </div>

                <div className="flex justify-between border-t border-slate-800/50 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(4)}
                    className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  >
                    Back to Register
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
