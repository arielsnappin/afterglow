import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link } from "wouter";
import { SiGooglecalendar, SiPinterest } from "react-icons/si";
import { Plug, Ticket, FileSpreadsheet, Download, AlertTriangle, Check, ShieldAlert, PenLine } from "lucide-react";
import { Button } from "@workspace/afterglow-design-system/components/afterglow/button";
import { GlassCard } from "@workspace/afterglow-design-system/components/afterglow/glass-card";
import { useGetWorkspace, usePreviewSyntheticImport, useCommitSyntheticImport, type ImportResult } from "@workspace/api-client-react";
import { PageHeader } from "@/components/shell";
import { errorMessage } from "@/components/demo-controller";
import { useInvalidateAll } from "@/lib/afterglow";
import { cn } from "@workspace/afterglow-design-system/lib/utils";

const MAX_BYTES = 48000;
type Source = "provider" | "csv";

const STAGE_LABEL: Record<string, string> = {
  reading: "Reading events",
  events: "Reading events",
  matching: "Matching people",
  people: "Matching people",
  attendance: "Checking attendance milestones",
  milestones: "Checking attendance milestones",
};
const stageLabel = (s: string) => {
  const k = Object.keys(STAGE_LABEL).find((key) => s.toLowerCase().includes(key));
  return k ? STAGE_LABEL[k] : s;
};
const fmtDay = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
};
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export default function ImportsPage() {
  const ws = useGetWorkspace();
  const invalidate = useInvalidateAll();
  const preview = usePreviewSyntheticImport();
  const commit = useCommitSyntheticImport();
  const [source, setSource] = useState<Source | null>(null);
  const [csv, setCsv] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const readVersion = useRef(0);
  const [visibleStages, setVisibleStages] = useState(0);
  useEffect(() => {
    setVisibleStages(0);
    if (!preview.data) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleStages(preview.data.stages.length);
      return;
    }
    // Honest presentation pacing only: these milestones have already completed on the server.
    const timers = preview.data.stages.map((_, index) =>
      window.setTimeout(() => setVisibleStages(index + 1), (index + 1) * 300));
    return () => timers.forEach(window.clearTimeout);
  }, [preview.data]);

  const imported = !!ws.data?.journey;
  const wasImported = useRef(imported);
  useEffect(() => {
    if (wasImported.current && !imported) {
      // Reset is initiated by the shared controller, so discard this page's local import session too.
      readVersion.current++;
      setResult(null); setSource(null); setCsv(null); setFileName(""); setFileError("");
      preview.reset(); commit.reset();
      if (fileRef.current) fileRef.current.value = "";
    }
    wasImported.current = imported;
  }, [imported]);

  const choose = (s: Source) => {
    readVersion.current++;
    setSource(s); setCsv(null); setFileName(""); setFileError(""); setResult(null);
    preview.reset(); commit.reset();
  };
  const cancel = () => {
    readVersion.current++;
    setSource(null); setCsv(null); setFileName(""); setFileError("");
    preview.reset(); commit.reset();
    if (fileRef.current) fileRef.current.value = "";
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const version = ++readVersion.current;
    setFileError(""); setCsv(null); preview.reset();
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    if (f.size > MAX_BYTES) { setFileError(`That file is ${f.size.toLocaleString()} bytes. The bundled sample is under ${MAX_BYTES.toLocaleString()}; only that file is accepted.`); return; }
    if (!/\.csv$/i.test(f.name)) { setFileError("Choose the bundled synthetic .csv file."); return; }
    const reader = new FileReader();
    reader.onload = () => { if (version === readVersion.current) setCsv(String(reader.result ?? "")); };
    reader.onerror = () => { if (version === readVersion.current) setFileError("Couldn't read that file. Try choosing it again."); };
    reader.readAsText(f);
  };

  const body = () => (source === "csv" ? { source: "csv" as const, csv: csv ?? "" } : { source: "provider" as const });
  const runPreview = () => { if (!source || (source === "csv" && !csv)) return; commit.reset(); preview.mutate({ data: body() }); };
  const runCommit = () => {
    commit.mutate({ data: body() }, {
      onSuccess: (r) => { setResult(r); if (r.committed) void invalidate(); },
    });
  };

  const p = preview.data;

  return (
    <div>
      <PageHeader eyebrow="Integrations" title="Bring in your events" />
      <p className="mb-6 max-w-xl text-sm text-ink-muted">Explore event sources for your follow-ups. Only the bundled Luma simulation and synthetic CSV sample are available; no external accounts are connected.</p>

      <div role="note" data-testid="text-synthetic-warning" className="mb-6 flex max-w-3xl gap-3 rounded-lg border border-line bg-glass p-4 text-sm">
        <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden />
        <div>
          <strong className="font-medium">Synthetic data only.</strong> No real account is connected, no API keys are used, and nothing is paid for. The Luma demo is a simulation; it never contacts Luma. Don't upload real personal data.
          {!imported && <> Your first import <strong className="font-medium">replaces the original sample workspace</strong> in this browser.</>}
        </div>
      </div>

      <fieldset className="max-w-4xl">
        <legend className="type-label mb-3">Event sources</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            { id: "provider" as const, mark: <img src={`${import.meta.env.BASE_URL}luma-favicon.ico`} alt="" className="h-6 w-6" />, tone: "bg-pop", name: "Luma", status: "Demo available", body: "Simulated with bundled fictional events and guests. No sign-in, never contacts Luma.", action: "Try demo connection" },
            { id: "csv" as const, mark: <FileSpreadsheet className="h-5 w-5" />, tone: "bg-zap", name: "CSV import", status: "Demo available", body: "Upload the bundled synthetic sample file. Other files are rejected.", action: "Import sample CSV" },
            { id: null, mark: <SiGooglecalendar className="h-6 w-6" />, tone: "bg-sky", name: "Google Calendar", status: "Not available yet", body: "A possible future calendar source. No calendar access or synchronization is available." },
            { id: null, mark: <Ticket className="h-5 w-5" />, tone: "bg-sun", name: "Eventbrite", status: "Not available yet", body: "A planned event source. No Eventbrite account access or attendee sync is available." },
            { id: null, mark: <SiPinterest className="h-6 w-6" />, tone: "bg-grape", name: "Pinterest", status: "Not available yet", body: "A planned inspiration source, not an event-attendee source. No connection is available." },
          ]).map((o) => (
            <GlassCard key={o.name} compact data-testid={`card-connection-${o.name.toLowerCase().replace(/\W+/g, "-")}`} className={cn("flex flex-col gap-3", o.id && source === o.id && "border-focus")}>
              <div className="flex items-center gap-3">
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md text-on-bright", o.tone)} aria-hidden="true">{o.mark}</span>
                <div className="min-w-0 flex-1"><h3 className="font-semibold">{o.name}</h3><span className={cn("text-xs font-semibold", o.id ? "text-pop-ink" : "text-ink-muted")} data-testid={`status-connection-${o.name.toLowerCase().replace(/\W+/g, "-")}`}>{o.status}</span></div>
              </div>
              <p className="text-sm text-ink-muted">{o.body}</p>
              <div className="mt-auto">
                {o.id ? (
                  <Button size="sm" variant={source === o.id ? "primary" : "secondary"} onClick={() => choose(o.id)} aria-pressed={source === o.id}
                    disabled={commit.isPending || preview.isPending} data-testid={`button-source-${o.id}`} icon={o.id === "provider" ? <Plug className="h-3.5 w-3.5" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}>{o.action}</Button>
                ) : (
                  <Button size="sm" variant="ghost" disabled data-testid={`button-unavailable-${o.name.toLowerCase().replace(/\W+/g, "-")}`}>Unavailable</Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      </fieldset>
      <p className="mt-4 flex max-w-3xl items-start gap-2 text-xs text-ink-muted"><PenLine className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />Prefer writing it down? Open any past event from <Link href="/events" className="font-semibold text-pop-ink underline">Your events</Link> and add notes by hand. That isn't an integration.</p>

      <Button asChild variant="ghost" size="sm" className="mt-3"><a href="/api/demo/sample" download="afterglow-luma-inspired-synthetic.csv" data-testid="link-download-sample">
        <Download className="h-4 w-4" aria-hidden="true" /> Download the synthetic sample CSV
      </a></Button>
      <p className="mt-1 max-w-xl text-xs text-ink-muted">Inspired by an event-platform export, but the columns are our own, not Luma's official headers.</p>

      {source && !result && (
        <GlassCard as="section" aria-labelledby="import-step" className="mt-8 max-w-3xl">
          <h2 id="import-step" className="type-title">{source === "csv" ? "Import sample CSV" : "Luma demo connection"}</h2>

          {source === "csv" && (
            <div className="mt-3">
              <label htmlFor="csv-file" className="text-sm font-medium">Bundled sample file (max {MAX_BYTES.toLocaleString()} bytes)</label>
              <input ref={fileRef} id="csv-file" type="file" accept=".csv,text/csv" onChange={onFile} data-testid="input-csv-file"
                disabled={preview.isPending || commit.isPending}
                aria-describedby={fileError ? "csv-error" : undefined}
                className={cn("mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-glass-strong file:px-3 file:py-1.5", focusRing)} />
              {fileName && csv && <p className="mt-1 text-xs text-ink-muted" data-testid="text-file-ready">{fileName} read locally. Not sent until you preview.</p>}
              {fileError && <p id="csv-error" role="alert" className="mt-1 text-sm text-danger" data-testid="text-file-error">{fileError}</p>}
            </div>
          )}

          {!p && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={runPreview} loading={preview.isPending} disabled={preview.isPending || (source === "csv" && !csv)} data-testid="button-preview">
                {preview.isPending ? "Checking" : "Preview import"}
              </Button>
              <Button variant="ghost" onClick={cancel} disabled={preview.isPending} data-testid="button-cancel">Cancel</Button>
            </div>
          )}

          <div aria-live="polite">
            {preview.error && (
              <div role="alert" className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-danger px-3 py-2 text-sm text-danger" data-testid="text-preview-error">
                <AlertTriangle className="h-4 w-4" aria-hidden /> {errorMessage(preview.error, "Preview failed.")}
                <Button size="sm" variant="secondary" onClick={runPreview} data-testid="button-retry-preview">Retry</Button>
              </div>
            )}

            {p && (
              <div className="mt-4" data-testid="panel-preview">
                <p className="text-xs text-ink-muted">Server validation finished these steps together in one request. This paced recap shows completed work, not live server progress; reduced-motion settings skip the pacing.</p>
                <ul className="mt-2 space-y-1">
                  {p.stages.map((s, i) => (
                    <li key={`${s}-${i}`} className={cn("flex items-center gap-2 text-sm", i >= visibleStages && "text-ink-muted")} data-testid={`text-stage-${i}`}>
                      {i < visibleStages ? <Check className="h-4 w-4 text-pop-ink" aria-hidden /> : <span aria-hidden className="h-4 w-4 rounded-full border border-line" />}
                      {stageLabel(s)}{i < visibleStages ? " — complete" : " — completed result ready"}
                    </li>
                  ))}
                </ul>
                <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[["Events", p.eventCount], ["People", p.peopleCount], ["Guest records", p.guestCount], ["Date range", `${fmtDay(p.startDate)} – ${fmtDay(p.endDate)}`]].map(([k, v]) => (
                    <div key={k} className="rounded-md bg-glass p-3"><dt className="text-xs text-ink-muted">{k}</dt><dd className="text-sm mt-0.5" data-testid={`text-preview-${String(k).toLowerCase().replace(/\s/g, "-")}`}>{v}</dd></div>
                  ))}
                </dl>
                {p.duplicate ? (
                  <p className="mt-4 text-sm text-ink-muted" data-testid="text-preview-duplicate">This synthetic history is already in your workspace. Committing again won't overwrite anything.</p>
                ) : (
                  <p className="mt-4 text-sm text-danger" data-testid="text-replace-warning">Committing replaces the original sample workspace in this browser. Reset in the demo controller restores it.</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={runCommit} loading={commit.isPending} disabled={commit.isPending || visibleStages < p.stages.length} data-testid="button-commit">
                    {commit.isPending ? "Preparing workspace" : "Confirm import"}
                  </Button>
                  <Button variant="ghost" onClick={cancel} disabled={commit.isPending} data-testid="button-cancel-commit">Cancel, change nothing</Button>
                </div>
                {commit.error && (
                  <div role="alert" className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-danger px-3 py-2 text-sm text-danger" data-testid="text-commit-error">
                    <AlertTriangle className="h-4 w-4" aria-hidden /> {errorMessage(commit.error, "Couldn't confirm the import result.")}
                    <span>It is safe to retry: an already committed import will not be duplicated or overwrite edits.</span>
                    <Button size="sm" variant="secondary" onClick={runCommit} data-testid="button-retry-commit">Retry</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {result && imported && (
        <GlassCard as="section" role="status" aria-live="polite" className="mt-8 max-w-3xl" data-testid="panel-result">
          {result.committed ? (
            <>
              <h2 className="type-title">Imported</h2>
              <p className="mt-1 text-sm text-ink-muted" data-testid="text-result-counts">
                {result.eventCount} events, {result.peopleCount} people and {result.guestCount} guest records, {fmtDay(result.startDate)} – {fmtDay(result.endDate)}.
              </p>
            </>
          ) : (
            <>
              <h2 className="type-title">Already imported</h2>
              <p className="mt-1 text-sm text-ink-muted" data-testid="text-result-duplicate">
                {result.duplicate ? "This history was already in your workspace, so nothing was overwritten." : "Nothing was changed."}
              </p>
            </>
          )}
          <nav aria-label="Go to" className="mt-4 flex flex-wrap gap-2">
            {[["/", "Home"], ["/events", "Events"], ["/people", "People"], ["/follow-ups", "Follow-ups"]].map(([h, l]) => (
              <Link key={h} href={h} data-testid={`link-result-${l.toLowerCase()}`} className={cn("rounded-full border border-line px-3 py-1 text-sm hover:bg-glass", focusRing)}>{l}</Link>
            ))}
          </nav>
        </GlassCard>
      )}
    </div>
  );
}
