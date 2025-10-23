import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Rect,
  Line,
  Path,
  Image,
  Circle,
} from "@react-pdf/renderer";
import { Fragment } from "react";
import bebasNeue400 from "@/assets/fonts/bebas-neue-400.ttf";
import inter400 from "@/assets/fonts/inter-400.ttf";
import inter500 from "@/assets/fonts/inter-500.ttf";
import inter600 from "@/assets/fonts/inter-600.ttf";
import type { ReportPayload, StrategicRecommendation } from "@/types/report";

interface AnalysisReportDocumentProps {
  analysisName: string;
  report: ReportPayload;
  generatedAt?: string | null;
}

Font.register({
  family: "Bebas Neue",
  src: bebasNeue400,
});

Font.register({
  family: "Inter",
  fonts: [
    {
      src: inter400,
      fontWeight: 400,
    },
    {
      src: inter500,
      fontWeight: 500,
    },
    {
      src: inter600,
      fontWeight: 600,
    },
  ],
});

const palette = {
  ink: "#1f2937",
  slate: "#475569",
  softSlate: "#94a3b8",
  sky: "#38bdf8",
  aqua: "#67e8f9",
  navy: "#1d4ed8",
  powder: "#e0f2fe",
  backdrop: "#f8fafc",
  border: "#e2e8f0",
  accent: "#0ea5e9",
};

const PieChart = ({
  segments,
  totalLabel = "Total",
}: {
  segments: { label: string; value: number; color: string }[];
  totalLabel?: string;
}) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radiusOuter = 60;
  const radiusInner = 34;
  let startAngle = -Math.PI / 2;
  const totalFormatted = new Intl.NumberFormat("en", { maximumFractionDigits: total >= 100 ? 0 : 1 }).format(total);

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={180} height={180} viewBox="0 0 180 180">
        <Rect x={0} y={0} width={180} height={180} fill="#ffffff" />
        {segments.map((segment, index) => {
          const sweep = (segment.value / total) * Math.PI * 2;
          const endAngle = startAngle + sweep;
          const largeArc = sweep > Math.PI ? 1 : 0;
          const x1 = 90 + radiusOuter * Math.cos(startAngle);
          const y1 = 90 + radiusOuter * Math.sin(startAngle);
          const x2 = 90 + radiusOuter * Math.cos(endAngle);
          const y2 = 90 + radiusOuter * Math.sin(endAngle);
          const innerX2 = 90 + radiusInner * Math.cos(endAngle);
          const innerY2 = 90 + radiusInner * Math.sin(endAngle);
          const innerX1 = 90 + radiusInner * Math.cos(startAngle);
          const innerY1 = 90 + radiusInner * Math.sin(startAngle);
          const pathData = [
            `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
            `A ${radiusOuter} ${radiusOuter} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
            `L ${innerX2.toFixed(2)} ${innerY2.toFixed(2)}`,
            `A ${radiusInner} ${radiusInner} 0 ${largeArc} 0 ${innerX1.toFixed(2)} ${innerY1.toFixed(2)}`,
            "Z",
          ].join(" ");
          startAngle = endAngle;
          return <Path key={`${segment.label}-${index}`} d={pathData} fill={segment.color} stroke="#ffffff" strokeWidth={1} />;
        })}
        <Circle cx={90} cy={90} r={radiusInner} fill="#ffffff" stroke={palette.border} strokeWidth={1} />
      </Svg>
      <Text style={{ fontSize: 10, color: palette.softSlate, marginTop: 8 }}>{totalLabel}</Text>
      <Text style={{ fontFamily: "Bebas Neue", fontSize: 20, color: palette.navy }}>{totalFormatted}</Text>
    </View>
  );
};

