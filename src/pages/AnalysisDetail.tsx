import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, Users, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Target, Lightbulb, Download, Globe2, Activity, BarChart3, Sparkles, CircleDollarSign, Shield, Network, MapPin, LineChart as LineChartIcon, Wallet, Coins, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadialBarChart, RadialBar, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area, ComposedChart } from "recharts";
import type { ReportPayload, PersonaProfile } from "@/types/report";

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function clampNumber(value: number | null | undefined, min: number, max: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value: number | null | undefined, options?: Intl.NumberFormatOptions) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return new Intl.NumberFormat(undefined, options).format(value);
}

function formatPercentage(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return `${Math.round(value)}%`;
}

function impactToScore(value: string | null | undefined) {
  if (!value) return 0;
  const normalized = value.toLowerCase();
  if (normalized.includes("high")) return 90;
  if (normalized.includes("medium")) return 60;
  if (normalized.includes("low")) return 30;
  return 45;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(value: number | null | undefined, currency = "USD") {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function coerceNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = parseFloat(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(cleaned) ? cleaned : 0;
  }
  return 0;
}

function sanitizePieData<T extends Record<string, any>, K extends keyof T>(items: T[], valueKey: K) {
  return items
    .map(item => {
      const numericValue = coerceNumber(item[valueKey]);
      return { ...item, [valueKey]: numericValue } as T & Record<K, number>;
    })
    .filter(item => item[valueKey] > 0);
}

function createDynamicDomain(values: number[], paddingRatio = 0.15): [number, number] {
  if (!values.length) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range === 0) {
    const pad = Math.max(Math.abs(max) * paddingRatio, 1);
    return [Math.max(0, min - pad), max + pad];
  }
  const pad = range * paddingRatio;
  return [Math.max(0, min - pad), max + pad];
}

function ensureUniPolarDomain(
  values: number[] | readonly [number, number],
  baseRange: readonly [number, number] = [0, 100]
): [number, number] {
  const [min, max] = Array.isArray(values) && values.length === 2 && typeof values[0] === 'number'
    ? [values[0], values[1]]
    : createDynamicDomain(values as number[]);
  const baseMin = baseRange[0];
  const baseMax = baseRange[1];
  if (max <= baseMax && min >= baseMin) {
    return [baseMin, baseMax];
  }
  return [Math.max(baseMin, min), Math.max(baseMax, max)];
}

function normalizePercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value > 1 && value <= 100) return value;
  if (value > 0 && value <= 1) return value * 100;
  return value;
}

const ChannelDeviceTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
  const lines = String(payload.value).split(" (");
  const formattedLines = lines.length > 1 ? [lines[0], `(${lines.slice(1).join(" (")}`] : lines;

  return (
    <text x={x} y={y + 14} textAnchor="middle" fill="currentColor" style={{ fontSize: 12 }}>
      {formattedLines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : 14}>
          {line}
        </tspan>
      ))}
    </text>
  );
};

const RADIAN = Math.PI / 180;

const renderSentimentLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 12 }}>
      {`${Math.round((percent || 0) * 100)}%`}
    </text>
  );
};

interface Competitor {
  name: string;
  website: string;
  pricing: string;
  traffic: string;
  differentiator: string;
  features?: string[];
  rating?: number;
  weaknesses?: string[];
  sourceLink?: string;
}

interface BuyerPersona {
  title: string;
  companySize: string;
  painPoints: string[];
  motivations: string[];
}

interface MarketTrend {
  title: string;
  description: string;
  impact: string;
}

interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface Analysis {
  id: string;
  product_name: string;
  product_description: string;
  competitors: Competitor[];
  buyer_personas: BuyerPersona[];
  market_trends: MarketTrend[];
  swot_analysis: SWOTAnalysis;
  market_readiness_score: number;
  readiness_advice: string;
  report_payload: ReportPayload | null;
  report_version?: string | null;
  generated_at?: string | null;
}

const COLORS = [
  '#F59E0B', // amber
  '#3B82F6', // blue
  '#10B981', // emerald
  '#EF4444', // red
  '#A78BFA', // violet
  '#22C55E', // green
  '#F97316', // orange
  '#06B6D4', // cyan
  '#EAB308', // yellow
  '#8B5CF6', // purple
];

type PersonaCard = PersonaProfile & { title?: string };

const AnalysisDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [selectedCompanySize, setSelectedCompanySize] = useState<string>('all');

  useEffect(() => {
    loadAnalysis();
  }, [id]);

  const loadAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('product_analyses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      const record = data as unknown as Analysis;
      setAnalysis(record);
      setReport(record.report_payload ?? null);
    } catch (error) {
      console.error('Error loading analysis:', error);
      toast.error("Failed to load analysis");
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare chart data
  const currentReport = report ?? undefined;

  const getIcpChartData = () => {
    const personas = currentReport
      ? safeArray(currentReport.customerInsights.personas)
      : safeArray(analysis?.buyer_personas as unknown as BuyerPersona[]);
    if (!personas.length) return [];
    const filtered = selectedCompanySize === 'all' 
      ? personas
      : personas.filter(p => p.companySize === selectedCompanySize);
    const counts: { [key: string]: number } = {};
    filtered.forEach(persona => {
      counts[persona.companySize] = (counts[persona.companySize] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const getCompetitorChartData = () => {
    const competitors = currentReport
      ? safeArray(currentReport.competitiveLandscape.marketShare)
      : [];
    return competitors.map(company => ({
      name: company.company,
      score: company.share,
    }));
  };

  const readinessScore = currentReport
    ? clampNumber((currentReport?.executiveSummary?.marketReadiness?.score ?? 0) * 10, 0, 100)
    : (analysis?.market_readiness_score ?? 0) * 10;

  const readinessScoreTenScale = Math.round(readinessScore / 10);

  const marketEnvironment = currentReport?.marketEnvironment;
  const marketSizeForecast = safeArray(marketEnvironment?.marketSize?.forecast);
  const marketSizeCurrency = marketEnvironment?.marketSize?.currency || "USD";
  const cagrByRegion = safeArray(marketEnvironment?.cagrByRegion);
  const geoSegmentation = safeArray(marketEnvironment?.segmentation?.geography);
  const industrySegmentation = safeArray(marketEnvironment?.segmentation?.industry);
  const customerSegmentation = safeArray(marketEnvironment?.segmentation?.customer);
  const regulatoryEvents = safeArray(marketEnvironment?.regulatoryTrends);
  const influenceNodes = safeArray(marketEnvironment?.influenceMap);
  const competitiveDensity = safeArray(marketEnvironment?.competitiveDensity);

  const topCompetitorsData = safeArray(currentReport?.competitiveLandscape?.topCompetitors);
  const marketShareData = safeArray(currentReport?.competitiveLandscape?.marketShare);
  const priceFeatureMatrix = safeArray(currentReport?.competitiveLandscape?.priceFeatureMatrix);
  const featureBenchmark = safeArray(currentReport?.competitiveLandscape?.featureBenchmark);
  const innovationFrequency = safeArray(currentReport?.competitiveLandscape?.innovationFrequency);
  const logoCloud = safeArray(currentReport?.competitiveLandscape?.logoCloud);
  const negativeSignals = safeArray(currentReport?.competitiveLandscape?.negativeSignals);
  const sentimentTrend = safeArray(currentReport?.competitiveLandscape?.sentimentTrend);

  const readinessComparisonData = marketShareData.length
    ? marketShareData.map(item => ({ name: item.company, value: item.share }))
    : (analysis?.competitors || []).map(comp => ({ name: comp.name, value: Math.floor(Math.random() * 40) + 10 }));

  const rawGeoSegments = geoSegmentation.length
    ? geoSegmentation
    : readinessComparisonData.map(item => ({ name: item.name, share: item.value ?? 0 }));
  const geoChartData = sanitizePieData(rawGeoSegments, "share");
  const hasGeoChartData = geoChartData.length > 0;

  const personaProfiles = safeArray(currentReport?.customerInsights?.personas);
  const sentimentMaps = safeArray(currentReport?.customerInsights?.sentimentMaps);
  const behavioralSignals = safeArray(currentReport?.customerInsights?.behavioralSignals);
  const channelUsage = safeArray(currentReport?.customerInsights?.channelUsage);
  const deviceUsage = safeArray(currentReport?.customerInsights?.deviceUsage);
  const channelDeviceData = [
    ...channelUsage.map(item => ({ name: item.label, value: coerceNumber(item.percentage) })),
    ...deviceUsage.map(item => ({ name: `${item.label} (Device)`, value: coerceNumber(item.percentage) }))
  ];
  const purchaseJourney = safeArray(currentReport?.customerInsights?.purchaseJourney);

  const performanceMetrics = safeArray(currentReport?.productEvaluation?.performanceRadar);
  const featureOverlap = safeArray(currentReport?.productEvaluation?.featureOverlap);
  const featureCoverageData = featureOverlap.map(item => ({
    feature: item.feature,
    product: coerceNumber((item as { product?: number | string }).product),
    competitorAverage: coerceNumber((item as { competitorAverage?: number | string }).competitorAverage)
  }));
  const innovationQuotient = currentReport?.productEvaluation?.innovationQuotient;
  const technicalReadiness = safeArray(currentReport?.productEvaluation?.technicalReadiness);
  const retentionRisk = safeArray(currentReport?.productEvaluation?.retentionRisk);

  const unexploredSegments = safeArray(currentReport?.opportunityForecast?.unexploredSegments);
  const predictedShifts = safeArray(currentReport?.opportunityForecast?.predictedShifts);
  const predictedShiftData = predictedShifts.map((shift) => ({
    topic: shift.topic,
    confidencePercent: normalizePercent(coerceNumber(shift.confidence)),
  }));
  const predictedShiftDomain = predictedShiftData.length
    ? createDynamicDomain(predictedShiftData.map((item) => item.confidencePercent))
    : [0, 1];
  const predictedShiftAxisDomain = ensureUniPolarDomain(predictedShiftDomain, [0, 100]);
  const partnerships = safeArray(currentReport?.opportunityForecast?.partnerships);
  const regionalOpportunity = safeArray(currentReport?.opportunityForecast?.regionalOpportunity);
  const threatSignals = safeArray(currentReport?.opportunityForecast?.threatSignals);
  const growthTimeline = safeArray(currentReport?.opportunityForecast?.growthTimeline);

  const messagingFramework = safeArray(currentReport?.gtmStrategy?.messagingFramework);
  const channelPrioritization = safeArray(currentReport?.gtmStrategy?.channelPrioritization);
  const gtmBudgetAllocation = safeArray(currentReport?.gtmStrategy?.budgetAllocation);
  const competitiveTracking = safeArray(currentReport?.gtmStrategy?.competitiveTracking);
  const roiSimulation = safeArray(currentReport?.gtmStrategy?.roiSimulation);

  const pricingBenchmarks = safeArray(currentReport?.financialBenchmark?.pricingBenchmarks);
  const willingnessToPay = safeArray(currentReport?.financialBenchmark?.willingnessToPay);
  const valuationModel = safeArray(currentReport?.financialBenchmark?.valuationModel);
  const unitEconomics = currentReport?.financialBenchmark?.unitEconomics;
  const pricePositioning = safeArray(currentReport?.financialBenchmark?.pricePositioning);
  const pricePositioningLineData = pricePositioning
    .map(item => ({
      label: (item as { name?: string; tier?: string; segment?: string }).name
        ?? (item as { tier?: string }).tier
        ?? (item as { segment?: string }).segment
        ?? `${formatCurrency(coerceNumber((item as { price?: number }).price))}`,
      price: coerceNumber((item as { price?: number | string }).price),
      valueScore: coerceNumber((item as { valueScore?: number | string }).valueScore)
    }))
    .sort((a, b) => a.price - b.price);
  const profitMarginTrend = safeArray(currentReport?.financialBenchmark?.profitMarginTrend);
  const clvVsCac = safeArray(currentReport?.financialBenchmark?.clvVsCac);

  const newsSentimentList = safeArray(currentReport?.sentimentAnalysis?.newsSentiment);
  const socialToneData = safeArray(currentReport?.sentimentAnalysis?.socialTone);
  const reputationIndex = safeArray(currentReport?.sentimentAnalysis?.reputationIndex);
  const emergingPhrases = safeArray(currentReport?.sentimentAnalysis?.emergingPhrases);
  const trendingStories = safeArray(currentReport?.sentimentAnalysis?.trendingStories);
  const competitorCoverage = safeArray(currentReport?.sentimentAnalysis?.competitorCoverage);

  const policyScores = safeArray(currentReport?.riskCompliance?.policyScores);
  const technologyRisk = safeArray(currentReport?.riskCompliance?.technologyRisk);
  const ipConflicts = safeArray(currentReport?.riskCompliance?.ipConflicts);
  const financialGeopolitical = safeArray(currentReport?.riskCompliance?.financialGeopolitical);
  const rawRiskMatrix = safeArray(currentReport?.riskCompliance?.riskMatrix);
  const riskMatrixData = rawRiskMatrix.map((risk) => ({
    risk: risk.risk,
    impactPercent: Math.min(100, Math.max(0, normalizePercent(coerceNumber(risk.impact)))),
    probabilityPercent: Math.min(100, Math.max(0, normalizePercent(coerceNumber(risk.probability)))),
    owner: risk.owner,
  }));
  const hasRiskMatrixData = riskMatrixData.length > 0;
  const complianceStatus = safeArray(currentReport?.riskCompliance?.complianceStatus);

  const competitorMoves = safeArray(currentReport?.predictiveDashboard?.competitorMoves);
  const userAdoption = safeArray(currentReport?.predictiveDashboard?.userAdoption);
  const scenarioData = safeArray(currentReport?.predictiveDashboard?.scenarios);

  const recommendationActions = safeArray(currentReport?.strategicRecommendations?.actions);
  const sources = safeArray(currentReport?.sourceAttribution?.sources);

  const fallbackPersonaCards: PersonaCard[] = safeArray(analysis?.buyer_personas).map((persona) => ({
    name: persona.title,
    title: persona.title,
    role: persona.title,
    companySize: persona.companySize,
    budget: "N/A",
    motivations: safeArray(persona.motivations).map(String),
    objections: [],
    preferredChannels: [],
  }));

  const personaCards: PersonaCard[] = personaProfiles.length ? personaProfiles : fallbackPersonaCards;

  const legacyTrends = analysis?.market_trends || [];

  const swotLegacy = analysis?.swot_analysis;

  const readinessNarrative = currentReport?.executiveSummary?.marketReadiness?.summary || analysis?.readiness_advice || "";

  const themePalette = [
    "hsl(var(--chart-1, var(--primary)))",
    "hsl(var(--chart-2, var(--secondary)))",
    "hsl(var(--chart-3, var(--accent)))",
    "hsl(var(--chart-4, var(--muted-foreground)))",
    "hsl(var(--chart-5, var(--primary)))",
  ];
  const primaryColor = themePalette[0];
  const secondaryColor = themePalette[1];
  const accentColor = themePalette[2];
  const donutPalette = COLORS;
  const elevatedCardClass = "group relative overflow-hidden rounded-3xl border border-[#efe4ff] bg-gradient-to-br from-white via-[#f5ecff] to-white shadow-sm";
  const analyticPanelClass = "group relative overflow-hidden rounded-3xl border border-[#efe4ff] bg-gradient-to-br from-white via-[#faf3ff] to-white shadow-sm";
  const highlightPanelClass = `${analyticPanelClass}`;
  const subPanelClass = "rounded-2xl border border-[#f2e8ff] bg-white/95 p-5 shadow-sm";
  const pastelThemeOverrides = {
    "--primary": "268 84% 64%",
    "--primary-foreground": "0 0% 100%",
    "--muted": "265 100% 97%",
    "--muted-foreground": "265 24% 58%",
    "--accent": "24 93% 64%",
    "--accent-foreground": "0 0% 100%",
    "--card": "0 0% 100%",
    "--card-foreground": "266 32% 20%",
    "--border": "268 50% 88%",
  } as CSSProperties;

  const userAdoptionData = safeArray(currentReport?.predictiveDashboard?.userAdoption).map((point) => ({
    period: point.period,
    adoptionRate: coerceNumber(point.adoptionRate),
    sentimentScore: coerceNumber(point.sentimentScore),
  }));

  const latestAdoption = userAdoptionData.at(-1);
  const previousAdoption = userAdoptionData.at(-2);
  const adoptionPercentChange = latestAdoption && previousAdoption
    ? ((latestAdoption.adoptionRate - previousAdoption.adoptionRate) / Math.max(previousAdoption.adoptionRate || 1, 1)) * 100
    : null;
  const sentimentAverage = userAdoptionData.length
    ? userAdoptionData.reduce((acc, point) => acc + point.sentimentScore, 0) / userAdoptionData.length
    : null;

  const scenarioModelingData = safeArray(currentReport?.predictiveDashboard?.scenarios).map((scenario) => ({
    scenario: scenario.scenario,
    growthRate: normalizePercent(coerceNumber(scenario.growthRate)),
    revenueProjection: coerceNumber(scenario.revenueProjection),
  }));
  const scenarioGrowthDomain = scenarioModelingData.length
    ? createDynamicDomain(scenarioModelingData.map((item) => item.growthRate))
    : [0, 1];
  const scenarioRevenueDomain = scenarioModelingData.length
    ? createDynamicDomain(scenarioModelingData.map((item) => item.revenueProjection))
    : [0, 1];
  const scenarioGrowthAxisDomain = ensureUniPolarDomain(scenarioGrowthDomain, [0, 100]);
  const scenarioRevenueAxisDomain = scenarioRevenueDomain;
  const topScenario = scenarioModelingData.reduce<
    { scenario: string; growthRate: number; revenueProjection: number } | undefined
  >(
    (best, entry) => {
      if (!best || entry.revenueProjection > best.revenueProjection) {
        return entry;
      }
      return best;
    },
    undefined,
  );

  const channelMixSegments = safeArray(currentReport?.gtmStrategy?.channelPrioritization).map((item, idx) => ({
    label: item.channel,
    value: coerceNumber(item.budgetShare),
    color: donutPalette[idx % donutPalette.length],
  }));

  const deviceMixSegments = safeArray(currentReport?.customerInsights?.deviceUsage).map((item, idx) => ({
    label: item.label ?? `Device ${idx + 1}`,
    value: coerceNumber(item.percentage),
    color: donutPalette[(idx + 1) % donutPalette.length],
  }));

  const journeySegments = safeArray(currentReport?.customerInsights?.purchaseJourney).map((item, idx) => ({
    label: item.stage,
    value: coerceNumber(item.conversionRate),
    color: donutPalette[(idx + 2) % donutPalette.length],
  }));

  const regionalOpportunitySegments = safeArray(currentReport?.opportunityForecast?.regionalOpportunity).map((item, idx) => ({
    label: item.region,
    value: coerceNumber(item.score),
    color: donutPalette[(idx + 3) % donutPalette.length],
  }));

  const segmentCards = [
    channelMixSegments.length
      ? { title: "Channel Prioritization", timeframe: "Budget share", segments: channelMixSegments }
      : null,
    deviceMixSegments.length
      ? { title: "Device Usage", timeframe: "Customer touchpoints", segments: deviceMixSegments }
      : null,
    journeySegments.length
      ? { title: "Purchase Journey", timeframe: "Conversion rates", segments: journeySegments }
      : null,
    regionalOpportunitySegments.length
      ? { title: "Regional Opportunity", timeframe: "Score index", segments: regionalOpportunitySegments }
      : null,
  ].filter(Boolean) as {
    title: string;
    timeframe: string;
    segments: { label: string; value: number; color: string }[];
  }[];

  const marginTrendChartData = profitMarginTrend.map((item) => ({
    period: item.period,
    margin: coerceNumber(item.margin),
  }));

  const pricePositioningBreakdown = safeArray(currentReport?.financialBenchmark?.pricePositioning).map((entry, idx) => ({
    name: entry.company,
    price: coerceNumber(entry.price),
    valueScore: coerceNumber(entry.valueScore),
    color: donutPalette[idx % donutPalette.length],
  }));

  const growthTimelineData = safeArray(currentReport?.opportunityForecast?.growthTimeline).map((point) => ({
    period: point.period,
    growthIndex: coerceNumber(point.growthIndex),
    confidence: coerceNumber(point.confidence),
  }));

  const newsSentimentCounts = newsSentimentList.reduce((acc, item) => {
    const key = (item.sentiment || 'unknown').toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const newsSentimentChartData = sanitizePieData(
    Object.entries(newsSentimentCounts).map(([sentiment, value]) => ({ sentiment, value })),
    "value"
  );
  const hasNewsSentimentData = newsSentimentChartData.length > 0;

  const socialTotals = socialToneData.reduce(
    (acc, item) => {
      acc.positive += coerceNumber(item.positive);
      acc.neutral += coerceNumber(item.neutral);
      acc.negative += coerceNumber(item.negative);
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  const socialToneChartData = sanitizePieData(
    [
      { sentiment: 'Positive', value: socialTotals.positive },
      { sentiment: 'Neutral', value: socialTotals.neutral },
      { sentiment: 'Negative', value: socialTotals.negative },
    ],
    "value"
  );
  const hasSocialToneData = socialToneChartData.length > 0;

  const financialPlanning = currentReport?.financialPlanning;
  const runwayScenarios = safeArray(financialPlanning?.runwayScenarios).map(item => ({
    scenario: item.scenario,
    monthsOfRunway: coerceNumber(item.monthsOfRunway),
    cashBalance: coerceNumber(item.cashBalance),
    burnRate: coerceNumber(item.burnRate),
  }));

  const financialBudgetAllocation = safeArray(financialPlanning?.budgetAllocation).map(item => {
    const planned = coerceNumber(item.planned);
    const actual = coerceNumber(item.actual);
    const varianceBase = (item as { variance?: number }).variance;
    const variance = varianceBase !== undefined
      ? coerceNumber(varianceBase)
      : actual - planned;
    return {
      category: item.category,
      planned,
      actual,
      variance,
    };
  });

  const cashFlowTimeline = safeArray(financialPlanning?.cashFlowTimeline).map(point => ({
    period: point.period,
    inflow: coerceNumber(point.inflow),
    outflow: coerceNumber(point.outflow),
    net: coerceNumber(point.net),
  }));

  const financialPlanningMap = safeArray(financialPlanning?.financialPlanningMap).map(node => ({
    region: node.region,
    budgetWeight: coerceNumber(node.budgetWeight),
    projectedRevenue: coerceNumber(node.projectedRevenue),
    priority: node.priority,
  }));

  const strategicFinancialNotes = safeArray(financialPlanning?.strategicNotes).filter((note): note is string => typeof note === "string" && note.trim().length > 0);

  const hasFinancialPlanningData = runwayScenarios.length || financialBudgetAllocation.length || cashFlowTimeline.length || financialPlanningMap.length || strategicFinancialNotes.length;

  // Export functions
  const exportCompetitorsCSV = () => {
    const csvRows = currentReport
      ? safeArray(currentReport?.competitiveLandscape?.topCompetitors).map(comp => [
          comp.name,
          comp.pricingModel,
          safeArray(comp.featureHighlights).join('; '),
          formatNumber(comp.monthlyTraffic),
          safeArray(comp.strengths).join('; '),
          safeArray(comp.weaknesses).join('; ')
        ])
      : safeArray(analysis?.competitors).map(comp => [
          comp.name,
          comp.pricing,
          (comp.features?.join('; ') || comp.differentiator),
          (comp.rating ? `${comp.rating}/5` : 'N/A'),
          (comp.weaknesses?.join('; ') || 'Limited integrations'),
          (comp.sourceLink || comp.website)
        ]);

    if (!csvRows.length) {
      toast.info("No competitor data available to export");
      return;
    }

    const headers = currentReport
      ? ['Competitor', 'Pricing', 'Key Features', 'Monthly Traffic', 'Strengths', 'Weaknesses']
      : ['Competitor', 'Price/mo', 'Main Features', 'Customer Rating', 'Major Weaknesses', 'Source Link'];

    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell ?? ''}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.product_name}-competitors.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportReportPDF = async () => {
    if (!analysis || !report) {
      toast.error("Report data unavailable for PDF export");
      return;
    }

    try {
      setIsExportingPdf(true);
      const pdfModule = await import("@/pdf/AnalysisReportPDF");
      type GenerateAnalysisReportPdf = (args: { analysisName: string; report: ReportPayload; generatedAt?: string | null }) => Promise<Blob>;
      const generateAnalysisReportPdf =
        (pdfModule as unknown as { generateAnalysisReportPdf?: GenerateAnalysisReportPdf }).generateAnalysisReportPdf ??
        (pdfModule as unknown as { default?: GenerateAnalysisReportPdf }).default ??
        null;
      if (!generateAnalysisReportPdf) {
        throw new Error("PDF generator not available");
      }
      const blob = await generateAnalysisReportPdf({
        analysisName: analysis.product_name,
        report,
        generatedAt: analysis.generated_at ?? analysis.generated_at ?? report.generatedAt,
      });

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const sanitizedName = analysis.product_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      anchor.download = `${sanitizedName || "analysis"}-report.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("PDF export ready");
    } catch (error) {
      console.error("Failed to export PDF", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const getScoreColor = (score: number) => {
    // Market Readiness uses orange theme color
    return "text-orange-500";
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      High: "bg-red-100 text-red-800",
      Medium: "bg-yellow-100 text-yellow-800",
      Low: "bg-green-100 text-green-800"
    };
    return colors[impact as keyof typeof colors] || colors.Medium;
  };

  const generatedDate = currentReport?.generatedAt
    ? new Date(currentReport.generatedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : analysis.generated_at
      ? formatDate(analysis.generated_at)
      : null;
  const keyInsights = safeArray(currentReport?.executiveSummary?.keyInsights);
  const riskIndicators = safeArray(currentReport?.executiveSummary?.riskIndicators);
  const topOpportunities = safeArray(currentReport?.executiveSummary?.topOpportunities);
  const primaryOpportunity = topOpportunities[0];
  const opportunityImpactLabel =
    typeof primaryOpportunity?.impact === "number"
      ? `${formatNumber(primaryOpportunity.impact, { maximumFractionDigits: 0 })} impact`
      : null;
  const primaryRisk = riskIndicators[0];
  const growthPotentialSummary = currentReport?.executiveSummary?.growthPotential;
  const targetPersona = personaCards[0];
  const competitorOverviewRaw = marketShareData.length
    ? marketShareData.map(item => ({ name: item.company, value: coerceNumber(item.share) }))
    : readinessComparisonData.map(item => ({ name: item.name, value: coerceNumber(item.value) }));
  const competitorOverview = competitorOverviewRaw.slice(0, 4);
  const competitorMaxShare = competitorOverview.reduce((max, item) => Math.max(max, item.value), 0) || 100;

  const latestGrowthPoint = growthTimelineData.at(-1);
  const baselineGrowthValue = typeof latestGrowthPoint?.growthIndex === "number" ? latestGrowthPoint.growthIndex : null;
  const growthHeadline = growthPotentialSummary?.trim().length
    ? growthPotentialSummary
    : baselineGrowthValue !== null
      ? `${baselineGrowthValue >= 0 ? "+" : ""}${formatNumber(baselineGrowthValue, { maximumFractionDigits: 0 })}% YoY Growth`
      : "Growth outlook pending";
  const growthSubcopy = latestGrowthPoint?.period
    ? `Projection through ${latestGrowthPoint.period}`
    : "AI-estimated annual trajectory";
  const competitorBarItems = competitorOverview.map((item, idx) => ({
    name: item.name ?? `Competitor ${idx + 1}`,
    value: item.value,
    color: donutPalette[idx % donutPalette.length],
  }));

  const summaryHighlights = [
    {
      title: "Top Market Opportunity",
      description: primaryOpportunity
        ? `${primaryOpportunity.label}${opportunityImpactLabel ? ` · ${opportunityImpactLabel}` : ""}`
        : keyInsights[0] ?? "AI identified the strongest growth lane for your product.",
      Icon: Lightbulb,
    },
    {
      title: "Key Differentiator",
      description: keyInsights[1] ?? keyInsights[0] ?? "Your proprietary edge stands out in the current landscape.",
      Icon: Sparkles,
    },
    {
      title: "Primary Competitive Risk",
      description: primaryRisk ?? riskIndicators[1] ?? "Monitor incumbent moves and pricing pressure.",
      Icon: Shield,
    },
    {
      title: "Target Audience Insight",
      description: targetPersona
        ? `${targetPersona.role} · ${targetPersona.companySize}`
        : "Project managers need relief from manual workflows.",
      Icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-muted">
      <div className="container mx-auto max-w-6xl px-4 py-10" style={pastelThemeOverrides}>
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2a1609] sm:text-4xl">Product Strategy & Financial Outlook</h1>
            {generatedDate ? (
              <p className="mt-1 text-sm font-medium text-[#a15c3d]">
                Report generated on: {generatedDate}
              </p>
            ) : (
              <p className="mt-1 text-sm text-[#a15c3d]/70">Report generated date unavailable</p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Button
              onClick={exportReportPDF}
              disabled={isExportingPdf}
              className="flex items-center gap-2 rounded-xl bg-[#fce7d8] px-5 py-2 text-sm font-semibold text-[#5d2a1a] shadow-sm transition hover:bg-[#f7d9c4] disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {isExportingPdf ? "Exporting PDF..." : "Export PDF"}
            </Button>
            <Button
              onClick={exportCompetitorsCSV}
              className="flex items-center gap-2 rounded-xl bg-[#fce7d8] px-5 py-2 text-sm font-semibold text-[#5d2a1a] shadow-sm transition hover:bg-[#f7d9c4]"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </header>

        <section className="space-y-12">
          <div className="relative overflow-hidden rounded-3xl border border-[#f0e3ff] bg-gradient-to-br from-[#fdfbff] via-[#f9f2ff] to-white p-8 shadow-lg">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(157,78,221,0.16),transparent_60%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-widest text-[#7c3aed]">AI Market Intelligence Report</p>
                  <h1 className="text-4xl font-bold text-[#271046]">{analysis.product_name}</h1>
                </div>
                <p className="max-w-2xl text-base text-[#5c4c71]">{analysis.product_description}</p>
                {generatedDate ? (
                  <p className="text-sm font-medium text-[#7d6b9c]">Generated on {generatedDate}</p>
                ) : null}
              </div>
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Button variant="outline" className="rounded-full border-[#cbb4ff] text-[#4b1f78] hover:bg-[#f1e9ff]" onClick={exportCompetitorsCSV}>
                  <Download className="h-4 w-4" />
                  <span className="ml-2">Export CSV</span>
                </Button>
                <Button variant="outline" className="rounded-full border-[#cbb4ff] text-[#4b1f78] hover:bg-[#f1e9ff]" onClick={exportReportPDF} disabled={isExportingPdf}>
                  <Download className="h-4 w-4" />
                  <span className="ml-2">{isExportingPdf ? "Exporting..." : "Export Report"}</span>
                </Button>
              </div>
            </div>
          </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {summaryHighlights.map(({ title, description, Icon }) => (
                <Card key={title} className="rounded-3xl border border-[#efe4ff] bg-white/95 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="flex h-full flex-col gap-3 p-6">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4ecff] text-[#8b5cf6]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#271046]">{title}</p>
                      <p className="mt-1 text-sm text-[#6f5c8d]">{description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#271046]">Key Metrics</h2>
                  <p className="text-sm text-[#7d6b9c]">Signal-rich overview of current market readiness</p>
                </div>
                <Button variant="ghost" className="w-max rounded-full px-4 text-[#4b1f78] hover:bg-[#f4ecff]" onClick={() => navigate("/dashboard")}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="rounded-3xl border border-[#efe4ff] bg-white/95 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardDescription className="text-[#7d6b9c]">Market Readiness Score</CardDescription>
                    <CardTitle className="text-4xl font-bold text-[#c056ff]">{readinessScoreTenScale * 10}%</CardTitle>
                    <p className="text-xs uppercase tracking-wide text-[#998bbb]">Composite of product-market fit, team strength, competitive landscape & financial viability</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 rounded-2xl bg-[#f6ecff] px-4 py-3 text-sm text-[#7b3baf]">
                      <Target className="h-5 w-5" />
                      <span>{readinessNarrative || "Strong positioning with targeted improvements recommended."}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {["Product-Market Fit", "Competitive Landscape", "Team Strength", "Financial Viability"].map((label) => (
                        <div key={label} className="flex items-center gap-2 text-xs font-medium text-[#7d6b9c]">
                          <span className="h-2 w-2 rounded-full bg-[#c056ff]" />
                          {label}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-3xl border border-[#efe4ff] bg-white/95 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardDescription className="text-[#7d6b9c]">Growth Potential</CardDescription>
                    <CardTitle className="text-4xl font-bold text-[#271046]">{growthHeadline}</CardTitle>
                    <p className="text-sm font-semibold text-[#16a34a]">YoY Growth</p>
                    <p className="text-xs text-[#7d6b9c]">{growthSubcopy}</p>
                  </CardHeader>
                  <CardContent className="h-48">
                    {growthTimelineData.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={growthTimelineData}>
                          <defs>
                            <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 4" stroke="#efe4ff" />
                          <XAxis dataKey="period" stroke="#998bbb" tickLine={false} axisLine={false} fontSize={12} />
                          <YAxis stroke="#998bbb" tickLine={false} axisLine={false} fontSize={12} />
                          <Tooltip formatter={(value: number) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`} />
                          <Area type="monotone" dataKey="growthIndex" stroke="#f97316" fill="url(#growthGradient)" strokeWidth={3} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[#7d6b9c]">
                        No growth data available.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <Card className="rounded-3xl border border-[#efe4ff] bg-white/95 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-[#271046]">Competitor Overview</CardTitle>
                  <CardDescription className="text-[#7d6b9c]">Relative market share vs. category average</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {competitorBarItems.length ? (
                    competitorBarItems.map((entry) => (
                      <div key={entry.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm font-medium text-[#4b1f78]">
                          <span>{entry.name}</span>
                          <span>{formatNumber(entry.value, { maximumFractionDigits: 1 })}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-[#f4ecff]">
                          <div
                            className="h-3 rounded-full"
                            style={{
                              width: `${Math.min(100, (entry.value / competitorMaxShare) * 100)}%`,
                              backgroundColor: entry.color,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#7d6b9c]">No competitor data available.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="rounded-3xl border border-[#efe4ff] bg-white/95 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-[#271046]">Executive Summary</CardTitle>
                  <CardDescription className="text-[#7d6b9c]">AI synthesized narrative</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-[#5c4c71]">
                  <p>{readinessNarrative || "Focus on unique differentiators and shore up integration coverage to win."}</p>
                  <div className="space-y-2">
                    {keyInsights.slice(0, 3).map((insight, index) => (
                      <div key={insight ?? index} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-1 h-4 w-4 text-[#8b5cf6]" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Product Intelligence Dashboard */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-[#271046]">Product Intelligence</h2>
                <p className="text-sm text-[#7d6b9c]">
                  Live dashboards summarizing the latest AI report signals
                </p>
              </div>

              <div className="space-y-8">
                <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                  <Card className={analyticPanelClass}>
                    <CardHeader className="pb-4">
                      <CardDescription className="text-[#7d6b9c]">User Adoption Overview</CardDescription>
                      <CardTitle className="text-3xl font-semibold text-[#271046]">
                        {formatNumber(latestAdoption?.adoptionRate, { maximumFractionDigits: 1 })}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-[#7d6b9c]">
                        <ArrowUpRight className="h-4 w-4 text-[#8b5cf6]" />
                        <span className={adoptionPercentChange && adoptionPercentChange < 0 ? "text-[#dc2626]" : "text-[#16a34a]"}>
                          {adoptionPercentChange !== null
                            ? `${formatNumber(adoptionPercentChange, { maximumFractionDigits: 1 })}% vs prior period`
                            : "No prior period"}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="text-[#5c4c71]">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#998bbb]">Sentiment Avg</p>
                          <p className="mt-1 text-lg font-semibold">
                            {formatNumber(sentimentAverage, { maximumFractionDigits: 1 })}
                          </p>
                          <span className="text-xs text-[#998bbb]">Score across adoption periods</span>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#998bbb]">Top Scenario</p>
                          <p className="mt-1 text-lg font-semibold">{topScenario?.scenario ?? "—"}</p>
                          <span className="text-xs text-[#998bbb]">
                            Growth {formatNumber(topScenario?.growthRate, { maximumFractionDigits: 1 })}%
                          </span>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#998bbb]">Revenue Projection</p>
                          <p className="mt-1 text-lg font-semibold">
                            {formatCurrency(topScenario?.revenueProjection)}
                          </p>
                          <span className="text-xs text-[#998bbb]">Scenario outlook</span>
                        </div>
                      </div>
                      <div className="mt-6 h-64">
                        {userAdoptionData.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={userAdoptionData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#efe4ff" />
                              <XAxis dataKey="period" stroke="#998bbb" tickLine={false} axisLine={false} fontSize={12} />
                              <YAxis stroke="#998bbb" tickLine={false} axisLine={false} fontSize={12} />
                              <Tooltip />
                              <Line type="monotone" dataKey="adoptionRate" stroke={primaryColor} strokeWidth={3} dot={false} isAnimationActive={false} />
                              <Line type="monotone" dataKey="sentimentScore" stroke={secondaryColor} strokeWidth={2} dot={false} isAnimationActive={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-[#7d6b9c]">
                            No adoption data available.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={analyticPanelClass}>
                    <CardHeader className="pb-4">
                      <CardDescription>Scenario Modeling</CardDescription>
                      <CardTitle className="flex items-center gap-2 text-3xl">
                        <Users className="h-6 w-6 text-primary" />
                        {scenarioModelingData.length ? formatNumber(topScenario?.growthRate, { maximumFractionDigits: 1 }) + "%" : "—"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Growth rate for highest revenue projection</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="h-32">
                        {scenarioModelingData.length ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={scenarioModelingData}>
                              <defs>
                                <linearGradient id="scenarioGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.5} />
                                  <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="scenario" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} fontSize={11} />
                              <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => formatCurrency(value)} />
                              <Tooltip formatter={(value) => formatCurrency(value as number)} />
                              <Area type="monotone" dataKey="revenueProjection" stroke={secondaryColor} fill="url(#scenarioGradient)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            No scenario modeling available.
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 text-sm">
                        {topScenario ? (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Top scenario</span>
                            <span className="font-semibold">{topScenario.scenario}</span>
                          </div>
                        ) : null}
                        {topScenario ? (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Revenue projection</span>
                            <span className="font-semibold">{formatCurrency(topScenario.revenueProjection)}</span>
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {segmentCards.length ? (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {segmentCards.map((segment) => {
                  const total = segment.segments.reduce((sum, item) => sum + item.value, 0);
                  return (
                    <Card key={segment.title} className={analyticPanelClass}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{segment.title}</CardTitle>
                          <span className="text-xs text-muted-foreground">{segment.timeframe}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center gap-5">
                        <div className="relative mx-auto flex items-center justify-center">
                          <div className="aspect-square w-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={segment.segments}
                                  dataKey="value"
                                  innerRadius="60%"
                                  outerRadius="80%"
                                  stroke="transparent"
                                  paddingAngle={4}
                                  cornerRadius={12}
                                  startAngle={90}
                                  endAngle={-270}
                                  cx="50%"
                                  cy="50%"
                                  isAnimationActive={false}
                                >
                                  {segment.segments.map((item, index) => (
                                    <Cell key={`${segment.title}-${item.label}-${index}`} fill={item.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-xl font-semibold">{formatNumber(total, { maximumFractionDigits: 1 })}</p>
                          </div>
                        </div>
                        <div className="w-full space-y-2 text-sm">
                          {segment.segments.map((item) => (
                            <div key={item.label} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-muted-foreground">{item.label}</span>
                              </div>
                              <span className="font-semibold">{formatNumber(item.value, { maximumFractionDigits: 1 })}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                    })}
                  </div>
                ) : null}

                <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
                  <Card className={analyticPanelClass}>
                    <CardHeader className="pb-4">
                  <CardTitle>Profit Margin Trend</CardTitle>
                  <CardDescription>Tracking margin swings over time</CardDescription>
                    </CardHeader>
                    <CardContent className="h-72">
                  {profitMarginTrend.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={profitMarginTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`} />
                        <Tooltip formatter={(value: number) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`} />
                        <Bar dataKey="margin" fill={primaryColor} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No profit margin data available.
                    </div>
                  )}
                    </CardContent>
                  </Card>

                  <Card className={analyticPanelClass}>
                    <CardHeader className="pb-4">
                  <CardTitle>Price Positioning</CardTitle>
                  <CardDescription>Comparing market price and value score</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6">
                  {pricePositioningBreakdown.length ? (
                    <>
                      <div className="relative mx-auto flex items-center justify-center">
                        <div className="aspect-square w-44">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pricePositioningBreakdown}
                                dataKey="price"
                                nameKey="name"
                                innerRadius="60%"
                                outerRadius="80%"
                                stroke="transparent"
                                paddingAngle={4}
                                cornerRadius={12}
                                startAngle={90}
                                endAngle={-270}
                                cx="50%"
                                cy="50%"
                                isAnimationActive={false}
                              >
                                {pricePositioningBreakdown.map((entry) => (
                                  <Cell key={entry.name} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-xs text-muted-foreground">Avg value score</p>
                          <p className="text-2xl font-semibold">
                            {formatNumber(
                              pricePositioningBreakdown.reduce((acc, entry) => acc + entry.valueScore, 0) / pricePositioningBreakdown.length,
                              { maximumFractionDigits: 1 }
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="w-full space-y-2 text-sm">
                        {pricePositioningBreakdown.map((entry) => (
                          <div key={entry.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-muted-foreground">{entry.name}</span>
                            </div>
                            <span className="font-semibold">{formatCurrency(entry.price)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                      No price positioning data available.
                    </div>
                  )}
                    </CardContent>
                  </Card>
                </div>

                <Card className={analyticPanelClass}>
                  <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Growth Timeline
                </CardTitle>
                <CardDescription>Growth index vs confidence across forecast periods</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72">
                {growthTimelineData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthTimelineData}>
                      <defs>
                        <linearGradient id="growthIndexGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={accentColor} stopOpacity={0.6} />
                          <stop offset="95%" stopColor={accentColor} stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="growthConfidenceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.5} />
                          <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip />
                      <Area type="monotone" dataKey="growthIndex" stroke={accentColor} fill="url(#growthIndexGradient)" strokeWidth={2} isAnimationActive={false} />
                      <Area type="monotone" dataKey="confidence" stroke={secondaryColor} fill="url(#growthConfidenceGradient)" strokeWidth={2} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No growth forecast data available.
                  </div>
                )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Market Readiness Score */}
            <Card className={`${highlightPanelClass} mb-12`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Executive Intelligence Summary
            </CardTitle>
            <CardDescription>Snapshot of opportunities, risks, and recommended moves.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col items-center justify-center gap-3">
                <RadialBarChart
                  width={225}
                  height={225}
                  data={[{ name: "Readiness", value: readinessScore }]}
                  innerRadius="70%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarGrid radialLines={false} />
                  <RadialBar
                    dataKey="value"
                    fill="#6366f1"
                    isAnimationActive={false}
                    cornerRadius={8}
                  />
                  <text
                    x={112}
                    y={115}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-current text-xl font-semibold"
                  >
                    {Math.round(readinessScore)}
                  </text>
                </RadialBarChart>
                <p className={`text-sm font-medium ${getScoreColor(readinessScore)}`}>
                  {currentReport?.executiveSummary?.marketReadiness?.status || "Assessment Pending"}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Key Insights
                  </h4>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    {safeArray(currentReport?.executiveSummary?.keyInsights).map((insight, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>
                          {typeof insight === "string"
                            ? insight
                            : typeof insight === "number"
                              ? String(insight)
                              : insight && typeof insight === "object"
                                ? [
                                    (insight as any).title,
                                    (insight as any).summary,
                                    (insight as any).focus,
                                    (insight as any).text,
                                    (insight as any).description,
                                  ]
                                    .filter(Boolean)
                                    .join(" — ") || JSON.stringify(insight)
                                : String(insight)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Decision Radar
                  </h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={safeArray(currentReport?.executiveSummary?.decisionRadar)}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="axis" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} isAnimationActive={false} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Top Opportunities
                </h4>
                <Table className="mt-3">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Area</TableHead>
                      <TableHead>Impact</TableHead>
                      <TableHead>Urgency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeArray(currentReport?.executiveSummary?.topOpportunities).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.label}</TableCell>
                        <TableCell>{formatPercentage(item.impact)}</TableCell>
                        <TableCell>{item.urgency ? formatPercentage(item.urgency) : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Top Threats
                </h4>
                <Table className="mt-3">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Threat</TableHead>
                      <TableHead>Impact</TableHead>
                      <TableHead>Urgency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeArray(currentReport?.executiveSummary?.topThreats).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.label}</TableCell>
                        <TableCell>{formatPercentage(item.impact)}</TableCell>
                        <TableCell>{item.urgency ? formatPercentage(item.urgency) : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Improvement Impact Matrix</h4>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={safeArray(currentReport?.executiveSummary?.marketReadiness?.improvementMatrix)} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="improvementMatrixGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                  <XAxis dataKey="effort" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="impact" tickFormatter={(value) => `${Math.round(value as number)}%`} />
                  <Tooltip formatter={(value: number, name, props) => {
                    if (name === 'impact') {
                      return [`${Math.round(value as number)}%`, 'Impact'];
                    }
                    if (name === 'effort') {
                      return [`${Math.round(value as number)}%`, 'Effort'];
                    }
                    const lift = props?.payload?.expectedLift;
                    return [formatNumber(lift, { maximumFractionDigits: 1 }), 'Expected Lift'];
                  }} />
                  <Area
                    type="monotone"
                    dataKey="impact"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#improvementMatrixGradient)"
                    dot={{ r: 4, stroke: '#6366f1', fill: '#fff', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                  <Line type="monotone" dataKey="expectedLift" stroke="#f97316" strokeWidth={2} dot={{ r: 4, stroke: '#f97316', fill: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Market Environment Overview */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card className={analyticPanelClass}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-primary" />
                Market Growth Forecast
              </CardTitle>
              <CardDescription>Projected market trajectory over the next 5 years</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={marketSizeForecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => formatNumber(value)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value, marketSizeCurrency)} />
                  <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="grid gap-3 sm:grid-cols-3">
                {cagrByRegion.map((region, idx) => (
                  <div key={idx} className="rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-muted-foreground">{region.region}</p>
                    <p className="text-lg font-semibold">{formatPercentage(region.value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={analyticPanelClass}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Geographic Distribution
              </CardTitle>
              <CardDescription>Regional market share and competitive density</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasGeoChartData ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={geoChartData}
                      dataKey="share"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      cornerRadius={6}
                      stroke="transparent"
                      isAnimationActive={false}
                      
                    >
                      {geoChartData.map((entry: any, index: number) => (
                        <Cell key={`geo-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No geographic distribution data available.</p>
              )}
              <div>
                <h4 className="text-sm font-semibold mb-2">Competitive Density Index</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={competitiveDensity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className={`${analyticPanelClass} mb-12`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-primary" />
              Regulatory & Policy Timeline
            </CardTitle>
            <CardDescription>Key milestones influencing market adoption</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {regulatoryEvents.map((event, idx) => (
                <div key={idx} className="rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground tracking-wide">{event.year}</p>
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-sm text-muted-foreground mt-2">{event.summary}</p>
                  </div>
                  <Badge className="whitespace-nowrap">{event.impact}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Competitive Landscape */}
        <Card className={`${analyticPanelClass} mb-12`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Competitive Landscape Mapping
            </CardTitle>
            <CardDescription>Benchmarking competitors across price, features, and innovation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competitor</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Traffic</TableHead>
                    <TableHead>Funding</TableHead>
                    <TableHead>Strengths</TableHead>
                    <TableHead>Weaknesses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(topCompetitorsData.length ? topCompetitorsData : analysis.competitors || []).map((competitor: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold">{competitor.name}</TableCell>
                      <TableCell>{competitor.pricingModel || competitor.pricing}</TableCell>
                      <TableCell>{competitor.monthlyTraffic ? `${formatNumber(competitor.monthlyTraffic)} visits/mo` : competitor.traffic}</TableCell>
                      <TableCell>{competitor.funding || '—'}</TableCell>
                      <TableCell>
                        <ul className="text-xs list-disc list-inside space-y-1">
                          {safeArray(competitor.strengths || competitor.features).slice(0, 3).map((strength: string, i: number) => (
                            <li key={i}>{strength}</li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell>
                        <ul className="text-xs list-disc list-inside space-y-1">
                          {safeArray(competitor.weaknesses).slice(0, 3).map((weakness: string, i: number) => (
                            <li key={i}>{weakness}</li>
                          )) || <li>Limited visibility</li>}
                        </ul>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl bg-gradient-to-br from-background/90 via-muted/20 to-background/95 p-5 shadow-lg backdrop-blur">
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Market Share Overview
                </h4>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={marketShareData.length ? marketShareData : readinessComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={marketShareData.length ? "company" : "name"} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey={marketShareData.length ? "share" : "value"} fill="#6366f1" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                    <Line type="monotone" dataKey={marketShareData.length ? "share" : "value"} stroke="#f97316" strokeWidth={2} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Price vs Feature Score
                </h4>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={priceFeatureMatrix} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                    <defs>
                      <linearGradient id="priceFeatureGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                    <XAxis dataKey="pricePosition" tickFormatter={(value) => `${Math.round(value as number)}%`} />
                    <YAxis dataKey="featureScore" tickFormatter={(value) => `${Math.round(value as number)}%`} />
                    <Tooltip formatter={(value: number, name, props) => {
                      if (name === 'pricePosition') {
                        return [`${Math.round(value as number)}%`, 'Price Position'];
                      }
                      return [`${Math.round(value as number)}%`, 'Feature Score'];
                    }} />
                    <Area
                      type="monotone"
                      dataKey="featureScore"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      fill="url(#priceFeatureGradient)"
                      dot={{ r: 4, stroke: '#22d3ee', fill: '#fff', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                    <Line type="monotone" dataKey="pricePosition" stroke="#a855f7" strokeWidth={2} dot={{ r: 4, stroke: '#a855f7', fill: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-4">Innovation Frequency</h4>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={innovationFrequency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="company" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="patentsPerYear" fill="#8b5cf6" radius={[8, 8, 0, 0]} isAnimationActive={false} />
                    <Line type="monotone" dataKey="releaseCadence" stroke="#f59e0b" strokeWidth={2} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className={`${subPanelClass} space-y-3`}>
                <h4 className="text-sm font-semibold">Negative Signals</h4>
                {negativeSignals.map((signal, idx) => (
                  <div key={idx} className="rounded-lg bg-background/80 p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{signal.company}</p>
                      <Badge>{signal.severity}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{signal.signal}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Insights */}
        <Card className={`${analyticPanelClass} mb-12`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Customer (ICP) Insights
            </CardTitle>
            <CardDescription>Buyer personas, sentiment, and decision journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {personaCards.map((persona, idx) => {
                const personaName = persona.name ?? persona.title ?? "ICP Persona";
                return (
                  <div key={idx} className="rounded-3xl bg-gradient-to-br from-muted/40 via-background/80 to-background/95 p-5 shadow-lg backdrop-blur">
                    <p className="text-xs uppercase text-muted-foreground">{persona.role}</p>
                    <h4 className="text-lg font-semibold mt-1">{personaName}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{persona.companySize}</p>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Motivations</p>
                      <ul className="text-xs list-disc list-inside space-y-1">
                        {safeArray(persona.motivations).slice(0, 3).map((motivation, i) => (
                          <li key={i}>{String(motivation)}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Objections</p>
                      <ul className="text-xs list-disc list-inside space-y-1">
                        {safeArray(persona.objections).slice(0, 3).map((objection, i) => (
                          <li key={i}>{String(objection)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  </div>
                );
              })}
            </div>

            <div className={subPanelClass}>
              <h4 className="text-sm font-semibold mb-3">Buyer Sentiment Mix</h4>
              {hasSocialToneData ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={socialToneChartData}
                      dataKey="value"
                      nameKey="sentiment"
                      innerRadius={56}
                      outerRadius={84}
                      paddingAngle={2}
                      cornerRadius={6}
                      stroke="transparent"
                      isAnimationActive={false}
                      
                    >
                      {socialToneChartData.map((item, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value}%`, name]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No sentiment mix data available.</p>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Demand Drivers</h4>
                <ul className="space-y-3 text-sm">
                  {behavioralSignals.map((signal, idx) => (
                    <li key={idx} className="rounded-lg p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{signal.signal}</span>
                        <Badge>{formatPercentage(signal.influence)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{signal.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Purchase Journey</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={purchaseJourney}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="conversionRate" stroke="#22c55e" fill="#a7f3d0" isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasFinancialPlanningData ? (
          <Card className={`${analyticPanelClass} mb-12`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Financial Planning & Budget Allocation
              </CardTitle>
              <CardDescription>Budget discipline, runway outlook, and regional allocation strategy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {runwayScenarios.length ? (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" />
                    Runway Scenarios
                  </h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={runwayScenarios}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="scenario" />
                      <YAxis yAxisId="left" label={{ value: 'Months', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value: number, name) => name === 'monthsOfRunway' ? `${value} months` : formatCurrency(value)} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="monthsOfRunway" fill="#6366f1" radius={[6, 6, 0, 0]} name="Runway" isAnimationActive={false} />
                      <Line yAxisId="right" dataKey="cashBalance" type="monotone" stroke="#f97316" strokeWidth={2} name="Cash Balance" isAnimationActive={false} />
                      <Line yAxisId="right" dataKey="burnRate" type="monotone" stroke="#0ea5e9" strokeWidth={2} name="Burn Rate" isAnimationActive={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : null}

              {financialBudgetAllocation.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Budget vs Actual</h4>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={financialBudgetAllocation} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                        <defs>
                          <linearGradient id="budgetPlannedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#cbd5f5" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#cbd5f5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                        <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip formatter={(value: number, name) => [formatCurrency(value), name === 'planned' ? 'Planned' : 'Actual']} />
                        <Area
                          type="monotone"
                          dataKey="planned"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          fill="url(#budgetPlannedGradient)"
                          dot={{ r: 4, stroke: '#94a3b8', fill: '#fff', strokeWidth: 2 }}
                          isAnimationActive={false}
                          name="Planned"
                        />
                        <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#fff', stroke: '#6366f1', strokeWidth: 2 }} name="Actual" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Variance Insights</h4>
                    {financialBudgetAllocation.map((item, idx) => (
                      <div key={idx} className="rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{item.category}</p>
                          <Badge variant={item.variance <= 0 ? "secondary" : "destructive"}>
                            {item.variance <= 0 ? "On Track" : "Over Budget"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Planned {formatCurrency(item.planned)} vs actual {formatCurrency(item.actual)} ({formatCurrency(item.variance)} variance)
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {cashFlowTimeline.length ? (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Cash Flow Timeline</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={cashFlowTimeline} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="cashFlowNetGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value: number, name) => [formatCurrency(value), name === 'net' ? 'Net Cash' : name === 'inflow' ? 'Inflow' : 'Outflow']} />
                      <Area
                        type="monotone"
                        dataKey="net"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#cashFlowNetGradient)"
                        dot={{ r: 4, stroke: '#6366f1', fill: '#fff', strokeWidth: 2 }}
                        isAnimationActive={false}
                        name="Net Cash"
                      />
                      <Line type="monotone" dataKey="inflow" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, stroke: '#22c55e', fill: '#fff', strokeWidth: 2 }} name="Inflow" isAnimationActive={false} />
                      <Line type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, stroke: '#ef4444', fill: '#fff', strokeWidth: 2 }} name="Outflow" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : null}

              {financialPlanningMap.length ? (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Financial Planning Map</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={financialPlanningMap}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="region" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value: number, name) => name === 'budgetWeight' ? `${value}%` : formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="budgetWeight" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Budget Weight" isAnimationActive={false} />
                      <Line type="monotone" dataKey="projectedRevenue" stroke="#6366f1" strokeWidth={2} name="Projected Revenue" isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {financialPlanningMap.map((node, idx) => (
                      <div key={idx} className="rounded-lg p-3 space-y-1 shadow-sm">
                        <p className="font-semibold">{node.region}</p>
                        <p className="text-sm text-muted-foreground">
                          Priority: <span className="font-medium text-primary">{node.priority}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Budget Weight: {formatNumber(node.budgetWeight, { style: 'percent', maximumFractionDigits: 1 })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Projected Revenue: {formatCurrency(node.projectedRevenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {strategicFinancialNotes.length ? (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Strategic Financial Notes</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {strategicFinancialNotes.map((note, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {/* Product Evaluation */}
        <Card className={`${analyticPanelClass} mb-12`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Product Evaluation & Fit
            </CardTitle>
            <CardDescription>Feature differentiation and readiness checks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Performance vs Competitors</h4>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={performanceMetrics}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="axis" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Product" dataKey="product" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                    <Radar name="Competitors" dataKey="competitors" stroke="#f97316" fill="#fcd34d" fillOpacity={0.2} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Feature Coverage</h4>
                {featureCoverageData.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={featureCoverageData} margin={{ top: 16, right: 24, left: 0, bottom: 24 }}>
                      <defs>
                        <linearGradient id="featureProductGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="featureCompetitorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                      <XAxis dataKey="feature" interval={0} angle={-20} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value: number, name) => [`${Math.round(value as number)}%`, name === 'product' ? 'Product' : 'Competitor Avg']} />
                      <Area
                        type="monotone"
                        dataKey="product"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        fill="url(#featureProductGradient)"
                        dot={{ r: 4, stroke: '#0ea5e9', fill: '#fff', strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="competitorAverage"
                        stroke="#a855f7"
                        strokeWidth={2}
                        fill="url(#featureCompetitorGradient)"
                        dot={{ r: 4, stroke: '#a855f7', fill: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No feature coverage data available.</p>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Innovation Quotient</h4>
                <p className="text-3xl font-bold text-primary">{innovationQuotient?.score ?? '—'}</p>
                <p className="text-sm text-muted-foreground mt-2">{innovationQuotient?.summary}</p>
                <ul className="mt-3 text-sm list-disc list-inside space-y-1">
                  {safeArray(innovationQuotient?.drivers).map((driver, idx) => (
                    <li key={idx}>{driver}</li>
                  ))}
                </ul>
              </div>
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Technical Readiness Checklist
                </h4>
                <ul className="space-y-2 text-sm">
                  {technicalReadiness.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <div>
                        <p className="font-semibold">{item.item} — {item.status}</p>
                        <p className="text-xs text-muted-foreground">{item.notes}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  Retention Risks
                </h4>
                <ul className="space-y-2 text-sm">
                  {retentionRisk.map((risk, idx) => (
                    <li key={idx} className="rounded-lg p-3 shadow-sm">
                      <p className="font-semibold">{risk.riskType}</p>
                      <p className="text-xs text-muted-foreground">Level: {risk.level}</p>
                      <p className="text-xs text-muted-foreground mt-1">Mitigation: {risk.mitigation}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opportunity Detection */}
        <Card className={`${analyticPanelClass} mb-12`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Opportunity Detection & Forecasting
            </CardTitle>
            <CardDescription>Emerging demand pockets and forecasted growth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Unexplored Segments</h4>
                <ul className="space-y-3 text-sm">
                  {unexploredSegments.map((segment, idx) => (
                    <li key={idx} className="rounded-lg p-3 shadow-sm">
                      <p className="font-semibold">{segment.segment}</p>
                      <p className="text-xs text-muted-foreground">Potential: {formatCurrency(segment.potentialValue)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{segment.rationale}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Predicted Market Shifts</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={predictedShiftData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic" interval={0} angle={-20} textAnchor="end" height={80} />
                    <YAxis domain={ensureUniPolarDomain(predictedShiftDomain, [0, 100])} tickFormatter={(value) => `${Math.round(value)}%`} allowDecimals={false} />
                    <Tooltip formatter={(value: number) => [`${Math.round(value)}%`, "Confidence"]} />
                    <Bar dataKey="confidencePercent" fill="#f97316" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Regional Opportunity Heatmap</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={regionalOpportunity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#10b981" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Growth Timeline</h4>
                {growthTimeline.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={growthTimeline} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="opportunityGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `${Math.round(value as number)}%`} />
                      <Tooltip formatter={(value: number) => [`${Math.round(value as number)}%`, 'Growth Index']} />
                      <Area
                        type="monotone"
                        dataKey="growthIndex"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#opportunityGrowthGradient)"
                        dot={{ r: 4, stroke: '#6366f1', fill: '#fff', strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No growth timeline data available.</p>
                )}
              </div>
            </div>

            <div className={subPanelClass}>
              <h4 className="text-sm font-semibold mb-3">Threat Early-Warning Signals</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {threatSignals.map((threat, idx) => (
                  <div key={idx} className="rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{threat.threat}</p>
                      <Badge>{threat.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Timeline: {threat.timeline}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GTM Strategy */}
        <Card className={`${analyticPanelClass} mb-12`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Go-To-Market Strategy & Positioning
            </CardTitle>
            <CardDescription>Messaging, channels, and ROI projections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Persona</TableHead>
                    <TableHead>Headline</TableHead>
                    <TableHead>Proof Point</TableHead>
                    <TableHead>CTA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messagingFramework.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.persona}</TableCell>
                      <TableCell>{row.headline}</TableCell>
                      <TableCell>{row.proofPoint}</TableCell>
                      <TableCell>{row.cta}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Channel Prioritization</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={channelPrioritization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="budgetShare" fill="#2563eb" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">ROI Simulation Paths</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={roiSimulation}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="path" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="projectedROI" fill="#22c55e" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                    <Line type="monotone" dataKey="paybackMonths" stroke="#f97316" strokeWidth={2} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={subPanelClass}>
              <h4 className="text-sm font-semibold mb-3">Competitive Keyword Tracking</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {competitiveTracking.map((row, idx) => (
                  <div key={idx} className="rounded-lg p-3 shadow-sm">
                    <p className="font-semibold">{row.competitor}</p>
                    <p className="text-xs text-muted-foreground mt-1">Ad spend est: {formatCurrency(row.adSpendEstimate)}</p>
                    <p className="text-xs text-muted-foreground mt-2">Keywords: {safeArray(row.keywords).join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial & Pricing Benchmark */}
        <Card className={`${analyticPanelClass} mb-8`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-primary" />
              Financial & Pricing Benchmark
            </CardTitle>
            <CardDescription>Pricing intelligence and unit economics overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Pricing Benchmarks</h4>
                <ul className="space-y-3 text-sm">
                  {pricingBenchmarks.map((tier, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span className="font-semibold">{tier.tier}</span>
                      <span>{formatCurrency(tier.averagePrice, tier.currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Price Positioning Scatter</h4>
                {pricePositioningLineData.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={pricePositioningLineData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="pricePositioningGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} />
                      <YAxis tickFormatter={(value) => `${value}`} />
                      <Tooltip formatter={(value: number, name, props) => {
                        const item = pricePositioningLineData[props?.payload?.index ?? 0];
                        return [
                          `${Math.round(value as number)} score`,
                          item ? `${item.label} · ${formatCurrency(item.price)}` : 'Value'
                        ];
                      }} />
                      <Area
                        type="monotone"
                        dataKey="valueScore"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#pricePositioningGradient)"
                        dot={{ r: 4, stroke: 'hsl(var(--primary))', fill: '#fff', strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No price positioning data available.</p>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Profit Margin Trend</h4>
                {profitMarginTrend.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={profitMarginTrend} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="profitMarginGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value: number) => [`${Math.round(value as number)}%`, 'Margin']} />
                      <Area
                        type="monotone"
                        dataKey="margin"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fill="url(#profitMarginGradient)"
                        dot={{ r: 4, stroke: '#22c55e', fill: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No margin trend data available.</p>
                )}
              </div>
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Unit Economics</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-background/80 p-3 text-center shadow-sm">
                    <p className="text-xs text-muted-foreground">CPA</p>
                    <p className="text-lg font-semibold">{formatCurrency(unitEconomics?.cpa)}</p>
                  </div>
                  <div className="rounded-lg bg-background/80 p-3 text-center shadow-sm">
                    <p className="text-xs text-muted-foreground">CLV</p>
                    <p className="text-lg font-semibold">{formatCurrency(unitEconomics?.clv)}</p>
                  </div>
                  <div className="rounded-lg bg-background/80 p-3 text-center shadow-sm">
                    <p className="text-xs text-muted-foreground">CLV:CAC</p>
                    <p className="text-lg font-semibold">{unitEconomics?.clvToCac ?? '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    <TableHead>Valuation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {valuationModel.map((scenario, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{scenario.scenario}</TableCell>
                      <TableCell>{formatCurrency(scenario.valuation)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment & Voice Analysis */}
        <Card className={`${analyticPanelClass} mb-12`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sentiment & Voice Analysis
            </CardTitle>
            <CardDescription>Media tone, social chatter, and emerging phrases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">News Sentiment Mix</h4>
                {hasNewsSentimentData ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={newsSentimentChartData} dataKey="value" nameKey="sentiment" innerRadius={50} outerRadius={80} paddingAngle={2} cornerRadius={6} stroke="transparent" isAnimationActive={false}>
                        {newsSentimentChartData.map((item, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No news sentiment data available.</p>
                )}
              </div>
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Reputation Index</h4>
                {reputationIndex.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={reputationIndex} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="reputationGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `${value}`} />
                      <Tooltip formatter={(value: number) => [`${Math.round(value as number)}`, 'Score']} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="url(#reputationGradient)"
                        dot={{ r: 4, stroke: '#8b5cf6', fill: '#fff', strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No reputation data available.</p>
                )}
              </div>
            </div>

            <div className={subPanelClass}>
              <h4 className="text-sm font-semibold mb-3">Emerging Phrases</h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {emergingPhrases.map((phrase, idx) => (
                  <div key={idx} className="rounded-lg p-3">
                    <p className="font-semibold">{phrase.phrase}</p>
                    <p className="text-xs text-muted-foreground mt-1">Frequency: {phrase.frequency}</p>
                    <p className="text-xs text-muted-foreground">Sentiment: {phrase.sentiment}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Trending Stories</h4>
                {trendingStories.length ? (
                  <div className="space-y-3 text-sm">
                    {trendingStories.map((story, idx) => (
                      <div key={idx} className="rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <a
                              href={story.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-primary hover:underline"
                            >
                              {story.title}
                            </a>
                            <p className="text-xs text-muted-foreground mt-1">
                              {story.source} · {formatDate(story.publishedAt)}
                            </p>
                          </div>
                          <Badge variant="outline">{story.relevance || "Signal"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{story.summary}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary">{story.sentiment}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No trending stories available.</p>
                )}
              </div>

              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Competitor Coverage</h4>
                {competitorCoverage.length ? (
                  <div className="space-y-3 text-sm">
                    {competitorCoverage.map((story, idx) => (
                      <div key={idx} className="rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase text-muted-foreground">{story.competitor}</p>
                            <a
                              href={story.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-primary hover:underline"
                            >
                              {story.title}
                            </a>
                            <p className="text-xs text-muted-foreground mt-1">
                              {story.source} · {formatDate(story.publishedAt)}
                            </p>
                          </div>
                          <Badge>{story.impact || "Impact"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{story.summary}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{story.sentiment}</Badge>
                          <span>{story.relevance}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No competitor coverage available.</p>
                )}
              </div>
            </div>

            <div className={subPanelClass}>
              <h4 className="text-sm font-semibold mb-3">Emerging Phrases</h4>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {emergingPhrases.map((phrase, idx) => (
                  <div key={idx} className="rounded-lg p-3">
                    <p className="font-semibold">{phrase.phrase}</p>
                    <p className="text-xs text-muted-foreground mt-1">Frequency: {phrase.frequency}</p>
                    <p className="text-xs text-muted-foreground">Sentiment: {phrase.sentiment}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk & Compliance */}
        <Card className={`${analyticPanelClass} mb-12`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Risk & Compliance Intelligence
            </CardTitle>
            <CardDescription>Policy exposure, technology compliance, and risk matrix</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Policy Risk Scorecard</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={policyScores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#f87171" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Technology Compliance</h4>
                <ul className="space-y-3 text-sm">
                  {technologyRisk.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className={`mt-1 h-2 w-2 rounded-full ${risk.status === 'Compliant' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <div>
                        <p className="font-semibold">{risk.area}</p>
                        <p className="text-xs text-muted-foreground">{risk.status}</p>
                        <p className="text-xs text-muted-foreground mt-1">{risk.notes}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className={subPanelClass}>
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-semibold mb-3">Risk Exposure Overview</h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/40" />Impact</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-primary" />Probability</span>
                  </div>
                </div>
                {hasRiskMatrixData ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={riskMatrixData} barGap={18} barCategoryGap="32%">
                      <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.4} />
                      <XAxis dataKey="risk" tick={{ fontSize: 12 }} interval={0} />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value: number, name) => [`${Math.round(value)}%`, name === 'impactPercent' ? 'Impact' : 'Probability']} />
                      <Bar dataKey="impactPercent" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} maxBarSize={24} isAnimationActive={false} />
                      <Bar dataKey="probabilityPercent" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={24} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No risk exposure data available.</p>
                )}
              </div>
              <div className={`${subPanelClass} space-y-3`}>
                <h4 className="text-sm font-semibold mb-3">Financial & Geopolitical Factors</h4>
                {financialGeopolitical.map((factor, idx) => (
                  <div key={idx} className="rounded-lg p-3">
                    <p className="font-semibold">{factor.factor}</p>
                    <p className="text-xs text-muted-foreground">Impact: {factor.impact}</p>
                    <p className="text-xs text-muted-foreground">Probability: {formatPercentage(factor.probability)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={subPanelClass}>
              <h4 className="text-sm font-semibold mb-3">Compliance Status</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {complianceStatus.map((item, idx) => (
                  <div key={idx} className="rounded-lg p-3">
                    <p className="font-semibold">{item.framework}</p>
                    <p className="text-xs text-muted-foreground">{item.status}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Predictive Analysis */}
        <Card className={`${analyticPanelClass} mb-12`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Predictive Analysis Dashboard
            </CardTitle>
            <CardDescription>Forecasting competitor moves and adoption scenarios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">Competitor Moves</h4>
                <ul className="space-y-3 text-sm">
                  {competitorMoves.map((move, idx) => (
                    <li key={idx} className="rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{move.competitor}</p>
                        <Badge>{move.likelihood}%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{move.predictedMove}</p>
                      <p className="text-xs text-muted-foreground">Timeline: {move.timeframe}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={subPanelClass}>
                <h4 className="text-sm font-semibold mb-3">User Adoption Projection</h4>
                {userAdoption.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={userAdoption} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                      <defs>
                        <linearGradient id="userAdoptionGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `${Math.round(value as number)}%`} />
                      <Tooltip formatter={(value: number, name) => {
                        if (name === 'adoptionRate') {
                          return [`${Math.round(value as number)}%`, 'Adoption Rate'];
                        }
                        return [`${Math.round(value as number)}%`, 'Sentiment Score'];
                      }} />
                      <Area
                        type="monotone"
                        dataKey="adoptionRate"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#userAdoptionGradient)"
                        dot={{ r: 4, stroke: '#6366f1', fill: '#fff', strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                      <Line type="monotone" dataKey="sentimentScore" stroke="#f97316" strokeWidth={2} dot={{ r: 4, stroke: '#f97316', fill: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No adoption forecast data available.</p>
                )}
              </div>
            </div>

            <div className={subPanelClass}>
              <h4 className="text-sm font-semibold mb-3">Scenario Modeling</h4>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={scenarioModelingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="scenario" />
                  <YAxis yAxisId="left" domain={ensureUniPolarDomain(scenarioGrowthDomain, [0, 100])} tickFormatter={(value) => `${Math.round(value)}%`} />
                  <YAxis yAxisId="right" orientation="right" domain={createDynamicDomain(scenarioRevenueDomain)} tickFormatter={(value) => formatNumber(value, { maximumFractionDigits: 1 })} />
                  <Tooltip formatter={(value: number, name) => name === 'growthRate' ? `${Math.round(value)}%` : formatNumber(value, { maximumFractionDigits: 1 })} />
                  <Bar yAxisId="left" dataKey="growthRate" fill="#22c55e" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  <Line yAxisId="right" type="monotone" dataKey="revenueProjection" stroke="#6366f1" strokeWidth={2} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Strategic Recommendations */}
        <Card className={`${analyticPanelClass} mb-12`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Strategic Recommendations & Action Matrix
            </CardTitle>
            <CardDescription>Prioritized roadmap with ROI and risk scoring</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>ROI</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendationActions.map((action, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <p className="font-semibold">{action.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                    </TableCell>
                    <TableCell>{action.owner}</TableCell>
                    <TableCell>{action.timeline}</TableCell>
                    <TableCell>{action.priority}</TableCell>
                    <TableCell>{formatPercentage(action.roi)}</TableCell>
                    <TableCell>{action.confidence}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Source Attribution */}
        <Card className={analyticPanelClass}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Source Attribution & Transparency
            </CardTitle>
            <CardDescription>Verified research signals powering this report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sources.map((source, idx) => (
                <div key={idx} className="rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
                  <div>
                    <p className="font-semibold">{source.name}</p>
                    <p className="text-xs text-muted-foreground">{source.type}</p>
                    <p className="text-xs text-muted-foreground mt-1">Retrieved: {new Date(source.retrievedAt).toLocaleString()}</p>
                  </div>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm font-semibold hover:underline">
                    Open Source
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Legacy fallback sections when no report data */}
        {!currentReport && (
          <>
            <Card className={`${analyticPanelClass} mb-8`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Market Trends & Insights
                </CardTitle>
                <CardDescription>Latest developments in your industry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {legacyTrends.map((trend, idx) => (
                    <div key={idx} className="rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{trend.title}</h4>
                        <Badge className={getImpactBadge(trend.impact)}>{trend.impact}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{trend.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={analyticPanelClass}>
              <CardHeader>
                <CardTitle>SWOT Analysis</CardTitle>
                <CardDescription>Strategic position assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg p-4 bg-green-50/50 shadow-sm">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                      Strengths
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {swotLegacy?.strengths?.map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-green-600">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg p-4 bg-red-50/50 shadow-sm">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-700">
                      <XCircle className="h-5 w-5" />
                      Weaknesses
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {swotLegacy?.weaknesses?.map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-red-600">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg p-4 bg-blue-50/50 shadow-sm">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-700">
                      <TrendingUp className="h-5 w-5" />
                      Opportunities
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {swotLegacy?.opportunities?.map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-blue-600">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg p-4 bg-yellow-50/50 shadow-sm">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-yellow-700">
                      <AlertTriangle className="h-5 w-5" />
                      Threats
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {swotLegacy?.threats?.map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-yellow-600">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </section>
    </div>
  </div>
);
};

export default AnalysisDetail;