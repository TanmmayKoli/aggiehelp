"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  HeartHandshake,
  Loader2,
  LogOut,
  MapPin,
  MessageCircle,
  Navigation,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { supabase, supabaseConfigReady } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  campus_area: string | null;
  verification_level: string | null;
  completed_assists: number | null;
  reliability_score: number | null;
};

type AssistRequest = {
  id: string;
  requester_id: string;
  title: string;
  description: string;
  category: string | null;
  from_area: string | null;
  to_area: string | null;
  time_window: string | null;
  effort_level: string | null;
  support_need: string | null;
  requires_car: boolean | null;
  safety_status: string | null;
  status: string | null;
  created_at: string;
};

type AssistOffer = {
  id: string;
  helper_id: string;
  request_id: string;
  description: string;
  category: string | null;
  from_area: string | null;
  to_area: string | null;
  time_window: string | null;
  has_car: boolean | null;
  max_effort: string | null;
  status: string | null;
  created_at: string;
};

type Match = {
  id: string;
  request_id: string;
  offer_id: string;
  requester_id: string;
  helper_id: string;
  requester_accepted: boolean | null;
  helper_confirmed: boolean | null;
  requester_contact_consent: boolean | null;
  helper_contact_consent: boolean | null;
  contact_sharing_enabled: boolean | null;
  safe_spot_id: string | null;
  status: string | null;
  created_at: string;
};

type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  moderation_status: string | null;
  blocked_reason: string | null;
  created_at: string;
};

type SafeSpot = {
  id: string;
  name: string;
  area: string | null;
  lat: number | null;
  lng: number | null;
  type: string | null;
  tags: string[] | null;
  description: string | null;
};

type Report = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  match_id: string | null;
  reason: string | null;
  description: string | null;
  status: string | null;
  created_at: string;
};

type Classification = {
  ok: boolean;
  category: string;
  reason: string;
  support: string;
  effort: string;
  requiresCar: boolean;
  fromArea: string;
  toArea: string;
  title: string;
};

type ModerationCategory = "contact_info" | "prohibited_content" | "private_meetup";

type ModerationResult = {
  category: ModerationCategory;
  senderReason: string;
  receiverReason: string;
};

type MainTab =
  | "dashboard"
  | "create_request"
  | "my_requests"
  | "open_requests"
  | "my_offers"
  | "matches"
  | "safety"
  | "admin_dashboard"
  | "users"
  | "requests"
  | "blocked_messages"
  | "reports";

type MatchTab = "overview" | "consent" | "safemeet" | "chat" | "safety";

type DeviceLocation = {
  lat: number;
  lng: number;
};

const demoAccounts = [
  { label: "Tanmmay", email: "tanmmay@ucdavis.edu", password: "Tanmmay123!" },
  { label: "Maya", email: "maya@ucdavis.edu", password: "Maya123!" },
  { label: "Alex", email: "alex@ucdavis.edu", password: "Alex123!" },
  { label: "Priya", email: "priya@ucdavis.edu", password: "Priya123!" },
  { label: "Admin", email: "admin@ucdavis.edu", password: "Admin123!" },
];

