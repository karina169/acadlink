import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type Settings = {
  announcement_banner: string | null;
  banner_starts_at: string | null;
  banner_ends_at: string | null;
  banner_variant: string;
  updated_at: string;
};

const DISMISS_KEY = "acadlink:dismissed-banner";

const variantStyles: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  info: { bg: "bg-primary", text: "text-primary-foreground", icon: Info },
  warning: { bg: "bg-amber-500", text: "text-white", icon: AlertTriangle },
  success: { bg: "bg-emerald-500", text: "text-white", icon: CheckCircle2 },
  alert: { bg: "bg-destructive", text: "text-destructive-foreground", icon: Megaphone },
};

export function isBannerActive(s: Pick<Settings, "announcement_banner" | "banner_starts_at" | "banner_ends_at"> | null) {
  if (!s || !s.announcement_banner?.trim()) return false;
  const now = Date.now();
  if (s.banner_starts_at && new Date(s.banner_starts_at).getTime() > now) return false;
  if (s.banner_ends_at && new Date(s.banner_ends_at).getTime() < now) return false;
  return true;
}

export default function AnnouncementBanner() {
  const [s, setS] = useState<Settings | null>(null);
  const [dismissedKey, setDismissedKey] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(DISMISS_KEY) : null,
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("system_settings" as any)
        .select("announcement_banner, banner_starts_at, banner_ends_at, banner_variant, updated_at")
        .eq("id", true)
        .maybeSingle();
      if (!cancelled) setS((data as any) ?? null);
    };
    load();
    const channel = supabase
      .channel("system_settings_banner")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_settings" }, load)
      .subscribe();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  if (!isBannerActive(s)) return null;
  const currentKey = `${s!.updated_at}:${s!.announcement_banner}`;
  if (dismissedKey === currentKey) return null;

  const style = variantStyles[s!.banner_variant] || variantStyles.info;
  const Icon = style.icon;

  return (
    <div className={`${style.bg} ${style.text} w-full px-3 py-2 flex items-center gap-2 text-sm shadow-sm relative z-40`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <p className="flex-1 leading-snug">{s!.announcement_banner}</p>
      <button
        type="button"
        aria-label="Dismiss banner"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, currentKey);
          setDismissedKey(currentKey);
        }}
        className="p-1 rounded hover:bg-black/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
