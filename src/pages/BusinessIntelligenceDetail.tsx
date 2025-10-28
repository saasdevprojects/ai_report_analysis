import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  Scatter,
  ScatterChart,
  RadialBar,
  RadialBarChart,
  Legend
} from "recharts";
import { 
  AlertCircle, 
  ArrowLeft,
  ArrowUpRight, 
  BarChart3, 
  Check, 
  CheckCircle, 
  ChevronDown, 
  ChevronRight, 
  Download, 
  ExternalLink, 
  FileText, 
  Filter, 
  Info, 
  Loader2, 
  MoreHorizontal, 
  Plus, 
  RotateCw,
  Search, 
  SlidersHorizontal, 
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { withSupabaseRetry } from "@/utils/retry";

// Import utility functions with aliases to avoid conflicts
import * as Utils from "@/lib/utils";
const { 
  formatNumber: formatNum, 
  formatPercentage: formatPct, 
  formatDate: fmtDate, 
  safeNumber: safeNum 
} = Utils;

import type { ReportPayload } from "@/types/report";
import generateAnalysisReportPdf from "@/pdf/AnalysisReportPDF";

// Add Checkbox import
import { Checkbox } from "@/components/ui/checkbox";

const threeDCardClass =
  "relative overflow-hidden rounded-[32px] border-2 border-cyan-100 bg-white shadow-[0_45px_140px_-60px_rgba(79,70,229,0.15)] ring-1 ring-cyan-100";
const modernCardClass = "rounded-xl border border-cyan-100 bg-white shadow-sm";
const forecastCardClass = "rounded-xl border-2 border-cyan-100 bg-white shadow-sm";

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  

  const loadAnalysis = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await withSupabaseRetry(async () => {
        const result = await supabase
          .from("product_analyses")
          .select("id, product_name, product_description, report_payload, report_version, generated_at")
          .eq("id", id)
          .single();
        return { data: result.data, error: result.error };
      });

      if (error) throw error;
      if (!data) throw new Error("Analysis not found");

      setAnalysis(data as unknown as AnalysisRecord);
      setReport((data as any).report_payload);
    } catch (error) {
      console.error("Error loading analysis:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load analysis. Please try again.",
        action: (
          <ToastAction altText="Retry" onClick={loadAnalysis}>
            Retry
          </ToastAction>
        ),
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  const currentReport = useMemo(() => report, [report]);
  const generatedDate = useMemo(() => {
    if (currentReport?.generatedAt) return fmtDate(currentReport.generatedAt);
    if (analysis?.generated_at) return fmtDate(analysis.generated_at);
    return null;
  }, [analysis?.generated_at, currentReport?.generatedAt]);

  const exportReportPDF = async () => {
    if (!analysis || !currentReport) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Report data unavailable"
      });
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
      toast({
        title: "Success",
        description: "PDF generated successfully",
        variant: "default"
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive"
      });
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
    .map((item: any) => ({ name: item?.name ?? String(item), share: safeNum(item?.share, 0) }))
    .filter((r) => !!r.name);
  const competitorNames = safeArray(currentReport?.competitiveLandscape?.topCompetitors)
    .slice(0, 4)
    .map((comp: any) => comp?.name)
    .filter(Boolean);
  const personaSignals = safeArray(currentReport?.customerInsights?.behavioralSignals).slice(0, 3);
  const sentimentChannelsCount = safeArray(currentReport?.customerInsights?.sentimentMaps).length;
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
          ? `${formatNum(base.impact, 0)}`
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
    return Math.max(0, Math.min(100, safeNum(raw, 68)));
  }, [currentReport]);

  const marketGrowthSeries = useMemo(() => {
    const points = safeArray(currentReport?.marketEnvironment?.marketSize?.forecast);
    return points.map((p: any) => ({ year: p?.year ?? p?.period ?? "", growth: safeNum(p?.value, 0) }));
  }, [currentReport]);

  const marketStats = useMemo(() => {
    const env = (currentReport as any)?.marketEnvironment ?? {};
    const cagrArr: any[] = safeArray(env.cagrByRegion);
    const cagr = cagrArr.length
      ? Math.round(
          (cagrArr.reduce((sum: number, r: any) => sum + safeNum(r?.value, 0), 0) / cagrArr.length) * 100,
        ) / 100
      : 0;
    const tam = safeNum(env?.marketSize?.current, 0);
    const f = safeArray(env?.marketSize?.forecast);
    const trend = f.length >= 2
      ? Math.round(((safeNum((f[f.length - 1] as any)?.value, 0) - safeNum((f[0] as any)?.value, 0)) / Math.max(1, safeNum((f[0] as any)?.value, 1))) * 100)
      : 0;
    return { cagr, tam, trend };
  }, [currentReport]);

  const competitorLabelA = useMemo(() => competitorNames[0] ?? "Competitor A", [competitorNames]);
  const competitorLabelB = useMemo(() => competitorNames[1] ?? "Competitor B", [competitorNames]);
  const competitorRadarData = useMemo(() => {
    const fb = safeArray(currentReport?.competitiveLandscape?.featureBenchmark);
    return fb.map((row: any) => ({ metric: row?.feature ?? "Metric", Ours: safeNum(row?.productScore, 0), Avg: safeNum(row?.competitorAverage, 0) }));
  }, [currentReport]);

  const competitorMatrixData = useMemo(() => {
    const pf = safeArray(currentReport?.competitiveLandscape?.priceFeatureMatrix);
    return pf.map((p: any) => ({
      name: p?.company ?? "",
      pricePosition: safeNum(p?.pricePosition, 0),
      featureScore: safeNum(p?.featureScore, 0),
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
        acc.pos += safeNum(m?.positive, 0);
        acc.neu += safeNum(m?.neutral, 0);
        acc.neg += safeNum(m?.negative, 0);
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
    return journey.map((j: any) => ({ stage: String(j?.stage ?? "Stage"), value: safeNum(j?.conversionRate, 0) }));
  }, [currentReport]);

  const productBenchmarkData = useMemo(() => {
    const pr = safeArray(currentReport?.productEvaluation?.performanceRadar);
    return pr.map((r: any) => ({ metric: r?.axis ?? "Metric", Ours: safeNum(r?.product, 0), Avg: safeNum(r?.competitors, 0) }));
  }, [currentReport]);

  const forecastRegions = useMemo(() => {
    const reg = safeArray(currentReport?.opportunityForecast?.regionalOpportunity);
    if (reg.length) return reg.map((r: any) => ({ region: r?.region ?? "Region", score: safeNum(r?.score, 0) }));
    return primaryRegions.map((r) => ({ region: r.name, score: r.share }));
  }, [currentReport, primaryRegions]);

  const emergingMarketCards = useMemo(() => {
    const list = safeArray(currentReport?.opportunityForecast?.unexploredSegments)
      .slice(0, 4)
      .map((o: any, i: number) => ({ title: o?.segment ?? `Market ${i + 1}`, score: safeNum(o?.potentialValue, 0) }));
    if (list.length) return list;
    return topOpps.slice(0, 4).map((o: any, i: number) => ({ title: o?.label ?? o?.title ?? `Market ${i + 1}`, score: safeNum(o?.impact, 0) }));
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
      const p = as01(safeNum(r?.probability, 0));
      const i = as01(safeNum(r?.impact, 0));
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
    const highs = rm.filter((r: any) => as01(safeNum(r?.probability, 0)) >= 0.7 && as01(safeNum(r?.impact, 0)) >= 0.7);
    if (highs.length) return highs.slice(0, 3).map((r: any) => ({ tone: "red", text: `High: ${r?.risk ?? "Critical risk"}` }));
    const meds = rm.filter((r: any) => as01(safeNum(r?.probability, 0)) >= 0.5 || as01(safeNum(r?.impact, 0)) >= 0.5);
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
  const regulatoryEvents = useMemo(() => {
    const ev = safeArray(currentReport?.marketEnvironment?.regulatoryTrends);
    return ev.map((e: any, i: number) => ({
      year: String(e?.year ?? ""),
      title: String(e?.title ?? `Event ${i + 1}`),
      impact: String(e?.impact ?? ""),
      summary: String(e?.summary ?? e?.description ?? ""),
    }));
  }, [currentReport]);
  const userAdoptionSeries = useMemo(() => {
    const arr = safeArray(currentReport?.predictiveDashboard?.userAdoption);
    return arr.map((p: any) => ({
      period: String(p?.period ?? ""),
      adoptionRate: safeNumber(p?.adoptionRate, 0),
      sentimentScore: safeNumber(p?.sentimentScore, 0),
    }));
  }, [currentReport]);
  const scenarioRows = useMemo(() => {
    const s = safeArray(currentReport?.predictiveDashboard?.scenarios);
    return s.map((row: any) => ({
      scenario: String(row?.scenario ?? "Scenario"),
      growthRate: safeNumber(row?.growthRate, 0),
      revenueProjection: safeNumber(row?.revenueProjection, 0),
      confidence: safeNumber(row?.confidence, 0),
    }));
  }, [currentReport]);
  const runwayCards = useMemo(() => {
    const r = safeArray(currentReport?.financialPlanning?.runwayScenarios);
    return r.map((x: any) => ({
      scenario: String(x?.scenario ?? "Base"),
      months: safeNumber(x?.monthsOfRunway, 0),
      cash: safeNumber(x?.cashBalance, 0),
      burn: safeNumber(x?.burnRate, 0),
    }));
  }, [currentReport]);
  const cashFlowSeries = useMemo(() => {
    const cf = safeArray(currentReport?.financialPlanning?.cashFlowTimeline);
    return cf.map((p: any) => ({
      period: String(p?.period ?? ""),
      net: safeNumber(p?.net, safeNumber(p?.inflow, 0) - safeNumber(p?.outflow, 0)),
    }));
  }, [currentReport]);
  const budgetPlanRows = useMemo(() => {
    const b = safeArray(currentReport?.financialPlanning?.budgetAllocation);
    return b.map((row: any) => ({
      category: String(row?.category ?? "Category"),
      planned: safeNumber(row?.planned, 0),
      actual: safeNumber(row?.actual, 0),
      variance: safeNumber(row?.variance, (safeNumber(row?.actual, 0) - safeNumber(row?.planned, 0))),
    }));
  }, [currentReport]);

  const coverageByType = useMemo(() => {
    const map: Record<string, number> = {};
    sources.forEach((s: any) => {
      const t = (s?.type ?? "Other").toString();
      map[t] = (map[t] ?? 0) + 1;
    });
    return Object.entries(map).map(([type, count]) => ({ type, count }));
  }, [sources]);

  const sourceRecency = useMemo(() => {
    const toTime = (d: any) => {
      const t = d ? new Date(d).getTime() : NaN;
      return Number.isFinite(t) ? t : NaN;
    };
    const times = sources
      .map((s: any) => toTime(s?.retrievedAt))
      .filter((n) => Number.isFinite(n)) as number[];
    if (!times.length) return null as null | { first: Date; last: Date; avgAgeDays: number };
    const now = Date.now();
    const first = new Date(Math.min(...times));
    const last = new Date(Math.max(...times));
    const avgAgeDays = Math.round(
      times.reduce((acc, t) => acc + (now - t), 0) / times.length / (1000 * 60 * 60 * 24),
    );
    return { first, last, avgAgeDays };
  }, [sources]);


  const sectionSummaries = useMemo(() => {
    const formatCount = (count: number, singular: string, plural: string) =>
      `${count || 0} ${count === 1 ? singular : plural}`;

    const insightCount = formatCount(keyInsights.length, "insight", "insights");
    const forecastPoints = formatCount(marketGrowthSeries.length, "forecast point", "forecast points");
    const competitorCount = formatCount(competitorNames.length, "competitor", "competitors");
    const personaCount = formatCount(personaCards.length, "persona", "personas");
    const sentimentChannels = formatCount(sentimentChannelsCount, "channel", "channels");
    const funnelStages = formatCount(funnelData.length, "stage", "stages");
    const benchmarkMetrics = formatCount(productBenchmarkData.length, "metric", "metrics");
    const regionCount = formatCount(forecastRegions.length, "region", "regions");
    const whitespaceCount = formatCount(emergingMarketCards.length, "whitespace bet", "whitespace bets");
    const riskTotal = riskCells.reduce((acc, cell) => acc + cell.risks.length, 0);
    const riskCount = formatCount(riskTotal, "risk", "risks");
    const complianceCount = formatCount(complianceItems.length, "framework", "frameworks");
    const profitPoints = formatCount(profitSeries.length, "period", "periods");
    const kpiCount = formatCount(Object.keys(kpis).length, "KPI", "KPIs");
    const recommendationCount = formatCount(recommendationsData.length, "recommendation", "recommendations");
    const sourceCount = formatCount(sources.length, "source", "sources");
    const tamDisplay = marketStats.tam
      ? `$${formatNumber(marketStats.tam, { notation: "compact", maximumFractionDigits: 1 })}`
      : "n/a";
    const regulatoryCount = formatCount(regulatoryEvents.length, "event", "events");
    const scenarioCount = formatCount(scenarioRows.length, "scenario", "scenarios");
    const adoptionPoints = formatCount(userAdoptionSeries.length, "point", "points");
    const runwayCount = formatCount(runwayCards.length, "scenario", "scenarios");
    const cashPoints = formatCount(cashFlowSeries.length, "period", "periods");

    return [
      {
        id: "overview",
        title: "Executive Summary",
        description: `Radial gauge shows the market readiness score (${marketScore || 0}) and summarizes ${insightCount} for leadership alignment.`,
      },
      {
        id: "market",
        title: "Market Overview",
        description: `Line chart plots ${forecastPoints}; stat cards highlight current TAM ${tamDisplay} and average regional CAGR ${marketStats.cagr || 0}%.`,
      },
      {
        id: "competitors",
        title: "Competitive Landscape",
        description: `Compares us against ${competitorCount} via the price-feature matrix and feature radar sourced from competitiveLandscape data.`,
      },
      {
        id: "customers",
        title: "Customer Insights",
        description: `Distills ${personaCount}, sentiment from ${sentimentChannels}, and ${funnelStages} funnel stages captured in customerInsights.`,
      },
      {
        id: "benchmarking",
        title: "Product Benchmarking",
        description: `Tracks ${benchmarkMetrics} capability scores from productEvaluation.performanceRadar to contrast us with market averages.`,
      },
      {
        id: "forecast",
        title: "Opportunity Forecast",
        description: `Surfaces ${regionCount} regions and ${whitespaceCount} emerging opportunities derived from opportunityForecast data.`,
      },
      {
        id: "predictive",
        title: "Predictive Scenarios",
        description: `Shows ${scenarioCount} scenarios and ${adoptionPoints} user adoption points to frame forward-looking bets.`,
      },
      {
        id: "regulatory",
        title: "Regulatory Timeline",
        description: `Tracks ${regulatoryCount} regulatory events with impact notes to watch dependencies.`,
      },
      {
        id: "risk",
        title: "Risk Assessment",
        description: `Organizes ${riskCount} in the risk matrix and tracks ${complianceCount} compliance frameworks to guide mitigation priorities.`,
      },
      {
        id: "finance",
        title: "Financial Summary",
        description: `Plots margin across ${profitPoints} and highlights ${kpiCount} core KPIs sourced from financialBenchmark.unitEconomics.`,
      },
      {
        id: "planning",
        title: "Financial Planning",
        description: `Covers ${runwayCount} runway scenarios and ${cashPoints} cash flow periods for capital planning.`,
      },
      {
        id: "recommendations",
        title: "Strategic Recommendations",
        description: `Lists ${recommendationCount} prioritized actions with ROI, timeline, and confidence pulled from strategicRecommendations.actions.`,
      },
      {
        id: "evidence",
        title: "Evidence Quality",
        description: `Summarizes ${sourceCount} and recency to back the ${dataConfidence.toLowerCase()} confidence rating.`,
      },
      {
        id: "methodology",
        title: "Methodology",
        description: "How we compute market score, trend, risk quadrants, sentiment totals, and KPIs.",
      },
      {
        id: "glossary",
        title: "Glossary",
        description: "Plain-English definitions for key terms (TAM, CAGR, CLV, CPA, Risk Matrix, etc.).",
      },
      {
        id: "sources",
        title: "Sources & Attribution",
        description: `Keeps ${sourceCount} references clickable so analysts can audit every insight back to its origin.`,
      },
    ];
  }, [
    complianceItems.length,
    competitorNames.length,
    emergingMarketCards.length,
    forecastRegions.length,
    formatNumber,
    funnelData.length,
    keyInsights.length,
    kpis,
    marketGrowthSeries.length,
    marketScore,
    marketStats.cagr,
    marketStats.tam,
    personaCards.length,
    productBenchmarkData.length,
    profitSeries.length,
    recommendationsData.length,
    riskCells,
    regulatoryEvents.length,
    scenarioRows.length,
    userAdoptionSeries.length,
    runwayCards.length,
    cashFlowSeries.length,
    dataConfidence,
    sentimentChannelsCount,
    sources.length,
  ]);

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
        <header className={`${modernCardClass} flex flex-col gap-4 rounded-3xl p-6 md:flex-row md:items-center md:justify-between`}>
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
                <li><a href="#report-guide" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Report Guide</a></li>
                <li><a href="#overview" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Overview</a></li>
                <li><a href="#market" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Market</a></li>
                <li><a href="#competitors" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Competitors</a></li>
                <li><a href="#customers" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Customers</a></li>
                <li><a href="#benchmarking" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Benchmarking</a></li>
                <li><a href="#forecast" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Forecast</a></li>
                <li><a href="#predictive" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Predictive</a></li>
                <li><a href="#regulatory" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Regulatory</a></li>
                <li><a href="#risk" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Risk</a></li>
                <li><a href="#finance" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Finance</a></li>
                <li><a href="#planning" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Planning</a></li>
                <li><a href="#recommendations" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Recommendations</a></li>
                <li><a href="#evidence" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Evidence</a></li>
                <li><a href="#methodology" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Methodology</a></li>
                <li><a href="#glossary" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Glossary</a></li>
                <li><a href="#sources" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">Sources</a></li>
              </ul>
            </nav>
          </aside>
          <div className="space-y-6">
            <section id="report-guide" className="scroll-mt-24">
              <div className={`${forecastCardClass} p-6`}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">Report Guide</h2>
                  <span className="text-xs text-slate-500">Quick reference</span>
                </div>
                <p className="mb-4 flex items-start gap-2 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                  Use this guide to understand what each section covers and which data powers it.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {sectionSummaries.map((entry) => (
                    <a key={entry.id} href={`#${entry.id}`} className="group block rounded-lg border border-slate-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-cyan-200 hover:shadow">
                      <h3 className="mb-1 text-sm font-semibold text-cyan-700 group-hover:text-cyan-800">{entry.title}</h3>
                      <p className="leading-relaxed text-slate-600">{entry.description}</p>
                    </a>
                  ))}
                </div>
              </div>
            </section>

            <section id="evidence" className="scroll-mt-24">
              <div className={`${forecastCardClass} p-6`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Evidence Quality</h3>
                  <span className="text-xs text-slate-500">Confidence: {dataConfidence}</span>
                </div>
                <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                  Coverage by source type and recency metrics to qualify findings.
                </p>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">Coverage by Source Type</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={coverageByType} barSize={28} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
                        <CartesianGrid stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="type" tick={{ fontSize: 11, fill: "#0e7490" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#0e7490" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <RechartsTooltip contentStyle={{ borderRadius: 12, borderColor: "#bae6fd" }} />
                        <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 4, 4]} />
                      </BarChart>
                    </ResponsiveContainer>
                    {!coverageByType.length ? (
                      <div className="mt-2 text-xs text-slate-500">No sources available to chart.</div>
                    ) : null}
                  </div>
                  <div className="grid content-start gap-3">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Recency</div>
                      {sourceRecency ? (
                        <ul className="mt-1 space-y-1 text-sm text-slate-700">
                          <li>Newest source: {formatDate(sourceRecency.last.toISOString())}</li>
                          <li>Oldest source: {formatDate(sourceRecency.first.toISOString())}</li>
                          <li>Average age: {sourceRecency.avgAgeDays} days</li>
                        </ul>
                      ) : (
                        <div className="mt-1 text-sm text-slate-500">No recency data available.</div>
                      )}
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Notes</div>
                      <p className="mt-1 text-sm text-slate-700">Use Evidence to prioritize follow-ups where coverage is light or stale.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="methodology" className="scroll-mt-24">
              <div className={`${forecastCardClass} p-6`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Methodology</h3>
                </div>
                <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                  How metrics are calculated in this report.
                </p>
                <ul className="grid gap-2 text-sm text-slate-700">
                  <li><strong className="font-semibold text-slate-900">Market Score</strong>: value from executiveSummary.marketReadiness.score (0–100).</li>
                  <li><strong className="font-semibold text-slate-900">Trend</strong>: percent change from first to last point in marketEnvironment.marketSize.forecast.</li>
                  <li><strong className="font-semibold text-slate-900">Risk Quadrants</strong>: probability/impact normalized to 0–1; quadrant assigned by 0.5 split.</li>
                  <li><strong className="font-semibold text-slate-900">Sentiment</strong>: totals aggregated across customerInsights.sentimentMaps.</li>
                  <li><strong className="font-semibold text-slate-900">KPIs</strong>: CPA/CLV/CLV:CAC from financialBenchmark.unitEconomics.</li>
                </ul>
              </div>
            </section>

            <section id="glossary" className="scroll-mt-24">
              <div className={`${forecastCardClass} p-6`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Glossary</h3>
                </div>
                <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                  Quick definitions to keep everyone aligned on terms.
                </p>
                <Table className="overflow-hidden rounded-lg border-2 border-cyan-100 bg-white text-sm">
                  <TableHeader className="bg-slate-50 text-slate-700">
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Definition</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow><TableCell>TAM</TableCell><TableCell>Total Addressable Market size.</TableCell></TableRow>
                    <TableRow><TableCell>CAGR</TableCell><TableCell>Compound Annual Growth Rate.</TableCell></TableRow>
                    <TableRow><TableCell>Market Readiness</TableCell><TableCell>Score indicating go-to-market fitness.</TableCell></TableRow>
                    <TableRow><TableCell>Risk Matrix</TableCell><TableCell>Grid mapping impact vs probability.</TableCell></TableRow>
                    <TableRow><TableCell>CLV</TableCell><TableCell>Customer Lifetime Value.</TableCell></TableRow>
                    <TableRow><TableCell>CPA</TableCell><TableCell>Cost per Acquisition.</TableCell></TableRow>
                    <TableRow><TableCell>CLV:CAC</TableCell><TableCell>Ratio of value created per acquisition cost.</TableCell></TableRow>
                    <TableRow><TableCell>Sentiment</TableCell><TableCell>Aggregate tone across channels.</TableCell></TableRow>
                    <TableRow><TableCell>Profit Margin</TableCell><TableCell>Percentage of revenue retained after costs.</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
            </section>

            <section id="overview" className="scroll-mt-24">
              <div className={`${forecastCardClass} p-6`}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">AI Market Intelligence Summary</h2>
                  <Badge className="rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200">AI Generated Insights</Badge>
                </div>
                <p className="mb-4 flex items-start gap-2 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                  Executive snapshot of your market position and the key narrative to align teams.
                </p>
                <div className="grid gap-6 md:grid-cols-[220px_1fr]">
                  <div className="relative flex flex-col items-center">
                    <div className="relative w-full">
                      <ResponsiveContainer width="100%" height={180}>
                        <RadialBarChart data={[{ name: "Score", value: marketScore, fill: "#06b6d4" }]} innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270}>
                          <RadialBar dataKey="value" cornerRadius={10} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-semibold text-slate-900">{marketScore}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs uppercase tracking-wide text-slate-500">Market Score</div>
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

            <section id="predictive" className="scroll-mt-24">
              <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                Forward-looking scenarios and adoption trajectory to frame expectations.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                <div className={`${modernCardClass} p-6`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">User Adoption</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={userAdoptionSeries}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                      <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#0e7490" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#0e7490" }} />
                      <RechartsTooltip contentStyle={{ borderRadius: 12, borderColor: "#bae6fd" }} />
                      <Line type="monotone" dataKey="adoptionRate" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className={`${modernCardClass} p-6`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Scenarios</h3>
                  </div>
                  <Table className="overflow-hidden rounded-lg border-2 border-cyan-100 bg-white text-sm">
                    <TableHeader className="bg-slate-50 text-slate-700">
                      <TableRow>
                        <TableHead>Scenario</TableHead>
                        <TableHead className="text-right">Growth %</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scenarioRows.map((s, i) => (
                        <TableRow key={i}>
                          <TableCell>{s.scenario}</TableCell>
                          <TableCell className="text-right">{formatPercentage(s.growthRate)}</TableCell>
                          <TableCell className="text-right">${formatNumber(s.revenueProjection, { notation: "compact", maximumFractionDigits: 1 })}</TableCell>
                          <TableCell className="text-right">{formatPercentage(s.confidence)}</TableCell>
                        </TableRow>
                      ))}
                      {!scenarioRows.length ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-slate-500">No scenarios available.</TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </section>

            <section id="regulatory" className="scroll-mt-24">
              <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                Key regulatory milestones that may impact GTM and product planning.
              </p>
              <div className={`${modernCardClass} p-6`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Regulatory Timeline</h3>
                </div>
                <div className="space-y-3">
                  {regulatoryEvents.map((e, i) => (
                    <div key={`${e.year}-${i}`} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="font-semibold text-slate-900">{e.title}</div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{e.year}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-600">Impact: {e.impact || '—'}</div>
                      {e.summary ? <p className="mt-2 text-sm text-slate-700">{e.summary}</p> : null}
                    </div>
                  ))}
                  {!regulatoryEvents.length ? (
                    <div className="text-sm text-slate-500">No regulatory items available.</div>
                  ) : null}
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
              <div className={`${forecastCardClass} p-6`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Strategic Recommendations</h3>
                </div>
                <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                  Prioritized initiatives with expected ROI, timeline, and confidence to guide execution.
                </p>
                <Table className="overflow-hidden rounded-lg border-2 border-cyan-100 bg-white text-sm">
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
              <div className={`${forecastCardClass} p-6`}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Sources & Attribution</h3>
                </div>
                <p className="mb-3 flex items-start gap-2 text-sm text-slate-500">
                  <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                  Linked references used to generate this report. Follow the links to audit or enrich the dataset.
                </p>
                <Table className="overflow-hidden rounded-lg border-2 border-cyan-100 bg-white text-sm">
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