const areaCoords: Record<string, { lat: number; lng: number }> = {
  Tercero: { lat: 38.5377, lng: -121.7528 },
  Segundo: { lat: 38.5421, lng: -121.761 },
  "Shields Library": { lat: 38.5393, lng: -121.7498 },
  "Memorial Union": { lat: 38.5424, lng: -121.7493 },
  "Trader Joe's": { lat: 38.5467, lng: -121.7602 },
  Safeway: { lat: 38.5515, lng: -121.7627 },
  Silo: { lat: 38.5399, lng: -121.7538 },
  Campus: { lat: 38.5382, lng: -121.7617 },
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isAdmin(profile: Profile | null) {
  return profile?.role === "admin" || profile?.role === "moderator";
}

function isHelper(profile: Profile | null) {
  return profile?.role === "helper" || profile?.email === "alex@ucdavis.edu";
}

function isRequester(profile: Profile | null) {
  return profile?.role === "requester";
}

function prettyRole(role?: string | null) {
  if (!role) return "Student";
  if (role === "moderator") return "Admin / Moderator";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function classifyRequest(text: string): Classification {
  const lower = text.toLowerCase();
  const blockedTerms = [
    "alcohol",
    "drugs",
    "weed",
    "weapon",
    "cash loan",
    "medical care",
    "personal care",
    "emergency",
    "apartment",
    "dorm room",
    "bedroom",
    "room 312",
    "my house",
    "come inside",
    "private address",
    "sexual",
    "romantic",
  ];
  const blocked = blockedTerms.find((term) => lower.includes(term));

  let category = "General Assist";
  if (/(grocery|groceries|trader joe|safeway)/i.test(text)) category = "Grocery / Carrying";
  if (/(walk|walking|night|library|segundo)/i.test(text)) category = "Walking Buddy";
  if (/(boxes|moving|carry)/i.test(text)) category = "Small Item Carrying";
  if (/(crutches|ankle|injured)/i.test(text)) category = "Mobility support";

  const fromArea = lower.includes("trader joe")
    ? "Trader Joe's"
    : lower.includes("safeway")
      ? "Safeway"
      : lower.includes("shields")
        ? "Shields Library"
        : lower.includes("segundo")
          ? "Segundo"
          : "Campus";
  const toArea = lower.includes("tercero")
    ? "Tercero"
    : lower.includes("segundo")
      ? "Segundo"
      : lower.includes("silo")
        ? "Silo"
        : "Campus";

  return {
    ok: !blocked,
    category,
    reason: blocked
      ? `Blocked because the request mentions "${blocked}". AggieHelp routes assists to public SafeMeet spots and does not allow private rooms, prohibited items, emergencies, or medical/personal care.`
      : "Looks like a small voluntary assist that can be coordinated through AggieHelp.",
    support: /(crutches|ankle|injured)/i.test(text) ? "Mobility support" : "Peer assist",
    effort: /(boxes|moving|carry|grocery|groceries)/i.test(text) ? "Medium" : "Low",
    requiresCar: /(grocery|groceries|trader joe|safeway)/i.test(text),
    fromArea,
    toArea,
    title: category === "Grocery / Carrying" ? "Help carrying groceries" : category,
  };
}

function moderateMessage(text: string, contactSharingEnabled: boolean): ModerationResult | null {
  const privatePlace = /(apartment|dorm room|bedroom|room\s*\d+|come inside|my house|private address)/i.exec(text);
  if (privatePlace) {
    return {
      category: "private_meetup",
      senderReason: "AggieHelp recommends SafeMeet public meetup spots instead of private residences, dorm rooms, or bedrooms.",
      receiverReason: "A private meetup message was blocked by AggieHelp.",
    };
  }

  const prohibited = /(alcohol|drugs|weed|weapon|cash loan|medical care|personal care|emergency|unsafe task)/i.exec(text);
  if (prohibited) {
    return {
      category: "prohibited_content",
      senderReason:
        "Your message was blocked because it violates AggieHelp safety rules. AggieHelp does not allow alcohol, drugs, weapons, cash loans, medical/personal care, emergencies, private-room meetups, or unsafe tasks.",
      receiverReason: "An unsafe message was blocked by AggieHelp.",
    };
  }

  if (!contactSharingEnabled) {
    const contact = /(\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|[\w.-]+@[\w.-]+\.\w+|@\w+|text me|call me|instagram|snapchat|discord)/i.exec(text);
    if (contact) {
      return {
      category: "contact_info",
      senderReason: "Your message was blocked because contact sharing is off for this assist.",
      receiverReason: "A contact-sharing message was blocked because consent is off.",
      };
    }
  }

  return null;
}

function encodeBlockedReason(result: ModerationResult) {
  return JSON.stringify(result);
}

function decodeBlockedReason(reason: string | null): ModerationResult {
  if (reason) {
    try {
      const parsed = JSON.parse(reason) as ModerationResult;
      if (parsed.category && parsed.senderReason && parsed.receiverReason) return parsed;
    } catch {
      if (reason.toLowerCase().includes("contact")) {
        return {
          category: "contact_info",
          senderReason: "Your message was blocked because contact sharing is off for this assist.",
          receiverReason: "A contact-sharing message was blocked because consent is off.",
        };
      }
      if (reason.toLowerCase().includes("private") || reason.toLowerCase().includes("safemeet")) {
        return {
          category: "private_meetup",
          senderReason: "AggieHelp recommends SafeMeet public meetup spots instead of private residences, dorm rooms, or bedrooms.",
          receiverReason: "A private meetup message was blocked by AggieHelp.",
        };
      }
    }
  }

  return {
    category: "prohibited_content",
    senderReason:
      "Your message was blocked because it violates AggieHelp safety rules. AggieHelp does not allow alcohol, drugs, weapons, cash loans, medical/personal care, emergencies, private-room meetups, or unsafe tasks.",
    receiverReason: "An unsafe message was blocked by AggieHelp.",
  };
}

function distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthMiles = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthMiles * Math.asin(Math.sqrt(h));
}

function walkMinutes(area: string | null | undefined, spot: SafeSpot) {
  const start = area && areaCoords[area] ? areaCoords[area] : areaCoords.Campus;
  const end = spot.lat && spot.lng ? { lat: spot.lat, lng: spot.lng } : areaCoords[spot.area || "Campus"] || areaCoords.Campus;
  return Math.max(2, Math.round((distanceMiles(start, end) / 3) * 60));
}

function walkMinutesFromCoord(start: DeviceLocation, spot: SafeSpot) {
  const end = spot.lat && spot.lng ? { lat: spot.lat, lng: spot.lng } : areaCoords[spot.area || "Campus"] || areaCoords.Campus;
  return Math.max(2, Math.round((distanceMiles(start, end) / 3) * 60));
}

function mapsSearchUrl(spot: SafeSpot) {
  const coord = spot.lat && spot.lng ? `${spot.lat},${spot.lng}` : encodeURIComponent(spot.name);
  return `https://www.google.com/maps/search/?api=1&query=${coord}`;
}

function mapsDirectionsUrl(origin: DeviceLocation | null, spot: SafeSpot) {
  if (!origin || !spot.lat || !spot.lng) return mapsSearchUrl(spot);
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${spot.lat},${spot.lng}&travelmode=walking`;
}

function safeSpotScore(spot: SafeSpot, midpoint: DeviceLocation) {
  const tags = (spot.tags || []).join(" ").toLowerCase();
  const safetyBoost = ["public", "busy", "visible", "well-lit", "campus landmark", "public lobby"].reduce(
    (score, tag) => score + (tags.includes(tag) ? 0.08 : 0),
    0,
  );
  const end = spot.lat && spot.lng ? { lat: spot.lat, lng: spot.lng } : areaCoords[spot.area || "Campus"] || areaCoords.Campus;
  return distanceMiles(midpoint, end) - safetyBoost;
}

function Button({
  children,
  onClick,
  type = "button",
  variant = "solid",
  disabled = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "solid" | "outline" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "solid" && "bg-aggie-blue text-white hover:bg-slate-800",
        variant === "outline" && "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-lg border border-slate-200 bg-white shadow-sm", className)}>{children}</section>;
}

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "amber" | "red" | "blue" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-rose-100 text-rose-800",
    blue: "bg-blue-100 text-blue-800",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold", tones[tone])}>{children}</span>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-950 outline-none ring-aggie-gold/30 transition focus:border-aggie-blue focus:ring-4"
      />
    </label>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">{children}</div>;
}

export default function AggieHelpApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<AssistRequest[]>([]);
  const [offers, setOffers] = useState<AssistOffer[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [safeSpots, setSafeSpots] = useState<SafeSpot[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("tanmmay@ucdavis.edu");
  const [password, setPassword] = useState("Tanmmay123!");
  const [requestText, setRequestText] = useState("I'm on crutches and need help carrying groceries from Trader Joe's to Tercero tonight.");
  const [offerTextByRequest, setOfferTextByRequest] = useState<Record<string, string>>({});
  const [chatByMatch, setChatByMatch] = useState<Record<string, string>>({});
  const [mainTab, setMainTab] = useState<MainTab>("dashboard");
  const [matchTabs, setMatchTabs] = useState<Record<string, MatchTab>>({});
  const [deviceLocation, setDeviceLocation] = useState<DeviceLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState("Using campus area for ETA.");

  const profileById = useMemo(() => new Map(profiles.map((item) => [item.id, item])), [profiles]);
  const requestById = useMemo(() => new Map(requests.map((item) => [item.id, item])), [requests]);
  const offerById = useMemo(() => new Map(offers.map((item) => [item.id, item])), [offers]);
  const myMatches = matches.filter((match) => match.requester_id === profile?.id || match.helper_id === profile?.id || isAdmin(profile));
  const activeMatches = myMatches.filter((match) => match.status === "active");
  const classification = useMemo(() => classifyRequest(requestText), [requestText]);

  useEffect(() => {
    if (!profile) return;
    if (isAdmin(profile)) setMainTab("admin_dashboard");
    else setMainTab("dashboard");
  }, [profile?.id]);

  async function loadProfile(userId: string) {
    if (!supabase) return null;
    const { data, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (profileError) throw profileError;
    setProfile(data);
    return data as Profile | null;
  }

  async function refresh(userId = session?.user.id) {
    if (!supabase || !userId) return;
    setError("");
    const currentProfile = await loadProfile(userId);
    if (!currentProfile) {
      setProfiles([]);
      setRequests([]);
      setOffers([]);
      setMatches([]);
      setMessages([]);
      setSafeSpots([]);
      setReports([]);
      return;
    }

    const [profilesRes, requestsRes, offersRes, matchesRes, safeSpotsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("name"),
      supabase.from("assist_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("assist_offers").select("*").order("created_at", { ascending: false }),
      supabase.from("matches").select("*").order("created_at", { ascending: false }),
      supabase.from("safe_spots").select("*").order("name"),
    ]);

    for (const result of [profilesRes, requestsRes, offersRes, matchesRes, safeSpotsRes]) {
      if (result.error) throw result.error;
    }

    setProfiles((profilesRes.data || []) as Profile[]);
    setRequests((requestsRes.data || []) as AssistRequest[]);
    setOffers((offersRes.data || []) as AssistOffer[]);
    const matchRows = (matchesRes.data || []) as Match[];
    setMatches(matchRows);
    setSafeSpots((safeSpotsRes.data || []) as SafeSpot[]);

    if (matchRows.length) {
      const matchIds = matchRows.map((match) => match.id);
      const { data, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .in("match_id", matchIds)
        .order("created_at", { ascending: true });
      if (messagesError) throw messagesError;
      setMessages((data || []) as Message[]);
    } else {
      setMessages([]);
    }

    if (isAdmin(currentProfile)) {
      const [reportsRes, blockedMessagesRes] = await Promise.all([
        supabase.from("reports").select("*").order("created_at", { ascending: false }),
        supabase.from("messages").select("*").eq("moderation_status", "blocked").order("created_at", { ascending: false }),
      ]);
      if (reportsRes.error) throw reportsRes.error;
      if (blockedMessagesRes.error) throw blockedMessagesRes.error;
      setReports((reportsRes.data || []) as Report[]);
      setMessages((previous) => {
        const seen = new Map(previous.map((message) => [message.id, message]));
        for (const message of (blockedMessagesRes.data || []) as Message[]) seen.set(message.id, message);
        return Array.from(seen.values()).sort((a, b) => a.created_at.localeCompare(b.created_at));
      });
    } else {
      setReports([]);
    }
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user.id) {
        try {
          await refresh(data.session.user.id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not load AggieHelp data.");
        }
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user.id) {
        refresh(nextSession.user.id).catch((err) => setError(err instanceof Error ? err.message : "Could not refresh session."));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user.id || !profile) return;

    const channel = supabase
      .channel("aggiehelp-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "assist_requests" }, () => refresh().catch(console.error))
      .on("postgres_changes", { event: "*", schema: "public", table: "assist_offers" }, () => refresh().catch(console.error))
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => refresh().catch(console.error))
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => refresh().catch(console.error))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const next = payload.new as Message;
        setMessages((current) => (current.some((message) => message.id === next.id) ? current : [...current, next]));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, profile?.id]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
    setBusy(false);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  async function createRequest() {
    if (!supabase || !profile || !classification.ok) return;
    setBusy(true);
    setError("");
    const { error: insertError } = await supabase.from("assist_requests").insert({
      requester_id: profile.id,
      title: classification.title,
      description: requestText.trim(),
      category: classification.category,
      from_area: classification.fromArea,
      to_area: classification.toArea,
      time_window: "Tonight",
      effort_level: classification.effort,
      support_need: classification.support,
      requires_car: classification.requiresCar,
      safety_status: "safe",
      status: "open",
    });
    if (insertError) setError(insertError.message);
    else {
      setRequestText("");
      await refresh();
    }
    setBusy(false);
  }

  async function offerHelp(request: AssistRequest) {
    if (!supabase || !profile) return;
    setBusy(true);
    const description =
      offerTextByRequest[request.id]?.trim() ||
      `I can help with "${request.title}" near ${request.from_area || "campus"} and coordinate through AggieHelp.`;
    const { error: insertError } = await supabase.from("assist_offers").insert({
      helper_id: profile.id,
      request_id: request.id,
      description,
      category: request.category,
      from_area: request.from_area,
      to_area: request.to_area,
      time_window: request.time_window,
      has_car: request.requires_car,
      max_effort: request.effort_level,
      status: "open",
    });
    if (insertError) setError(insertError.message);
    else await refresh();
    setBusy(false);
  }

  async function acceptOffer(offer: AssistOffer) {
    if (!supabase || !profile) return;
    const request = requestById.get(offer.request_id);
    if (!request) return;
    setBusy(true);
    const { error: insertError } = await supabase.from("matches").insert({
      request_id: request.id,
      offer_id: offer.id,
      requester_id: profile.id,
      helper_id: offer.helper_id,
      requester_accepted: true,
      helper_confirmed: false,
      status: "pending_helper_confirmation",
    });
    if (insertError) setError(insertError.message);
    else {
      await supabase.from("assist_offers").update({ status: "matched" }).eq("id", offer.id);
      await refresh();
    }
    setBusy(false);
  }

  async function confirmMatch(match: Match) {
    if (!supabase) return;
    setBusy(true);
    const { error: updateError } = await supabase
      .from("matches")
      .update({ helper_confirmed: true, status: "active" })
      .eq("id", match.id);
    if (updateError) setError(updateError.message);
    else await refresh();
    setBusy(false);
  }

  async function updateConsent(match: Match, field: "requester_contact_consent" | "helper_contact_consent", value: boolean) {
    if (!supabase) return;
    const requesterConsent = field === "requester_contact_consent" ? value : Boolean(match.requester_contact_consent);
    const helperConsent = field === "helper_contact_consent" ? value : Boolean(match.helper_contact_consent);
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        [field]: value,
        contact_sharing_enabled: requesterConsent && helperConsent,
      })
      .eq("id", match.id);
    if (updateError) setError(updateError.message);
    else await refresh();
  }

  async function sendMessage(match: Match) {
    if (!supabase || !profile) return;
    const body = chatByMatch[match.id]?.trim();
    if (!body) return;
    const moderation = moderateMessage(body, Boolean(match.contact_sharing_enabled));
    const { error: insertError } = await supabase.from("messages").insert({
      match_id: match.id,
      sender_id: profile.id,
      body,
      moderation_status: moderation ? "blocked" : "allowed",
      blocked_reason: moderation ? encodeBlockedReason(moderation) : null,
    });
    if (insertError) setError(insertError.message);
    else {
      setChatByMatch((current) => ({ ...current, [match.id]: "" }));
      await refresh();
    }
  }

  async function reportMessage(message: Message, match: Match) {
    if (!supabase || !profile || message.sender_id === profile.id || message.moderation_status === "blocked") return;
    const { error: reportError } = await supabase.from("reports").insert({
      reporter_id: profile.id,
      reported_user_id: message.sender_id,
      match_id: match.id,
      reason: "message_report",
      description: message.body,
      status: "open",
    });
    if (reportError) setError(reportError.message);
    else await refresh();
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Location is not available in this browser. Using campus area instead.");
      return;
    }

    setLocationStatus("Requesting location permission...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeviceLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("Using your current location for ETA");
      },
      () => {
        setDeviceLocation(null);
        setLocationStatus("Location permission denied. Using campus area instead.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }

  if (!supabaseConfigReady) {
    return (
      <main className="min-h-screen bg-campus-mist p-4 text-slate-950 md:p-8">
        <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center">
          <Card className="w-full p-8">
            <div className="mb-5 inline-flex rounded-lg bg-amber-100 p-3 text-amber-800">
              <AlertTriangle size={24} />
            </div>
            <h1 className="text-3xl font-black">AggieHelp needs Supabase env vars</h1>
            <p className="mt-3 text-slate-600">
              Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` locally and in Vercel. The app is intentionally showing this setup screen instead of crashing or hardcoding keys.
            </p>
          </Card>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-campus-mist text-slate-700">
        <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-4 shadow-sm">
          <Loader2 className="animate-spin" size={20} /> Loading AggieHelp
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d9ecff,transparent_35%),linear-gradient(135deg,#f8fafc,#fff7df)] p-4 text-slate-950 md:p-8">
        <div className="mx-auto grid min-h-[88vh] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_.85fr]">
          <div>
            <div className="mb-5 inline-flex rounded-lg bg-aggie-blue p-3 text-white shadow-lg">
              <HeartHandshake size={30} />
            </div>
            <h1 className="max-w-2xl text-5xl font-black leading-tight tracking-tight md:text-6xl">AggieHelp</h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600">
              Verified student mutual aid for small, safe assists.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Pill tone="green">Supabase Auth</Pill>
              <Pill tone="blue">Realtime assists</Pill>
              <Pill tone="amber">Hackathon demo ready</Pill>
            </div>
          </div>
          <Card className="p-6">
            <h2 className="text-2xl font-black">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">Use one of the demo accounts created in Supabase Auth.</p>
            <form className="mt-6 space-y-4" onSubmit={signIn}>
              <Field label="Email" value={email} onChange={setEmail} placeholder="tanmmay@ucdavis.edu" />
              <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Demo password" />
              {error && <div className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-800">{error}</div>}
              <Button type="submit" disabled={busy} className="w-full">
                {busy && <Loader2 className="animate-spin" size={16} />} Sign in
              </Button>
            </form>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {demoAccounts.map((account) => (
                <Button
                  key={account.email}
                  variant="outline"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                  }}
                >
                  Quick-fill {account.label}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-campus-mist p-4 text-slate-950 md:p-8">
        <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center">
          <Card className="w-full p-8">
            <div className="mb-4 inline-flex rounded-lg bg-rose-100 p-3 text-rose-700">
              <AlertTriangle size={24} />
            </div>
            <h1 className="text-3xl font-black">Profile not found</h1>
            <p className="mt-3 text-slate-600">
              This Supabase Auth user exists, but there is no matching `public.profiles` row. Ask the admin to run `supabase/seed-profiles.sql` after creating the demo auth users.
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => refresh(session.user.id)}>Refresh</Button>
              <Button variant="outline" onClick={signOut}>Sign out</Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  const openRequests = requests.filter((request) => request.status === "open");
  const myRequests = requests.filter((request) => request.requester_id === profile.id);
  const myOffers = offers.filter((offer) => offer.helper_id === profile.id);
  const offersReceived = offers.filter((offer) => myRequests.some((request) => request.id === offer.request_id));
  const pendingHelperMatches = matches.filter((match) => match.helper_id === profile.id && match.status === "pending_helper_confirmation");
  const blockedMessages = messages.filter((message) => message.moderation_status === "blocked");
  const navItems: Array<{ key: MainTab; label: string }> = isAdmin(profile)
    ? [
        { key: "admin_dashboard", label: "Admin Dashboard" },
        { key: "users", label: "Users" },
        { key: "requests", label: "Requests" },
        { key: "matches", label: "Matches" },
        { key: "blocked_messages", label: "Blocked Messages" },
        { key: "reports", label: "Reports" },
      ]
    : isHelper(profile)
      ? [
          { key: "dashboard", label: "Dashboard" },
          { key: "open_requests", label: "Open Requests" },
          { key: "my_offers", label: "My Offers" },
          { key: "matches", label: "Matches" },
          { key: "safety", label: "Safety" },
        ]
      : [
          { key: "dashboard", label: "Dashboard" },
          { key: "create_request", label: "Create Request" },
          { key: "my_requests", label: "My Requests" },
          { key: "matches", label: "Matches" },
          { key: "safety", label: "Safety" },
        ];

  return (
    <main className="min-h-screen bg-campus-mist p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-aggie-blue text-white">
              <HeartHandshake size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">AggieHelp</h1>
              <p className="text-sm text-slate-500">Small assists. Stronger campus.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="blue"><UserCheck size={13} /> {profile.name} · {prettyRole(profile.role)}</Pill>
            <Button variant="outline" onClick={() => refresh()}><RefreshCw size={16} /> Refresh</Button>
            <Button variant="ghost" onClick={signOut}><LogOut size={16} /> Sign out</Button>
          </div>
        </header>

        {error && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">{error}</div>}

        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setMainTab(item.key)}
              className={cn(
                "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition",
                mainTab === item.key ? "bg-aggie-blue text-white shadow-sm" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          {([
            ["Open requests", openRequests.length, HeartHandshake],
            ["Offers", offers.length, Users],
            ["Active matches", activeMatches.length, CheckCircle2],
            ["Safe spots", safeSpots.length, MapPin],
          ] as Array<[string, number, React.ElementType]>).map(([label, value, Icon]) => (
            <Card key={String(label)} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{String(label)}</p>
                  <p className="text-3xl font-black">{String(value)}</p>
                </div>
                <div className="rounded-lg bg-slate-100 p-3 text-aggie-blue"><Icon size={22} /></div>
              </div>
            </Card>
          ))}
        </section>

        {!isAdmin(profile) && mainTab === "dashboard" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <SectionHeader icon={ShieldCheck} title={`${profile.name}'s Dashboard`} subtitle="Your role-based AggieHelp workspace." />
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric label={isRequester(profile) ? "My requests" : "Open requests"} value={isRequester(profile) ? myRequests.length : openRequests.length} />
                <Metric label={isRequester(profile) ? "Offers received" : "My offers"} value={isRequester(profile) ? offersReceived.length : myOffers.length} />
                <Metric label="My matches" value={myMatches.length} />
                <Metric label="Active assists" value={activeMatches.length} />
              </div>
            </Card>
            <SafetyPanel />
          </div>
        )}

        {!isAdmin(profile) && mainTab === "safety" && <SafetyPanel />}

        {isRequester(profile) && mainTab === "create_request" && (
          <RequestComposer
            requestText={requestText}
            setRequestText={setRequestText}
            classification={classification}
            createRequest={createRequest}
            busy={busy}
          />
        )}

        {isRequester(profile) && mainTab === "my_requests" && (
          <div className="grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
            <RequestList title="My Requests" requests={myRequests} profileById={profileById} />
            <OffersReceived offers={offersReceived} profileById={profileById} matches={matches} acceptOffer={acceptOffer} busy={busy} />
          </div>
        )}

        {isHelper(profile) && mainTab === "open_requests" && (
          <OpenRequestsPanel
            openRequests={openRequests}
            profile={profile}
            offerTextByRequest={offerTextByRequest}
            setOfferTextByRequest={setOfferTextByRequest}
            offerHelp={offerHelp}
            busy={busy}
          />
        )}

        {isHelper(profile) && mainTab === "my_offers" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <OfferList title="My Offers" offers={myOffers} requestById={requestById} />
            <PendingConfirmations matches={pendingHelperMatches} requestById={requestById} confirmMatch={confirmMatch} busy={busy} />
          </div>
        )}

        {!isAdmin(profile) && mainTab === "matches" && (
          <MatchWorkspace
            matches={myMatches}
            {...{
              profile,
              profiles,
              profileById,
              requestById,
              offerById,
              messages,
              safeSpots,
              chatByMatch,
              setChatByMatch,
              updateConsent,
              sendMessage,
              reportMessage,
              matchTabs,
              setMatchTabs,
              deviceLocation,
              locationStatus,
              useCurrentLocation,
            }}
          />
        )}

        {isAdmin(profile) && mainTab === "admin_dashboard" && (
          <Card className="p-5">
            <SectionHeader icon={ShieldCheck} title="Admin Dashboard" subtitle="Moderation, reports, and complete demo data." />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Profiles" value={profiles.length} />
              <Metric label="Reports" value={reports.length} />
              <Metric label="Blocked messages" value={blockedMessages.length} />
              <Metric label="Matches" value={matches.length} />
            </div>
          </Card>
        )}

        {isAdmin(profile) && mainTab === "users" && <ProfilesPanel profiles={profiles} />}
        {isAdmin(profile) && mainTab === "requests" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <RequestList title="All Requests" requests={requests} profileById={profileById} />
            <OfferList title="All Offers" offers={offers} requestById={requestById} />
          </div>
        )}
        {isAdmin(profile) && mainTab === "matches" && (
          <MatchWorkspace
            matches={matches}
            {...{
              profile,
              profiles,
              profileById,
              requestById,
              offerById,
              messages,
              safeSpots,
              chatByMatch,
              setChatByMatch,
              updateConsent,
              sendMessage,
              reportMessage,
              matchTabs,
              setMatchTabs,
              deviceLocation,
              locationStatus,
              useCurrentLocation,
            }}
          />
        )}
        {isAdmin(profile) && mainTab === "blocked_messages" && <BlockedMessagesPanel messages={blockedMessages} profileById={profileById} />}
        {isAdmin(profile) && mainTab === "reports" && <ReportsPanel reports={reports} />}
      </div>
    </main>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="rounded-lg bg-aggie-blue p-2 text-white"><Icon size={18} /></div>
      <div>
        <h2 className="text-lg font-black">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}

function RequestList({ title, requests, profileById }: { title: string; requests: AssistRequest[]; profileById: Map<string, Profile> }) {
  return (
    <Card className="p-5">
      <SectionHeader icon={Clock} title={title} />
      <div className="space-y-3">
        {requests.length === 0 && <EmptyState>No requests to show.</EmptyState>}
        {requests.map((request) => (
          <div key={request.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">{request.title}</p>
                <p className="mt-1 text-sm text-slate-600">{request.description}</p>
                <p className="mt-2 text-xs text-slate-500">Requester: {profileById.get(request.requester_id)?.name || "Unknown"}</p>
              </div>
              <Pill tone={request.status === "open" ? "green" : "slate"}>{request.status}</Pill>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="blue">{request.category}</Pill>
              <Pill>{request.from_area} to {request.to_area}</Pill>
              <Pill>{request.effort_level}</Pill>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function OfferList({ title, offers, requestById }: { title: string; offers: AssistOffer[]; requestById: Map<string, AssistRequest> }) {
  return (
    <Card className="p-5">
      <SectionHeader icon={HeartHandshake} title={title} />
      <div className="space-y-3">
        {offers.length === 0 && <EmptyState>No offers to show.</EmptyState>}
        {offers.map((offer) => (
          <div key={offer.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">{requestById.get(offer.request_id)?.title || "Offer"}</p>
                <p className="mt-1 text-sm text-slate-600">{offer.description}</p>
              </div>
              <Pill tone={offer.status === "open" ? "green" : "slate"}>{offer.status}</Pill>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RequestComposer({
  requestText,
  setRequestText,
  classification,
  createRequest,
  busy,
}: {
  requestText: string;
  setRequestText: (value: string) => void;
  classification: Classification;
  createRequest: () => Promise<void>;
  busy: boolean;
}) {
  return (
    <Card className="p-5">
      <SectionHeader icon={Sparkles} title="Create Request" subtitle="AggieHelp checks safety before saving a request." />
      <textarea
        className="min-h-40 w-full rounded-lg border border-slate-200 p-4 outline-none ring-aggie-gold/30 focus:border-aggie-blue focus:ring-4"
        value={requestText}
        onChange={(event) => setRequestText(event.target.value)}
        placeholder="Describe the small assist you need. Use public campus areas, not private addresses."
      />
      <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Pill tone={classification.ok ? "green" : "red"}>{classification.ok ? "Safe" : "Blocked"}</Pill>
          <Pill tone="blue">{classification.category}</Pill>
          <Pill>{classification.fromArea} to {classification.toArea}</Pill>
        </div>
        <p className={classification.ok ? "text-slate-600" : "font-medium text-rose-800"}>{classification.reason}</p>
      </div>
      <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        Use public meetup locations or campus areas, such as Memorial Union, Shields Library, Tercero Services Center, Trader Joe's Entrance, or Silo.
      </div>
      <Button className="mt-4 w-full" onClick={createRequest} disabled={busy || !classification.ok || !requestText.trim()}>
        Create request
      </Button>
    </Card>
  );
}

function OffersReceived({
  offers,
  profileById,
  matches,
  acceptOffer,
  busy,
}: {
  offers: AssistOffer[];
  profileById: Map<string, Profile>;
  matches: Match[];
  acceptOffer: (offer: AssistOffer) => Promise<void>;
  busy: boolean;
}) {
  return (
    <Card className="p-5">
      <SectionHeader icon={HeartHandshake} title="Offers Received" subtitle="Accept one to create a pending match." />
      <div className="space-y-3">
        {offers.length === 0 && <EmptyState>No offers yet. Helpers will see open requests in realtime.</EmptyState>}
        {offers.map((offer) => {
          const helper = profileById.get(offer.helper_id);
          const matched = matches.some((match) => match.offer_id === offer.id);
          return (
            <div key={offer.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-bold">{helper?.name || "Helper"}</p>
                  <p className="mt-1 text-sm text-slate-600">{offer.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Pill>{offer.category}</Pill>
                    {offer.has_car && <Pill tone="green">Has car</Pill>}
                  </div>
                </div>
                <Button disabled={busy || matched} onClick={() => acceptOffer(offer)}>
                  {matched ? "Match created" : "Accept offer"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function OpenRequestsPanel({
  openRequests,
  profile,
  offerTextByRequest,
  setOfferTextByRequest,
  offerHelp,
  busy,
}: {
  openRequests: AssistRequest[];
  profile: Profile;
  offerTextByRequest: Record<string, string>;
  setOfferTextByRequest: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  offerHelp: (request: AssistRequest) => Promise<void>;
  busy: boolean;
}) {
  return (
    <Card className="p-5">
      <SectionHeader icon={HeartHandshake} title="Open Requests" subtitle="Offer help without bypassing requester acceptance." />
      <div className="space-y-4">
        {openRequests.length === 0 && <EmptyState>No open requests yet.</EmptyState>}
        {openRequests.map((request) => (
          <div key={request.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-bold">{request.title}</p>
                <p className="mt-1 text-sm text-slate-600">{request.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill tone="blue">{request.category}</Pill>
                  <Pill>{request.from_area} to {request.to_area}</Pill>
                  {request.requires_car && <Pill tone="amber">Car helpful</Pill>}
                </div>
              </div>
              <div className="w-full lg:w-80">
                <textarea
                  className="min-h-20 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-aggie-blue"
                  value={offerTextByRequest[request.id] || ""}
                  onChange={(event) => setOfferTextByRequest((current) => ({ ...current, [request.id]: event.target.value }))}
                  placeholder="Optional offer note..."
                />
                <Button className="mt-2 w-full" onClick={() => offerHelp(request)} disabled={busy || request.requester_id === profile.id}>
                  Offer Help
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PendingConfirmations({
  matches,
  requestById,
  confirmMatch,
  busy,
}: {
  matches: Match[];
  requestById: Map<string, AssistRequest>;
  confirmMatch: (match: Match) => Promise<void>;
  busy: boolean;
}) {
  return (
    <Card className="p-5">
      <SectionHeader icon={CheckCircle2} title="Pending Matches To Confirm" subtitle="Requester accepted. Helper confirms to activate." />
      <div className="space-y-3">
        {matches.length === 0 && <EmptyState>No pending confirmations.</EmptyState>}
        {matches.map((match) => (
          <div key={match.id} className="rounded-lg border border-slate-200 p-4">
            <p className="font-bold">{requestById.get(match.request_id)?.title || "Assist match"}</p>
            <p className="mt-1 text-sm text-slate-600">{requestById.get(match.request_id)?.description}</p>
            <Button className="mt-3" onClick={() => confirmMatch(match)} disabled={busy}>Confirm Match</Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SafetyPanel() {
  return (
    <Card className="p-5">
      <SectionHeader icon={ShieldCheck} title="Safety" subtitle="AggieHelp keeps planning public, voluntary, and consent-based." />
      <div className="grid gap-3 md:grid-cols-2">
        {[
          "Meet in public.",
          "Keep planning in AggieHelp.",
          "No money.",
          "No alcohol or drugs.",
          "No private rooms.",
          "For emergencies, call 911 or campus emergency services.",
        ].map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm">
            <CheckCircle2 size={17} className="text-emerald-600" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProfilesPanel({ profiles }: { profiles: Profile[] }) {
  return (
    <Card className="p-5">
      <SectionHeader icon={Users} title="User Profiles" subtitle="Roles are loaded from public.profiles." />
      <div className="space-y-3">
        {profiles.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4">
            <div>
              <p className="font-bold">{item.name}</p>
              <p className="text-sm text-slate-500">{item.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="blue">{prettyRole(item.role)}</Pill>
              <Pill>{item.campus_area || "Campus"}</Pill>
              <Pill tone="green">{item.reliability_score || 100}% reliable</Pill>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BlockedMessagesPanel({ messages, profileById }: { messages: Message[]; profileById: Map<string, Profile> }) {
  return (
    <Card className="p-5">
      <SectionHeader icon={AlertTriangle} title="Blocked Messages" subtitle="Admins see full moderation logs. Receivers do not see blocked content in chat." />
      <div className="space-y-3">
        {messages.length === 0 && <EmptyState>No blocked messages yet.</EmptyState>}
        {messages.map((message) => {
          const reason = decodeBlockedReason(message.blocked_reason);
          return (
            <div key={message.id} className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Pill tone="red">{reason.category}</Pill>
                <span className="text-xs text-rose-800">Sender: {profileById.get(message.sender_id)?.name || "Unknown"}</span>
              </div>
              <p className="text-sm font-semibold text-rose-900">{reason.senderReason}</p>
              <p className="mt-2 rounded-lg bg-white/70 p-3 text-sm text-slate-800">{message.body}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ReportsPanel({ reports }: { reports: Report[] }) {
  return (
    <Card className="p-5">
      <SectionHeader icon={Flag} title="Reports" subtitle="Authenticated users can insert; admins can select all." />
      <div className="space-y-3">
        {reports.length === 0 && <EmptyState>No reports yet.</EmptyState>}
        {reports.map((report) => (
          <div key={report.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex justify-between gap-3">
              <p className="font-bold">{report.reason || "Report"}</p>
              <Pill tone={report.status === "open" ? "amber" : "green"}>{report.status}</Pill>
            </div>
            <p className="mt-1 text-sm text-slate-600">{report.description || "No description"}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MatchWorkspace({
  matches,
  profile,
  profileById,
  requestById,
  offerById,
  messages,
  safeSpots,
  chatByMatch,
  setChatByMatch,
  updateConsent,
  sendMessage,
  reportMessage,
  matchTabs,
  setMatchTabs,
  deviceLocation,
  locationStatus,
  useCurrentLocation,
}: {
  matches: Match[];
  profile: Profile;
  profiles: Profile[];
  profileById: Map<string, Profile>;
  requestById: Map<string, AssistRequest>;
  offerById: Map<string, AssistOffer>;
  messages: Message[];
  safeSpots: SafeSpot[];
  chatByMatch: Record<string, string>;
  setChatByMatch: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  updateConsent: (match: Match, field: "requester_contact_consent" | "helper_contact_consent", value: boolean) => Promise<void>;
  sendMessage: (match: Match) => Promise<void>;
  reportMessage: (message: Message, match: Match) => Promise<void>;
  matchTabs: Record<string, MatchTab>;
  setMatchTabs: React.Dispatch<React.SetStateAction<Record<string, MatchTab>>>;
  deviceLocation: DeviceLocation | null;
  locationStatus: string;
  useCurrentLocation: () => void;
}) {
  return (
    <Card className="p-5">
      <SectionHeader icon={MessageCircle} title="Matches" subtitle="Open a match tab for overview, ConsentShare, SafeMeet, chat, and safety." />
      <div className="space-y-5">
        {matches.length === 0 && <EmptyState>No matches yet.</EmptyState>}
        {matches.map((match) => {
          const request = requestById.get(match.request_id);
          const offer = offerById.get(match.offer_id);
          const requester = profileById.get(match.requester_id);
          const helper = profileById.get(match.helper_id);
          const matchMessages = messages.filter((message) => message.match_id === match.id);
          const isActive = match.status === "active";
          const requesterArea = requester?.campus_area || request?.to_area || "Campus";
          const helperArea = helper?.campus_area || offer?.from_area || "Campus";
          const requesterLocation = profile.id === match.requester_id && deviceLocation ? deviceLocation : areaCoords[requesterArea] || areaCoords.Campus;
          const helperLocation = profile.id === match.helper_id && deviceLocation ? deviceLocation : areaCoords[helperArea] || areaCoords.Campus;
          const midpoint = {
            lat: (requesterLocation.lat + helperLocation.lat) / 2,
            lng: (requesterLocation.lng + helperLocation.lng) / 2,
          };
          const suggestedSpots = safeSpots
            .map((spot) => ({
              spot,
              total: safeSpotScore(spot, midpoint),
            }))
            .sort((a, b) => a.total - b.total)
            .slice(0, 3);
          const activeTab = matchTabs[match.id] || "overview";

          return (
            <div key={match.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{request?.title || "Assist match"}</p>
                  <p className="mt-1 text-sm text-slate-600">{requester?.name} and {helper?.name}</p>
                </div>
                <Pill tone={isActive ? "green" : "amber"}>{match.status}</Pill>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto rounded-lg bg-slate-100 p-1">
                {([
                  ["overview", "Overview"],
                  ["consent", "ConsentShare"],
                  ["safemeet", "SafeMeet"],
                  ["chat", "Chat"],
                  ["safety", "Safety / Report"],
                ] as Array<[MatchTab, string]>).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMatchTabs((current) => ({ ...current, [match.id]: key }))}
                    className={cn(
                      "whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold transition",
                      activeTab === key ? "bg-white text-aggie-blue shadow-sm" : "text-slate-600 hover:bg-white/70",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InfoTile label="Request" value={request?.description || "No request summary"} />
                  <InfoTile label="People" value={`${requester?.name || "Requester"} + ${helper?.name || "Helper"}`} />
                  <InfoTile label="Match status" value={match.status || "pending"} />
                  <InfoTile label="Current step" value={match.status === "pending_helper_confirmation" ? "Pending helper confirmation" : match.status === "active" ? "Active" : "Completed or pending"} />
                </div>
              )}

              {activeTab === "consent" && (
                <div className="mt-4">
                  <div className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    Contact sharing turns on only if both users consent.
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <ConsentButton
                      label={`${requester?.name || "Requester"} contact consent`}
                      checked={Boolean(match.requester_contact_consent)}
                      disabled={profile.id !== match.requester_id}
                      onClick={() => updateConsent(match, "requester_contact_consent", !match.requester_contact_consent)}
                    />
                    <ConsentButton
                      label={`${helper?.name || "Helper"} contact consent`}
                      checked={Boolean(match.helper_contact_consent)}
                      disabled={profile.id !== match.helper_id}
                      onClick={() => updateConsent(match, "helper_contact_consent", !match.helper_contact_consent)}
                    />
                  </div>
                  <div className={cn("mt-3 rounded-lg p-3 text-sm font-medium", match.contact_sharing_enabled ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")}>
                    {match.contact_sharing_enabled ? "Contact sharing enabled by mutual consent." : "Contact sharing is off. Phone numbers, emails, handles, and contact prompts are blocked."}
                  </div>
                </div>
              )}

              {activeTab === "safemeet" && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
                    AggieHelp routes both users to public SafeMeet spots. Private home, apartment, and dorm-room meetups are discouraged for safety.
                  </div>
                  <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold">Location for ETA</p>
                      <p className="text-sm text-slate-600">Your precise device location is only used in this session to calculate ETA. AggieHelp does not store your live location.</p>
                      <div className="mt-2">
                        <Pill tone={deviceLocation ? "green" : locationStatus.includes("denied") ? "amber" : "blue"}>{locationStatus}</Pill>
                      </div>
                    </div>
                    <Button onClick={useCurrentLocation}><Navigation size={16} /> Use my current location</Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {suggestedSpots.map(({ spot }, index) => {
                      const requesterEta = walkMinutesFromCoord(requesterLocation, spot);
                      const helperEta = walkMinutesFromCoord(helperLocation, spot);
                      const currentOrigin =
                        profile.id === match.requester_id || profile.id === match.helper_id
                          ? deviceLocation
                          : null;
                      return (
                        <div key={spot.id} className="rounded-lg border border-slate-200 bg-white p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <Pill tone={index === 0 ? "green" : "blue"}>{index === 0 ? "Recommended" : "Backup"}</Pill>
                            <MapPin size={16} className="text-slate-500" />
                          </div>
                          <p className="font-bold">{spot.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{spot.description || "Public campus meetup spot."}</p>
                          <p className="mt-2 text-xs font-semibold text-emerald-800">Why safe: public, visible, and easier to find.</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(spot.tags || []).map((tag) => <Pill key={tag}>{tag}</Pill>)}
                          </div>
                          <p className="mt-3 text-xs text-slate-600">Requester: {requesterEta} min walk</p>
                          <p className="text-xs text-slate-600">Helper: {helperEta} min walk</p>
                          <div className="mt-3 grid gap-2">
                            <MapLink href={mapsSearchUrl(spot)} label="Open in Maps" />
                            <MapLink href={mapsDirectionsUrl(currentOrigin, spot)} label="Get Walking Directions" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "chat" && (
                <div className="mt-4 rounded-lg border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 bg-amber-50 p-3 text-sm text-amber-900">
                    Keep planning in AggieHelp. Contact info is blocked until ConsentShare is enabled, and private-room meetup language is always blocked.
                  </div>
                  <div className="max-h-96 space-y-2 overflow-y-auto p-3">
                    {matchMessages.length === 0 && <EmptyState>No messages yet.</EmptyState>}
                    {matchMessages.map((message) => (
                      <ChatMessageBubble
                        key={message.id}
                        message={message}
                        match={match}
                        profile={profile}
                        profileById={profileById}
                        reportMessage={reportMessage}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-slate-200 p-3">
                    {["Does this time still work?", "Let's meet at the suggested SafeMeet spot.", "I'm here.", "I need to cancel.", "Thanks for helping!"].map((reply) => (
                      <Button
                        key={reply}
                        variant="outline"
                        onClick={() => setChatByMatch((current) => ({ ...current, [match.id]: reply }))}
                      >
                        {reply}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2 border-t border-slate-200 p-3">
                    <input
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-aggie-blue"
                      value={chatByMatch[match.id] || ""}
                      onChange={(event) => setChatByMatch((current) => ({ ...current, [match.id]: event.target.value }))}
                      placeholder="Send a safe in-app message..."
                    />
                    <Button onClick={() => sendMessage(match)}><Send size={16} /></Button>
                  </div>
                </div>
              )}

              {activeTab === "safety" && (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <SafetyPanel />
                  <Card className="p-4 shadow-none">
                    <SectionHeader icon={Flag} title="Safety / Report" subtitle="Use message-level Report buttons in chat for allowed messages." />
                    <div className="rounded-lg bg-slate-900 p-4 text-sm text-white">
                      Friend check-in mockup: {requester?.name || "Requester"} is meeting {helper?.name || "Helper"} for an AggieHelp assist at a public SafeMeet spot.
                    </div>
                    <Button className="mt-3" variant="outline">Report user or assist</Button>
                  </Card>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value}</p>
    </div>
  );
}

function MapLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 transition hover:bg-slate-50"
    >
      <Navigation size={14} /> {label}
    </a>
  );
}

function ChatMessageBubble({
  message,
  match,
  profile,
  profileById,
  reportMessage,
}: {
  message: Message;
  match: Match;
  profile: Profile;
  profileById: Map<string, Profile>;
  reportMessage: (message: Message, match: Match) => Promise<void>;
}) {
  const mine = message.sender_id === profile.id;
  const admin = isAdmin(profile);
  const blocked = message.moderation_status === "blocked";
  const reason = decodeBlockedReason(message.blocked_reason);

  if (blocked) {
    const showBody = mine || admin;
    return (
      <div className={cn("max-w-[92%] rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900", mine && "ml-auto")}>
        <p className="mb-1 text-xs font-bold">{mine ? "Your blocked message" : "Safety notice"}</p>
        <p>{showBody ? message.body : reason.receiverReason}</p>
        <p className="mt-2 text-xs font-semibold">{mine || admin ? reason.senderReason : reason.receiverReason}</p>
      </div>
    );
  }

  return (
    <div className={cn("max-w-[88%] rounded-lg p-3 text-sm", mine ? "ml-auto bg-aggie-blue text-white" : "bg-slate-100 text-slate-800")}>
      <p className="mb-1 text-xs opacity-70">{profileById.get(message.sender_id)?.name || "User"}</p>
      <p>{message.body}</p>
      {!mine && (
        <button
          type="button"
          onClick={() => reportMessage(message, match)}
          className={cn("mt-2 text-xs font-bold underline", mine ? "text-white" : "text-slate-500 hover:text-rose-700")}
        >
          Report
        </button>
      )}
    </div>
  );
}

function ConsentButton({ label, checked, disabled, onClick }: { label: string; checked: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:bg-white",
      )}
    >
      <p className="font-bold">{label}</p>
      <p className={cn("mt-1 text-sm", checked ? "text-emerald-800" : "text-slate-500")}>{checked ? "Consented" : disabled ? "Waiting for other user" : "Keep private"}</p>
    </button>
  );
}
