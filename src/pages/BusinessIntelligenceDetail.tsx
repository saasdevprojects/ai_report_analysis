import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import type { ReportPayload } from "@/types/report";
import generateAnalysisReportPdf from "@/pdf/AnalysisReportPDF";

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

type AnalysisRecord = {
  id: string;
  product_name: string;
  product_description: string;
  report_payload: ReportPayload | null;
  report_version?: string | null;
  generated_at?: string | null;
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

  const dataConfidence = useMemo(() => {
    const n = sources.length;
    if (n >= 9) return "High";
    if (n >= 5) return "Medium";
    return "Low";
  }, [sources.length]);

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

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>Executive Insight Summary</CardDescription>
              <CardTitle>What matters now</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-slate-700">
                {keyInsights.slice(0, 4).map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
                {!keyInsights.length ? <li>No insights available yet.</li> : null}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>Snapshot</CardDescription>
              <CardTitle>Opportunities and Risks</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-500">Major opportunities</p>
                <ul className="list-disc space-y-2 pl-5 text-slate-700">
                  {topOpps.map((o, i) => (
                    <li key={i}>{o.label} — Impact {typeof o.impact === 'number' ? formatNumber(o.impact, { maximumFractionDigits: 0 }) : o.impact}</li>
                  ))}
                  {!topOpps.length ? <li>No opportunities listed yet.</li> : null}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-500">Key risks</p>
                <ul className="list-disc space-y-2 pl-5 text-slate-700">
                  {risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                  {!risks.length ? <li>No risks identified.</li> : null}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>Deep Insight Analysis</CardDescription>
              <CardTitle>Positioning, Competition, Customers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <div>
                <p className="text-sm font-semibold text-slate-500">Market positioning overview</p>
                <p>Market size: {formatNumber(currentReport?.marketEnvironment?.marketSize?.current, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}. Top regions: {safeArray(currentReport?.marketEnvironment?.segmentation?.geography).slice(0, 2).map(s => s.name).join(', ') || '—'}.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Competitor snapshot</p>
                <ul className="list-disc pl-5">
                  {safeArray(currentReport?.competitiveLandscape?.topCompetitors).slice(0, 3).map((c) => (
                    <li key={c.name}><span className="font-medium">{c.name}</span> — {c.pricingModel}; strengths: {safeArray(c.strengths).slice(0, 1).join(', ') || '—'}</li>
                  ))}
                  {!safeArray(currentReport?.competitiveLandscape?.topCompetitors).length ? <li>Data pending</li> : null}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Customer behavior insights</p>
                <ul className="list-disc pl-5">
                  {safeArray(currentReport?.customerInsights?.behavioralSignals).slice(0, 3).map((b, i) => (
                    <li key={i}>{b.signal}: {b.description}</li>
                  ))}
                  {!safeArray(currentReport?.customerInsights?.behavioralSignals).length ? <li>Insights pending</li> : null}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Data-backed forecast</p>
                <ul className="list-disc pl-5">
                  {safeArray(currentReport?.opportunityForecast?.growthTimeline).slice(0, 4).map((p) => (
                    <li key={p.period}>{p.period}: Growth index {formatNumber(p.growthIndex, { maximumFractionDigits: 0 })} (confidence {formatPercentage(p.confidence * 100)})</li>
                  ))}
                  {!safeArray(currentReport?.opportunityForecast?.growthTimeline).length ? <li>Forecast pending</li> : null}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>Modern Strategies & AI Integration</CardDescription>
              <CardTitle>Where automation compounds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <div>
                <p className="text-sm font-semibold text-slate-500">Marketing automation</p>
                <ul className="list-disc pl-5">
                  <li>Use Klaviyo AI for segmented lifecycle campaigns and churn-preventing win-backs.</li>
                  <li>Adopt HubSpot AI for lead scoring, pipeline health, and predictive routing.</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Product optimization</p>
                <ul className="list-disc pl-5">
                  <li>Use Amplitude+Notion AI for experiment briefs and insights synthesis.</li>
                  <li>Leverage LaunchDarkly + analytics to rollout AI feature flags safely.</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Support & supply chain</p>
                <ul className="list-disc pl-5">
                  <li>Integrate ChatGPT API as a tier-1 assistant with human-in-the-loop routing.</li>
                  <li>Automate vendor and SLA health monitoring with anomaly alerts.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>Market Opportunity Based on Product</CardDescription>
              <CardTitle>Where to play</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700">
              <p><span className="font-semibold">Regional demand:</span> {safeArray(currentReport?.opportunityForecast?.regionalOpportunity).slice(0, 3).map(r => r.region).join(", ") || "—"}</p>
              <p><span className="font-semibold">Emerging trends:</span> {safeArray(currentReport?.opportunityForecast?.predictedShifts).slice(0, 3).map(s => s.topic).join(", ") || "—"}</p>
              <p><span className="font-semibold">Pricing/positioning:</span> Use financial benchmarks to validate tiering and value score; focus on {safeArray(currentReport?.financialBenchmark?.pricePositioning).slice(0, 1).map(p=>p.company).join(", ") || "peers"} differentials.</p>
              <p><span className="font-semibold">Channels to expand:</span> {channels.slice(0, 3).map(c => c.channel).join(", ") || "—"}</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>AI Tools Based on Your Business</CardDescription>
              <CardTitle>Recommended stack</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-slate-700">
                <li>Use Klaviyo AI for segmented campaigns</li>
                <li>Adopt SurferSEO for content optimization</li>
                <li>Integrate ChatGPT API for personalized upsells</li>
                <li>Use Jasper for ad copy and variant testing</li>
                <li>HubSpot AI for CRM enrichment</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>Action Plan</CardDescription>
              <CardTitle>30/60/90 day roadmap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">Phase 1: First 30 days</p>
                <ul className="list-disc pl-5 text-slate-700">
                  {actions.slice(0, 2).map(a => (
                    <li key={a.title}>{a.title} — Owner: {a.owner}; ROI: {formatPercentage(Math.round(a.roi * 10))}</li>
                  ))}
                  {!actions.length ? <li>Define initial experiments and measurement plan.</li> : null}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Phase 2: Next 60 days</p>
                <ul className="list-disc pl-5 text-slate-700">
                  {actions.slice(2, 4).map(a => (
                    <li key={a.title}>{a.title} — Owner: {a.owner}; ROI: {formatPercentage(Math.round(a.roi * 10))}</li>
                  ))}
                  {actions.length < 3 ? <li>Automate key GTM workflows and attribution.</li> : null}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Phase 3: Next 90 days</p>
                <ul className="list-disc pl-5 text-slate-700">
                  {actions.slice(4, 6).map(a => (
                    <li key={a.title}>{a.title} — Owner: {a.owner}; ROI: {formatPercentage(Math.round(a.roi * 10))}</li>
                  ))}
                  {actions.length < 5 ? <li>Scale winning variants and expand partnerships.</li> : null}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>Future of this Business / Niche</CardDescription>
              <CardTitle>What to anticipate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-slate-700">
              <ul className="list-disc pl-5">
                {safeArray(currentReport?.opportunityForecast?.predictedShifts).slice(0, 4).map((s, i) => (
                  <li key={i}>{s.topic} — {s.direction}; confidence {formatPercentage(Math.round(s.confidence * 100))}</li>
                ))}
                {!safeArray(currentReport?.opportunityForecast?.predictedShifts).length ? <li>Predicted shifts will appear as data matures.</li> : null}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>Data Sources & References</CardDescription>
              <CardTitle>Attribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 text-sm text-slate-600">Data Confidence Level: <span className="font-semibold">{dataConfidence}</span> ({sources.length} sources)</div>
              <div className="grid gap-3 md:grid-cols-2">
                {sources.slice(0, 8).map((s) => (
                  <div key={s.url} className="rounded-xl border bg-white p-4 text-sm">
                    <p className="font-medium text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.type}</p>
                    {s.url ? (
                      <a href={s.url} className="text-xs font-semibold text-[#5b21b6] underline-offset-4 hover:underline" target="_blank" rel="noreferrer">{s.url}</a>
                    ) : null}
                  </div>
                ))}
                {!sources.length ? <p className="text-sm text-slate-500">No external sources recorded.</p> : null}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>1-Line Recap (Share-ready)</CardDescription>
              <CardTitle>Executive recap</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">{analysis.product_name} can accelerate growth using AI-driven GTM automation and prioritized actions across {channels.slice(0,2).map(c=>c.channel).join(" & ") || "core channels"}; see plan above.</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default BusinessIntelligenceDetail;
