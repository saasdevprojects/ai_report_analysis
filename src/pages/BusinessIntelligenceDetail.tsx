import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, CheckCircle2, Info, ExternalLink } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Tooltip as RechartsTooltip,
  Legend,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { ReportPayload } from "@/types/report";
import generateAnalysisReportPdf from "@/pdf/AnalysisReportPDF";

const threeDCardClass =
  "relative overflow-hidden rounded-[32px] border border-white/40 bg-white/[0.92] shadow-[0_45px_140px_-60px_rgba(79,70,229,0.35)] ring-1 ring-violet-200/70 backdrop-blur-2xl";
const modernCardClass = "rounded-xl border border-slate-200 bg-white shadow-sm";

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function renderNarrative(text: string) {
  const parts = (text ?? "")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/g)
    .filter((s) => s && s.trim().length > 0);
  return (
    <div className="max-w-prose space-y-3 leading-7 text-slate-700/90">
      {parts.map((s, i) => (
        <p key={i}>{s}</p>
      ))}
    </div>
  );
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

function safeNumber(value: any, fallback: number = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
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
  const [budget, setBudget] = useState<number[]>([60]);

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
    .map((item: any) => ({ name: item?.name ?? String(item), share: safeNumber(item?.share, 0) }))
    .filter((r) => !!r.name);
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

  const opportunityChartData = useMemo(
    () =>
      opportunityRows.map((row, index) => {
        const rawImpact =
          typeof row.impact === "number"
            ? row.impact
            : parseFloat(row.impact ? String(row.impact).replace(/[^0-9.-]/g, "") : "");
        const impactValue = Number.isFinite(rawImpact)
          ? rawImpact
          : Math.max(10, (opportunityRows.length - index) * 10);
        return {
          title: row.title ?? `Opportunity ${index + 1}`,
          impact: impactValue,
          timeframe: row.timeframe ?? "Ongoing",
        };
      }),
    [opportunityRows],
  );

  const opportunityChartMulti = useMemo(() => {
    const data = [...opportunityChartData];
    if (!data.length) return data;
    const impacts = data.map((d) => d.impact);
    const trend: number[] = [];
    for (let i = 0; i < impacts.length; i++) {
      const start = Math.max(0, i - 2);
      const window = impacts.slice(start, i + 1);
      trend.push(Math.round(window.reduce((a, b) => a + b, 0) / window.length));
    }
    return data.map((d, i) => ({ ...d, trend: trend[i] }));
  }, [opportunityChartData]);

  const automationChartData = useMemo(() => {
    if (!automationRows.length) return [];
    const counts = automationRows.reduce((acc, row) => {
      const priorityLabel = (row.priority ?? "Plan").toString().toUpperCase();
      acc[priorityLabel] = (acc[priorityLabel] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([priority, count]) => ({ priority, count }));
  }, [automationRows]);

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

  const marketScore = useMemo(() => {
    const raw = (currentReport as any)?.executiveSummary?.marketReadiness?.score;
    return Math.max(0, Math.min(100, safeNumber(raw, 68)));
  }, [currentReport]);

  const marketGrowthSeries = useMemo(() => {
    const points = safeArray(currentReport?.marketEnvironment?.marketSize?.forecast);
    return points.map((p: any) => ({ year: p?.year ?? p?.period ?? "", growth: safeNumber(p?.value, 0) }));
  }, [currentReport]);

  const marketStats = useMemo(() => {
    const env = (currentReport as any)?.marketEnvironment ?? {};
    const cagrArr: any[] = safeArray(env.cagrByRegion);
    const cagr = cagrArr.length
      ? Math.round(
          (cagrArr.reduce((sum: number, r: any) => sum + safeNumber(r?.value, 0), 0) / cagrArr.length) * 100,
        ) / 100
      : 0;
    const tam = safeNumber(env?.marketSize?.current, 0);
    const f = safeArray(env?.marketSize?.forecast);
    const trend = f.length >= 2
      ? Math.round(((safeNumber((f[f.length - 1] as any)?.value, 0) - safeNumber((f[0] as any)?.value, 0)) / Math.max(1, safeNumber((f[0] as any)?.value, 1))) * 100)
      : 0;
    return { cagr, tam, trend };
  }, [currentReport]);

  const roiByChannelData = useMemo(() => {
    const alloc = safeArray(currentReport?.gtmStrategy?.budgetAllocation);
    const list = alloc.map((row: any, idx: number) => ({
      channel: row?.channel ?? `Channel ${idx + 1}`,
      roi: safeNumber(row?.expectedROI, 0),
      allocation: safeNumber(row?.allocation, 0),
    }));
    if (list.length) return list;
    return channels.map((ch: any, idx) => ({
      channel: ch?.channel ?? ch?.name ?? `Channel ${idx + 1}`,
      roi: safeNumber((ch as any)?.expectedROI, 0),
      allocation: safeNumber((ch as any)?.budgetShare, 0),
    }));
  }, [channels, currentReport]);

  const competitorLabelA = useMemo(() => competitorNames[0] ?? "Competitor A", [competitorNames]);
  const competitorLabelB = useMemo(() => competitorNames[1] ?? "Competitor B", [competitorNames]);
  const competitorRadarData = useMemo(() => {
    const fb = safeArray(currentReport?.competitiveLandscape?.featureBenchmark);
    return fb.map((row: any) => ({ metric: row?.feature ?? "Metric", Ours: safeNumber(row?.productScore, 0), Avg: safeNumber(row?.competitorAverage, 0) }));
  }, [currentReport]);

  const competitorMatrixData = useMemo(() => {
    const pf = safeArray(currentReport?.competitiveLandscape?.priceFeatureMatrix);
    return pf.map((p: any) => ({
      name: p?.company ?? "",
      pricePosition: safeNumber(p?.pricePosition, 0),
      featureScore: safeNumber(p?.featureScore, 0),
    }));
  }, [currentReport]);

  const personaCards = useMemo(() => {
    const personas = safeArray(currentReport?.customerInsights?.personas);
    return personas.map((p: any) => ({
      role: String(p?.role ?? p?.name ?? "Key persona"),
      pain: String(safeArray(p?.motivations).slice(0,1)[0] ?? "—"),
      budget: String(p?.budget ?? "—"),
      companySize: String(p?.companySize ?? "—"),
    }));
  }, [currentReport]);

  const sentimentData = useMemo(() => {
    const maps = safeArray(currentReport?.customerInsights?.sentimentMaps);
    const totals = maps.reduce(
      (acc, m: any) => {
        acc.pos += safeNumber(m?.positive, 0);
        acc.neu += safeNumber(m?.neutral, 0);
        acc.neg += safeNumber(m?.negative, 0);
        return acc;
      },
      { pos: 0, neu: 0, neg: 0 },
    );
    return [
      { label: "Positive", value: totals.pos },
      { label: "Neutral", value: totals.neu },
      { label: "Negative", value: totals.neg },
    ];
  }, [currentReport]);

  const funnelData = useMemo(() => {
    const journey = safeArray(currentReport?.customerInsights?.purchaseJourney);
    return journey.map((j: any) => ({ stage: String(j?.stage ?? "Stage"), value: safeNumber(j?.conversionRate, 0) }));
  }, [currentReport]);

  const productBenchmarkData = useMemo(() => {
    const pr = safeArray(currentReport?.productEvaluation?.performanceRadar);
    return pr.map((r: any) => ({ metric: r?.axis ?? "Metric", Ours: safeNumber(r?.product, 0), Avg: safeNumber(r?.competitors, 0) }));
  }, [currentReport]);

  const forecastRegions = useMemo(() => {
    const reg = safeArray(currentReport?.opportunityForecast?.regionalOpportunity);
    if (reg.length) return reg.map((r: any) => ({ region: r?.region ?? "Region", score: safeNumber(r?.score, 0) }));
    return primaryRegions.map((r) => ({ region: r.name, score: r.share }));
  }, [currentReport, primaryRegions]);

  const emergingMarketCards = useMemo(() => {
    const list = safeArray(currentReport?.opportunityForecast?.unexploredSegments)
      .slice(0, 4)
      .map((o: any, i: number) => ({ title: o?.segment ?? `Market ${i + 1}`, score: safeNumber(o?.potentialValue, 0) }));
    if (list.length) return list;
    return topOpps.slice(0, 4).map((o: any, i: number) => ({ title: o?.label ?? o?.title ?? `Market ${i + 1}`, score: safeNumber(o?.impact, 0) }));
  }, [currentReport, topOpps]);

  const riskCells = useMemo(() => {
    const rm = safeArray(currentReport?.riskCompliance?.riskMatrix);
    const as01 = (v: number) => (v > 1 ? v / 100 : v);
    const buckets = [
      { quadrant: "Low L / Low I", risks: [] as string[] },
      { quadrant: "Low L / High I", risks: [] as string[] },
      { quadrant: "High L / Low I", risks: [] as string[] },
      { quadrant: "High L / High I", risks: [] as string[] },
    ];
    rm.forEach((r: any) => {
      const p = as01(safeNumber(r?.probability, 0));
      const i = as01(safeNumber(r?.impact, 0));
      const idx = (p < 0.5 ? 0 : 2) + (i < 0.5 ? 0 : 1);
      buckets[idx].risks.push(r?.risk ?? "Risk");
    });
    if (buckets.some((b) => b.risks.length)) return buckets;
    return [
      { quadrant: "Low L / Low I", risks },
      { quadrant: "Low L / High I", risks: [] as string[] },
      { quadrant: "High L / Low I", risks: [] as string[] },
      { quadrant: "High L / High I", risks: [] as string[] },
    ];
  }, [currentReport, risks]);

  const complianceItems = useMemo(() => {
    const cs = safeArray(currentReport?.riskCompliance?.complianceStatus);
    if (!cs.length) return ["SOC 2 controls mapped", "PII handling reviewed", "DSAR workflow tested", "Model audit log enabled"];
    return cs.map((c: any) => `${c?.framework ?? "Framework"}: ${c?.status ?? "Unknown"}`);
  }, [currentReport]);

  const alertBadges = useMemo(() => {
    const rm = safeArray(currentReport?.riskCompliance?.riskMatrix);
    const as01 = (v: number) => (v > 1 ? v / 100 : v);
    const highs = rm.filter((r: any) => as01(safeNumber(r?.probability, 0)) >= 0.7 && as01(safeNumber(r?.impact, 0)) >= 0.7);
    if (highs.length) return highs.slice(0, 3).map((r: any) => ({ tone: "red", text: `High: ${r?.risk ?? "Critical risk"}` }));
    const meds = rm.filter((r: any) => as01(safeNumber(r?.probability, 0)) >= 0.5 || as01(safeNumber(r?.impact, 0)) >= 0.5);
    if (meds.length) return meds.slice(0, 3).map((r: any) => ({ tone: "yellow", text: `Medium: ${r?.risk ?? "Attention"}` }));
    return [{ tone: "green", text: "Low: No critical risks detected" }];
  }, [currentReport]);

  const profitSeries = useMemo(() => {
    const trend = safeArray(currentReport?.financialBenchmark?.profitMarginTrend);
    return trend.map((p: any) => ({ period: p?.period ?? "", margin: safeNumber(p?.margin, 0) }));
  }, [currentReport]);

  const kpis = useMemo(() => {
    const ue = (currentReport as any)?.financialBenchmark?.unitEconomics ?? {};
    return {
      CPA: { value: safeNumber(ue.cpa, 0) },
      CLV: { value: safeNumber(ue.clv, 0) },
      "CLV:CAC": { value: safeNumber(ue.clvToCac, 0) },
    } as Record<string, { value: number }>;
  }, [currentReport]);

  const recommendationsData = useMemo(() => {
    return actions.map((a: any, i: number) => ({
      title: a?.title ?? a?.name ?? `Initiative ${i + 1}`,
      roi: safeNumber(a?.roi, 0),
      timeline: a?.timeline ?? a?.timeframe ?? "Next quarter",
      confidence: safeNumber(a?.confidence, 0),
    }));
  }, [actions]);

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
    <div className="min-h-screen bg-slate-50 font-plex">
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
            <Button variant="ghost" className="flex items-center rounded-full" onClick={() => navigate("/dashboard")}>
              Back
              <ArrowLeft className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <aside className="sticky top-6 h-max rounded-xl border border-slate-200 bg-white p-3">
            <nav className="text-sm">
              <ul className="space-y-1">
                <li><a href="#overview" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Overview</a></li>
                <li><a href="#market" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Market</a></li>
                <li><a href="#competitors" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Competitors</a></li>
                <li><a href="#customers" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Customers</a></li>
                <li><a href="#benchmarking" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Benchmarking</a></li>
                <li><a href="#forecast" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Forecast</a></li>
                <li><a href="#gtm" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">GTM</a></li>
                <li><a href="#risk" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Risk</a></li>
                <li><a href="#finance" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Finance</a></li>
                <li><a href="#recommendations" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Recommendations</a></li>
                <li><a href="#sources" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Sources</a></li>
              </ul>
            </nav>
          </aside>
          <div className="space-y-6">
            <section id="overview" className="scroll-mt-24">
              <div className={`${modernCardClass} p-6`}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">AI Market Intelligence Summary</h2>
                  <Badge className="rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200">AI Generated Insights</Badge>
                </div>
                <p className="mb-4 flex items-start gap-2 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                  Executive snapshot of your market position and the key narrative to align teams.
                </p>
                <div className="grid gap-6 md:grid-cols-[220px_1fr]">
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={180}>
                      <RadialBarChart data={[{ name: "Score", value: marketScore, fill: "#06b6d4" }]} innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270}>
                        <RadialBar dataKey="value" cornerRadius={10} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-semibold text-slate-900">{marketScore}</div>
                        <div className="text-xs uppercase tracking-wide text-slate-500">Market Score</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    {renderNarrative(recapNarrative)}
                  </div>
                </div>
              </div>
            </section>

            <section id="market" className="scroll-mt-24">
              <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                Tracks multi-year growth, TAM/CAGR/trends, and regions with strongest adoption.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <div className={`${modernCardClass} p-6`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">5-year Growth</h3>
                    <span className="text-xs text-slate-500">Market Overview</span>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={marketGrowthSeries} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#0e7490" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#0e7490" }} axisLine={false} tickLine={false} width={28} />
                      <RechartsTooltip contentStyle={{ borderRadius: 12, borderColor: "#bae6fd" }} cursor={{ stroke: "#bae6fd" }} />
                      <Line type="monotone" dataKey="growth" stroke="#06b6d4" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid gap-6">
                  <div className={`${modernCardClass} p-4`}>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-500">CAGR</div>
                        <div className="text-xl font-semibold text-slate-900">{formatPercentage(marketStats.cagr)}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-500">TAM</div>
                        <div className="text-xl font-semibold text-slate-900">${formatNumber(marketStats.tam, { notation: "compact", maximumFractionDigits: 1 })}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-500">Trend</div>
                        <div className="text-xl font-semibold text-slate-900">{marketStats.trend}</div>
                      </div>
                    </div>
                  </div>
                  <div className={`${modernCardClass} p-4`}>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-cyan-700">Adoption by Region</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {primaryRegions.length ? primaryRegions.map((r, i) => (
                        <div key={r.name} className="rounded-lg border border-slate-200 p-3" style={{ backgroundColor: `rgba(6,182,212,${0.06 + i * 0.06})` }}>
                          <div className="font-medium text-slate-900">{r.name}</div>
                          <div className="text-xs text-slate-600">Adoption score: {Math.round(r.share)}</div>
                        </div>
                      )) : (
                        <div className="text-sm text-slate-500">Regions will appear when available.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="competitors" className="scroll-mt-24">
              <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                Compares pricing vs features and capability profiles relative to top competitors.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <div className={`${modernCardClass} p-6`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Price vs Features</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <ScatterChart margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
                      <CartesianGrid stroke="#e2e8f0" />
                      <XAxis dataKey="pricePosition" name="Price" tick={{ fontSize: 11, fill: "#0e7490" }} />
                      <YAxis dataKey="featureScore" name="Features" tick={{ fontSize: 11, fill: "#0e7490" }} />
                      <RechartsTooltip cursor={{ stroke: "#bae6fd" }} />
                      <Scatter data={competitorMatrixData} fill="#06b6d4" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className={`${modernCardClass} p-6`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Product Radar</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={competitorRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#0e7490" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                      <Radar name="Ours" dataKey="Ours" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                      <Radar name="Competitor Avg" dataKey="Avg" stroke="#64748b" fill="#64748b" fillOpacity={0.1} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section id="gtm" className="scroll-mt-24">
              <div className={`${modernCardClass} p-6`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">ROI by Channel</h3>
                  <span className="text-xs text-slate-500">Budget: {budget[0]}%</span>
                </div>
                <p className="mb-2 flex items-start gap-2 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                  Expected ROI by acquisition channel; adjust the budget slider to explore allocations.
                </p>
                <div className="mb-4">
                  <Slider value={budget} onValueChange={setBudget} min={0} max={100} step={1} />
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={roiByChannelData} barSize={36} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="channel" tick={{ fontSize: 11, fill: "#0e7490" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#0e7490" }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: 12, borderColor: "#bae6fd" }} />
                    <Bar dataKey="roi" fill="#06b6d4" radius={[8, 8, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section id="customers" className="scroll-mt-24">
              <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                Who buys, what pain they feel, and how demand converts across the funnel.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <div className={`${modernCardClass} p-6`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Persona Cards</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {personaCards.map((p, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 p-4">
                        <div className="text-sm font-semibold text-slate-900">{p.role}</div>
                        <div className="mt-1 text-xs text-slate-600">{p.pain}</div>
                        <div className="mt-2 text-xs text-cyan-700">Budget: {p.budget}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-6">
                  <div className={`${modernCardClass} p-6`}>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-700">Sentiment</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={sentimentData} barSize={36} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
                        <CartesianGrid stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#0e7490" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#0e7490" }} axisLine={false} tickLine={false} />
                        <RechartsTooltip contentStyle={{ borderRadius: 12, borderColor: "#bae6fd" }} />
                        <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 4, 4]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={`${modernCardClass} p-6`}>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-700">Conversion Funnel</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={funnelData} barSize={36} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
                        <CartesianGrid stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "#0e7490" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#0e7490" }} axisLine={false} tickLine={false} />
                        <RechartsTooltip contentStyle={{ borderRadius: 12, borderColor: "#bae6fd" }} />
                        <Bar dataKey="value" fill="#94a3b8" radius={[8, 8, 4, 4]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>

            <section id="benchmarking" className="scroll-mt-24">
              <div className={`${modernCardClass} p-6`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Product Benchmarking</h3>
                </div>
                <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                  How the product stacks up versus market average across features, innovation, UX, and pricing.
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={productBenchmarkData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#0e7490" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                    <Radar name="Ours" dataKey="Ours" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                    <Radar name="Avg" dataKey="Avg" stroke="#64748b" fill="#64748b" fillOpacity={0.1} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section id="forecast" className="scroll-mt-24">
              <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                Where the next growth pockets are likely to emerge by region and theme.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <div className={`${modernCardClass} p-6`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Regional Heat</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {forecastRegions.map((r) => (
                      <div key={r.region} className="rounded-lg border border-slate-200 p-3" style={{ backgroundColor: `rgba(6,182,212,${Math.min(0.1 + (r.score - 60) / 200, 0.25)})` }}>
                        <div className="text-sm font-medium text-slate-900">{r.region}</div>
                        <div className="text-xs text-slate-600">Score: {r.score}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`${modernCardClass} p-6`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Emerging Markets</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {emergingMarketCards.map((c, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 p-4" style={{ backgroundColor: `rgba(6,182,212,${0.06 + (c.score - 60) / 200})` }}>
                        <div className="text-sm font-semibold text-slate-900">{c.title}</div>
                        <div className="mt-1 text-xs text-slate-600">Score: {c.score}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section id="risk" className="scroll-mt-24">
              <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                Key risks plotted by likelihood and impact, plus compliance hygiene and alerts.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <div className={`${modernCardClass} p-6`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">2x2 Risk Matrix</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {riskCells.map((cell, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{cell.quadrant}</div>
                        <ul className="mt-2 space-y-1 text-sm">
                          {cell.risks.map((r: string, i: number) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              <span className="truncate">{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-6">
                  <div className={`${modernCardClass} p-6`}>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-700">Compliance Checklist</h3>
                    <div className="space-y-2">
                      {complianceItems.map((item, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm">
                          <Checkbox />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className={`${modernCardClass} p-4`}>
                    <div className="flex flex-wrap gap-2">
                      {alertBadges.map((b, i) => (
                        <span key={i} className={`rounded-full px-2.5 py-1 text-xs ring-1 ${b.tone === 'red' ? 'bg-red-50 text-red-700 ring-red-200' : b.tone === 'yellow' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'}`}>{b.text}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="finance" className="scroll-mt-24">
              <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                Unit economics trends and KPIs to monitor for sustainable growth.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <div className={`${modernCardClass} p-6`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Profit Margin Trend</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={profitSeries}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#0e7490" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#0e7490" }} />
                      <RechartsTooltip contentStyle={{ borderRadius: 12, borderColor: "#bae6fd" }} />
                      <Line type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className={`${modernCardClass} p-6`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">KPIs</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {Object.entries(kpis).map(([k, v]) => (
                      <div key={k} className="rounded-lg border border-slate-200 p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-500">{k}</div>
                        <div className="text-xl font-semibold text-slate-900">{(k === 'CLV' || k === 'CPA') ? `$${formatNumber(v.value)}` : (k.includes(':') ? `${formatNumber(v.value)}x` : formatNumber(v.value))}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section id="recommendations" className="scroll-mt-24">
              <div className={`${modernCardClass} p-6`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Strategic Recommendations</h3>
                </div>
                <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                  Prioritized initiatives with expected ROI, timeline, and confidence to guide execution.
                </p>
                <Table className="overflow-hidden rounded-lg border border-slate-200 bg-white text-sm">
                  <TableHeader className="bg-slate-50 text-slate-700">
                    <TableRow>
                      <TableHead>Initiative</TableHead>
                      <TableHead className="text-right">ROI %</TableHead>
                      <TableHead className="text-right">Timeline</TableHead>
                      <TableHead className="text-right">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recommendationsData.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.title}</TableCell>
                        <TableCell className="text-right">{r.roi}</TableCell>
                        <TableCell className="text-right">{r.timeline}</TableCell>
                        <TableCell className="text-right">{r.confidence}</TableCell>
                      </TableRow>
                    ))}
                    {!recommendationsData.length ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-500">Recommendations will appear when available.</TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </section>

            <section id="sources" className="scroll-mt-24">
              <div className={`${modernCardClass} p-6`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Sources & Attribution</h3>
                </div>
                <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                  Linked references used to generate this report. Follow the links to audit or enrich the dataset.
                </p>
                <Table className="overflow-hidden rounded-lg border border-slate-200 bg-white text-sm">
                  <TableHeader className="bg-slate-50 text-slate-700">
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Retrieved</TableHead>
                      <TableHead className="text-right">Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sources.slice(0, 50).map((s: any, i: number) => (
                      <TableRow key={`${s?.url ?? s?.name}-${i}`}>
                        <TableCell>{s?.name ?? 'Source'}</TableCell>
                        <TableCell>{s?.type ?? '—'}</TableCell>
                        <TableCell className="text-right">{formatDate(s?.retrievedAt)}</TableCell>
                        <TableCell className="text-right">
                          {s?.url ? (
                            <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-700 hover:underline">
                              Open <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!sources.length ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-500">No sources available.</TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessIntelligenceDetail;
