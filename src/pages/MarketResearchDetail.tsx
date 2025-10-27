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

function formatCurrency(value: number | string | null | undefined, currency = "USD") {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (typeof numeric !== "number" || Number.isNaN(numeric)) return "-";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: numeric >= 100 ? 0 : 2,
  }).format(numeric);
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

const MarketResearchDetail = () => {
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

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>Executive Insight Summary</CardDescription>
              <CardTitle>Key findings</CardTitle>
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
              <CardDescription>Market overview</CardDescription>
              <CardTitle>Size & forecast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700">
              <p><span className="font-semibold">Current size:</span> {formatCurrency(marketSize ?? 0, "USD")} (est.)</p>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-500">Forecast</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecast.map((p) => (
                      <TableRow key={p.year}>
                        <TableCell>{p.year}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.value, "USD")}</TableCell>
                      </TableRow>
                    ))}
                    {!forecast.length ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-slate-500">Forecast pending</TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>Segmentation</CardDescription>
              <CardTitle>Industry & regions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-500">By industry</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segment</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segIndustry.map(s => (
                      <TableRow key={s.name}>
                        <TableCell>{s.name}</TableCell>
                        <TableCell className="text-right">{formatNumber(s.share, { maximumFractionDigits: 0 })}%</TableCell>
                      </TableRow>
                    ))}
                    {!segIndustry.length ? (
                      <TableRow><TableCell colSpan={2} className="text-slate-500">No data</TableCell></TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-500">By geography</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segGeography.map(s => (
                      <TableRow key={s.name}>
                        <TableCell>{s.name}</TableCell>
                        <TableCell className="text-right">{formatNumber(s.share, { maximumFractionDigits: 0 })}%</TableCell>
                      </TableRow>
                    ))}
                    {!segGeography.length ? (
                      <TableRow><TableCell colSpan={2} className="text-slate-500">No data</TableCell></TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>Competitor snapshot</CardDescription>
              <CardTitle>Key differentiators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Strength</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors.map(c => (
                    <TableRow key={c.name}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.pricingModel}</TableCell>
                      <TableCell>{safeArray(c.strengths).slice(0,1).join(', ') || '—'}</TableCell>
                    </TableRow>
                  ))}
                  {!competitors.length ? (
                    <TableRow><TableCell colSpan={3} className="text-slate-500">No competitor data yet</TableCell></TableRow>
                  ) : null}
                </TableBody>
              </Table>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-500">Feature benchmarks</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead className="text-right">Product</TableHead>
                      <TableHead className="text-right">Competitor Avg</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featureBenchmark.map(f => (
                      <TableRow key={f.feature}>
                        <TableCell>{f.feature}</TableCell>
                        <TableCell className="text-right">{formatNumber(f.productScore, { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell className="text-right">{formatNumber(f.competitorAverage, { maximumFractionDigits: 0 })}</TableCell>
                      </TableRow>
                    ))}
                    {!featureBenchmark.length ? (
                      <TableRow><TableCell colSpan={3} className="text-slate-500">No benchmark data</TableCell></TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>Customer behavior</CardDescription>
              <CardTitle>Journey insights</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Conversion</TableHead>
                    <TableHead>Key activities</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journey.map(s => (
                    <TableRow key={s.stage}>
                      <TableCell>{s.stage}</TableCell>
                      <TableCell className="text-right">{formatNumber(s.conversionRate, { maximumFractionDigits: 0 })}%</TableCell>
                      <TableCell>{safeArray(s.keyActivities).slice(0,3).join(', ')}</TableCell>
                    </TableRow>
                  ))}
                  {!journey.length ? (
                    <TableRow><TableCell colSpan={3} className="text-slate-500">No journey data</TableCell></TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardDescription>Data-backed forecast</CardDescription>
              <CardTitle>Growth outlook</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Growth Index</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {growthTimeline.map(p => (
                    <TableRow key={p.period}>
                      <TableCell>{p.period}</TableCell>
                      <TableCell className="text-right">{formatNumber(p.growthIndex, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right">{formatNumber(p.confidence * 100, { maximumFractionDigits: 0 })}%</TableCell>
                    </TableRow>
                  ))}
                  {!growthTimeline.length ? (
                    <TableRow><TableCell colSpan={3} className="text-slate-500">Forecast pending</TableCell></TableRow>
                  ) : null}
                </TableBody>
              </Table>
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
                {sources.slice(0, 10).map((s) => (
                  <div key={s.url} className="rounded-xl border bg-white p-4 text-sm">
                    <p className="font-medium text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.type}</p>
                    {s.url ? (
                      <a href={s.url} className="text-xs font-semibold text-[#1e40af] underline-offset-4 hover:underline" target="_blank" rel="noreferrer">{s.url}</a>
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
              <CardTitle>Market recap</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">{analysis.product_name} can capture demand by focusing on {segIndustry.slice(0,1).map(s=>s.name).join(", ") || "priority segments"} and top regions {segGeography.slice(0,1).map(s=>s.name).join(", ") || "target regions"}, while differentiating vs. leading competitors.</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default MarketResearchDetail;
