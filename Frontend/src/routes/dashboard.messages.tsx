import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Search, Send, Smile, Paperclip, CheckCheck, Phone, Video } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/messages")({
  head: () => ({ meta: [{ title: "Messages — Saadhyam AI" }] }),
  component: MessagesPage,
});

const chats = [
  {
    id: 1,
    name: "Aanya Patel",
    last: "Loved the new collection ❤️",
    time: "2m",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: "Rohan Kapoor",
    last: "Can I get the Diwali offer?",
    time: "12m",
    unread: 1,
    online: true,
  },
  {
    id: 3,
    name: "Meera Iyer",
    last: "Thanks for the quick reply!",
    time: "1h",
    unread: 0,
    online: false,
  },
  { id: 4, name: "Karan Bose", last: "Order delivered ✓", time: "3h", unread: 0, online: false },
  {
    id: 5,
    name: "Divya Nair",
    last: "Will check tomorrow",
    time: "Yesterday",
    unread: 0,
    online: false,
  },
];

const messages = [
  { from: "them", text: "Hi! Saw your new Diwali collection — gorgeous! 😍", time: "10:42" },
  {
    from: "me",
    text: "Thank you so much, Aanya! 🪔 We have something special for our VIP customers — a personal 30% off code 💫",
    time: "10:43",
  },
  { from: "them", text: "Oh wow, that's amazing! Can I get the code?", time: "10:45" },
  { from: "me", text: "Of course! Use AANYA30 at checkout — valid for 48 hours 🎁", time: "10:46" },
  { from: "them", text: "Loved the new collection ❤️", time: "10:48" },
];

function MessagesPage() {
  const [active, setActive] = useState(1);
  const [draft, setDraft] = useState("");

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <PageHeader title="Messages" subtitle="WhatsApp & in-app conversations" />

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-0 bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden h-[70vh]">
        {/* Chat list */}
        <div className="border-r border-border/60 flex flex-col">
          <div className="p-3 border-b border-border/60">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                placeholder="Search chats..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-muted/60 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition text-left ${
                  active === c.id ? "bg-primary/5" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-brand text-white flex items-center justify-center text-xs font-bold">
                    {c.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </div>
                  {c.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{c.time}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate">{c.last}</p>
                    {c.unread > 0 && (
                      <span className="h-4 min-w-4 px-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat view */}
        <div className="flex flex-col bg-gradient-soft">
          <div className="px-4 py-3 border-b border-border/60 bg-card flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-brand text-white flex items-center justify-center text-xs font-bold">
              AP
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Aanya Patel</p>
              <p className="text-[11px] text-success">● online</p>
            </div>
            <button className="h-9 w-9 rounded-lg hover:bg-accent/40 inline-flex items-center justify-center">
              <Phone size={15} />
            </button>
            <button className="h-9 w-9 rounded-lg hover:bg-accent/40 inline-flex items-center justify-center">
              <Video size={15} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-soft ${
                    m.from === "me"
                      ? "bg-gradient-primary text-primary-foreground rounded-br-md"
                      : "bg-card text-foreground rounded-bl-md"
                  }`}
                >
                  <p className="leading-relaxed">{m.text}</p>
                  <div
                    className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${m.from === "me" ? "opacity-80" : "text-muted-foreground"}`}
                  >
                    {m.time}
                    {m.from === "me" && <CheckCheck size={11} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border/60 bg-card flex items-center gap-2">
            <button className="h-9 w-9 rounded-lg hover:bg-accent/40 inline-flex items-center justify-center">
              <Paperclip size={15} />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-10 px-4 rounded-full bg-muted/60 text-sm outline-none focus:bg-background focus:ring-2 focus:ring-primary/15"
            />
            <button className="h-9 w-9 rounded-lg hover:bg-accent/40 inline-flex items-center justify-center">
              <Smile size={15} />
            </button>
            <button className="h-10 w-10 rounded-full bg-gradient-primary text-white flex items-center justify-center shadow-glow hover:brightness-110">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
