"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Accessibility,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  HeartHandshake,
  Lock,
  MapPin,
  MessageCircle,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Users,
} from "lucide-react";

type User = {
  id: string;
  name: string;
  role: string;
  area: string;
  badges: string[];
  assists: number;
  reliability: number;
};

type AssistRequest = {
  id: string;
  user: User;
  text: string;
  category: string;
  from: string;
  to: string;
  time: string;
  effort: string;
  support: string;
  car: string;
  safety: string;
  status: string;
};

type AssistOffer = {
  id: string;
  user: User;
  text: string;
  category: string;
  from: string;
  to: string;
  time: string;
  effort: string;
  car: boolean;
};

type Classification = {
  status: "Safe" | "Needs Revision" | "Blocked";
  category: string;
  reason: string;
  support?: string;
  car?: string;
  effort?: string;
  cleaned?: string;
};

const users: Record<string, User> = {
  tanmmay: {
    id: "tanmmay",
    name: "Tanmmay",
    role: "Requester",
    area: "Tercero",
    badges: ["Verified UC Davis Student", "Photo Verified"],
    assists: 3,
    reliability: 98,
  },
  maya: {
    id: "maya",
    name: "Maya",
    role: "Helper",
    area: "Tercero",
    badges: ["Verified UC Davis Student", "Grocery Hero"],
    assists: 8,
    reliability: 100,
  },
  alex: {
    id: "alex",
    name: "Alex",
    role: "Helper",
    area: "Segundo",
    badges: ["Verified UC Davis Student", "Walking Buddy"],
    assists: 12,
    reliability: 97,
  },
  priya: {
    id: "priya",
    name: "Priya",
    role: "Admin",
    area: "Campus",
    badges: ["Campus Moderator", "Verified UC Davis Student"],
    assists: 0,
    reliability: 100,
  },
};

const demoUsers = Object.values(users);

const safeSpots = [
  { name: "Trader Joe’s Main Entrance", area: "Trader Joe’s", tags: ["public", "busy", "easy to find"], bestFor: "pickup" },
  { name: "Tercero Services Center", area: "Tercero", tags: ["public lobby", "student area", "visible"], bestFor: "drop-off" },
  { name: "Shields Library Main Entrance", area: "Shields Library", tags: ["public", "well-lit", "campus landmark"], bestFor: "walking buddy" },
  { name: "Memorial Union Front Entrance", area: "Memorial Union", tags: ["busy", "central", "easy to find"], bestFor: "backup" },
  { name: "Segundo Services Center", area: "Segundo", tags: ["public lobby", "student area", "visible"], bestFor: "drop-off" },
  { name: "Silo Main Entrance", area: "Silo", tags: ["busy", "central", "food nearby"], bestFor: "backup" },
];

const seededRequests: AssistRequest[] = [
  {
    id: "req-1",
    user: users.tanmmay,
    text: "I’m on crutches and need help carrying groceries from Trader Joe’s to Tercero tonight.",
    category: "Grocery / Carrying",
    from: "Trader Joe’s",
    to: "Tercero",
    time: "Today, 6–7 PM",
    effort: "Medium",
    support: "Mobility support",
    car: "Helpful",
    safety: "Safe",
    status: "Open",
  },
  {
    id: "req-2",
    user: users.tanmmay,
    text: "Can someone walk with me from Shields Library to Segundo at 10 PM?",
    category: "Walking Buddy",
    from: "Shields Library",
    to: "Segundo",
    time: "Tonight, 10 PM",
    effort: "Low",
    support: "Late-night safety",
    car: "No",
    safety: "Safe",
    status: "Open",
  },
];

const seededOffers: AssistOffer[] = [
  {
    id: "offer-1",
    user: users.maya,
    text: "I’m driving to Trader Joe’s at 6 PM and coming back near Tercero. I can help carry light groceries.",
    category: "Grocery / Carrying",
    from: "Campus",
    to: "Tercero",
    time: "Today, 6–7 PM",
    effort: "Medium",
    car: true,
  },
  {
    id: "offer-2",
    user: users.alex,
    text: "I’m leaving Shields around 10 PM and walking toward Segundo.",
    category: "Walking Buddy",
    from: "Shields Library",
    to: "Segundo",
    time: "Tonight, 10 PM",
    effort: "Low",
    car: false,
  },
];

