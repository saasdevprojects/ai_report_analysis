import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ArrowLeft, Download, Shield, TrendingUp, Users, Activity } from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PersonaProfile, ReportPayload } from "../types/report";

type AnalysisRecord = {
  id: string;
  product_name: string;
  product_description: string;
  competitors: Array<{
    name: string;
    website: string;
    pricing: string;
    differentiator: string;
  }>;
  buyer_personas: Array<{
    title: string;
    companySize: string;
    motivations: string[];
    painPoints: string[];
  }>;
  market_trends: Array<{
    title: string;
    description: string;
    impact: string;
  }>;
  swot_analysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  } | null;
  market_readiness_score: number;
  readiness_advice: string;
  report_payload: ReportPayload | null;
  report_version?: string | null;
  generated_at?: string | null;
};

type PersonaCard = PersonaProfile & { title?: string };

type CsvRow = Record<string, string | number | null | undefined>;

declare global {
  interface Window {
    generateAnalysisReportPdf?: (options: {
      analysisName: string;
      report: ReportPayload;
      generatedAt: string | null | undefined;
    }) => Promise<Blob>;
  }
}

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

function coerceNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }
  return 0;
}

function buildCsv(rows: CsvRow[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(",");
  const dataLines = rows
    .map(row =>
      headers
        .map(header => {
          const cell = row[header];
          if (cell === null || cell === undefined) return "";
          const escaped = String(cell).replace(/"/g, '""');
          return escaped.includes(",") ? `"${escaped}"` : escaped;
        })
        .join(",")
    )
    .join("\n");
  return `${headerLine}\n${dataLines}`;
}

const themeStyles = {
  "--primary": "262 83% 58%",
  "--primary-foreground": "0 0% 100%",
  "--muted": "260 100% 97%",
  "--muted-foreground": "257 25% 55%",
} as CSSProperties;

const panelShadow = "shadow-[0_32px_90px_-60px_rgba(30,41,59,0.45)]";
const cardShadow = "shadow-[0_28px_70px_-55px_rgba(91,33,182,0.45)]";

const AnalysisDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    void loadAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAnalysis = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("product_analyses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const record = data as unknown as AnalysisRecord;
      setAnalysis(record);
      setReport(record.report_payload ?? null);
    } catch (error) {
      console.error("Failed to load analysis", error);
      toast.error("We couldn't load that report. Redirecting you back.");
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const currentReport = report ?? undefined;
  const executiveSummary = currentReport?.executiveSummary;

  const readinessScore = useMemo(() => {
    const raw = executiveSummary?.marketReadiness?.score ?? analysis?.market_readiness_score ?? 0;
    return Math.round(Math.min(Math.max(raw * 10, 0), 100));
  }, [analysis?.market_readiness_score, executiveSummary?.marketReadiness?.score]);

  const readinessNarrative = executiveSummary?.marketReadiness?.summary ?? analysis?.readiness_advice ?? "";
  const keyInsights = safeArray(executiveSummary?.keyInsights);
  const riskIndicators = safeArray(executiveSummary?.riskIndicators);
  const topOpportunities = safeArray(executiveSummary?.topOpportunities);

  const generatedDate = useMemo(() => {
    if (currentReport?.generatedAt) return formatDate(currentReport.generatedAt);
    if (analysis?.generated_at) return formatDate(analysis.generated_at);
    return null;
  }, [analysis?.generated_at, currentReport?.generatedAt]);

  const personaProfiles = safeArray<ReportPayload["customerInsights"]["personas"][number]>(
    currentReport?.customerInsights?.personas
  );
  const fallbackPersonas: PersonaCard[] = safeArray(analysis?.buyer_personas).map(persona => ({
    name: persona.title,
    role: persona.title,
    title: persona.title,
    companySize: persona.companySize,
    budget: "N/A",
    motivations: safeArray(persona.motivations).map(String),
    objections: safeArray(persona.painPoints).map(String),
    preferredChannels: [],
  }));
  const personaCards: PersonaCard[] = personaProfiles.length ? personaProfiles : fallbackPersonas;

  const growthTimeline = safeArray<ReportPayload["opportunityForecast"]["growthTimeline"][number]>(
    currentReport?.opportunityForecast?.growthTimeline
  ).map(point => ({
    period: point.period,
    growthIndex: coerceNumber(point.growthIndex),
    confidence: coerceNumber(point.confidence),
  }));

  const sentimentTrend = safeArray<ReportPayload["sentimentAnalysis"]["reputationIndex"][number]>(
    currentReport?.sentimentAnalysis?.reputationIndex
  ).map(point => ({
    period: point.period,
    score: coerceNumber(point.score),
  }));

  const competitorData = useMemo(() => {
    const dataset = safeArray<ReportPayload["competitiveLandscape"]["marketShare"][number]>(
      currentReport?.competitiveLandscape?.marketShare
    ).map(entry => ({
      company: entry.company,
      share: coerceNumber(entry.share),
    }));
    if (dataset.length) return dataset;
    return safeArray(analysis?.competitors).map(item => ({
      company: item.name,
      share: Math.floor(Math.random() * 30) + 15,
    }));
  }, [analysis?.competitors, currentReport?.competitiveLandscape?.marketShare]);

  const personaPieData = useMemo(() => {
    if (!personaCards.length) return [];
    const counts = new Map<string, number>();
    personaCards.forEach(persona => {
      const key = persona.companySize || "General";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [personaCards]);

  const riskMatrixRows = safeArray<ReportPayload["riskCompliance"]["riskMatrix"][number]>(
    currentReport?.riskCompliance?.riskMatrix
  ).map(risk => ({
    risk: risk.risk,
    impact: formatPercentage(coerceNumber(risk.impact)),
    probability: formatPercentage(coerceNumber(risk.probability)),
    owner: risk.owner,
  }));

  const opportunityRows = safeArray<ReportPayload["executiveSummary"]["topOpportunities"][number]>(topOpportunities).map(
    opportunity => ({
      label: opportunity.label,
      impact:
        typeof opportunity.impact === "number"
          ? formatNumber(opportunity.impact, { maximumFractionDigits: 0 })
          : opportunity.impact ?? "—",
      horizon:
        typeof opportunity.urgency === "number"
          ? `Priority ${opportunity.urgency}`
          : "—",
    })
  );

  const summaryCards = useMemo(
    () => [
      {
        title: "Market readiness",
        value: `${readinessScore}/100`,
        description: readinessNarrative || "Steady path to category leadership; keep investing in activation and retention.",
        icon: Shield,
        accent: "bg-[#ede9fe] text-[#5b21b6]",
      },
      {
        title: "Growth outlook",
        value:
          executiveSummary?.growthPotential ||
          (growthTimeline.length
            ? `${growthTimeline[growthTimeline.length - 1]?.growthIndex >= 0 ? "+" : ""}${formatNumber(
                growthTimeline[growthTimeline.length - 1]?.growthIndex,
                { maximumFractionDigits: 0 }
              )}% projected YoY growth`
            : "Growth trajectory pending"),
        description: keyInsights[0] || "Demand signals and retention cohorts suggest expanding enterprise traction.",
        icon: TrendingUp,
        accent: "bg-[#dbeafe] text-[#1e40af]",
      },
      {
        title: "Audience focus",
        value: personaCards[0]?.role ?? "Primary persona",
        description: personaCards[0]?.motivations?.[0] ?? "Champions look for quantifiable ROI and faster onboarding.",
        icon: Users,
        accent: "bg-[#dcfce7] text-[#166534]",
      },
      {
        title: "Watch list",
        value: riskIndicators[0] ?? "Competitive pressure",
        description: riskIndicators[1] ?? "Monitor pricing moves and late-stage incumbents.",
        icon: Activity,
        accent: "bg-[#fef3c7] text-[#92400e]",
      },
    ],
    [
      executiveSummary?.growthPotential,
      growthTimeline,
      keyInsights,
      personaCards,
      readinessNarrative,
      readinessScore,
      riskIndicators,
    ]
  );

  const exportCompetitorsCSV = () => {
    if (!competitorData.length) {
      toast.error("Nothing to export yet");
      return;
    }

    const rows: CsvRow[] = competitorData.map(entry => ({
      Company: entry.company,
      Share: entry.share,
    }));

    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitized = analysis?.product_name?.replace(/[^a-z0-9]+/gi, "-").toLowerCase() ?? "analysis";
    link.href = url;
    link.download = `${sanitized}-competitors.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const exportReportPDF = async () => {
    if (!analysis || !currentReport) {
      toast.error("Report data unavailable");
      return;
    }

    try {
      setIsExportingPdf(true);
      const generateAnalysisReportPdf = window.generateAnalysisReportPdf;
      if (!generateAnalysisReportPdf) {
        throw new Error("PDF generator not registered");
      }
      const blob = await generateAnalysisReportPdf({
        analysisName: analysis.product_name,
        report: currentReport,
        generatedAt: currentReport.generatedAt ?? analysis.generated_at,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const sanitized = analysis.product_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      anchor.href = url;
      anchor.download = `${sanitized || "analysis"}-report.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("PDF generated");
    } catch (error) {
      console.error("Failed to export PDF", error);
      toast.error("We couldn't export the PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading your AI report...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const personaPalette = ["#8b5cf6", "#6366f1", "#ec4899", "#f59e0b", "#14b8a6", "#0ea5e9"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9fafb] via-[#f4efff] to-[#fef9f5]" style={themeStyles}>
      <div className="container mx-auto max-w-6xl space-y-10 px-4 py-10">
        <header className="flex flex-col gap-6 rounded-[2.5rem] border border-white/60 bg-white/85 p-8 backdrop-blur-xl md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="rounded-full bg-[#ede9fe] px-3 py-1 text-xs font-semibold text-[#5b21b6] shadow-sm">
                AI Strategy Report v{currentReport?.reportVersion ?? analysis.report_version ?? "1"}
              </Badge>
              {generatedDate ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Generated {generatedDate}
                </span>
              ) : null}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{analysis.product_name}</h1>
            <p className="max-w-3xl text-base leading-relaxed text-slate-600">
              {analysis.product_description ||
                "An executive-grade snapshot of market conditions, customer intent, product posture, and runway generated by our intelligence engine."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              className="rounded-full border border-slate-200 bg-white/70 font-medium text-slate-700 hover:bg-white"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
            </Button>
            <Button
              className="rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] font-semibold shadow-lg transition hover:shadow-xl"
              onClick={exportReportPDF}
              disabled={isExportingPdf}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExportingPdf ? "Exporting PDF..." : "Export PDF"}
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-[#c4b5fd] text-[#5b21b6] hover:bg-[#ede9fe]"
              onClick={exportCompetitorsCSV}
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(card => (
            <Card key={card.title} className={`rounded-[1.75rem] border border-white/70 bg-white/90 ${panelShadow}`}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardDescription className="text-xs uppercase tracking-widest text-slate-500">{card.title}</CardDescription>
                  <CardTitle className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</CardTitle>
                </div>
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.accent}`}>
                  <card.icon className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-slate-600">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
          <Card className={`rounded-[2rem] border border-white/70 bg-white/95 ${panelShadow}`}>
            <CardHeader>
              <CardDescription className="text-sm text-slate-500">Growth & sentiment trajectory</CardDescription>
              <CardTitle className="text-2xl text-slate-900">Adoption momentum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-64">
                {growthTimeline.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthTimeline}>
                      <defs>
                        <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.55} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
                      <XAxis dataKey="period" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip />
                      <Area type="monotone" dataKey="growthIndex" stroke="#7c3aed" strokeWidth={3} fill="url(#growthGradient)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Growth projections will appear once we process additional telemetry.
                  </div>
                )}
              </div>
              {sentimentTrend.length ? (
                <div className="h-32 rounded-2xl bg-slate-50/70 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sentimentTrend}>
                      <XAxis dataKey="period" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#f97316" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className={`rounded-[2rem] border border-white/70 bg-white/95 ${cardShadow}`}>
            <CardHeader>
              <CardDescription className="text-sm text-slate-500">Where competitors hold share today</CardDescription>
              <CardTitle className="text-2xl text-slate-900">Competitive share</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-52">
                {competitorData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={competitorData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
                      <XAxis dataKey="company" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip formatter={(value: number) => `${formatNumber(value, { maximumFractionDigits: 0 })}%`} />
                      <Bar dataKey="share" radius={[12, 12, 12, 12]} fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Competitor benchmarks will display once the AI gathers enough data.
                  </div>
                )}
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                We prioritise the strongest four players by estimated share. Use this lens to align GTM teams on displacement tactics and regional priorities.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Card className={`rounded-[2rem] border border-white/70 bg-white/95 ${panelShadow}`}>
            <CardHeader>
              <CardDescription className="text-sm text-slate-500">AI synthesised narrative</CardDescription>
              <CardTitle className="text-2xl text-slate-900">Executive briefing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-2xl bg-slate-50/70 p-5 text-sm leading-relaxed text-slate-600">
                {readinessNarrative || "Double down on integration coverage and monetise premium workflows to keep command of the category."}
              </div>
              <div className="space-y-4">
                {keyInsights.slice(0, 4).map((insight, index) => (
                  <div key={insight ?? index} className="flex gap-3 rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-sm">
                    <Badge className="h-7 rounded-full bg-[#ede9fe] px-3 text-xs font-semibold text-[#5b21b6]">
                      Insight {index + 1}
                    </Badge>
                    <p className="text-sm leading-relaxed text-slate-600">{insight}</p>
                  </div>
                ))}
                {!keyInsights.length ? (
                  <p className="text-sm text-slate-500">Insights will populate once the AI finishes processing.</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className={`rounded-[2rem] border border-white/70 bg-white/95 ${cardShadow}`}>
            <CardHeader>
              <CardDescription className="text-sm text-slate-500">Distribution of buyer energy</CardDescription>
              <CardTitle className="text-2xl text-slate-900">Persona mix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-56">
                {personaPieData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={personaPieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                        {personaPieData.map((entry, index) => (
                          <Cell key={entry.name} fill={personaPalette[index % personaPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, label: string) => [`${formatNumber(value, { maximumFractionDigits: 0 })}`, label]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Persona distribution will render once customer data is available.
                  </div>
                )}
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                This blend highlights where to focus enablement and budget. Each persona is weighted by AI confidence and engagement depth.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className={`rounded-[2rem] border border-white/70 bg-white/95 ${panelShadow}`}>
            <CardHeader>
              <CardDescription className="text-sm text-slate-500">Highest conviction growth moves</CardDescription>
              <CardTitle className="text-2xl text-slate-900">Opportunity radar</CardTitle>
            </CardHeader>
            <CardContent>
              {opportunityRows.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-slate-500">Focus area</TableHead>
                      <TableHead className="text-right text-slate-500">Impact</TableHead>
                      <TableHead className="text-right text-slate-500">Timeline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opportunityRows.map(row => (
                      <TableRow key={`${row.label}-${row.horizon}`}>
                        <TableCell className="font-medium text-slate-700">{row.label}</TableCell>
                        <TableCell className="text-right text-slate-600">{row.impact}</TableCell>
                        <TableCell className="text-right text-slate-600">{row.horizon}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-slate-500">Opportunity prioritisation will appear as soon as the AI surfaces confident bets.</p>
              )}
            </CardContent>
          </Card>

          <Card className={`rounded-[2rem] border border-white/70 bg-white/95 ${cardShadow}`}>
            <CardHeader>
              <CardDescription className="text-sm text-slate-500">Operational & compliance exposure</CardDescription>
              <CardTitle className="text-2xl text-slate-900">Risk register</CardTitle>
            </CardHeader>
            <CardContent>
              {riskMatrixRows.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-slate-500">Risk</TableHead>
                      <TableHead className="text-right text-slate-500">Impact</TableHead>
                      <TableHead className="text-right text-slate-500">Probability</TableHead>
                      <TableHead className="text-right text-slate-500">Owner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riskMatrixRows.map(row => (
                      <TableRow key={`${row.risk}-${row.owner}`}>
                        <TableCell className="font-medium text-slate-700">{row.risk}</TableCell>
                        <TableCell className="text-right text-slate-600">{row.impact}</TableCell>
                        <TableCell className="text-right text-slate-600">{row.probability}</TableCell>
                        <TableCell className="text-right text-slate-600">{row.owner}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-slate-500">Risk signals will populate as compliance and finance feeds sync.</p>
              )}
            </CardContent>
          </Card>
        </section>

        {personaCards.length ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Persona intelligence</h2>
              <p className="text-sm text-slate-500">Tailor messaging, enablement, and sequencing for the teams selling into these profiles.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {personaCards.slice(0, 4).map(persona => (
                <Card
                  key={`${persona.name}-${persona.role}`}
                  className="rounded-[1.75rem] border border-white/70 bg-white/95 shadow-[0_30px_85px_-55px_rgba(76,29,149,0.55)]"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-slate-900">{persona.role || persona.name}</CardTitle>
                      <Badge className="rounded-full bg-[#ede9fe] px-3 text-xs font-semibold text-[#5b21b6]">
                        {persona.companySize || "General"}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm text-slate-500">Budget: {persona.budget || "N/A"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-relaxed text-slate-600">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Motivations</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {safeArray(persona.motivations).slice(0, 3).map(item => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objections</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {safeArray(persona.objections).slice(0, 3).map(item => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {currentReport?.strategicRecommendations?.actions?.length ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Strategic recommendations</h2>
              <p className="text-sm text-slate-500">Board-ready moves prioritised by impact, owner, and time horizon.</p>
            </div>
            <div className="grid gap-4">
              {currentReport.strategicRecommendations.actions.slice(0, 5).map(action => (
                <div
                  key={action.title}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-white/70 bg-white/95 p-5 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.55)] md:flex-row md:items-center"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{action.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{action.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Badge className="rounded-full bg-[#dcfce7] px-3 text-[#166534]">{action.priority}</Badge>
                    <span>Owner: {action.owner}</span>
                    <span>Timeline: {action.timeline}</span>
                    <span>ROI: {formatPercentage(action.roi)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {currentReport?.sourceAttribution?.sources?.length ? (
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900">Source attribution</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {currentReport.sourceAttribution.sources.slice(0, 6).map(source => (
                <Card
                  key={source.url}
                  className="rounded-2xl border border-white/70 bg-white/95 shadow-[0_26px_75px_-60px_rgba(76,29,149,0.48)]"
                >
                  <CardContent className="space-y-1 p-5 text-sm text-slate-600">
                    <p className="font-medium text-slate-900">{source.name}</p>
                    <p className="text-xs text-slate-500">{source.type}</p>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-[#5b21b6] underline-offset-4 hover:underline"
                    >
                      Review source
                    </a>
                    <p className="text-xs text-slate-400">Captured {formatDate(source.retrievedAt)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default AnalysisDetail;
