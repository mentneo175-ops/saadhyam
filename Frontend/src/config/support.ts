export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || "info@saadhyam.com";

export const buildSupportGmailUrl = (subject: string, body: string) => {
  const params = new URLSearchParams();
  params.set("view", "cm");
  params.set("fs", "1");
  params.set("to", SUPPORT_EMAIL);
  if (subject.trim()) params.set("su", subject.trim());
  if (body.trim()) params.set("body", body.trim());
  return `https://mail.google.com/mail/?${params.toString()}`;
};