const flaggedExamples = [
  { text: "Can someone pick up alcohol and bring it to my dorm?", status: "Blocked", reason: "Prohibited item + private delivery" },
  { text: "Can someone move my couch upstairs alone?", status: "Needs revision", reason: "Unsafe heavy lifting" },
  { text: "Text me at 530-123-4567", status: "Blocked", reason: "Contact sharing disabled" },
  { text: "Come to my apartment room 312", status: "Blocked", reason: "Private meetup location" },
];

function classifyRequest(text: string): Classification {
  const lower = text.toLowerCase();
  const blockedTerms = ["alcohol", "weed", "drugs", "weapon", "cash loan", "venmo me", "come to my apartment", "my dorm room", "room 312"];
  const contactPattern = /(\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|@\w+|snapchat|instagram|discord|text me|call me)/i;

  if (blockedTerms.some((term) => lower.includes(term))) {
    return {
      status: "Blocked",
      category: "Unsafe request",
      reason: "This request includes prohibited items, private meetup details, or unsafe behavior.",
    };
  }

  if (contactPattern.test(text)) {
    return {
      status: "Needs Revision",
      category: "Contact Info",
      reason: "Contact information should only be shared if both users consent.",
    };
  }

  let category = "General Assist";
  if (lower.includes("grocery") || lower.includes("trader joe") || lower.includes("safeway")) category = "Grocery / Carrying";
  else if (lower.includes("walk") || lower.includes("walking")) category = "Walking Buddy";
  else if (lower.includes("box") || lower.includes("move")) category = "Small Item Carrying";
  else if (lower.includes("class") || lower.includes("find")) category = "Campus Navigation";
  else if (lower.includes("tech") || lower.includes("laptop")) category = "Tech Help";

  const support = lower.includes("crutch") || lower.includes("ankle") || lower.includes("injur") ? "Mobility support" : "None specified";
  const car = lower.includes("grocery") || lower.includes("target") || lower.includes("trader joe") ? "Helpful" : "No";
  const effort = lower.includes("carry") || lower.includes("box") || lower.includes("grocery") ? "Medium" : "Low";

  return {
    status: "Safe",
    category,
    reason: "This looks like a small, voluntary, non-monetary assist.",
    support,
    car,
    effort,
    cleaned: text.replace(/\bidk\b/gi, "").replace(/\bcan someone maybe\b/gi, "Can someone").trim(),
  };
}

function contactInfoDetected(text: string) {
  return /(\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|[\w.-]+@[\w.-]+\.\w+|instagram|snapchat|discord|text me|call me|@\w+)/i.test(text);
}

function privateLocationDetected(text: string) {
  return /(apartment|dorm room|bedroom|room \d+|come inside|my house)/i.test(text);
}

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Button({ children, onClick, variant = "solid", disabled = false, className = "" }: { children: React.ReactNode; onClick?: () => void; variant?: "solid" | "outline" | "ghost"; disabled?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "solid" && "bg-slate-950 text-white hover:bg-slate-800",
        variant === "outline" && "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-3xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}

function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "good" | "warn" | "danger" | "blue" | "purple" }) {
  const tones = {
    default: "bg-slate-100 text-slate-700",
    good: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-violet-100 text-violet-700",
  };
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="rounded-2xl bg-slate-900 p-2 text-white shadow-sm"><Icon size={20} /></div>
      <div>
        <h2 className="text-xl font-bold text-slate-950">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function DemoUserSwitcher({ currentUser, setCurrentUser }: { currentUser: User; setCurrentUser: (u: User) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <span className="text-sm text-slate-500">Viewing as:</span>
      <select
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
        value={currentUser.id}
        onChange={(e) => {
          const nextUser = demoUsers.find((u) => u.id === e.target.value);
          if (nextUser) setCurrentUser(nextUser);
        }}
      >
        {demoUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} — {user.role}
          </option>
        ))}
      </select>
    </div>
  );
}