const LineAreaChart = ({
  data,
  primaryKey,
  secondaryKey,
  labels,
  colors,
  height = 180,
  width = 440,
}: {
  data: { [key: string]: number | string | undefined }[];
  primaryKey: string;
  secondaryKey?: string;
  labels: string;
  colors: { primary: string; secondary?: string; grid: string; axis: string };
  height?: number;
  width?: number;
}) => {
  if (!data.length) {
    return <Text style={{ fontSize: 10, color: palette.softSlate }}>No chart data</Text>;
  }

  const paddingX = 36;
  const paddingY = 24;
  const drawableWidth = width - paddingX * 2;
  const drawableHeight = height - paddingY * 2;

  const numericValues = data.flatMap((point) => [
    typeof point[primaryKey] === "number" ? (point[primaryKey] as number) : 0,
    secondaryKey && typeof point[secondaryKey] === "number" ? (point[secondaryKey] as number) : 0,
  ]);

  const maxValue = numericValues.length ? Math.max(...numericValues, 1) : 1;

  const scaleX = (index: number) => paddingX + (drawableWidth * index) / Math.max(data.length - 1, 1);
  const scaleY = (value: number) => paddingY + drawableHeight - (drawableHeight * value) / maxValue;

  const areaPath = data
    .map((point, index) => {
      const value = typeof point[primaryKey] === "number" ? (point[primaryKey] as number) : 0;
      const x = scaleX(index);
      const y = scaleY(value);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const areaClosing = `L ${paddingX + drawableWidth} ${paddingY + drawableHeight} L ${paddingX} ${paddingY + drawableHeight} Z`;

  const linePath = secondaryKey
    ? data
        .map((point, index) => {
          const value = typeof point[secondaryKey] === "number" ? (point[secondaryKey] as number) : 0;
          const x = scaleX(index);
          const y = scaleY(value);
          return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ")
    : undefined;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      {Array.from({ length: 5 }).map((_, index) => {
        const y = paddingY + (drawableHeight * index) / 4;
        return <Line key={`grid-${index}`} x1={paddingX} y1={y} x2={paddingX + drawableWidth} y2={y} stroke={colors.grid} strokeWidth={1} />;
      })}
      <Path d={`${areaPath} ${areaClosing}`} fill={`${colors.primary}33`} stroke={colors.primary} strokeWidth={2} />
      {linePath ? <Path d={linePath} stroke={colors.secondary ?? palette.navy} strokeWidth={2} fill="none" /> : null}
      {data.map((point, index) => {
        const label = String(point.period ?? point.label ?? index + 1);
        const x = scaleX(index);
        return <Line key={`tick-${label}`} x1={x} y1={paddingY + drawableHeight} x2={x} y2={paddingY + drawableHeight + 6} stroke={colors.axis} strokeWidth={1} />;
      })}
    </Svg>
  );
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingHorizontal: 48,
    paddingBottom: 60,
    backgroundColor: "#ffffff",
    color: palette.ink,
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 1.4,
    position: "relative",
  },
  heading: {
    fontFamily: "Bebas Neue",
    fontSize: 44,
    letterSpacing: 1.6,
    color: palette.ink,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 12,
    color: palette.slate,
    marginBottom: 16,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#ffffff",
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: "Bebas Neue",
    fontSize: 24,
    letterSpacing: 1,
    marginBottom: 12,
  },
  cardBody: {
    fontSize: 11,
    color: palette.slate,
    marginBottom: 12,
  },
  flexRow: {
    flexDirection: "row",
    gap: 12,
  },
  flexColumn: {
    flex: 1,
    paddingRight: 12,
  },
  flexColumnLast: {
    flex: 1,
    paddingRight: 0,
  },
  statCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 10,
    color: palette.slate,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: "Bebas Neue",
    fontSize: 30,
    color: palette.navy,
    marginTop: 4,
  },
  statFoot: {
    fontSize: 10,
    color: palette.softSlate,
    marginTop: 6,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bulletMark: {
    fontSize: 12,
    color: palette.navy,
    marginRight: 6,
  },
  bulletText: {
    fontSize: 11,
    color: palette.ink,
  },
  recommendationCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#ffffff",
    padding: 18,
    marginBottom: 12,
  },
  recommendationTitle: {
    fontFamily: "Bebas Neue",
    fontSize: 22,
    color: palette.ink,
  },
  recommendationBody: {
    fontSize: 11,
    color: palette.slate,
    marginTop: 6,
    lineHeight: 1.45,
  },
  recommendationMeta: {
    fontSize: 10,
    color: palette.softSlate,
    marginTop: 8,
  },
  personaCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#ffffff",
    padding: 18,
    marginBottom: 12,
  },
  personaName: {
    fontFamily: "Bebas Neue",
    fontSize: 24,
    color: palette.ink,
  },
  personaMeta: {
    fontSize: 11,
    color: palette.slate,
    marginTop: 4,
  },
  caption: {
    fontSize: 10,
    color: palette.softSlate,
    marginTop: 12,
  },
  footer: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 34,
    fontSize: 9,
    color: palette.slate,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  coverPage: {
    paddingTop: 72,
    paddingBottom: 60,
    paddingHorizontal: 64,
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    position: "relative",
  },
  coverTitle: {
    fontFamily: "Bebas Neue",
    fontSize: 64,
    letterSpacing: 2.4,
    marginBottom: 24,
  },
  coverSubtitle: {
    fontSize: 16,
    color: "#cbd5f5",
    width: "70%",
    lineHeight: 1.5,
    marginBottom: 40,
  },
  coverMeta: {
    fontSize: 12,
    color: "#bfdbfe",
    marginTop: 6,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  metricCardLarge: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 20,
  },
  metricValue: {
    fontFamily: "Bebas Neue",
    fontSize: 42,
    color: "#38bdf8",
  },
  metricLabel: {
    fontSize: 11,
    color: "#cbd5f5",
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  tocHeading: {
    fontFamily: "Bebas Neue",
    fontSize: 32,
    marginBottom: 16,
  },
  tocList: {
    marginTop: 12,
    gap: 10,
  },
  tocItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    color: palette.slate,
    marginBottom: 6,
  },
  tocLevel: {
    fontFamily: "Inter",
    fontSize: 12,
    color: palette.ink,
  },
  pill: {
    backgroundColor: palette.powder,
    color: palette.navy,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tag: {
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: palette.powder,
    color: palette.navy,
    fontSize: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  table: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: palette.powder,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontFamily: "Inter",
    fontWeight: 600,
    color: palette.ink,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    color: palette.slate,
  },
  gridTwo: {
    flexDirection: "row",
    gap: 16,
  },
  gridItem: {
    flex: 1,
  },
  gridItemTight: {
    flex: 1,
    marginRight: 0,
  },
  gridThree: {
    flexDirection: "row",
    gap: 16,
  },
  gridFour: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  sectionHeading: {
    fontFamily: "Bebas Neue",
    fontSize: 28,
    letterSpacing: 1,
    color: palette.ink,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: palette.slate,
    marginBottom: 20,
  },
  statGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#ffffff",
    padding: 14,
  },
  statLabelSmall: {
    fontSize: 10,
    color: palette.softSlate,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  statValueSmall: {
    fontFamily: "Bebas Neue",
    fontSize: 24,
    color: palette.navy,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: palette.powder,
    color: palette.navy,
    fontSize: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  dividerLight: {
    height: 1,
    width: "100%",
    backgroundColor: palette.border,
    marginVertical: 18,
  },
  listCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 12,
  },
  listItem: {
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 12,
    fontFamily: "Inter",
    color: palette.ink,
    fontWeight: 600,
  },
  listBody: {
    fontSize: 10,
    color: palette.slate,
    marginTop: 4,
    lineHeight: 1.4,
  },
  callout: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.powder,
    backgroundColor: "#f0f9ff",
    padding: 18,
    marginBottom: 16,
  },
  calloutTitle: {
    fontFamily: "Bebas Neue",
    fontSize: 20,
    color: palette.navy,
    marginBottom: 6,
  },
  calloutBody: {
    fontSize: 11,
    color: palette.slate,
    lineHeight: 1.5,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  column: {
    flex: 1,
  },
  spacer: {
    height: 12,
  },
  chartWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#ffffff",
    padding: 16,
    marginTop: 12,
  },
  legendList: {
    marginTop: 12,
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 10,
    color: palette.slate,
  },
  tableNote: {
    fontSize: 9,
    color: palette.softSlate,
    marginTop: 8,
    lineHeight: 1.3,
  },
});

