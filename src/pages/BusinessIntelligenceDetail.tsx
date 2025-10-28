import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { ReportPayload } from "@/types/report";
import generateAnalysisReportPdf from "@/pdf/AnalysisReportPDF";

const threeDCardClass =
  "relative overflow-hidden rounded-[32px] border border-white/40 bg-white/[0.92] shadow-[0_45px_140px_-60px_rgba(79,70,229,0.35)] ring-1 ring-violet-200/70 backdrop-blur-2xl";

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function formatNumber(value: number | string | null | undefined, options?: Intl.NumberFormatOptions) {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (typeof numeric !== "number" || Number.isNaN(numeric)) return "-";
  return new Intl.NumberFormat(undefined, options).format(numeric);
}

function formatPercentage(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${Math.round(value)}%`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function describeItems(items: unknown[], fallback: string) {
  const labels = items
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") return item;
      if (typeof item === "object") {
        const candidate = item as Record<string, unknown>;
        if (typeof candidate.label === "string") return candidate.label;
        if (typeof candidate.name === "string") return candidate.name;
        if (typeof candidate.title === "string") return candidate.title;
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));

  if (!labels.length) return fallback;
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels.slice(-1)}`;
}

type AnalysisRecord = {
  id: string;
  product_name: string;
  product_description: string;
  report_payload: ReportPayload | null;
  report_version?: string | null;
  generated_at?: string | null;
};

type OpportunityRow = {
  title: string;
  impact?: string;
  timeframe?: string;
  detail?: string;
};

type AutomationChecklistRow = {
  title: string;
  owner?: string | null;
  timeline?: string | null;
  priority?: string | null;
  description?: string | null;
};

type FutureSignalRow = {
  title: string;
  detail?: string;
  meta?: string;
};

const BusinessIntelligenceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("product_analyses")
          .select("id, product_name, product_description, report_payload, report_version, generated_at")
          .eq("id", id)
          .single();
        if (error) throw error;
        if (!mounted) return;
        setAnalysis(data as unknown as AnalysisRecord);
        setReport((data as any).report_payload ?? null);
      } catch (e) {
        console.error(e);
        toast.error("Couldn't load that report");
        navigate("/dashboard");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const currentReport = report ?? undefined;
  const generatedDate = useMemo(() => {
    if (currentReport?.generatedAt) return formatDate(currentReport.generatedAt);
    if (analysis?.generated_at) return formatDate(analysis.generated_at);
    return null;
  }, [analysis?.generated_at, currentReport?.generatedAt]);

  const exportReportPDF = async () => {
    if (!analysis || !currentReport) {
      toast.error("Report data unavailable");
      return;
    }
    try {
      setIsExportingPdf(true);
      const blob = await generateAnalysisReportPdf({
        analysisName: analysis.product_name,
        report: currentReport,
        generatedAt: currentReport.generatedAt ?? analysis.generated_at,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const sanitized = analysis.product_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      anchor.href = url;
      anchor.download = `${sanitized || "analysis"}-bi-report.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("PDF generated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const keyInsights = safeArray(currentReport?.executiveSummary?.keyInsights).slice(0, 5);
  const topOpps = safeArray(currentReport?.executiveSummary?.topOpportunities).slice(0, 4);
  const risks = safeArray(currentReport?.executiveSummary?.riskIndicators).slice(0, 4);

  const actions = safeArray(currentReport?.strategicRecommendations?.actions).slice(0, 5);
  const channels = safeArray(currentReport?.gtmStrategy?.channelPrioritization).slice(0, 4);
  const runway = safeArray(currentReport?.financialPlanning?.runwayScenarios);
  const sources = safeArray(currentReport?.sourceAttribution?.sources);

  const productName = analysis?.product_name ?? "your company";
  const productOverview = analysis?.product_description ?? "its growth mission";
  const primaryRegions = safeArray(currentReport?.marketEnvironment?.segmentation?.geography)
    .slice(0, 3)
    .map((item: any) => (typeof item === "string" ? item : item?.name))
    .filter(Boolean);
  const competitorNames = safeArray(currentReport?.competitiveLandscape?.topCompetitors)
    .slice(0, 4)
    .map((comp: any) => comp?.name)
    .filter(Boolean);
  const personaSignals = safeArray(currentReport?.customerInsights?.behavioralSignals).slice(0, 3);
  const growthPeriods = safeArray(currentReport?.opportunityForecast?.growthTimeline)
    .slice(0, 4)
    .map((period) => period?.period)
    .filter(Boolean);

  const opportunityRows: OpportunityRow[] = topOpps.map((opp) => {
    const base = opp as any;
    return {
      title: base?.label ?? base?.title ?? base?.name ?? "Emerging opportunity",
      impact:
        typeof base?.impact === "number"
          ? `${formatNumber(base.impact, { maximumFractionDigits: 0 })}`
          : typeof base?.impact === "string"
          ? base.impact
          : undefined,
      timeframe: base?.timeframe ?? base?.timeline ?? base?.horizon ?? undefined,
      detail: base?.detail ?? base?.description ?? base?.summary ?? undefined,
    };
  });

  const automationRows: AutomationChecklistRow[] = actions.map((action) => {
    const base = action as any;
    return {
      title: base?.title ?? "Priority initiative",
      owner: base?.owner ?? null,
      timeline: base?.timeline ?? base?.timeframe ?? null,
      priority: base?.priority ?? base?.category ?? null,
      description: base?.description ?? base?.summary ?? null,
    };
  });

  const futureSignals: FutureSignalRow[] = safeArray(currentReport?.opportunityForecast?.predictedShifts)
    .slice(0, 5)
    .map((signal) => {
      const base = signal as any;
      const confidence =
        typeof base?.confidence === "number" ? `${Math.round(base.confidence * 100)}% confidence` : null;
      return {
        title: base?.topic ?? "Emerging market signal",
        detail: base?.direction ? `${base.direction} trajectory` : base?.detail ?? undefined,
        meta: [base?.timeframe ?? base?.timeline ?? null, confidence].filter(Boolean).join(" • ") || undefined,
      };
    });

  const runwayAverage =
    runway.length > 0
      ? Math.round(
          runway.reduce(
            (total, scenario) =>
              total + (typeof scenario.monthsOfRunway === "number" ? scenario.monthsOfRunway : 0),
            0,
          ) / runway.length,
        )
      : null;

  const keyInsightSummary = describeItems(keyInsights, "core strategic themes");
  const riskSummary = describeItems(risks, "a manageable set of uncertainties");
  const personaSummary = describeItems(
    personaSignals.map((signal: any) => signal?.signal ?? signal?.title ?? signal?.name ?? null),
    "emerging behaviors",
  );
  const regionSummary = describeItems(primaryRegions, "core launch territories");
  const competitorSummary = describeItems(competitorNames, "established incumbents");
  const channelSummary = describeItems(
    channels.map((channel) => {
      const base = channel as any;
      return base?.channel ?? base?.name ?? null;
    }),
    "multi-channel outreach",
  );
  const growthSummary = describeItems(growthPeriods, "upcoming planning windows");

  const dataConfidence = useMemo(() => {
    const n = sources.length;
    if (n >= 9) return "High";
    if (n >= 5) return "Medium";
    return "Low";
  }, [sources.length]);

  const strategicNarrative = useMemo(() => {
    const sourceLabel = sources.length
      ? `${sources.length} curated intelligence sources`
      : "a focused set of intelligence sources";
    const sentences = [
      `This Business Intelligence panorama distills ${sourceLabel} into a briefing ${productName} can apply immediately across revenue, product, and operations.`,
      `We translate ${keyInsightSummary} into accessible storytelling so every team understands how the data informs day-to-day decisions and not just high-level narratives.`,
      `Customer behavior signals surface ${personaSummary}, highlighting where messaging, onboarding, and lifecycle plays can feel more human without losing scalability.`,
      `Geographically, momentum is concentrating within ${regionSummary}, giving leaders clarity on where to double-down marketing spend and where to prepare localization.`,
      `Competitive sensing shows ${competitorSummary} are shaping expectations, making it crucial to sharpen value communication while reinforcing differentiation.`,
      `Risk triage keeps attention on ${riskSummary}, ensuring experimentation stays bold yet defensible as we orchestrate the next quarters of growth.`,
      `Use this narrative as a shared language for cross-functional planning, so every sprint, campaign, and investment is anchored in the same intelligence.`,
    ];
    return sentences.join(" ");
  }, [competitorSummary, keyInsightSummary, personaSummary, productName, regionSummary, riskSummary, sources.length]);

  const opportunityNarrative = useMemo(() => {
    const sentences = [
      `Opportunity prioritization is anchored in ${growthSummary}, keeping commercial, product, and finance teams marching toward the same quarterly milestones.`,
      `Each initiative blends qualitative insight with quantitative signal, marrying runway expectations with the actual buying triggers surfaced in the research.`,
      `By pairing impact indicators with timeframes we make it easy to sequence experimentation, allocate budgets, and communicate expectations to stakeholders ahead of reviews.`,
      `Lean into ${channelSummary} to create a coherent campaign arc that reinforces the strongest differentiators identified against ${competitorSummary}.`,
      `Revisit this scorecard weekly so celebrations, course corrections, and risk mitigation all reference the same evidence-backed playbook.`,
    ];
    return sentences.join(" ");
  }, [channelSummary, competitorSummary, growthSummary]);

  const automationNarrative = useMemo(() => {
    const sentences = [
      `Automation readiness pairs people, process, and platform so ${productName} can scale without eroding the signature experience described in the product vision.`,
      `Owners, timelines, and priority cues are surfaced together to remove ambiguity around who moves first and how success should be documented.`,
      `Documenting descriptions directly inside the scorecard keeps context portable, enabling async updates and executive readouts without redundant slide building.`,
      `Treat this checklist as a living artifact: note blockers, track small wins, and socialize the compounding ROI of automation to secure future investment.`,
      `When every squad can see how their workflow upgrades ladder into the north-star metrics, momentum and morale stay synchronized.`,
    ];
    return sentences.join(" ");
  }, [productName]);

  const futureNarrative = useMemo(() => {
    const runwayLabel = runwayAverage ? `${runwayAverage}-month average runway` : "a monitored runway trajectory";
    const sentences = [
      `Future-looking signals turn speculative noise into informed foresight so teams can design pilots before competitors saturate the channel.`,
      `With ${runwayLabel}, leadership gains breathing room to invest in experimentation while still protecting the core business.`,
      `Blend directional shifts with the growth timeline to time launches, partnerships, and capital raises around the most receptive customer moments.`,
      `Capturing these foresight notes centrally prevents knowledge loss and keeps scenario planning rooted in the same shared evidence base.`,
      `Keep iterating this board as new signals arrive so the organization always has a provocative yet pragmatic point of view on what comes next.`,
    ];
    return sentences.join(" ");
  }, [runwayAverage]);

  const attributionNarrative = useMemo(() => {
    const sentences = [
      `Every insight inside this playbook is backed by transparent attribution so teams can trace conclusions back to the original signal.`,
      `A ${dataConfidence.toLowerCase()} confidence rating reflects the breadth and freshness of sources, prompting faster enrichment where coverage is light.`,
      `Use the quick descriptors to brief stakeholders, then dive into linked references when deeper diligence is required for board updates or investor memos.`,
      `Maintaining this transparent evidence trail makes it easier to onboard new teammates and preserves institutional knowledge even as strategies evolve.`,
      `Treat the attribution wall as a living library: tag notable quotes, log contradictory findings, and surface wins to celebrate disciplined research habits.`,
    ];
    return sentences.join(" ");
  }, [dataConfidence]);

  const recapNarrative = useMemo(() => {
    const sentences = [
      `${productName} is primed to unlock growth by weaving together ${channelSummary} with product-led storytelling anchored in ${productOverview}.`,
      `Lean on the prioritized opportunities to choreograph campaigns that prove value quickly, then feed learnings back into automation and roadmap rituals.`,
      `Align go-to-market and product rituals around the same intelligence metrics so customer promises stay consistent from first touch to renewal.`,
      `Keep iterating this recap as you execute; momentum compounds fastest when every leader references a single, shared snapshot of progress and potential.`,
    ];
    return sentences.join(" ");
  }, [channelSummary, productName, productOverview]);

  if (isLoading || !analysis) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading Business Intelligence Report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9fafb] via-[#eef2ff] to-[#fff1f2]">
      <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
        <header className="flex flex-col gap-4 rounded-3xl border bg-white/90 p-6 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="rounded-full bg-[#ede9fe] text-[#5b21b6]">Business Intelligence</Badge>
              <Badge variant="secondary">v{currentReport?.reportVersion ?? analysis.report_version ?? "2"}</Badge>
              {generatedDate ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Generated {generatedDate}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Report Generated By: AI Business Analyst Engine v1.0</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">AI-Driven Growth Insights for {analysis.product_name}</h1>
            <p className="mt-1 max-w-3xl text-slate-600">{analysis.product_description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] font-semibold shadow-lg transition hover:shadow-xl"
              onClick={exportReportPDF}
              disabled={isExportingPdf}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExportingPdf ? "Exporting PDF..." : "Export PDF"}
            </Button>
            <Button variant="ghost" className="rounded-full" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        </header>

        <section>
          <Card className={`${threeDCardClass} flex h-full flex-col bg-gradient-to-br from-white/95 via-violet-50/80 to-indigo-100/60`}
            aria-label="Strategic opportunity overview">
            <CardHeader className="space-y-2">
              <CardDescription className="text-violet-600">Intelligence Execution Hub</CardDescription>
              <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">
                Unify decisions with shared context
              </CardTitle>
              <p className="max-w-3xl text-slate-600">
                Align strategy, opportunity sequencing, and automation readiness inside one board so operators can act on
                live intelligence without hopping between multiple sections.
              </p>
            </CardHeader>
            <CardContent className="grid gap-6 text-slate-700 lg:grid-cols-[1.6fr_1fr]">
              <div className="flex flex-col gap-6 rounded-[28px] border border-violet-200/70 bg-white/85 p-5 backdrop-blur">
                <div className="space-y-1">
                  <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Strategic Intelligence Narrative</p>
                  <h3 className="text-xl font-semibold text-slate-900">Unify decisions with shared context</h3>
                </div>
                <p className="leading-relaxed text-base">{strategicNarrative}</p>
                <div className="grid gap-3 rounded-[24px] border border-violet-200/60 bg-white/90 p-4">
                  <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">Headlines surfaced</p>
                  <ul className="grid gap-3">
                    {keyInsights.slice(0, 5).map((insight, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15 text-violet-600">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                        <span className="text-sm leading-relaxed text-slate-800">{insight}</span>
                      </li>
                    ))}
                    {!keyInsights.length ? (
                      <li className="text-sm text-muted-foreground">Insight bullets will appear once analysis is generated.</li>
                    ) : null}
                  </ul>
                </div>
              </div>
              <div className="flex flex-col gap-6 rounded-[28px] border border-indigo-200/60 bg-white/90 p-5 backdrop-blur">
                <div className="space-y-5 rounded-[24px] border border-indigo-200/60 bg-white/95 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Opportunity Orchestration</p>
                    <h4 className="text-lg font-semibold text-slate-900">Score, stage, and socialize growth bets</h4>
                  </div>
                  <p className="leading-relaxed text-base">{opportunityNarrative}</p>
                  <Table className="overflow-hidden rounded-[20px] border border-indigo-200/60 bg-white/95 text-sm">
                    <TableHeader className="bg-indigo-500/10 text-indigo-700">
                      <TableRow className="border-indigo-200/60">
                        <TableHead className="font-semibold">Opportunity</TableHead>
                        <TableHead className="text-right font-semibold">Impact</TableHead>
                        <TableHead className="text-right font-semibold">Timeframe</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {opportunityRows.map((row, index) => (
                        <TableRow key={index} className="border-indigo-100/60 bg-white/95 backdrop-blur">
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600">
                                <CheckCircle2 className="h-4 w-4" />
                              </span>
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-900">{row.title}</p>
                                {row.detail ? <p className="text-xs text-slate-500">{row.detail}</p> : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-800">{row.impact ?? "—"}</TableCell>
                          <TableCell className="text-right text-xs uppercase tracking-wide text-slate-500">
                            {row.timeframe ?? "Ongoing"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!opportunityRows.length ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                            Opportunity scoring will populate when the analysis highlights specific moves.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
                <div className="rounded-[24px] border border-rose-200/60 bg-white/95 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">Automation Runway</p>
                    <h4 className="text-lg font-semibold text-slate-900">Turn intelligence into repeatable momentum</h4>
                  </div>
                  <p className="leading-relaxed text-base">{automationNarrative}</p>
                  <Table className="overflow-hidden rounded-[24px] border border-rose-200/60 bg-white/90 text-sm">
                    <TableHeader className="bg-rose-500/10 text-rose-600">
                      <TableRow className="border-rose-200/60">
                        <TableHead className="font-semibold">Action</TableHead>
                        <TableHead className="text-right font-semibold">Owner</TableHead>
                        <TableHead className="text-right font-semibold">Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {automationRows.map((row, index) => (
                        <TableRow key={index} className="border-rose-100/60 bg-white/95 backdrop-blur">
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/15 text-rose-600">
                                <CheckCircle2 className="h-4 w-4" />
                              </span>
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-900">{row.title}</p>
                                {row.description ? <p className="text-xs text-slate-500">{row.description}</p> : null}
                                {row.timeline ? (
                                  <p className="text-xs uppercase tracking-wide text-rose-500">{row.timeline}</p>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-slate-700">{row.owner ?? "TBD"}</TableCell>
                          <TableCell className="text-right text-xs uppercase tracking-wide text-slate-500">{row.priority ?? "Plan"}</TableCell>
                        </TableRow>
                      ))}
                      {!automationRows.length ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                            Automation priorities populate as the AI surfaces explicit next moves.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:auto-rows-fr lg:grid-cols-[1.6fr_1fr]">
          <Card className={`${threeDCardClass} flex h-full flex-col bg-gradient-to-br from-white/95 via-slate-50/70 to-sky-100/50`}
            aria-label="Futurecasting intelligence card">
            <CardHeader className="space-y-1">
              <CardDescription className="text-sky-600">Futurecasting & Resilience</CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                Stay ahead of the next inflection point
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-6 text-slate-700 lg:grid lg:grid-cols-2">
              <p className="leading-relaxed text-base">{futureNarrative}</p>
              <div className="space-y-4">
                {futureSignals.map((signal, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-[24px] border border-sky-200/70 bg-white/80 p-4 backdrop-blur">
                    <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-sky-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">{signal.title}</p>
                      {signal.detail ? <p className="text-sm text-slate-600">{signal.detail}</p> : null}
                      {signal.meta ? (
                        <p className="text-xs uppercase tracking-wide text-sky-500">{signal.meta}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
                {!futureSignals.length ? (
                  <p className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 p-4 text-sm text-muted-foreground">
                    Scenario signals will unlock once trend confidence crosses the reporting threshold.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className={`${threeDCardClass} flex h-full flex-col bg-gradient-to-br from-white/95 via-amber-50/60 to-violet-100/40`}
            aria-label="Risk navigation card">
            <CardHeader className="space-y-1">
              <CardDescription className="text-amber-600">Risk Navigation</CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                Keep experiments bold and defensible
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 text-slate-700">
              <p className="leading-relaxed text-base">{`Risk attention is centered on ${riskSummary}. Encourage every team to capture mitigations in-line, so governance never slows momentum.`}</p>
              <div className="space-y-3">
                {risks.map((risk, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-[24px] border border-amber-200/70 bg-white/75 p-4">
                    <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <p className="text-sm leading-relaxed text-slate-800">{risk}</p>
                  </div>
                ))}
                {!risks.length ? (
                  <p className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 p-4 text-sm text-muted-foreground">
                    Risk indicators will populate as the analysis flags compliance or delivery watch-outs.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:auto-rows-fr lg:grid-cols-[1.2fr_1fr]">
          <Card className={`${threeDCardClass} flex h-full flex-col bg-gradient-to-br from-white/95 via-emerald-50/60 to-violet-100/40`}
            aria-label="Attribution and data confidence card">
            <CardHeader className="space-y-1">
              <CardDescription className="text-emerald-600">Attribution & Evidence</CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                Anchor every insight in transparent sources
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-6 text-slate-700">
              <p className="leading-relaxed text-base">{attributionNarrative}</p>
              <div className="rounded-[28px] border border-emerald-200/70 bg-white/80 p-5">
                <p className="text-sm font-semibold text-emerald-600">
                  Data confidence level: <span className="font-bold text-slate-900">{dataConfidence}</span> ({sources.length} sources)
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {sources.slice(0, 8).map((source) => (
                    <div key={source.url ?? source.name} className="rounded-[20px] border border-emerald-200/60 bg-white/80 p-4 text-sm">
                      <p className="font-medium text-slate-900">{source.name}</p>
                      <p className="text-xs uppercase tracking-wide text-emerald-500">{source.type}</p>
                      {source.url ? (
                        <a
                          href={source.url}
                          className="text-xs font-semibold text-emerald-600 underline-offset-4 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {source.url}
                        </a>
                      ) : null}
                    </div>
                  ))}
                  {!sources.length ? (
                    <p className="rounded-[20px] border border-dashed border-slate-300 bg-white/60 p-4 text-sm text-muted-foreground">
                      External citations will surface here after the next sync cycle.
                    </p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${threeDCardClass} flex h-full flex-col bg-gradient-to-br from-white/95 via-violet-50/70 to-indigo-100/40`}
            aria-label="Executive recap card">
            <CardHeader className="space-y-1">
              <CardDescription className="text-violet-600">Executive Recap</CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                Broadcast the story in one confident swipe
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 text-slate-700">
              <p className="leading-relaxed text-base">{recapNarrative}</p>
              <div className="rounded-[24px] border border-violet-200/70 bg-white/80 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Share-ready headline</p>
                <p className="mt-2 leading-relaxed">{analysis.product_name} can accelerate growth using AI-driven GTM automation and prioritized actions across {channels.slice(0, 2).map((c) => c.channel).join(" & ") || "core channels"}; align squads around the roadmap above.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default BusinessIntelligenceDetail;