function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
            {user.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-950">{user.name}</h3>
              <UserCheck size={16} className="text-emerald-600" />
            </div>
            <p className="text-sm text-slate-500">{user.area} • {user.assists} assists • {user.reliability}% reliable</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {user.badges.map((b) => <Pill key={b} tone="blue">{b}</Pill>)}
        </div>
      </div>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function ConsentToggle({ name, checked, onChange }: { name: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-3xl border border-slate-200 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold">{name}</h3>
          <p className="text-sm text-slate-500">Allow contact info sharing for this assist?</p>
        </div>
        <Button variant={checked ? "solid" : "outline"} onClick={() => onChange(!checked)}>
          {checked ? "Consented" : "Keep private"}
        </Button>
      </div>
    </div>
  );
}

export default function CampusKindMVP() {
  const [screen, setScreen] = useState("home");
  const [currentUser, setCurrentUser] = useState<User>(users.tanmmay);
  const [agreement, setAgreement] = useState(false);
  const [requestText, setRequestText] = useState(seededRequests[0].text);
  const [activeRequest, setActiveRequest] = useState<AssistRequest>(seededRequests[0]);
  const [contactA, setContactA] = useState(false);
  const [contactB, setContactB] = useState(false);
  const [chatInput, setChatInput] = useState("Let's meet at Trader Joe's Main Entrance around 6 PM.");
  const [chatMessages, setChatMessages] = useState([
    { from: "CampusKind", text: "SafeMeet suggested Trader Joe’s Main Entrance as the public pickup spot and Tercero Services Center as the public drop-off spot.", system: true },
    { from: "Maya", text: "Hi! I’m still going at 6. I can help carry light groceries.", system: false },
  ]);
  const [blockedNotice, setBlockedNotice] = useState("");

  const classification = useMemo(() => classifyRequest(requestText), [requestText]);
  const contactSharingEnabled = contactA && contactB;
  const bestMatch = useMemo(() => seededOffers.find((o) => o.category === activeRequest.category) || seededOffers[0], [activeRequest]);
  const relevantSafeSpots = safeSpots.filter((s) => [activeRequest.from, activeRequest.to, "Memorial Union"].includes(s.area)).slice(0, 3);

  function approveRequest() {
    if (classification.status !== "Safe") return;
    setActiveRequest({
      id: "req-new",
      user: users.tanmmay,
      text: classification.cleaned || requestText,
      category: classification.category,
      from: requestText.toLowerCase().includes("trader") ? "Trader Joe’s" : "Campus",
      to: requestText.toLowerCase().includes("tercero") ? "Tercero" : "Campus",
      time: "Today",
      effort: classification.effort || "Low",
      support: classification.support || "None specified",
      car: classification.car || "No",
      safety: "Safe",
      status: "Open",
    });
    setScreen("matches");
  }

  function sendMessage() {
    const message = chatInput.trim();
    if (!message) return;
    if (!contactSharingEnabled && contactInfoDetected(message)) {
      setBlockedNotice("Message blocked: Contact sharing is disabled for this assist. Please coordinate inside CampusKind.");
      return;
    }
    if (privateLocationDetected(message)) {
      setBlockedNotice("Message blocked: CampusKind recommends public meetup spots instead of private residences or dorm rooms.");
      return;
    }
    setChatMessages([...chatMessages, { from: currentUser.name, text: message, system: false }]);
    setChatInput("");
    setBlockedNotice("");
  }

  const nav = [
    ["home", "Home"],
    ["onboarding", "Onboarding"],
    ["request", "Request"],
    ["matches", "Match"],
    ["consent", "ConsentShare"],
    ["safemeet", "SafeMeet"],
    ["chat", "Chat"],
    ["admin", "Admin"],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-200 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-lg">
              <HeartHandshake size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">CampusKind</h1>
              <p className="text-sm text-slate-500">Small assists. Stronger campus.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <DemoUserSwitcher currentUser={currentUser} setCurrentUser={setCurrentUser} />
            <div className="flex flex-wrap gap-2">
              {nav.map(([key, label]) => (
                <Button key={key} variant={screen === key ? "solid" : "outline"} onClick={() => setScreen(key)}>{label}</Button>
              ))}
            </div>
          </div>
        </header>

        {screen === "home" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
            <Card>
              <div className="p-8">
                <div className="mb-6 flex flex-wrap gap-2">
                  <Pill tone="good">Verified campus mutual aid</Pill>
                  <Pill tone="blue">No payments</Pill>
                  <Pill tone="purple">AI safety checks</Pill>
                </div>
                <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                  A safer way for students to ask for small everyday help.
                </h2>
                <p className="mt-5 max-w-2xl text-lg text-slate-600">
                  CampusKind connects verified students who need small, voluntary assists with peers who are already nearby or already going that way.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button className="px-6 py-3" onClick={() => setScreen("request")}>Request an Assist</Button>
                  <Button className="px-6 py-3" variant="outline" onClick={() => setScreen("matches")}>View Demo Match</Button>
                </div>
              </div>
            </Card>
            <div className="grid gap-4">
              {[
                ["43", "assists completed this week", Users],
                ["18", "grocery/carrying assists", HeartHandshake],
                ["12", "walking buddy assists", ShieldCheck],
                ["9", "accessibility-support assists", Accessibility],
              ].map(([num, label, Icon]) => (
                <Card key={String(label)}>
                  <div className="flex items-center gap-4 p-5">
                    <div className="rounded-2xl bg-slate-100 p-3"><Icon size={24} /></div>
                    <div><div className="text-3xl font-black">{String(num)}</div><div className="text-sm text-slate-500">{String(label)}</div></div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {screen === "onboarding" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-2">
            <Card><div className="p-6"><SectionTitle icon={UserCheck} title="Campus verification" subtitle="Keep the network campus-only and trusted." />
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 p-4"><p className="font-semibold">Campus email</p><p className="text-sm text-slate-500">tanmmay@ucdavis.edu</p><div className="mt-3"><Pill tone="good">Verified UC Davis Student</Pill></div></div>
                <div className="rounded-2xl border border-slate-200 p-4"><p className="font-semibold">Optional higher verification</p><p className="text-sm text-slate-500">Student ID + selfie check. Private data is never shown publicly.</p><div className="mt-3 flex gap-2"><Pill tone="blue">ID Verified</Pill><Pill tone="blue">Photo Verified</Pill></div></div>
              </div></div></Card>
            <Card><div className="p-6"><SectionTitle icon={ShieldCheck} title="Community Safety Agreement" subtitle="Required before using CampusKind." />
              <div className="space-y-3 text-sm text-slate-600">
                {["Small, voluntary, non-monetary assists only.", "No emergencies, medical care, personal care, dangerous tasks, or paid labor.", "Meet in public places and avoid private residences or dorm rooms.", "Contact info can only be shared when both users consent.", "No alcohol, drugs, weapons, cash loans, or illegal items.", "Cancel, report, or block at any time."].map((line) => (
                  <label key={line} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><input type="checkbox" checked={agreement} onChange={(e) => setAgreement(e.target.checked)} /><span>{line}</span></label>
                ))}
              </div><Button className="mt-5 w-full" disabled={!agreement} onClick={() => setScreen("home")}>I agree and continue</Button></div></Card>
          </motion.div>
        )}

        {screen === "request" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-[1fr_.9fr]">
            <Card><div className="p-6"><SectionTitle icon={Sparkles} title="Request an Assist" subtitle="Type naturally. CampusKind cleans, classifies, and safety-checks the request." />
              <textarea className="min-h-40 w-full rounded-3xl border border-slate-200 bg-white p-4 text-base outline-none ring-slate-900 focus:ring-2" value={requestText} onChange={(e) => setRequestText(e.target.value)} />
              <div className="mt-4 flex flex-wrap gap-3"><Button onClick={approveRequest} disabled={classification.status !== "Safe"}>Approve and find matches</Button><Button variant="outline" onClick={() => setRequestText("Can someone pick up alcohol and bring it to my dorm?")}>Try blocked example</Button><Button variant="outline" onClick={() => setRequestText("Text me at 530-123-4567 so we can coordinate")}>Try contact example</Button></div>
            </div></Card>
            <Card><div className="p-6"><SectionTitle icon={ShieldCheck} title="AI safety/classification" subtitle="Demo classifier output." />
              <div className="space-y-3"><div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><span className="font-semibold">Safety status</span><Pill tone={classification.status === "Safe" ? "good" : classification.status === "Blocked" ? "danger" : "warn"}>{classification.status}</Pill></div>
                <InfoRow label="Category" value={classification.category} /><InfoRow label="Effort" value={classification.effort || "—"} /><InfoRow label="Support need" value={classification.support || "—"} /><InfoRow label="Car" value={classification.car || "—"} />
                <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reason</p><p className="mt-1 text-sm text-slate-700">{classification.reason}</p></div>
              </div></div></Card>
          </motion.div>
        )}

        {screen === "matches" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-[.85fr_1fr]">
            <div className="space-y-6"><UserCard user={activeRequest.user} /><Card><div className="p-5"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Open request</p><h3 className="text-lg font-bold">{activeRequest.category}</h3><p className="mt-2 text-sm text-slate-600">{activeRequest.text}</p><div className="mt-4 flex flex-wrap gap-2"><Pill tone="blue"><Clock size={12} className="mr-1" />{activeRequest.time}</Pill><Pill tone="purple"><MapPin size={12} className="mr-1" />{activeRequest.from} → {activeRequest.to}</Pill><Pill tone="good"><Accessibility size={12} className="mr-1" />{activeRequest.support}</Pill></div></div></Card></div>
            <Card><div className="p-6"><SectionTitle icon={HeartHandshake} title="Best match" subtitle="Already Going matching reduces burden and improves reliability." /><UserCard user={bestMatch.user} /><div className="mt-5 rounded-3xl bg-emerald-50 p-5"><div className="mb-3 flex items-center gap-2 font-bold text-emerald-800"><CheckCircle2 size={20} /> Match score: 92%</div><ul className="space-y-2 text-sm text-emerald-900"><li>• Already going toward {activeRequest.from}</li><li>• Returning near {activeRequest.to}</li><li>• Available in your time window</li><li>• Can handle {activeRequest.effort.toLowerCase()} effort</li><li>• Verified campus account with strong reliability</li></ul></div><div className="mt-5 flex gap-3"><Button onClick={() => setScreen("consent")}>Accept match</Button><Button variant="outline">View other helpers</Button></div></div></Card>
          </motion.div>
        )}

        {screen === "consent" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-2">
            <Card><div className="p-6"><SectionTitle icon={Lock} title="ConsentShare" subtitle="Contact info sharing only turns on when both users explicitly opt in." /><div className="grid gap-4"><ConsentToggle name="Tanmmay" checked={contactA} onChange={setContactA} /><ConsentToggle name="Maya" checked={contactB} onChange={setContactB} /></div><div className={cn("mt-5 rounded-3xl p-5", contactSharingEnabled ? "bg-emerald-50" : "bg-amber-50")}><p className={cn("font-bold", contactSharingEnabled ? "text-emerald-800" : "text-amber-800")}>{contactSharingEnabled ? "Contact sharing enabled for this assist." : "Contact sharing is off for this assist."}</p><p className="mt-1 text-sm text-slate-600">{contactSharingEnabled ? "Users may share contact info, but CampusKind still recommends in-app planning and public meetups." : "Chat still works, but AI will block phone numbers, emails, social handles, and private addresses."}</p></div><Button className="mt-5" onClick={() => setScreen("safemeet")}>Continue to SafeMeet</Button></div></Card>
            <Card><div className="p-6"><SectionTitle icon={ShieldCheck} title="Safety checklist" subtitle="Both users accept this before chat opens." /><div className="space-y-3">{["Meet in public first.", "Keep exact dorm room/private address hidden.", "Do not exchange money.", "No alcohol, drugs, weapons, or illegal items.", "No medical or personal care.", "Cancel if uncomfortable."].map((item) => (<div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm"><CheckCircle2 size={18} className="text-emerald-600" /> {item}</div>))}</div></div></Card>
          </motion.div>
        )}

        {screen === "safemeet" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card><div className="p-6"><SectionTitle icon={MapPin} title="SafeMeet" subtitle="Neutral public meetup spots based on both users’ general areas." /><div className="grid gap-4 md:grid-cols-3">{relevantSafeSpots.map((spot, idx) => (<Card key={spot.name} className={idx === 0 ? "border-slate-900" : ""}><div className="p-5"><div className="mb-3 flex items-center justify-between"><Pill tone={idx === 0 ? "good" : "blue"}>{idx === 0 ? "Recommended" : "Backup"}</Pill><MapPin size={18} className="text-slate-500" /></div><h3 className="font-bold">{spot.name}</h3><p className="mt-1 text-sm text-slate-500">Best for {spot.bestFor}</p><div className="mt-4 flex flex-wrap gap-2">{spot.tags.map((t) => <Pill key={t}>{t}</Pill>)}</div></div></Card>))}</div><div className="mt-6 rounded-3xl bg-rose-50 p-5 text-rose-900"><div className="flex items-center gap-2 font-bold"><AlertTriangle size={20} /> Private meetup warning</div><p className="mt-1 text-sm">CampusKind does not recommend meeting inside private residences, apartments, or dorm rooms. Choose a public meetup spot instead.</p></div><Button className="mt-5" onClick={() => setScreen("chat")}>Open in-app chat</Button></div></Card>
          </motion.div>
        )}

        {screen === "chat" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-[1fr_.75fr]">
            <Card><div className="p-6"><SectionTitle icon={MessageCircle} title="In-app assist chat" subtitle="No open DMs. Chat is tied to this confirmed assist." /><div className="mb-4 rounded-2xl bg-slate-50 p-3 text-sm">Contact sharing: {contactSharingEnabled ? <Pill tone="good">Enabled by mutual consent</Pill> : <Pill tone="warn">Disabled — AI blocks contact info</Pill>}</div><div className="h-80 space-y-3 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4">{chatMessages.map((m, idx) => (<div key={idx} className={cn("rounded-2xl p-3 text-sm", m.system ? "bg-blue-50 text-blue-900" : m.from === currentUser.name ? "ml-auto max-w-[80%] bg-slate-900 text-white" : "max-w-[80%] bg-slate-100 text-slate-800")}><p className="mb-1 text-xs opacity-70">{m.from}</p><p>{m.text}</p></div>))}</div>{blockedNotice && <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-sm font-medium text-rose-800">{blockedNotice}</div>}<div className="mt-4 flex flex-wrap gap-2">{["Does 6 PM still work?", "Let’s meet at the suggested public spot.", "I’m here.", "I need to cancel.", "Thanks for helping!"].map((q) => (<Button key={q} variant="outline" onClick={() => setChatInput(q)}>{q}</Button>))}</div><div className="mt-4 flex gap-2"><input className="flex-1 rounded-2xl border border-slate-200 px-4 outline-none ring-slate-900 focus:ring-2" value={chatInput} onChange={(e) => setChatInput(e.target.value)} /><Button onClick={sendMessage}><Send size={18} /></Button></div></div></Card>
            <div className="space-y-6"><Card><div className="p-5"><h3 className="mb-3 font-bold">Assist lifecycle</h3><div className="grid gap-2"><Button><Clock size={16} className="mr-2 inline" />Start Assist</Button><Button variant="outline"><CheckCircle2 size={16} className="mr-2 inline" />Complete Assist</Button><Button variant="outline"><Share2 size={16} className="mr-2 inline" />Share with a Friend</Button><Button variant="outline"><Flag size={16} className="mr-2 inline" />Report Issue</Button></div></div></Card><Card><div className="p-5"><h3 className="mb-3 font-bold">Friend check-in preview</h3><div className="rounded-2xl bg-slate-900 p-4 text-sm text-white">Tanmmay is meeting Maya for a grocery assist near Trader Joe’s from 6:00–6:30 PM.</div></div></Card></div>
          </motion.div>
        )}

        {screen === "admin" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-[.85fr_1fr]">
            <Card><div className="p-6"><SectionTitle icon={Star} title="Impact dashboard" subtitle="Shows judges the community value." /><div className="grid gap-3">{[["128", "total assists completed"], ["43", "grocery/carrying assists"], ["31", "walking buddy assists"], ["18", "accessibility-support assists"], ["22", "students helped without cars"]].map(([n, label]) => (<div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><span className="text-sm text-slate-600">{label}</span><span className="text-2xl font-black">{n}</span></div>))}</div></div></Card>
            <Card><div className="p-6"><SectionTitle icon={AlertTriangle} title="Safety moderation dashboard" subtitle="AI flags unsafe requests and contact-sharing violations." /><div className="space-y-3">{flaggedExamples.map((f) => (<div key={f.text} className="rounded-2xl border border-slate-200 p-4"><div className="mb-2 flex items-center justify-between gap-3"><p className="font-medium">“{f.text}”</p><Pill tone={f.status === "Blocked" ? "danger" : "warn"}>{f.status}</Pill></div><p className="text-sm text-slate-500">Reason: {f.reason}</p></div>))}</div></div></Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
