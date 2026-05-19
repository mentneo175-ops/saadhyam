import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Camera,
  Save,
  Instagram,
  MessageCircle,
  Mail,
  ShoppingBag,
  Loader2,
  ChevronDown,
  ChevronUp,
  LogOut,
  CheckCircle,
  AlertCircle,
  Building2,
  MapPin,
  User,
  Phone,
  Globe,
  Shield,
  Bell,
  CreditCard,
  Sparkles,
  Crown,
  Zap,
  Lock,
  Key,
  Palette,
  Target,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/dashboard/settings/redesigned")({
  head: () => ({ meta: [{ title: "Settings — Saadhyam AI" }] }),
  component: SettingsPage,
});

const integrations = [
  {
    name: "Instagram",
    desc: "Post and analyze",
    icon: Instagram,
    color: "from-pink-500 to-fuchsia-500",
  },
  {
    name: "WhatsApp Business",
    desc: "Send and receive messages",
    icon: MessageCircle,
    color: "from-emerald-500 to-teal-500",
  },
  {
    name: "Email (Gmail)",
    desc: "Campaigns and automations",
    icon: Mail,
    color: "from-blue-500 to-indigo-500",
  },
];

// Animation variants - Subtle and elegant
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};
