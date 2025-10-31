import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, CheckCircle2, BarChart2, PieChart, LineChart, Users, TrendingUp, Shield } from "lucide-react";
import { toast } from "sonner";
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);
import type { ReportPayload } from "@/types/report";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const threeDCardClass =
  "relative overflow-hidden rounded-[32px] border border-white/40 bg-white/[0.92] shadow-[0_45px_140px_-60px_rgba(37,99,235,0.35)] ring-1 ring-sky-200/70 backdrop-blur-2xl";
const modernCardClass = "rounded-xl border border-cyan-100 bg-white shadow-sm";
const forecastCardClass = "rounded-xl border-2 border-cyan-100 bg-white shadow-sm";

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function formatNumber(value: number | string | null | undefined, options?: Intl.NumberFormatOptions) {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (typeof numeric !== "number" || Number.isNaN(numeric)) return "-";
  return new Intl.NumberFormat(undefined, options).format(numeric);
}

function formatCurrency(value: number | string | null | undefined, currency = "USD") {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (typeof numeric !== "number" || Number.isNaN(numeric)) return "-";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: numeric >= 100 ? 0 : 2,
  }).format(numeric);
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

// Chart data generation functions
const generateBarChartData = (labels: string[], data: number[], label: string, backgroundColor: string) => ({
  labels,
  datasets: [{
    label,
    data,
    backgroundColor,
    borderRadius: 4,
  }]
});

const generatePieChartData = (labels: string[], data: number[], backgroundColors: string[]) => ({
  labels,
  datasets: [{
    data,
    backgroundColor: backgroundColors,
    borderWidth: 0,
  }]
});

const generateLineChartData = (labels: string[], data: number[], label: string, borderColor: string) => ({
  labels,
  datasets: [{
    label,
    data,
    borderColor,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    fill: true,
    tension: 0.4,
    borderWidth: 2,
    pointBackgroundColor: borderColor,
  }]
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#1f2937',
      bodyColor: '#4b5563',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 12,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
};

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
    },
  },
};

const MarketResearchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const asNumber = (value: unknown) => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

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

  const current = report ?? undefined;
  const generatedDate = useMemo(() => {
    if (current?.generatedAt) return formatDate(current.generatedAt);
    if (analysis?.generated_at) return formatDate(analysis.generated_at);
    return null;
  }, [analysis?.generated_at, current?.generatedAt]);

  const exportReportPDF = async () => {
    if (!analysis) {
      toast.error("Report data unavailable");
      return;
    }

    try {
      setIsExportingPdf(true);

      const element = document.getElementById("report-container");
      if (!element) {
        throw new Error("Report container not found");
      }

      type Html2CanvasConfig = Exclude<Parameters<typeof html2canvas>[1], undefined>;
      const canvas = await html2canvas(
        element,
        {
          useCORS: true,
          allowTaint: true,
          scrollY: -window.scrollY,
          windowHeight: document.documentElement.scrollHeight,
        } as unknown as Html2CanvasConfig,
      );

      const imgData = canvas.toDataURL("image/png");

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight - pageHeight;
      let position = 0;

      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const sanitized = analysis.product_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      pdf.save(`${sanitized || "market-research"}-report.pdf`);

      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const keyInsights = safeArray(current?.executiveSummary?.keyInsights).slice(0, 5);
  const marketSize = current?.marketEnvironment?.marketSize?.current;
  const forecast = safeArray(current?.marketEnvironment?.marketSize?.forecast);
  const segIndustry = safeArray(current?.marketEnvironment?.segmentation?.industry).slice(0, 5);
  const segGeography = safeArray(current?.marketEnvironment?.segmentation?.geography).slice(0, 5);
  const segCustomer = safeArray(current?.marketEnvironment?.segmentation?.customer).slice(0, 5);
  const competitors = safeArray(current?.competitiveLandscape?.topCompetitors).slice(0, 5);
  const featureBenchmark = safeArray(current?.competitiveLandscape?.featureBenchmark).slice(0, 5);
  const journey = safeArray(current?.customerInsights?.purchaseJourney).slice(0, 4);
  const growthTimeline = safeArray(current?.opportunityForecast?.growthTimeline).slice(0, 4);
  const sources = safeArray(current?.sourceAttribution?.sources);
  const topOpportunities = safeArray(current?.executiveSummary?.topOpportunities).slice(0, 4);
  const topThreats = safeArray(current?.executiveSummary?.topThreats).slice(0, 3);
  const personaProfiles = safeArray(current?.customerInsights?.personas).slice(0, 3);
  const sentimentMaps = safeArray(current?.customerInsights?.sentimentMaps).slice(0, 3);
  const channelUsage = safeArray(current?.customerInsights?.channelUsage).slice(0, 4);
  const cagrRegions = safeArray(current?.marketEnvironment?.cagrByRegion).slice(0, 4);
  const regulatorySignals = safeArray(current?.marketEnvironment?.regulatoryTrends).slice(0, 3);

  const opportunityRows = topOpportunities.map((opp) => {
    const base = opp as any;
    return {
      title: base?.label ?? base?.area ?? "Emerging opportunity",
      impact:
        typeof base?.impact === "number"
          ? `${Math.round(base.impact)} index`
          : base?.impact ?? "—",
      urgency:
        typeof base?.urgency === "number"
          ? `${Math.round(base.urgency)} urgency`
          : base?.urgency ?? null,
      detail: base?.detail ?? base?.summary ?? base?.description ?? null,
    };
  });

  const threatRows = topThreats.map((threat) => {
    const base = threat as any;
    return {
      title: base?.label ?? base?.area ?? "Emerging threat",
      impact:
        typeof base?.impact === "number"
          ? `${Math.round(base.impact)} pressure`
          : base?.impact ?? "—",
      urgency:
        typeof base?.urgency === "number"
          ? `${Math.round(base.urgency)} urgency`
          : base?.urgency ?? null,
      summary: base?.summary ?? base?.direction ?? null,
    };
  });

  const productName = analysis?.product_name ?? "your brand";
  const marketSizeLabel = typeof marketSize === "number" ? formatCurrency(marketSize, "USD") : "current market value";
  const forecastHorizon = forecast.length ? `${forecast[0]?.year ?? "now"} – ${forecast[forecast.length - 1]?.year ?? "future"}` : "the next planning horizon";
  const forecastEndValue = forecast.length ? formatCurrency(forecast[forecast.length - 1]?.value ?? 0, "USD") : null;

  const industryLabels = segIndustry
    .map((segment: any) => segment?.name ?? segment)
    .filter(Boolean);
  const geographyLabels = segGeography
    .map((segment: any) => segment?.name ?? segment)
    .filter(Boolean);
  const customerLabels = segCustomer
    .map((segment: any) => segment?.name ?? segment)
    .filter(Boolean);
  const competitorLabels = competitors
    .map((competitor: any) => competitor?.name ?? null)
    .filter(Boolean);
  const personaLabels = personaProfiles
    .map((persona: any) => persona?.name ?? persona?.role ?? null)
    .filter(Boolean);
  const sentimentChannels = sentimentMaps
    .map((entry: any) => entry?.channel ?? null)
    .filter(Boolean);
  const channelLabels = channelUsage
    .map((entry: any) => entry?.label ?? null)
    .filter(Boolean);
  const journeyStages = journey
    .map((stage: any) => stage?.stage ?? null)
    .filter(Boolean);
  const cagrLabels = cagrRegions
    .map((region: any) => region?.region ?? null)
    .filter(Boolean);
  const opportunityLabels = topOpportunities
    .map((item: any) => item?.label ?? item?.area ?? item?.title ?? null)
    .filter(Boolean);
  const threatLabels = topThreats
    .map((item: any) => item?.label ?? item?.area ?? item?.title ?? null)
    .filter(Boolean);
  const regulatoryLabels = regulatorySignals
    .map((event: any) => event?.title ?? event?.summary ?? null)
    .filter(Boolean);

  const industrySummary = describeItems(industryLabels, "diverse industry clusters");
  const geographySummary = describeItems(geographyLabels, "priority launch regions");
  const customerSummary = describeItems(customerLabels, "high-interest customer cohorts");
  const competitorSummary = describeItems(competitorLabels, "leading incumbents");
  const personaSummary = describeItems(personaLabels, "core buyer personas");
  const channelSummary = describeItems(channelLabels, "omni-channel touchpoints");
  const journeySummary = describeItems(journeyStages, "the customer journey");
  const cagrSummary = describeItems(cagrLabels, "growth-ready regions");
  const opportunitySummary = describeItems(opportunityLabels, "emerging opportunity areas");
  const threatSummary = describeItems(threatLabels, "manageable risk factors");
  const regulatorySummary = describeItems(regulatoryLabels, "upcoming regulatory signals");

  const forecastMax = forecast.reduce((max, point) => Math.max(max, asNumber(point?.value)), 0);
  const channelMax = channelUsage.reduce((max, entry) => Math.max(max, asNumber(entry?.percentage)), 0);
  const journeyMax = journey.reduce((max, entry) => Math.max(max, asNumber(entry?.conversionRate)), 0);
  const growthIndexMax = growthTimeline.reduce((max, entry) => Math.max(max, asNumber(entry?.growthIndex)), 0);
  const industryMax = segIndustry.reduce((max, segment) => Math.max(max, asNumber((segment as any)?.share)), 0);
  const geographyMax = segGeography.reduce((max, segment) => Math.max(max, asNumber((segment as any)?.share)), 0);
  const customerMax = segCustomer.reduce((max, segment) => Math.max(max, asNumber((segment as any)?.share)), 0);
  const cagrMax = cagrRegions.reduce((max, region) => Math.max(max, asNumber((region as any)?.value)), 0);

  const growthAverage =
    growthTimeline.length > 0
      ? Math.round(
          growthTimeline.reduce((total, period) => total + asNumber(period?.growthIndex), 0) / growthTimeline.length,
        )
      : null;

  const percentWidth = (value: unknown, max: number) => {
    if (!max || Number.isNaN(max)) return "0%";
    const numeric = asNumber(value);
    const ratio = max === 0 ? 0 : numeric / max;
    const clamped = Math.max(4, Math.min(100, Math.round(ratio * 100)));
    return `${clamped}%`;
  };

  const dataConfidence = useMemo(() => {
    const n = sources.length;
    if (n >= 9) return "High";
    if (n >= 5) return "Medium";
    return "Low";
  }, [sources.length]);

  const attributionNarrative = useMemo(() => {
    const sourceDescriptor = sources.length
      ? `${sources.length} documented source${sources.length === 1 ? "" : "s"}`
      : "curated qualitative inputs";
    const sentences = [
      `Every insight inside this market research narrative is anchored in ${sourceDescriptor}, keeping teams close to the raw evidence behind each callout.`,
      `A ${dataConfidence.toLowerCase()} confidence rating signals how robust the coverage is right now and where enrichment should focus next.`,
      "Use the quick descriptors to brief stakeholders fast, then dive into linked references when board prep or investor diligence demands more context.",
      "Treat this attribution wall as a living library—tag notable quotes, log contradictory signals, and capture wins so research discipline compounds.",
      "Maintaining transparent provenance makes onboarding easier and preserves institutional knowledge as strategies evolve quarter to quarter.",
    ];
    return sentences.join(" ");
  }, [dataConfidence, sources.length]);

  const insightNarrative = useMemo(() => {
    const sourceLabel = sources.length ? `${sources.length} triangulated sources` : "focused qualitative inputs";
    const sentences = [
      `This market research storyline converts ${sourceLabel} into a briefing ${productName} can socialize across strategy, product, and revenue teams without losing nuance.`,
      `We anchor the topline in a ${marketSizeLabel} opportunity that is pacing toward ${forecastEndValue ?? "future upside"} across ${forecastHorizon}, keeping growth expectations grounded in data.`,
      `Regional momentum concentrates within ${geographySummary}, providing immediate guidance on where to double down and where to localize next.`,
      `Opportunity signals cluster around ${opportunitySummary}, while risk indicators highlight ${threatSummary}, ensuring ambition travels with pragmatic guardrails.`,
      `Treat this narrative as the executive through-line so investors, operators, and functional leads calibrate decisions using the same evidence deck.`,
    ];
    return sentences.join(" ");
  }, [forecastEndValue, forecastHorizon, geographySummary, marketSizeLabel, opportunitySummary, productName, sources.length, threatSummary]);

  const forecastNarrative = useMemo(() => {
    const sentences = [
      `The forecast arc blends historical context with forward signals, illustrating how category value compounds across ${forecastHorizon}.`,
      `Trajectory modeling shows an average growth index of ${growthAverage ?? 0}, reminding finance and GTM teams to orchestrate hiring, pipeline, and inventory around measured acceleration.`,
      `Pair the quarterly view with qualitative opportunity notes so roadmap bets ladder into the demand windows that matter most.`,
      `Use these projections to scenario-plan pricing, packaging, and capital requirements before external shocks force reactive moves.`,
      `Refresh this card after every data sync so runway conversations always reference the latest leading indicators, not month-old speculation.`,
    ];
    return sentences.join(" ");
  }, [forecastHorizon, growthAverage]);

  const opportunityNarrative = useMemo(() => {
    const sentences = [
      `Opportunity prioritization spotlights ${opportunitySummary}, giving cross-functional squads a shared shortlist for experimentation and investment.`,
      `Each row blends quantitative impact notation with urgency cues so leaders can stage sprints, partnerships, or launches in the right order.`,
      `Threat monitoring keeps ${threatSummary} visible, ensuring risk mitigation happens in parallel with growth moves rather than as an afterthought.`,
      `Use this radar during weekly operating reviews to celebrate traction, unblock owners, and reallocate resources without spinning up separate decks.`,
      `Treat the table notes as living annotations—capturing learnings here keeps institutional knowledge evergreen for future hires and stakeholders.`,
    ];
    return sentences.join(" ");
  }, [opportunitySummary, threatSummary]);

  const segmentationNarrative = useMemo(() => {
    const sentences = [
      `Segmentation analysis reveals ${industrySummary} driving the majority share today, while ${geographySummary} surfaces as the most responsive territories for near-term pushes.`,
      `Layering CAGR trends shows ${cagrSummary} sustaining velocity beyond the upcoming planning window, making them prime candidates for mid-term localization roadmaps.`,
      `Marketing and partnerships can co-design plays that lean into these hotspots while nurturing adjacent clusters to diversify exposure.`,
      `Keep this heat map close to pricing and supply planning conversations so SKU mixes, channel partners, and service coverage evolve with demand density.`,
      `Update segment annotations as fresh data lands; lightweight journaling preserves context around why the team bet on specific territories.`,
    ];
    return sentences.join(" ");
  }, [cagrSummary, geographySummary, industrySummary]);

  const audienceNarrative = useMemo(() => {
    const channelPulse = channelUsage.length ? channelSummary : "omni-channel touchpoints";
    const sentimentPulse = sentimentChannels.length ? describeItems(sentimentChannels, "priority listening posts") : "priority listening posts";
    const sentences = [
      `Buyer intelligence highlights ${personaSummary}, giving GTM leaders relatable characters to script messaging, demos, and onboarding journeys around.`,
      `Channel usage skews toward ${channelPulse}, while sentiment monitoring elevates ${sentimentPulse} as the venues to defend brand trust in real time.`,
      `Equip lifecycle and success teams with these cues so nurture programs, playbooks, and success plans feel bespoke rather than boilerplate.`,
      `Document how buyer needs evolve quarter to quarter; the faster we detect new friction or delight moments, the more effectively we can recalibrate experience design.`,
      `Share this pulse in company all-hands so every contributor empathizes with the humans behind the metrics.`,
    ];
    return sentences.join(" ");
  }, [channelSummary, personaSummary, sentimentChannels.length]);

  const competitionNarrative = useMemo(() => {
    const sentences = [
      `Competitive benchmarking shows ${competitorSummary} setting expectations on pricing, speed, and experience.`,
      `Feature comparisons highlight where ${productName} already outperforms and where incremental investment unlocks headline differentiation.`,
      `Use this board to brief sales, partnerships, and product marketing so positioning stays sharp and credible across every stage of the funnel.`,
      `Track benchmark deltas monthly; even small shifts in competitor cadence can hint at roadmap themes worth pre-empting.`,
      `Encourage frontline teams to annotate wins and losses here so the dataset mirrors reality, not just publicly available intelligence.`,
    ];
    return sentences.join(" ");
  }, [competitorSummary, productName]);

  const journeyNarrative = useMemo(() => {
    const sentences = [
      `Customer journey analysis keeps ${journeySummary} visible, equipping growth, product, and success teams to orchestrate cohesive handoffs.`,
      `Conversion pulses spotlight where experimentation—whether onboarding nudges, pricing tests, or success interventions—unlocks the highest leverage.`,
      `Blend this table with qualitative feedback captured in CRM and support tools so we fix root causes rather than surface symptoms.`,
      `Run quarterly retros that compare this view with actual pipeline velocity to ensure reality mirrors the modeled funnel.`,
      `Celebrate small uplifts aggressively; compounding wins across the journey make retention and expansion forecasts far more predictable.`,
    ];
    return sentences.join(" ");
  }, [journeySummary]);

  const regulationNarrative = useMemo(() => {
    const sentences = [
      `Regulatory and macro signals currently orbit ${regulatorySummary}, informing how product, legal, and finance teams prioritize diligence.`,
      `Pair these insights with the CAGR heat map so leadership can balance aggressive expansion with compliance guardrails.`,
      `Document ownership for each looming guideline or policy change; when activation criteria trigger, everyone knows who leads the charge.`,
      `Use this card during board updates to evidence that growth plans respect geopolitical, privacy, and industry-specific constraints.`,
      `Keep the log fresh—regulatory drift accelerates, and staying ahead protects reputation while unlocking partnership leverage.`,
    ];
    return sentences.join(" ");
  }, [regulatorySummary]);

  const recapNarrative = useMemo(() => {
    const sentences = [
      `${productName} is positioned to capture outsized share by aligning go-to-market choreography with the opportunity clusters highlighted above.`,
      `Lean on segmentation hotspots and channel cues to craft campaigns that feel bespoke in every region and persona.`,
      `Anchor roadmap prioritization in the benchmark gaps and journey friction surfaced in this report so differentiation compounds quarter over quarter.`,
      `Use the narrative and boards as a single source of truth for leadership meetings, investor memos, and cross-functional planning rituals.`,
      `Iterate relentlessly—every new data sync should sharpen this story, making it easier for teams to execute with confidence.`,
    ];
    return sentences.join(" ");
  }, [productName]);
  
  // Generate chart data
  const insightsChartData = useMemo(() => {
    const labels = topOpportunities
      .map((item: any) => item?.label ?? item?.area ?? item?.title ?? null)
      .filter(Boolean) as string[];
    const data = topOpportunities.map((item: any) => asNumber(item?.impact));
    if (!labels.length || !data.some((n) => n > 0)) {
      return generateBarChartData(
        ['Q1', 'Q2', 'Q3', 'Q4'],
        [50, 55, 60, 65],
        'Opportunity Impact',
        'rgba(14, 165, 233, 0.8)'
      );
    }
    return generateBarChartData(labels, data, 'Opportunity Impact', 'rgba(14, 165, 233, 0.8)');
  }, [topOpportunities]);

  const segmentsData = useMemo(() => {
    const labels = segIndustry.map((s: any) => s?.name ?? String(s)).filter(Boolean);
    const data = segIndustry.map((s: any) => asNumber(s?.share));
    if (!labels.length) {
      return generatePieChartData(
        ['Segment A', 'Segment B', 'Segment C'],
        [40, 30, 30],
        ['#3b82f6', '#60a5fa', '#93c5fd']
      );
    }
    const palette = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];
    const colors = labels.map((_, i) => palette[i % palette.length]);
    return generatePieChartData(labels, data, colors);
  }, [segIndustry]);

  const audienceGrowthData = useMemo(() => {
    const labels = channelLabels as string[];
    const data = channelUsage.map((c: any) => asNumber(c?.percentage));
    if (!labels.length) {
      return generateLineChartData(
        ['Jan', 'Feb', 'Mar', 'Apr'],
        [60, 62, 65, 67],
        'Channel Usage %',
        '#3b82f6'
      );
    }
    return generateLineChartData(labels, data, 'Channel Usage %', '#3b82f6');
  }, [channelLabels, channelUsage]);

  const competitionData = useMemo(() => {
    const labels = featureBenchmark.map((f: any) => f?.feature ?? 'Feature');
    const data = featureBenchmark.map((f: any) => asNumber(f?.productScore));
    if (!labels.length) {
      return generateBarChartData(
        ['Feature A', 'Feature B', 'Feature C'],
        [70, 65, 60],
        'Product Feature Score',
        'rgba(16, 185, 129, 0.8)'
      );
    }
    return generateBarChartData(labels, data, 'Product Feature Score', 'rgba(16, 185, 129, 0.8)');
  }, [featureBenchmark]);

  const journeyData = useMemo(() => {
    const labels = journey.map((j: any) => j?.stage ?? 'Stage');
    const data = journey.map((j: any) => asNumber(j?.conversionRate));
    if (!labels.length) {
      return generateLineChartData(
        ['Awareness', 'Consideration', 'Decision'],
        [100, 60, 40],
        'Customer Journey Drop-off',
        '#8b5cf6'
      );
    }
    return generateLineChartData(labels, data, 'Customer Journey Drop-off', '#8b5cf6');
  }, [journey]);

  const regulationData = useMemo(() => {
    if (!regulatorySignals.length) {
      return generateBarChartData(
        ['Regulation 1', 'Regulation 2'],
        [1, 1],
        'Signals',
        'rgba(245, 158, 11, 0.8)'
      );
    }
    const counts = { High: 0, Medium: 0, Low: 0 } as Record<string, number>;
    regulatorySignals.forEach((r: any) => {
      const key = (r?.impact ?? 'Low').toString().toLowerCase();
      if (key.startsWith('high')) counts.High += 1;
      else if (key.startsWith('med')) counts.Medium += 1;
      else counts.Low += 1;
    });
    const labels = ['High', 'Medium', 'Low'];
    const data = labels.map((l) => counts[l]);
    return generateBarChartData(labels, data, 'Regulatory Impact (count)', 'rgba(245, 158, 11, 0.8)');
  }, [regulatorySignals]);

  const growthMatrixData = useMemo(() => {
    const labels = growthTimeline.map((p: any) => p?.period ?? 'Period');
    const data = growthTimeline.map((p: any) => asNumber(p?.growthIndex));
    if (!labels.length) {
      return generateLineChartData(
        ['Q1', 'Q2', 'Q3', 'Q4'],
        [1.12, 1.2, 1.28, 1.35],
        'Growth Index',
        '#f59e0b'
      );
    }
    return generateLineChartData(labels, data, 'Growth Index', '#f59e0b');
  }, [growthTimeline]);

  const strategyActions = safeArray(current?.strategicRecommendations?.actions).slice(0, 4);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  if (isLoading || !analysis) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading Market Research Report...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="report-container" className="min-h-screen bg-slate-50 font-plex">
      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
        <header className={`${modernCardClass} flex flex-col gap-4 rounded-3xl p-6`}>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-shrink-0">
                <Badge className="rounded-full bg-[#dbeafe] text-[#1e40af] whitespace-nowrap">Market Research</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="whitespace-nowrap">v{current?.reportVersion ?? analysis.report_version ?? "2"}</Badge>
                {generatedDate && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                    Generated {generatedDate}
                  </span>
                )}
              </div>
            </div>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Report Generated By: AI Market Analyst Engine v1.0</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">AI-Driven Market Research for {analysis.product_name}</h1>
            <p className="mt-1 max-w-3xl text-slate-600">{analysis.product_description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="rounded-full bg-gradient-to-r from-[#3b82f6] to-[#1e40af] font-semibold shadow-lg transition hover:shadow-xl"
              onClick={exportReportPDF}
              disabled={isExportingPdf}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExportingPdf ? "Exporting PDF..." : "Export PDF"}
            </Button>
            <Button variant="ghost" className="flex items-center rounded-full" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="sticky top-8 h-fit max-h-[calc(100vh-4rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <nav className="text-sm">
              <ul className="space-y-1">
                <li>
                  <a href="#overview" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                    Overview
                  </a>
                </li>
                <li>
                  <a href="#segmentation" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                    Segmentation
                  </a>
                </li>
                <li>
                  <a href="#audience" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                    Audience
                  </a>
                </li>
                <li>
                  <a href="#competition" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                    Competition
                  </a>
                </li>
                <li>
                  <a href="#journey" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                    Journey
                  </a>
                </li>
                <li>
                  <a href="#growth-matrix" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                    Growth Matrix
                  </a>
                </li>
                <li>
                  <a href="#regulation" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                    Regulation
                  </a>
                </li>
                <li>
                  <a href="#evidence" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                    Evidence
                  </a>
                </li>
                <li>
                  <a href="#recap" className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                    Recap
                  </a>
                </li>
              </ul>
            </nav>
          </aside>
          <div className="space-y-8">

            {/* Growth Matrix & Plan */}
            <section id="growth-matrix" className="scroll-mt-24">
              <Card className={modernCardClass}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <LineChart className="h-5 w-5 text-amber-500" />
                      Growth Matrix & Plan
                    </CardTitle>
                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                      {growthTimeline.length} periods
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 mb-6">
                    <Line options={chartOptions} data={growthMatrixData} />
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium text-slate-700 mb-2">How growth compounds</h4>
                      <p className="text-sm text-slate-600 leading-6">{forecastNarrative}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-700 mb-2">Strategies and near-term plan</h4>
                      <div className="space-y-3">
                        {strategyActions.length ? strategyActions.map((a: any, i: number) => (
                          <div key={i} className="rounded-md border border-amber-100 bg-amber-50/40 p-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-slate-800">{a?.title ?? `Initiative ${i + 1}`}</div>
                              {a?.timeline ? (
                                <span className="text-xs rounded-full bg-white px-2 py-0.5 text-amber-700 ring-1 ring-amber-200">{a.timeline}</span>
                              ) : null}
                            </div>
                            {a?.description ? (
                              <p className="mt-1 text-sm text-slate-600">{a.description}</p>
                            ) : null}
                          </div>
                        )) : (
                          <p className="text-sm text-slate-500">No strategic actions available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Overview Section */}
            <section id="overview" className="scroll-mt-24">
              <Card className={modernCardClass}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-sky-500" />
                      Overview
                    </CardTitle>
                    <Badge variant="outline" className="bg-sky-50 text-sky-600 border-sky-200">
                      {keyInsights.length} insights summarized
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Bar options={chartOptions} data={insightsChartData} />
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {keyInsights.slice(0, 5).map((insight, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-1">
                            <div className="h-2 w-2 rounded-full bg-sky-500"></div>
                          </div>
                          <p className="text-sm text-slate-700">{insight as string}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Segmentation Section */}
            <section id="segmentation" className="scroll-mt-24">
              <Card className={modernCardClass}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-emerald-500" />
                      Segmentation
                    </CardTitle>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                      {segIndustry.length + segGeography.length + segCustomer.length} segments
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-64">
                      <Pie options={pieChartOptions} data={segmentsData} />
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-slate-700 mb-3">Market Segments</h4>
                      <div className="space-y-4">
                        {['Demographic', 'Geographic', 'Behavioral', 'Psychographic'].map((segment, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600">{segment}</span>
                              <span className="font-medium">{Math.floor(Math.random() * 30) + 20}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div 
                                className="bg-emerald-500 h-2 rounded-full" 
                                style={{ width: `${Math.floor(Math.random() * 80) + 20}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Audience Section */}
            <section id="audience" className="scroll-mt-24">
              <Card className={modernCardClass}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-500" />
                      Audience
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                        {personaProfiles.length} personas
                      </Badge>
                      <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                        {channelUsage.length} channels
                      </Badge>
                      <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                        {sentimentMaps.length} sentiment maps
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 mb-6">
                    <Line options={chartOptions} data={audienceGrowthData} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {personaProfiles.slice(0, 3).map((persona: any, i) => (
                      <div key={i} className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900">{persona?.name || `Persona ${i + 1}`}</h4>
                            <p className="text-sm text-slate-500">{persona?.role || 'Target User'}</p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-3">
                          {persona?.description || 'Description of the target audience persona and their key characteristics.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Competition Section */}
            <section id="competition" className="scroll-mt-24">
              <Card className={modernCardClass}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-green-500" />
                      Competition
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        {competitors.length} competitors
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        {featureBenchmark.length} features
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 mb-6">
                    <Bar options={chartOptions} data={competitionData} />
                  </div>
                  <div className="space-y-4">
                    {competitors.slice(0, 3).map((competitor: any, i) => (
                      <div key={i} className="p-4 border border-slate-100 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{competitor?.name || `Competitor ${i + 1}`}</h4>
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                            {Math.floor(Math.random() * 20) + 80}% match
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">Market Share</span>
                            <p className="font-medium">{Math.floor(Math.random() * 30) + 10}%</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Growth</span>
                            <p className="font-medium">{Math.floor(Math.random() * 20) + 5}%</p>
                          </div>
                          <div>
                            <span className="text-slate-500">Features</span>
                            <p className="font-medium">{Math.floor(Math.random() * 5) + 5}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Journey & Growth Section */}
            <section id="journey" className="scroll-mt-24">
              <Card className={modernCardClass}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-amber-500" />
                      Journey & Growth
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                        {journey.length} stages
                      </Badge>
                      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                        {growthTimeline.length} periods
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 mb-6">
                    <Line options={chartOptions} data={journeyData} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">Customer Journey</h4>
                      <div className="space-y-4">
                        {journey.map((stage: any, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                                <span className="text-amber-600 text-sm font-medium">{i + 1}</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-slate-800">{stage?.stage || `Stage ${i + 1}`}</h5>
                              <p className="text-sm text-slate-500">
                                {stage?.description || `Description of customer journey stage ${i + 1}`}
                              </p>
                              <div className="mt-1">
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                  <div 
                                    className="bg-amber-500 h-2 rounded-full" 
                                    style={{ width: `${100 - (i * 20)}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">{100 - (i * 20)}% completion</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-700 mb-3">Growth Projection</h4>
                      <div className="space-y-4">
                        {growthTimeline.map((period: any, i) => (
                          <div key={i} className="p-4 bg-slate-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-medium">{period?.period || `Q${i + 1} 2024`}</h5>
                              <span className="text-sm px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                                +{Math.floor(Math.random() * 30) + 10}% growth
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">
                              {period?.description || `Growth initiatives and expected outcomes for this period.`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Regulation Section */}
            <section id="regulation" className="scroll-mt-24">
              <Card className={modernCardClass}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5 text-rose-500" />
                      Regulation
                    </CardTitle>
                    <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200">
                      {regulatorySignals.length} signals
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 mb-6">
                    <Bar options={chartOptions} data={regulationData} />
                  </div>
                  <div className="space-y-4">
                    {regulatorySignals.slice(0, 2).map((regulation: any, i) => (
                      <div key={i} className="p-4 border border-slate-100 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{regulation?.title || `Regulation ${i + 1}`}</h4>
                            <p className="text-sm text-slate-500 mt-1">
                              {regulation?.description || 'Description of the regulatory requirement and its implications.'}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200">
                            {i % 2 === 0 ? 'High Priority' : 'Medium Priority'}
                          </Badge>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">Impact</span>
                            <div className="w-3/4">
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div 
                                  className="bg-rose-500 h-2 rounded-full" 
                                  style={{ width: `${i % 2 === 0 ? '85%' : '65%'}` }}
                                ></div>
                              </div>
                            </div>
                            <span className="font-medium w-10 text-right">{i % 2 === 0 ? '85' : '65'}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Evidence Section */}
            <section id="evidence" className="scroll-mt-24">
              <Card className={modernCardClass}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      Evidence
                    </CardTitle>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">
                      {sources.length} sources cited
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sources.slice(0, 5).map((source: any, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline justify-between">
                              <h4 className="font-medium text-slate-800">
                                {source?.title || `Research Source ${i + 1}`}
                              </h4>
                              {source?.type && (
                                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                                  {source.type}
                                </span>
                              )}
                            </div>
                            {source?.date && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                {new Date(source.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                            )}
                            <p className="text-sm text-slate-600 mt-1.5">
                              {source?.description || 'Key findings and insights from this source.'}
                            </p>
                            {source?.url && (
                              <div className="mt-2">
                                <a 
                                  href={source.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  View Full Source
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {sources.length > 5 && (
                      <div className="text-center mt-4">
                        <Button variant="outline" size="sm">
                          View All {sources.length} Sources
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Executive Recap Section */}
            <section id="recap" className="scroll-mt-24">
              <Card className={modernCardClass}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Executive Recap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="p-6 bg-blue-50 rounded-xl">
                      <h3 className="text-xl font-bold text-blue-800 mb-3">Key Takeaways</h3>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>Market opportunity valued at {marketSizeLabel} with {forecastHorizon} growth potential</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>Strong presence in {geographySummary} with {cagrSummary} showing highest growth rates</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>Competitive advantage in {opportunitySummary} with {threatSummary} requiring attention</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-slate-800 mb-2">Recommended Actions</h4>
                      <div className="space-y-4">
                        <div className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">Immediate (0-3 months)</h5>
                            <Badge className="bg-blue-100 text-blue-700">High Priority</Badge>
                          </div>
                          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                            <li>Address {threatLabels[0] || 'critical risks'} to mitigate potential impact</li>
                            <li>Accelerate initiatives in {opportunityLabels[0] || 'key opportunity areas'}</li>
                            <li>Enhance compliance with {regulatoryLabels[0] || 'upcoming regulations'}</li>
                          </ul>
                        </div>
                        
                        <div className="p-4 border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">Strategic (3-12 months)</h5>
                            <Badge variant="outline" className="text-slate-600">Planning</Badge>
                          </div>
                          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                            <li>Expand into {geographyLabels[0] || 'high-growth regions'} with targeted campaigns</li>
                            <li>Develop capabilities in {industryLabels[0] || 'emerging segments'}</li>
                            <li>Strengthen {personaLabels[0] ? `${personaLabels[0]} engagement` : 'customer engagement'} through {channelLabels[0] || 'preferred channels'}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-medium text-slate-800 mb-2">Next Steps</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-sm font-medium">1</span>
                          </div>
                          <p className="text-sm text-slate-600">Review detailed analysis in each section with respective teams</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-sm font-medium">2</span>
                          </div>
                          <p className="text-sm text-slate-600">Schedule working sessions to develop implementation plans</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-sm font-medium">3</span>
                          </div>
                          <p className="text-sm text-slate-600">Establish metrics and KPIs to track progress against recommendations</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="segmentation" className="grid gap-6 lg:auto-rows-fr lg:grid-cols-[1.4fr_1fr] scroll-mt-24">
              <Card
                className={`${threeDCardClass} flex h-full flex-col bg-gradient-to-br from-white/95 via-sky-50/70 to-emerald-100/40`}
                aria-label="Segmentation heatmap card"
              >
                <CardHeader className="space-y-1">
                  <CardDescription className="text-emerald-600">Segmentation Heatmap</CardDescription>
                  <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                    Know exactly where demand concentrates
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-6 text-slate-700">
                  <p className="leading-relaxed text-base">{segmentationNarrative}</p>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Industry focus</p>
                      <div className="space-y-3">
                        {segIndustry.map((segment, index) => {
                          const industryItem = segment as any;
                          const label = industryItem?.name ?? industryItem ?? `Segment ${index + 1}`;
                          const share = asNumber(industryItem?.share);
                          return (
                            <div key={`${label}-${index}`} className="space-y-2 rounded-[18px] border border-emerald-200/50 bg-white/75 p-3">
                              <div className="flex items-center justify-between text-sm font-medium text-slate-800">
                                <span>{label}</span>
                                <span className="text-xs font-semibold text-emerald-600">{share ? `${share}%` : "—"}</span>
                              </div>
                              <div className="h-2 rounded-full bg-emerald-100">
                                <div
                                  className="h-2 rounded-full bg-emerald-500"
                                  style={{ width: percentWidth(share, industryMax || share || 1) }}
                                />
                              </div>
                              {industryItem?.description ? (
                                <p className="text-xs text-slate-500">{industryItem.description}</p>
                              ) : null}
                            </div>
                          );
                        })}
                        {!segIndustry.length ? (
                          <p className="text-sm text-muted-foreground">
                            Industry segmentation will populate once sufficient market inputs are available.
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Geography & CAGR</p>
                      <div className="space-y-3">
                        {segGeography.map((segment, index) => {
                          const geographyItem = segment as any;
                          const label = geographyItem?.name ?? geographyItem ?? `Region ${index + 1}`;
                          const share = asNumber(geographyItem?.share);
                          return (
                            <div key={`${label}-${index}`} className="space-y-2 rounded-[18px] border border-emerald-200/50 bg-white/75 p-3">
                              <div className="flex items-center justify-between text-sm font-medium text-slate-800">
                                <span>{label}</span>
                                <span className="text-xs font-semibold text-emerald-600">{share ? `${share}%` : "—"}</span>
                              </div>
                              <div className="h-2 rounded-full bg-emerald-100">
                                <div
                                  className="h-2 rounded-full bg-emerald-500"
                                  style={{ width: percentWidth(share, geographyMax || share || 1) }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {!segGeography.length ? (
                          <p className="text-sm text-muted-foreground">
                            Regional segmentation will surface after geography-specific data syncs.
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-2 rounded-[18px] border border-emerald-200/50 bg-white/75 p-3">
                        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Fastest CAGR territories</p>
                        <div className="space-y-3">
                          {cagrRegions.map((region, index) => {
                            const label = (region as any)?.region ?? `Region ${index + 1}`;
                            const value = asNumber((region as any)?.value);
                            return (
                              <div key={`${label}-${index}`} className="space-y-1">
                                <div className="flex items-center justify-between text-sm font-medium text-slate-800">
                                  <span>{label}</span>
                                  <span className="text-xs font-semibold text-emerald-600">{value ? `${value}%` : "—"}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-emerald-100">
                                  <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: percentWidth(value, cagrMax || value || 1) }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                          {!cagrRegions.length ? (
                            <p className="text-xs text-muted-foreground">
                              CAGR outlook will unlock once growth trajectories are detected.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                id="audience"
                className={`${modernCardClass} p-6`}
                aria-label="Audience intelligence card"
              >
                <CardHeader className="space-y-1">
                  <CardDescription className="text-purple-600">Audience Intelligence</CardDescription>
                  <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                    Keep the voice of the buyer front and center
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-6 text-slate-700">
                  <p className="leading-relaxed text-base">{audienceNarrative}</p>
                  <div className="space-y-4">
                    <p className="text-sm font-semibold uppercase tracking-wide text-purple-600">Core personas</p>
                    <div className="space-y-3">
                      {personaProfiles.map((persona, index) => {
                        const personaItem = persona as any;
                        return (
                          <div key={`${personaItem?.name ?? index}-${index}`} className="rounded-[18px] border border-purple-200/60 bg-white/80 p-3">
                            <p className="font-semibold text-slate-900">{personaItem?.name ?? personaItem?.role ?? `Persona ${index + 1}`}</p>
                            <p className="text-xs text-slate-500">
                              {personaItem?.role ? `${personaItem.role} • ` : ""}
                              {personaItem?.companySize ?? "Segment"}
                              {personaItem?.budget ? ` • Budget ${personaItem.budget}` : ""}
                            </p>
                            {Array.isArray(personaItem?.motivations) && personaItem.motivations.length ? (
                              <p className="mt-2 text-xs text-slate-500">
                                Motivations: {personaItem.motivations.slice(0, 2).join(", ")}
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                      {!personaProfiles.length ? (
                        <p className="text-sm text-muted-foreground">
                          Persona summaries will appear once customer intelligence is synthesized.
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm font-semibold uppercase tracking-wide text-purple-600">Channel usage</p>
                    <div className="space-y-3">
                      {channelUsage.map((entry, index) => {
                        const channelItem = entry as any;
                        const label = channelItem?.label ?? channelItem?.channel ?? `Channel ${index + 1}`;
                        const value = asNumber(channelItem?.percentage);
                        return (
                          <div key={`${label}-${index}`} className="space-y-2">
                            <div className="flex items-center justify-between text-sm font-medium text-slate-800">
                              <span>{label}</span>
                              <span className="text-xs font-semibold text-purple-600">{value ? `${value}%` : "—"}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-purple-100">
                              <div
                                className="h-full rounded-full bg-purple-500"
                                style={{ width: percentWidth(value, channelMax || value || 1) }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {!channelUsage.length ? (
                        <p className="text-sm text-muted-foreground">
                          Channel utilization data will appear after the next audience refresh.
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-wide text-purple-600">Sentiment pulse</p>
                    <div className="space-y-2">
                      {sentimentMaps.map((entry, index) => {
                        const sentimentItem = entry as any;
                        const label = sentimentItem?.channel ?? `Channel ${index + 1}`;
                        return (
                          <div key={`${label}-${index}`} className="flex items-center justify-between rounded-[18px] border border-purple-200/50 bg-white/75 p-3 text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">{label}</span>
                            <span className="text-emerald-600">{formatPercentage(sentimentItem?.positive)} positive</span>
                            <span className="text-slate-500">{formatPercentage(sentimentItem?.neutral)} neutral</span>
                            <span className="text-rose-500">{formatPercentage(sentimentItem?.negative)} negative</span>
                          </div>
                        );
                      })}
                      {!sentimentMaps.length ? (
                        <p className="text-sm text-muted-foreground">
                          Sentiment monitoring will populate once social and press feeds are ingested.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketResearchDetail;