const safeArray = <T,>(items?: T[] | null): T[] => (Array.isArray(items) ? items : []);

const formatCurrency = (value?: number, currency = "USD") => {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
};

const formatPercent = (value?: number, fractionDigits = 0) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${value.toFixed(fractionDigits)}%`;
};

const formatNumber = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const PageFooter = ({ pageNumber }: { pageNumber: number }) => (
  <View style={styles.footer}>
    <Text>www.readygrowth.ai</Text>
    <Text>{`Page ${pageNumber.toString().padStart(2, "0")}`}</Text>
  </View>
);

const BulletList = ({ items, limit = 4 }: { items: string[]; limit?: number }) => (
  <View>
    {items.slice(0, limit).map((item, index) => (
      <View key={`${item}-${index}`} style={styles.bulletRow}>
        <Text style={styles.bulletMark}>•</Text>
        <Text style={styles.bulletText}>{item}</Text>
      </View>
    ))}
  </View>
);

const QuadrantArea = ({
  data,
  fill,
}: {
  data: { period: string; value: number }[];
  fill: string;
}) => {
  if (!data.length) {
    return <Text style={{ fontSize: 10, color: palette.softSlate }}>No data</Text>;
  }

  const width = 420;
  const height = 160;
  const maxValue = Math.max(...data.map((item) => item.value)) || 1;

  let d = `M0 ${height}`;
  data.forEach((point, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * width;
    const y = height - (point.value / maxValue) * (height - 18);
    d += ` L${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  d += ` L${width} ${height} Z`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      {Array.from({ length: 5 }).map((_, index) => (
        <Line
          key={index}
          x1={0}
          y1={(index / 4) * (height - 18)}
          x2={width}
          y2={(index / 4) * (height - 18)}
          stroke={palette.powder}
          strokeWidth={1}
        />
      ))}
      <Path d={d} fill={`${fill}55`} stroke={fill} strokeWidth={2} />
    </Svg>
  );
};

const BarComparison = ({
  data,
  colors,
}: {
  data: { label: string; value: number }[];
  colors: string[];
}) => {
  if (!data.length) {
    return <Text style={{ fontSize: 10, color: palette.softSlate }}>No chart data</Text>;
  }

  const width = 420;
  const height = 160;
  const barHeight = 18;
  const gap = 16;
  const maxValue = Math.max(...data.map((item) => item.value)) || 1;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      {data.map((item, index) => {
        const y = index * (barHeight + gap) + 10;
        const barWidth = (item.value / maxValue) * (width - 120);
        return (
          <Fragment key={item.label}>
            <Rect x={0} y={y} width={width} height={barHeight} fill={palette.powder} rx={4} />
            <Rect x={0} y={y} width={barWidth} height={barHeight} fill={colors[index % colors.length]} rx={4} />
          </Fragment>
        );
      })}
    </Svg>
  );
};

const selectTopRecommendations = (actions: StrategicRecommendation[], limit = 3) =>
  actions
    .slice()
    .sort((a, b) => (b.roi || 0) - (a.roi || 0))
    .slice(0, limit);

