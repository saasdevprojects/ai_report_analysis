import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { ReportPayload } from "@/types/report";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, color: "#111827" },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  h2: { fontSize: 14, fontWeight: 700, marginTop: 16, marginBottom: 6 },
  small: { fontSize: 9, color: "#6b7280" },
  p: { marginBottom: 6, lineHeight: 1.35 },
  listItem: { marginBottom: 4 },
  table: { marginTop: 6, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  th: { flex: 1, fontSize: 10, fontWeight: 700, paddingVertical: 6 },
  td: { flex: 1, fontSize: 10, paddingVertical: 6 },
});

function fmtNumber(value: unknown, opts?: Intl.NumberFormatOptions) {
  const num = typeof value === "string" ? Number(value) : (value as number);
  if (typeof num !== "number" || Number.isNaN(num)) return "-";
  return new Intl.NumberFormat(undefined, opts).format(num);
}

export async function generateAnalysisReportPdf(args: {
  analysisName: string;
  report: ReportPayload;
  generatedAt?: string | null;
}): Promise<Blob> {
  const { analysisName, report, generatedAt } = args;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.h1}>AI Report: {analysisName}</Text>
        <Text style={styles.small}>
          Generated: {generatedAt ? new Date(generatedAt).toLocaleDateString() : "—"} · v{report.reportVersion}
        </Text>

        <Text style={styles.h2}>Executive Insight Summary</Text>
        {(report.executiveSummary?.keyInsights || []).slice(0, 5).map((ins, i) => (
          <Text key={i} style={styles.listItem}>• {ins}</Text>
        ))}

        {report.executiveSummary?.topOpportunities?.length ? (
          <>
            <Text style={styles.h2}>Top Opportunities</Text>
            <View style={styles.table}>
              <View style={styles.tr}>
                <Text style={styles.th}>Label</Text>
                <Text style={styles.th}>Impact</Text>
              </View>
              {report.executiveSummary.topOpportunities.slice(0, 5).map((o, i) => (
                <View key={i} style={styles.tr}>
                  <Text style={styles.td}>{String(o.label)}</Text>
                  <Text style={styles.td}>{typeof o.impact === "number" ? fmtNumber(o.impact, { maximumFractionDigits: 0 }) : String(o.impact)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {report.gtmStrategy?.channelPrioritization?.length ? (
          <>
            <Text style={styles.h2}>GTM Highlights</Text>
            {(report.gtmStrategy.channelPrioritization || []).slice(0, 5).map((c, i) => (
              <Text key={i} style={styles.listItem}>• {c.channel}: {fmtNumber(c.budgetShare, { maximumFractionDigits: 0 })}% budget share</Text>
            ))}
          </>
        ) : null}

        {report.financialBenchmark?.unitEconomics ? (
          <>
            <Text style={styles.h2}>Financial Snapshot</Text>
            <Text style={styles.p}>CPA: {fmtNumber(report.financialBenchmark.unitEconomics.cpa, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}</Text>
            <Text style={styles.p}>CLV: {fmtNumber(report.financialBenchmark.unitEconomics.clv, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}</Text>
            <Text style={styles.p}>CLV/CAC: {fmtNumber(report.financialBenchmark.unitEconomics.clvToCac, { maximumFractionDigits: 2 })}</Text>
          </>
        ) : null}

        {report.sourceAttribution?.sources?.length ? (
          <>
            <Text style={styles.h2}>Data Sources & References</Text>
            {report.sourceAttribution.sources.slice(0, 10).map((s, i) => (
              <Text key={i} style={styles.listItem}>• {s.name} — {s.url || s.type}</Text>
            ))}
          </>
        ) : null}
      </Page>
    </Document>
  );

  const instance = pdf(doc);
  const blob = await instance.toBlob();
  return blob;
}

export default generateAnalysisReportPdf;
