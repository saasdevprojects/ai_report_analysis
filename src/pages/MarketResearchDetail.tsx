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
  "relative overflow-hidden rounded-[32px] border border-white/40 bg-white/[0.92] shadow-[0_45px_140px_-60px_rgba(37,99,235,0.35)] ring-1 ring-sky-200/70 backdrop-blur-2xl";

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
    if (!analysis || !current) {
      toast.error("Report data unavailable");
      return;
    }
    try {
      setIsExportingPdf(true);
      const blob = await generateAnalysisReportPdf({
        analysisName: analysis.product_name,
        report: current,
        generatedAt: current.generatedAt ?? analysis.generated_at,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const sanitized = analysis.product_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      anchor.href = url;
      anchor.download = `${sanitized || "analysis"}-market-research.pdf`;
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
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#f9fafb]">
      <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
        <header className="flex flex-col gap-4 rounded-3xl border bg-white/90 p-6 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="rounded-full bg-[#dbeafe] text-[#1e40af]">Market Research</Badge>
              <Badge variant="secondary">v{current?.reportVersion ?? analysis.report_version ?? "2"}</Badge>
              {generatedDate ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Generated {generatedDate}
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">AI Market Research for {analysis.product_name}</h1>
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
            <Button variant="ghost" className="rounded-full" onClick={() => navigate("/dashboard")}> 
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        </header>

        <section>
          <Card
            className={`${threeDCardClass} flex h-full flex-col bg-gradient-to-br from-white/95 via-sky-50/80 to-indigo-100/50`}
            aria-label="Market research narrative overview"
          >
            <CardHeader className="space-y-2">
              <CardDescription className="text-sky-600">Narrative Intelligence Stack</CardDescription>
              <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">
                Translate signal into confident action
              </CardTitle>
              <p className="max-w-3xl text-slate-600">
                Brief leadership with a single canvas that blends market intelligence, forward-looking forecasts, and
                prioritized opportunities without losing the supporting evidence.
              </p>
            </CardHeader>
            <CardContent className="grid gap-6 text-slate-700 lg:grid-cols-3">
              <div className="flex flex-col gap-6 rounded-[28px] border border-sky-200/70 bg-white/85 p-5 backdrop-blur">
                <div className="space-y-1">
                  <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Market Intelligence Narrative</p>
                  <h3 className="text-xl font-semibold text-slate-900">Translate signal into confident action</h3>
                </div>
                <p className="leading-relaxed text-base">{insightNarrative}</p>
                <div className="grid gap-3 rounded-[24px] border border-sky-200/60 bg-white/90 p-4">
                  <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Spotlight insights</p>
                  <ul className="grid gap-3">
                    {keyInsights.slice(0, 5).map((insight, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-sky-600">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                        <span className="text-sm leading-relaxed text-slate-800">{insight}</span>
                      </li>
                    ))}
                    {!keyInsights.length ? (
                      <li className="text-sm text-muted-foreground">
                        Insight bullets will appear once the analysis generates qualitative highlights.
                      </li>
                    ) : null}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-6 rounded-[28px] border border-indigo-200/70 bg-white/85 p-5 backdrop-blur">
                <div className="space-y-1">
                  <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Forecast Outlook</p>
                  <h3 className="text-xl font-semibold text-slate-900">See where the category is headed next</h3>
                </div>
                <p className="leading-relaxed text-base">{forecastNarrative}</p>
                <Table className="overflow-hidden rounded-[24px] border border-indigo-200/60 bg-white/90 text-sm">
                  <TableHeader className="bg-indigo-500/10 text-indigo-700">
                    <TableRow className="border-indigo-200/60">
                      <TableHead className="font-semibold">Year</TableHead>
                      <TableHead className="text-right font-semibold">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecast.map((point, index) => {
                      const numericValue = asNumber(point?.value);
                      const label = point?.year ?? `FY${index + 1}`;
                      return (
                        <TableRow key={`${label}-${index}`} className="border-indigo-100/60 bg-white/95 backdrop-blur">
                          <TableCell className="font-medium text-slate-900">{label}</TableCell>
                          <TableCell className="text-right">
                            <div className="space-y-2">
                              <span className="font-semibold text-slate-800">{formatCurrency(numericValue, "USD")}</span>
                              <div className="h-1.5 overflow-hidden rounded-full bg-indigo-100">
                                <div
                                  className="h-full rounded-full bg-indigo-500"
                                  style={{ width: percentWidth(numericValue, forecastMax || numericValue || 1) }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!forecast.length ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                          Forecast projections will surface once the analysis has historical context.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-6 rounded-[28px] border border-purple-200/70 bg-white/85 p-5 backdrop-blur">
                <div className="space-y-1">
                  <p className="text-sm font-semibold uppercase tracking-wide text-purple-600">Opportunity Radar</p>
                  <h3 className="text-xl font-semibold text-slate-900">Prioritize moves with shared evidence</h3>
                </div>
                <p className="leading-relaxed text-base">{opportunityNarrative}</p>
                <Table className="overflow-hidden rounded-[24px] border border-purple-200/60 bg-white/90 text-sm">
                  <TableHeader className="bg-purple-500/10 text-purple-700">
                    <TableRow className="border-purple-200/60">
                      <TableHead className="font-semibold">Opportunity</TableHead>
                      <TableHead className="text-right font-semibold">Impact</TableHead>
                      <TableHead className="text-right font-semibold">Urgency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opportunityRows.map((row, index) => (
                      <TableRow key={`${row.title}-${index}`} className="border-purple-100/60 bg-white/95 backdrop-blur">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-900">{row.title}</p>
                            {row.detail ? <p className="text-xs text-slate-500">{row.detail}</p> : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-800">{row.impact ?? "—"}</TableCell>
                        <TableCell className="text-right text-xs uppercase tracking-wide text-slate-500">{row.urgency ?? "Plan"}</TableCell>
                      </TableRow>
                    ))}
                    {!opportunityRows.length ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                          Opportunity scoring will appear once the analysis ranks high-potential plays.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:auto-rows-fr lg:grid-cols-[1.4fr_1fr]">
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
            className={`${threeDCardClass} flex h-full flex-col bg-gradient-to-br from-white/95 via-sky-50/60 to-purple-100/40`}
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

        <section className="grid gap-6 lg:auto-rows-fr lg:grid-cols-2">
          <Card
            className={`${threeDCardClass} flex h-full flex-col bg-gradient-to-br from-white/95 via-indigo-50/70 to-slate-100/40`}
            aria-label="Competitive landscape card"
          >
            <CardHeader className="space-y-1">
              <CardDescription className="text-indigo-600">Competitive Landscape</CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                Stay sharper than the incumbents
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-6 text-slate-700">
              <p className="leading-relaxed text-base">{competitionNarrative}</p>
              <Table className="overflow-hidden rounded-[28px] border border-indigo-200/70 bg-white/80 text-sm">
                <TableHeader className="bg-indigo-500/10 text-indigo-700">
                  <TableRow className="border-indigo-200/60">
                    <TableHead className="font-semibold">Company</TableHead>
                    <TableHead className="font-semibold">Pricing</TableHead>
                    <TableHead className="font-semibold">Signature strength</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors.map((competitor, index) => {
                    const competitorItem = competitor as any;
                    return (
                      <TableRow key={`${competitorItem?.name ?? index}-${index}`} className="border-indigo-100/60 bg-white/85 backdrop-blur">
                        <TableCell className="font-semibold text-slate-900">{competitorItem?.name ?? `Competitor ${index + 1}`}</TableCell>
                        <TableCell className="text-sm text-slate-600">{competitorItem?.pricingModel ?? "—"}</TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {safeArray(competitorItem?.strengths).slice(0, 1).join(", ") || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!competitors.length ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                        Competitor benchmarks will appear once the analysis identifies key players.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
              <div className="space-y-3 rounded-[24px] border border-indigo-200/60 bg-white/80 p-4 text-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Feature benchmarks</p>
                <div className="space-y-2">
                  {featureBenchmark.map((feature, index) => {
                    const featureItem = feature as any;
                    return (
                      <div key={`${featureItem?.feature ?? index}-${index}`} className="flex items-center justify-between text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">{featureItem?.feature ?? `Feature ${index + 1}`}</span>
                        <span>{formatNumber(featureItem?.productScore, { maximumFractionDigits: 0 })}</span>
                        <span className="text-slate-500">Avg {formatNumber(featureItem?.competitorAverage, { maximumFractionDigits: 0 })}</span>
                      </div>
                    );
                  })}
                  {!featureBenchmark.length ? (
                    <p className="text-xs text-muted-foreground">
                      Feature comparisons will populate with richer competitive telemetry.
                    </p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`${threeDCardClass} flex h-full flex-col bg-gradient-to-br from-white/95 via-sky-50/70 to-amber-100/40`}
            aria-label="Journey and growth card"
          >
            <CardHeader className="space-y-1">
              <CardDescription className="text-amber-600">Journey & Growth Pulse</CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                Synchronize funnel health with future runway
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-6 text-slate-700">
              <p className="leading-relaxed text-base">{journeyNarrative}</p>
              <Table className="overflow-hidden rounded-[28px] border border-amber-200/70 bg-white/80 text-sm">
                <TableHeader className="bg-amber-500/10 text-amber-700">
                  <TableRow className="border-amber-200/60">
                    <TableHead className="font-semibold">Journey stage</TableHead>
                    <TableHead className="text-right font-semibold">Conversion</TableHead>
                    <TableHead className="font-semibold">Key plays</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journey.map((stage, index) => {
                    const stageItem = stage as any;
                    const conversion = asNumber(stageItem?.conversionRate);
                    return (
                      <TableRow key={`${stageItem?.stage ?? index}-${index}`} className="border-amber-100/60 bg-white/85 backdrop-blur">
                        <TableCell className="font-semibold text-slate-900">{stageItem?.stage ?? `Stage ${index + 1}`}</TableCell>
                        <TableCell className="text-right text-sm text-slate-700">{conversion ? `${conversion}%` : "—"}</TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {safeArray(stageItem?.keyActivities).slice(0, 3).join(", ") || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!journey.length ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                        Journey analytics will populate after the funnel receives enough signal.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
              <div className="space-y-3 rounded-[24px] border border-amber-200/60 bg-white/80 p-4 text-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">Growth timeline</p>
                <div className="space-y-2">
                  {growthTimeline.map((period, index) => {
                    const periodItem = period as any;
                    const growthIndex = asNumber(periodItem?.growthIndex);
                    const confidence = asNumber(periodItem?.confidence) * 100;
                    return (
                      <div key={`${periodItem?.period ?? index}-${index}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-800">
                          <span>{periodItem?.period ?? `Period ${index + 1}`}</span>
                          <span>{growthIndex ? `${growthIndex}` : "—"} index</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-amber-100">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{ width: percentWidth(growthIndex, growthIndexMax || growthIndex || 1) }}
                          />
                        </div>
                        <p className="text-[11px] uppercase tracking-wide text-amber-600">Confidence {confidence ? `${Math.round(confidence)}%` : "—"}</p>
                      </div>
                    );
                  })}
                  {!growthTimeline.length ? (
                    <p className="text-xs text-muted-foreground">
                      Growth projections will appear once forward-looking indicators are available.
                    </p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:auto-rows-fr lg:grid-cols-[1.2fr_1fr]">
          <Card
            className={`${threeDCardClass} flex h-full flex-col bg-gradient-to-br from-white/95 via-amber-50/70 to-rose-100/40`}
            aria-label="Regulation and risk card"
          >
            <CardHeader className="space-y-1">
              <CardDescription className="text-rose-600">Regulation & Risk Navigation</CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                Keep bold moves compliant and resilient
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-6 text-slate-700">
              <p className="leading-relaxed text-base">{regulationNarrative}</p>
              <div className="grid gap-3 rounded-[24px] border border-rose-200/60 bg-white/80 p-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">Regulatory signals</p>
                <div className="space-y-3">
                  {regulatorySignals.map((event, index) => {
                    const eventItem = event as any;
                    return (
                      <div key={`${eventItem?.title ?? index}-${index}`} className="flex items-start gap-3 rounded-[18px] border border-rose-100/60 bg-white/80 p-3">
                        <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/15 text-rose-600">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">{eventItem?.title ?? `Signal ${index + 1}`}</p>
                          <p className="text-xs text-slate-500">{eventItem?.impact ?? eventItem?.summary ?? "Impact pending"}</p>
                          {eventItem?.year ? (
                            <p className="text-[11px] uppercase tracking-wide text-rose-600">Effective {eventItem.year}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                  {!regulatorySignals.length ? (
                    <p className="text-sm text-muted-foreground">
                      Regulatory watch-outs will appear once the analysis flags policy movements.
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-3 rounded-[24px] border border-rose-200/60 bg-white/80 p-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">Risk watchlist</p>
                <div className="space-y-3">
                  {threatRows.map((risk, index) => (
                    <div key={`${risk.title}-${index}`} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/15 text-rose-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{risk.title}</p>
                        <p className="text-xs text-slate-500">{risk.summary ?? "Monitor for directional shifts"}</p>
                        <p className="text-[11px] uppercase tracking-wide text-rose-600">
                          Impact {risk.impact ?? "—"}{risk.urgency ? ` • Urgency ${risk.urgency}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!threatRows.length ? (
                    <p className="text-sm text-muted-foreground">
                      Risk indicators will surface here once the model spots material threats.
                    </p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`${threeDCardClass} flex h-full flex-col bg-gradient-to-br from-white/95 via-emerald-50/70 to-sky-100/40`}
            aria-label="Attribution and confidence card"
          >
            <CardHeader className="space-y-1">
              <CardDescription className="text-emerald-600">Attribution & Evidence</CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                Show exactly where every insight originated
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
                    <div
                      key={source.url ?? source.name}
                      className="rounded-[20px] border border-emerald-200/60 bg-white/80 p-4 text-sm"
                    >
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
                      External citations will surface here after the next enrichment cycle.
                    </p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6">
          <Card
            className={`${threeDCardClass} flex h-full flex-col bg-gradient-to-br from-white/95 via-sky-50/70 to-indigo-100/40`}
            aria-label="Executive recap card"
          >
            <CardHeader className="space-y-1">
              <CardDescription className="text-sky-600">Executive Recap</CardDescription>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                Broadcast the market story in one confident swipe
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 text-slate-700">
              <p className="leading-relaxed text-base">{recapNarrative}</p>
              <div className="rounded-[24px] border border-sky-200/70 bg-white/80 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Share-ready headline</p>
                <p className="mt-2 leading-relaxed">
                  {analysis.product_name} can capture demand by focusing on {segIndustry.slice(0, 1).map((item) => (item as any)?.name ?? item).join(" & ") || "priority segments"} and leaning into {segGeography.slice(0, 1).map((item) => (item as any)?.name ?? item).join(" & ") || "target regions"}; align squads to the roadmap above for differentiation that compounds each quarter.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default MarketResearchDetail;