const AnalysisReportDocument = ({ analysisName, report, generatedAt }: AnalysisReportDocumentProps) => {
  const summary = report.executiveSummary;
  const formattedDate = formatDate(generatedAt ?? report.generatedAt);

  const readinessScore = (summary?.marketReadiness?.score ?? 0) * 100;
  const readinessStatus = summary?.marketReadiness?.status || "Not rated";
  const readinessNarrative = summary?.marketReadiness?.summary || "No summary available.";

  const growthTimeline = safeArray(report.opportunityForecast?.growthTimeline);
  const adoption = safeArray(report.predictiveDashboard?.userAdoption);
  const sentimentTrend = safeArray(report.competitiveLandscape?.sentimentTrend);
  const scenarioModeling = safeArray(report.predictiveDashboard?.scenarios);
  const runwayScenarios = safeArray(report.financialPlanning?.runwayScenarios);
  const budgetAllocation = safeArray(report.financialPlanning?.budgetAllocation);
  const cashFlowTimeline = safeArray(report.financialPlanning?.cashFlowTimeline);
  const financialPlanningNotes = safeArray(report.financialPlanning?.strategicNotes).filter(Boolean);

  const regionalOpportunity = safeArray(report.opportunityForecast?.regionalOpportunity);
  const pricePositioning = safeArray(report.financialBenchmark?.pricePositioning);
  const performanceRadar = safeArray(report.productEvaluation?.performanceRadar);
  const featureOverlap = safeArray(report.productEvaluation?.featureOverlap);
  const innovationQuotient = report.productEvaluation?.innovationQuotient;
  const technicalReadiness = safeArray(report.productEvaluation?.technicalReadiness);
  const retentionRisk = safeArray(report.productEvaluation?.retentionRisk);

  const personas = safeArray(report.customerInsights?.personas);
  const behavioralSignals = safeArray(report.customerInsights?.behavioralSignals);
  const purchaseJourney = safeArray(report.customerInsights?.purchaseJourney);
  const sentimentMaps = safeArray(report.customerInsights?.sentimentMaps);
  const channelUsage = safeArray(report.customerInsights?.channelUsage);
  const deviceUsage = safeArray(report.customerInsights?.deviceUsage);

  const marketSizeForecast = safeArray(report.marketEnvironment?.marketSize?.forecast);
  const cagrByRegion = safeArray(report.marketEnvironment?.cagrByRegion);
  const regulatoryTrends = safeArray(report.marketEnvironment?.regulatoryTrends);
  const competitiveDensity = safeArray(report.marketEnvironment?.competitiveDensity);
  const geoSegmentation = safeArray(report.marketEnvironment?.segmentation?.geography);

  const topCompetitors = safeArray(report.competitiveLandscape?.topCompetitors);
  const marketShare = safeArray(report.competitiveLandscape?.marketShare);
  const featureBenchmark = safeArray(report.competitiveLandscape?.featureBenchmark);
  const priceFeatureMatrix = safeArray(report.competitiveLandscape?.priceFeatureMatrix);
  const innovationFrequency = safeArray(report.competitiveLandscape?.innovationFrequency);
  const negativeSignals = safeArray(report.competitiveLandscape?.negativeSignals);

  const newsSentiment = safeArray(report.sentimentAnalysis?.newsSentiment);
  const socialTone = safeArray(report.sentimentAnalysis?.socialTone);
  const reputationIndex = safeArray(report.sentimentAnalysis?.reputationIndex);
  const emergingPhrases = safeArray(report.sentimentAnalysis?.emergingPhrases);
  const trendingStories = safeArray(report.sentimentAnalysis?.trendingStories);
  const competitorCoverage = safeArray(report.sentimentAnalysis?.competitorCoverage);

  const policyScores = safeArray(report.riskCompliance?.policyScores);
  const technologyRisk = safeArray(report.riskCompliance?.technologyRisk);
  const financialGeo = safeArray(report.riskCompliance?.financialGeopolitical);
  const complianceStatus = safeArray(report.riskCompliance?.complianceStatus);
  const ipConflicts = safeArray(report.riskCompliance?.ipConflicts);
  const riskMatrix = safeArray(report.riskCompliance?.riskMatrix).map((item) => ({
    risk: item.risk,
    impactPercent: Math.min(100, Math.max(0, item.impact ?? 0)),
    probabilityPercent: Math.min(100, Math.max(0, item.probability ?? 0)),
    owner: item.owner,
  }));

  const recommendationActions = safeArray(report.strategicRecommendations?.actions);
  const sources = safeArray(report.sourceAttribution?.sources);

  const valuations = safeArray(report.financialBenchmark?.valuationModel);
  const unitEconomics = report.financialBenchmark?.unitEconomics;
  const pricingBenchmarks = safeArray(report.financialBenchmark?.pricingBenchmarks);
  const profitMarginTrend = safeArray(report.financialBenchmark?.profitMarginTrend);
  const clvVsCac = safeArray(report.financialBenchmark?.clvVsCac);
  const pricePositioningLine = pricePositioning.map((point) => ({
    label: point.company,
    value: point.price,
  }));

  const topScenario = scenarioModeling.reduce<
    { scenario: string; growthRate: number; revenueProjection: number } | undefined
  >((best, entry) => {
    if (!best || (entry.revenueProjection ?? 0) > (best.revenueProjection ?? 0)) {
      return {
        scenario: entry.scenario ?? "",
        growthRate: entry.growthRate ?? 0,
        revenueProjection: entry.revenueProjection ?? 0,
      };
    }
    return best;
  }, undefined);

  const regionPie = regionalOpportunity.slice(0, 6).map((item, index) => ({
    label: item.region,
    value: item.score,
    color: [palette.sky, palette.navy, palette.aqua, palette.powder, palette.ink, palette.accent][index % 6],
  }));

  const sentimentSummary = sentimentMaps.map((item) => `${item.channel}: ${formatPercent(item.positive)} positive / ${formatPercent(item.negative)} negative`);

  const currency = pricingBenchmarks[0]?.currency ?? report.marketEnvironment?.marketSize?.currency ?? "USD";

  const toc = [
    { title: "Executive Summary", page: 2 },
    { title: "Performance Overview", page: 3 },
    { title: "Customer & ICP Insights", page: 4 },
    { title: "Competitive & Market Landscape", page: 5 },
    { title: "Product Evaluation", page: 6 },
    { title: "Opportunity Forecast & GTM", page: 7 },
    { title: "Financial Planning & Benchmark", page: 8 },
    { title: "Sentiment & Media Intelligence", page: 9 },
    { title: "Risk & Compliance", page: 10 },
    { title: "Strategic Recommendations", page: 11 },
    { title: "Source Attribution", page: 12 },
  ];

  return (
    <Document title={`${analysisName} Intelligence Report`} author="ReadyGrowth AI">
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverTitle}>{analysisName}</Text>
        <Text style={styles.coverSubtitle}>
          AI-assisted go-to-market intelligence covering performance signals, market dynamics, customer sentiment, and financial planning insights.
        </Text>
        <View>
          <Text style={styles.coverMeta}>Generated: {formattedDate || "Unknown"}</Text>
          <Text style={styles.coverMeta}>Report Version: {report.reportVersion ?? "1.0"}</Text>
          <Text style={styles.coverMeta}>Prepared by ReadyGrowth AI</Text>
        </View>
        <View style={[styles.metricRow, { marginTop: 48 }]}> 
          <View style={styles.metricCardLarge}>
            <Text style={styles.metricValue}>{formatPercent(summary?.marketReadiness?.score ? summary.marketReadiness.score * 100 : 0, 0)}</Text>
            <Text style={styles.metricLabel}>Market Readiness Score</Text>
            <Text style={styles.calloutBody}>{readinessStatus}</Text>
          </View>
          <View style={styles.metricCardLarge}>
            <Text style={styles.metricValue}>{formatCurrency(valuations[0]?.valuation, currency)}</Text>
            <Text style={styles.metricLabel}>Projected Valuation</Text>
            <Text style={styles.calloutBody}>{valuations[0]?.scenario || "Baseline scenario"}</Text>
          </View>
          <View style={styles.metricCardLarge}>
            <Text style={styles.metricValue}>{runwayScenarios[0]?.monthsOfRunway ?? "-"}</Text>
            <Text style={styles.metricLabel}>Months of Runway</Text>
            <Text style={styles.calloutBody}>{runwayScenarios[0]?.scenario || "Primary plan"}</Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>Table of Contents</Text>
        <View style={styles.dividerLight} />
        <View>
          {toc.map((item) => (
            <View key={item.title} style={styles.tocItem}>
              <Text style={styles.tocLevel}>{item.title}</Text>
              <Text style={styles.tocLevel}>{item.page.toString().padStart(2, "0")}</Text>
            </View>
          ))}
        </View>
        <PageFooter pageNumber={1} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>Executive Summary</Text>
        <Text style={styles.sectionSubtitle}>Readiness narrative, core signals, and prioritized actions.</Text>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>Market Readiness Narrative</Text>
          <Text style={styles.calloutBody}>{readinessNarrative}</Text>
        </View>
        <View style={styles.statGroup}>
          <View style={styles.statItem}>
            <Text style={styles.statLabelSmall}>Readiness Score</Text>
            <Text style={styles.statValueSmall}>{formatPercent(readinessScore, 0)}</Text>
            <Text style={styles.caption}>{readinessStatus}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabelSmall}>Valuation</Text>
            <Text style={styles.statValueSmall}>{formatCurrency(valuations[0]?.valuation, currency)}</Text>
            <Text style={styles.caption}>{valuations[0]?.scenario || "Primary scenario"}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabelSmall}>Runway (months)</Text>
            <Text style={styles.statValueSmall}>{runwayScenarios[0]?.monthsOfRunway ?? "-"}</Text>
            <Text style={styles.caption}>{runwayScenarios[0]?.scenario || "Financial plan"}</Text>
          </View>
        </View>
        <View style={styles.dividerLight} />
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>Strategic Priorities</Text>
          <BulletList
            items={selectTopRecommendations(recommendationActions, 4).map(
              (item) => `${item.title} · Priority ${item.priority ?? "n/a"} · ROI ${formatPercent(item.roi)}`
            )}
          />
        </View>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>Opportunity Radar</Text>
          <BulletList
            items={regionalOpportunity.slice(0, 5).map((item) => `${item.region}: score ${formatPercent(item.score ?? 0)}`)}
          />
        </View>
        <PageFooter pageNumber={2} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>Performance Overview</Text>
        <Text style={styles.sectionSubtitle}>Growth, adoption, sentiment, and revenue development.</Text>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Growth Timeline</Text>
          <Text style={styles.cardBody}>Opportunity index trend derived from predictive forecast.</Text>
          <View style={styles.chartWrapper}>
            <LineAreaChart
              data={growthTimeline.map((item) => ({ period: item.period, value: item.growthIndex }))}
              primaryKey="value"
              labels="period"
              colors={{ primary: palette.navy, grid: palette.powder, axis: palette.softSlate }}
            />
          </View>
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Adoption & Sentiment</Text>
          <Text style={styles.cardBody}>Quarterly adoption rate alongside sentiment score confidence.</Text>
          <View style={styles.chartWrapper}>
            <LineAreaChart
              data={adoption.map((item) => ({ period: item.period, adoptionRate: item.adoptionRate ?? 0, sentimentScore: item.sentimentScore ?? 0 }))}
              primaryKey="adoptionRate"
              secondaryKey="sentimentScore"
              labels="period"
              colors={{ primary: palette.sky, secondary: palette.navy, grid: palette.powder, axis: palette.softSlate }}
            />
          </View>
        </View>
        <View style={styles.statGroup}>
          <View style={styles.statItem}>
            <Text style={styles.statLabelSmall}>Latest Adoption</Text>
            <Text style={styles.statValueSmall}>{formatPercent(adoption.slice(-1)[0]?.adoptionRate ?? 0, 0)}</Text>
            <Text style={styles.caption}>Last period signal</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabelSmall}>Sentiment Score</Text>
            <Text style={styles.statValueSmall}>{formatPercent(sentimentTrend.slice(-1)[0]?.score ?? 0, 0)}</Text>
            <Text style={styles.caption}>Cross-channel sentiment</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabelSmall}>Revenue Projection</Text>
            <Text style={styles.statValueSmall}>{formatCurrency(topScenario?.revenueProjection, currency)}</Text>
            <Text style={styles.caption}>{topScenario?.scenario || "Scenario modeling"}</Text>
          </View>
        </View>
        <PageFooter pageNumber={3} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>Customer & ICP Insights</Text>
        <Text style={styles.sectionSubtitle}>Persona segmentation, sentiment, and journey analysis.</Text>
        <View style={styles.gridTwo}>
          <View style={styles.gridItem}>
            <View style={styles.sectionCard} wrap={false}>
              <Text style={styles.cardTitle}>Persona Spotlight</Text>
              {personas.length ? (
                personas.slice(0, 3).map((persona) => (
                  <View key={persona.name} style={styles.listCard}>
                    <Text style={styles.listTitle}>{persona.name}</Text>
                    <Text style={styles.listBody}>Role: {persona.role} · Company Size: {persona.companySize} · Budget: {persona.budget ?? "n/a"}</Text>
                    <View style={styles.chipRow}>
                      {safeArray(persona.motivations).slice(0, 3).map((motivation) => (
                        <Text key={motivation} style={styles.chip}>{motivation}</Text>
                      ))}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.cardBody}>No persona insights available.</Text>
              )}
            </View>
          </View>
          <View style={styles.gridItem}>
            <View style={styles.sectionCard} wrap={false}>
              <Text style={styles.cardTitle}>Sentiment Highlights</Text>
              <BulletList items={sentimentSummary} />
              <Text style={styles.caption}>Aggregated positive vs negative tone by channel</Text>
            </View>
          </View>
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Demand Signals</Text>
          {behavioralSignals.length ? (
            behavioralSignals.slice(0, 4).map((signal, index) => (
              <View key={index} style={styles.listCard}>
                <Text style={styles.listTitle}>{signal.signal}</Text>
                <Text style={styles.listBody}>{signal.description}</Text>
                <Text style={styles.caption}>Influence: {formatPercent(signal.influence ?? 0)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardBody}>No behavioral signals available.</Text>
          )}
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Journey & Channel Mix</Text>
          <BulletList items={purchaseJourney.map((item) => `${item.stage}: ${formatPercent(item.conversionRate ?? 0)}`)} limit={6} />
          <View style={styles.spacer} />
          <Text style={styles.caption}>Channel usage: {channelUsage.map((item) => `${item.label} ${formatPercent(item.percentage ?? 0)}`).join(" · ")}</Text>
        </View>
        <PageFooter pageNumber={4} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>Competitive & Market Landscape</Text>
        <Text style={styles.sectionSubtitle}>Market growth, regional distribution, and competitor benchmarking.</Text>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Market Growth Forecast</Text>
          <View style={styles.chartWrapper}>
            <LineAreaChart
              data={marketSizeForecast.map((item) => ({ period: item.year ?? String(item.year), value: item.value ?? 0 }))}
              primaryKey="value"
              labels="period"
              colors={{ primary: palette.navy, grid: palette.powder, axis: palette.softSlate }}
            />
          </View>
          <Text style={styles.caption}>Currency: {report.marketEnvironment?.marketSize?.currency ?? currency}</Text>
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Regional Opportunity</Text>
          <View style={[styles.chartWrapper, { alignItems: "center" }]}> 
            <PieChart segments={regionPie.length ? regionPie : [{ label: "Global", value: 1, color: palette.navy }]} />
            <View style={styles.legendList}>
              {(regionPie.length ? regionPie : [{ label: "Global", value: 1, color: palette.navy }]).map((segment) => (
                <View key={segment.label} style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: segment.color }]} />
                  <Text style={styles.legendLabel}>{segment.label} · {formatPercent(segment.value ?? 0)}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.caption}>Top regions by opportunity score</Text>
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Competitor Highlights</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Company</Text>
              <Text style={styles.tableHeaderCell}>Share</Text>
              <Text style={styles.tableHeaderCell}>Pricing Model</Text>
              <Text style={styles.tableHeaderCell}>Strength</Text>
            </View>
            {topCompetitors.slice(0, 5).map((competitor, index) => (
              <View key={`${competitor.name}-${index}`} style={styles.tableRow}>
                <Text style={styles.tableCell}>{competitor.name}</Text>
                <Text style={styles.tableCell}>
                  {formatPercent(
                    marketShare.find((item) => item.company === competitor.name)?.share ??
                      competitiveDensity[index]?.value ??
                      0
                  )}
                </Text>
                <Text style={styles.tableCell}>{competitor.pricingModel ?? "-"}</Text>
                <Text style={styles.tableCell}>{safeArray(competitor.strengths).slice(0, 1).join(", ")}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.tableNote}>Additional competitors available in primary dashboard.</Text>
        </View>
        <PageFooter pageNumber={5} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>Product Evaluation & Fit</Text>
        <Text style={styles.sectionSubtitle}>Performance radar, feature coverage, innovation, and risks.</Text>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Performance Radar</Text>
          <BarComparison
            data={performanceRadar.map((metric) => ({ label: metric.axis, value: metric.product ?? 0 }))}
            colors={[palette.navy, palette.sky, palette.aqua, palette.powder]}
          />
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Feature Coverage</Text>
          <BulletList
            items={featureOverlap.map((feature) => `${feature.feature}: product ${formatPercent(feature.product ?? 0)} vs competitors ${formatPercent(feature.competitorAverage ?? 0)}`)}
          />
        </View>
        <View style={styles.gridTwo}>
          <View style={styles.gridItem}>
            <View style={styles.sectionCard} wrap={false}>
              <Text style={styles.cardTitle}>Innovation Quotient</Text>
              <Text style={styles.statValueSmall}>{innovationQuotient?.score ?? "-"}</Text>
              <Text style={styles.cardBody}>{innovationQuotient?.summary}</Text>
              <BulletList items={safeArray(innovationQuotient?.drivers)} />
            </View>
          </View>
          <View style={styles.gridItem}>
            <View style={styles.sectionCard} wrap={false}>
              <Text style={styles.cardTitle}>Technical Readiness Checklist</Text>
              <BulletList
                items={technicalReadiness.map((item) => `${item.item}: ${item.status} · ${item.notes}`)}
                limit={6}
              />
            </View>
          </View>
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Retention Risks</Text>
          <BulletList
            items={retentionRisk.map((risk) => `${risk.riskType}: ${risk.level} · Mitigation ${risk.mitigation}`)}
          />
        </View>
        <PageFooter pageNumber={6} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>Opportunity Forecast & GTM Strategy</Text>
        <Text style={styles.sectionSubtitle}>Emerging segments, partnerships, scenario modeling, and ROI.</Text>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Scenario Modeling</Text>
          <View style={styles.chartWrapper}>
            <LineAreaChart
              data={scenarioModeling.map((scenario, index) => ({ period: scenario.scenario ?? `Scenario ${index + 1}`, value: scenario.revenueProjection ?? 0 }))}
              primaryKey="value"
              labels="period"
              colors={{ primary: palette.aqua, grid: palette.powder, axis: palette.softSlate }}
            />
          </View>
          <Text style={styles.caption}>Growth rate range: {formatPercent(scenarioModeling.reduce((max, entry) => Math.max(max, entry.growthRate ?? 0), 0))}</Text>
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Unexplored Segments</Text>
          <BulletList
            items={safeArray(report.opportunityForecast?.unexploredSegments).map(
              (segment) => `${segment.segment}: ${segment.rationale}`
            )}
          />
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>GTM Channel Prioritization</Text>
          <BulletList items={safeArray(report.gtmStrategy?.channelPrioritization).map((item) => `${item.channel}: ${formatPercent(item.budgetShare ?? 0)}`)} />
          <Text style={styles.caption}>ROI Simulation: {safeArray(report.gtmStrategy?.roiSimulation).map((item) => `${item.path}: ROI ${formatPercent(item.projectedROI ?? 0)} in ${item.paybackMonths} months`).join(" · ")}</Text>
        </View>
        <PageFooter pageNumber={7} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>Financial Planning & Benchmark</Text>
        <Text style={styles.sectionSubtitle}>Budget allocation, runway scenarios, cash flow, and unit economics.</Text>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Runway Scenarios</Text>
          {runwayScenarios.length ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Scenario</Text>
                <Text style={styles.tableHeaderCell}>Runway (months)</Text>
                <Text style={styles.tableHeaderCell}>Cash Balance</Text>
                <Text style={styles.tableHeaderCell}>Burn Rate</Text>
              </View>
              {runwayScenarios.map((scenario) => (
                <View key={scenario.scenario} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{scenario.scenario}</Text>
                  <Text style={styles.tableCell}>{scenario.monthsOfRunway ?? "-"}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(scenario.cashBalance, currency)}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(scenario.burnRate, currency)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.cardBody}>No runway data available.</Text>
          )}
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Budget Allocation</Text>
          <BulletList
            items={budgetAllocation.map((item) => `${item.category}: planned ${formatCurrency(item.planned, currency)} vs actual ${formatCurrency(item.actual, currency)} (variance ${formatCurrency(item.variance, currency)})`)}
          />
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Unit Economics</Text>
          <BulletList
            items={unitEconomics
              ? [
                  `CAC: ${formatCurrency(unitEconomics.cpa, currency)}`,
                  `CLV: ${formatCurrency(unitEconomics.clv, currency)}`,
                  `CLV:CAC Ratio: ${unitEconomics.clvToCac ?? "-"}`,
                ]
              : ["Unit economics not available."]}
          />
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Financial Notes</Text>
          <BulletList items={financialPlanningNotes} />
        </View>
        <PageFooter pageNumber={8} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>Sentiment & Media Intelligence</Text>
        <Text style={styles.sectionSubtitle}>News sentiment, social tone, reputation, and emerging stories.</Text>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>News Sentiment</Text>
          <BulletList
            items={newsSentiment.map(
              (item) => `${item.source}: ${item.sentiment} · ${item.summary ?? "View details"}`
            )}
          />
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Social Tone</Text>
          <BulletList
            items={socialTone.map(
              (item) => `${item.platform}: +${item.positive} / °${item.neutral} / -${item.negative}`
            )}
          />
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Reputation Index</Text>
          <QuadrantArea data={reputationIndex.map((entry) => ({ period: entry.period, value: entry.score }))} fill={palette.sky} />
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Emerging Phrases & Stories</Text>
          <BulletList items={emergingPhrases.map((phrase) => `${phrase.phrase}: freq ${phrase.frequency} · ${phrase.sentiment}`)} />
          <View style={styles.spacer} />
          <BulletList items={trendingStories.map((story) => `${story.title} (${story.source}): ${story.sentiment}`)} />
        </View>
        <PageFooter pageNumber={9} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>Risk & Compliance</Text>
        <Text style={styles.sectionSubtitle}>Policy exposure, technology compliance, risk matrix, and IP conflicts.</Text>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Risk Exposure Overview</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Risk</Text>
              <Text style={styles.tableHeaderCell}>Impact %</Text>
              <Text style={styles.tableHeaderCell}>Probability %</Text>
              <Text style={styles.tableHeaderCell}>Owner</Text>
            </View>
            {riskMatrix.map((risk) => (
              <View key={risk.risk} style={styles.tableRow}>
                <Text style={styles.tableCell}>{risk.risk}</Text>
                <Text style={styles.tableCell}>{formatPercent(risk.impactPercent ?? 0)}</Text>
                <Text style={styles.tableCell}>{formatPercent(risk.probabilityPercent ?? 0)}</Text>
                <Text style={styles.tableCell}>{risk.owner ?? "-"}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Compliance Status</Text>
          <BulletList items={complianceStatus.map((item) => `${item.framework}: ${item.status} (${item.notes ?? "no notes"})`)} />
        </View>
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.cardTitle}>Technology Risk</Text>
          <BulletList items={technologyRisk.map((item) => `${item.area}: ${item.status} · ${item.notes}`)} />
        </View>
        <PageFooter pageNumber={10} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>Strategic Recommendations</Text>
        <Text style={styles.sectionSubtitle}>Action matrix with owners, timeline, ROI, and confidence scores.</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCell}>Action</Text>
            <Text style={styles.tableHeaderCell}>Owner</Text>
            <Text style={styles.tableHeaderCell}>Timeline</Text>
            <Text style={styles.tableHeaderCell}>Priority</Text>
            <Text style={styles.tableHeaderCell}>ROI</Text>
            <Text style={styles.tableHeaderCell}>Confidence</Text>
          </View>
          {recommendationActions.map((action) => (
            <View key={action.title} style={styles.tableRow}>
              <Text style={styles.tableCell}>{action.title}</Text>
              <Text style={styles.tableCell}>{action.owner ?? "-"}</Text>
              <Text style={styles.tableCell}>{action.timeline ?? "-"}</Text>
              <Text style={styles.tableCell}>{action.priority ?? "-"}</Text>
              <Text style={styles.tableCell}>{formatPercent(action.roi ?? 0)}</Text>
              <Text style={styles.tableCell}>{formatPercent(action.confidence ?? 0)}</Text>
            </View>
          ))}
        </View>
        <PageFooter pageNumber={11} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>Source Attribution</Text>
        <Text style={styles.sectionSubtitle}>Reference materials and data provenance for transparency.</Text>
        <View style={styles.sectionCard} wrap={false}>
          <BulletList
            items={sources.map((source) => `${source.name} (${source.type}): Retrieved ${formatDate(source.retrievedAt)} · ${source.url}`)}
          />
        </View>
        <Text style={styles.caption}>For full dataset access, contact ReadyGrowth AI.</Text>
        <PageFooter pageNumber={12} />
      </Page>
    </Document>
  );
};

export async function generateAnalysisReportPdf({ analysisName, report, generatedAt }: AnalysisReportDocumentProps) {
  const { pdf } = await import("@react-pdf/renderer");
  if (typeof window !== "undefined" && !(window as unknown as { Buffer?: typeof import("buffer").Buffer }).Buffer) {
    const { Buffer } = await import("buffer");
    (window as unknown as { Buffer?: typeof import("buffer").Buffer }).Buffer = Buffer;
  }
  const doc = <AnalysisReportDocument analysisName={analysisName} report={report} generatedAt={generatedAt} />;
  return pdf(doc).toBlob();
}
