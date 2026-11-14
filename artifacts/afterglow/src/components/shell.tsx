import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "next-themes";
import { Home, CalendarDays, Users, Send, Plug, UserRound, Moon, Sun, PanelLeftClose, PanelLeftOpen, BookOpen, ExternalLink } from "lucide-react";
import { useGetSummary } from "@workspace/api-client-react";
import { cn } from "@workspace/afterglow-design-system/lib/utils";
import { Button } from "@workspace/afterglow-design-system/components/afterglow/button";
import { PersonSheet } from "@/components/person-sheet";
import { DemoController } from "@/components/demo-controller";
import { OnboardingDialog, TourLauncher, useOnboardingTour } from "@/components/onboarding/onboarding-tour";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/follow-ups", label: "Follow-ups", icon: Send },
  { href: "/people", label: "People", icon: Users },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Profile", icon: UserRound },
];

const PersonCtx = createContext<(id: string) => void>(() => {});
export const useOpenPerson = () => useContext(PersonCtx);

const COLLAPSE_KEY = "afterglow:nav-collapsed";

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-full focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus" data-testid="link-home-logo">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-pop font-display text-lg font-extrabold text-on-bright" aria-hidden="true">A</span>
      <span className={cn("font-display text-2xl font-extrabold tracking-tight", compact && "md:sr-only")}>Afterglow</span>
    </Link>
  );
}

function ThemeSwitch({ mobile = false, compact = false }: { mobile?: boolean; compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme !== "light";
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to Day party (light) theme" : "Switch to Night out (dark) theme"}
      data-testid={mobile ? "button-theme-toggle-mobile" : "button-theme-toggle"}
      icon={dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    >
      <span className={cn(compact && "sr-only")}>{dark ? "Day party" : "Night out"}</span>
    </Button>
  );
}

function BuilderNotesLink({ compact = false, mobile = false }: { compact?: boolean; mobile?: boolean }) {
  return (
    <a
      href={`${import.meta.env.BASE_URL}afterglow-demo.html`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Builder notes (opens in a new tab)"
      title="Builder notes (opens in a new tab)"
      data-testid={mobile ? "link-build-story-mobile" : "link-build-story"}
      className={cn(
        "flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold text-ink-muted transition-colors duration-220 hover:bg-glass hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus",
        compact && "md:justify-center md:px-0",
      )}
    >
      <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className={cn(compact && "md:sr-only")}>Builder notes</span>
      <ExternalLink className={cn("h-3 w-3 shrink-0", compact && "md:hidden")} aria-hidden="true" />
    </a>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const [personId, setPersonId] = useState<string | null>(null);
  const personOpener = useRef<HTMLElement | null>(null);
  const openPerson = (id: string) => {
    personOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPersonId(id);
  };
  const { data: summary } = useGetSummary();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return window.localStorage.getItem(COLLAPSE_KEY) === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0"); } catch { /* storage unavailable */ }
  }, [collapsed]);
  const tour = useOnboardingTour();
  const active = (h: string) => (h === "/" ? loc === "/" : h === "/integrations" ? loc.startsWith("/integrations") || loc.startsWith("/imports") : loc.startsWith(h));

  return (
    <PersonCtx.Provider value={openPerson}>
      <div className="min-h-[100dvh] md:flex">
        <aside className={cn("sticky top-0 z-30 flex flex-col border-b border-line bg-bg md:h-[100dvh] md:shrink-0 md:border-b-0 md:border-r", collapsed ? "md:w-20" : "md:w-64")} data-testid="nav-sidebar" data-collapsed={collapsed ? "true" : "false"}>
          <div className={cn("flex flex-wrap items-center justify-between gap-3 px-4 pt-4 md:flex-nowrap md:pt-8 md:pb-4", collapsed ? "md:flex-col md:px-3" : "md:px-6")}>
            <Wordmark compact={collapsed} />
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => setCollapsed((c) => !c)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
              data-testid="button-toggle-nav"
              icon={collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            />
            <div className="flex flex-col items-start md:hidden">
              <div className="flex items-center gap-1"><TourLauncher tour={tour} mobile /><ThemeSwitch mobile /></div>
              <BuilderNotesLink mobile />
            </div>
          </div>
          <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-col md:overflow-visible">
            {NAV.map(({ href, label, icon: Icon }) => {
              const on = active(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={href === "/follow-ups" && summary?.dueCount ? `${label}, ${summary.dueCount} due` : label}
                  title={collapsed ? label : undefined}
                  aria-current={on ? "page" : undefined}
                  data-testid={`link-nav-${label.toLowerCase().replace(/\W+/g, "-")}`}
                  className={cn(
                    "flex h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors duration-220 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus",
                    on ? "bg-ink text-bg" : "text-ink-muted hover:bg-glass hover:text-ink",
                    collapsed && "md:relative md:justify-center md:px-0",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className={cn(collapsed && "md:sr-only")}>{label}</span>
                  {href === "/follow-ups" && !!summary?.dueCount && (
                    <span data-testid="badge-due-count" className={cn("ml-auto rounded-full bg-sun px-2 text-xs font-bold text-on-bright", collapsed && "md:absolute md:right-1 md:top-0")} aria-hidden="true">
                      {summary.dueCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className={cn("mt-auto hidden md:flex md:flex-col md:items-start md:gap-2", collapsed ? "p-3" : "p-4")}>
            <TourLauncher tour={tour} compact={collapsed} />
            <ThemeSwitch compact={collapsed} />
            <BuilderNotesLink compact={collapsed} />
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <main className="max-w-6xl px-5 py-8 md:px-10 md:py-12"><DemoController className="mb-6" />{children}</main>
        </div>
      </div>
      <PersonSheet personId={personId} onClose={() => setPersonId(null)} returnFocusRef={personOpener} />
      <OnboardingDialog tour={tour} />
    </PersonCtx.Provider>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="type-label mb-2 text-pop-ink">{eyebrow}</div>
        <h1 className="type-title md:type-display-lg">{title}</h1>
      </div>
      {children}
    </header>
  );
}
