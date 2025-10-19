export interface OpportunityMatrixItem {
  area: string;
  impact: number;
  effort: number;
  expectedLift?: number;
}

export interface RadarMetric {
  axis: string;
  score: number;
  recommendation?: string;
}

export interface HeatmapCell {
  label: string;
  impact: number;
  urgency?: number;
}

export interface ExecutiveSummarySection {
  overview: string;
  keyInsights: string[];
  growthPotential: string;
  riskIndicators: string[];
  topOpportunities: HeatmapCell[];
  topThreats: HeatmapCell[];
  decisionRadar: RadarMetric[];
  marketReadiness: {
    score: number;
    status: string;
    summary: string;
    improvementMatrix: OpportunityMatrixItem[];
  };
}

export interface MarketSizeForecastPoint {
  year: string;
  value: number;
}

export interface RegionMetric {
  region: string;
  value: number;
}

export interface MarketSegmentBreakdown {
  name: string;
  share: number;
  description?: string;
}

export interface RegulatoryEvent {
  year: string;
  title: string;
  impact: string;
  summary: string;
}

export interface InfluenceNode {
  name: string;
  role: string;
  influence: number;
}

export interface MarketEnvironmentSection {
  marketSize: {
    current: number;
    currency: string;
    forecast: MarketSizeForecastPoint[];
  };
  cagrByRegion: RegionMetric[];
  segmentation: {
    industry: MarketSegmentBreakdown[];
    geography: MarketSegmentBreakdown[];
    customer: MarketSegmentBreakdown[];
  };
  regulatoryTrends: RegulatoryEvent[];
  influenceMap: InfluenceNode[];
  competitiveDensity: RegionMetric[];
}

export interface CompetitorProfile {
  name: string;
  website: string;
  pricingModel: string;
  monthlyTraffic: number;
  funding: string;
  featureHighlights: string[];
  strengths: string[];
  weaknesses: string[];
  sentimentScore: number;
}

export interface PriceFeaturePoint {
  company: string;
  pricePosition: number;
  featureScore: number;
}

export interface InnovationMetric {
  company: string;
  patentsPerYear: number;
  releaseCadence: number;
  mediaMentions: number;
}

export interface NegativeSignal {
  company: string;
  signal: string;
  severity: string;
}

export interface SentimentTrendPoint {
  period: string;
  score: number;
}

export interface CompetitiveLandscapeSection {
  topCompetitors: CompetitorProfile[];
  marketShare: { company: string; share: number }[];
  priceFeatureMatrix: PriceFeaturePoint[];
  featureBenchmark: { feature: string; productScore: number; competitorAverage: number }[];
  innovationFrequency: InnovationMetric[];
  logoCloud: string[];
  negativeSignals: NegativeSignal[];
  sentimentTrend: SentimentTrendPoint[];
}

export interface PersonaProfile {
  name: string;
  role: string;
  companySize: string;
  budget: string;
  motivations: string[];
  objections: string[];
  preferredChannels: string[];
}

export interface SentimentBreakdown {
  channel: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface UsageMetric {
  label: string;
  percentage: number;
}

export interface JourneyStage {
  stage: string;
  conversionRate: number;
  keyActivities: string[];
}

export interface CustomerInsightsSection {
  personas: PersonaProfile[];
  sentimentMaps: SentimentBreakdown[];
  behavioralSignals: { signal: string; description: string; influence: number }[];
  channelUsage: UsageMetric[];
  deviceUsage: UsageMetric[];
  purchaseJourney: JourneyStage[];
}

export interface PerformanceMetric {
  axis: string;
  product: number;
  competitors: number;
}

export interface ChecklistItem {
  item: string;
  status: string;
  notes?: string;
}

export interface RiskItem {
  riskType: string;
  level: string;
  mitigation: string;
}

export interface ProductEvaluationSection {
  uvpScore: number;
  uvpSummary: string;
  performanceRadar: PerformanceMetric[];
  featureOverlap: { feature: string; product: number; competitorAverage: number }[];
  innovationQuotient: {
    score: number;
    summary: string;
    drivers: string[];
  };
  technicalReadiness: ChecklistItem[];
  retentionRisk: RiskItem[];
}

export interface OpportunityForecastSection {
  unexploredSegments: { segment: string; rationale: string; potentialValue: number }[];
  predictedShifts: { topic: string; direction: string; confidence: number; timeframe: string }[];
  partnerships: { partner: string; type: string; probability: number; notes: string }[];
  regionalOpportunity: { region: string; score: number }[];
  threatSignals: { threat: string; timeline: string; severity: string }[];
  growthTimeline: { period: string; growthIndex: number; confidence: number }[];
}

export interface GtmStrategySection {
  messagingFramework: { persona: string; headline: string; proofPoint: string; cta: string }[];
  channelPrioritization: { channel: string; priority: string; budgetShare: number }[];
  budgetAllocation: { channel: string; allocation: number; expectedROI: number }[];
  competitiveTracking: { competitor: string; keywords: string[]; adSpendEstimate: number }[];
  roiSimulation: { path: string; projectedROI: number; paybackMonths: number }[];
}

export interface FinancialBenchmarkSection {
  pricingBenchmarks: { tier: string; averagePrice: number; currency: string }[];
  willingnessToPay: { segment: string; score: number }[];
  valuationModel: { scenario: string; valuation: number }[];
  unitEconomics: {
    cpa: number;
    clv: number;
    clvToCac: number;
  };
  pricePositioning: { company: string; price: number; valueScore: number }[];
  profitMarginTrend: { period: string; margin: number }[];
  clvVsCac: { metric: string; value: number }[];
}

export interface FinancialRunwayScenario {
  scenario: string;
  monthsOfRunway: number;
  cashBalance: number;
  burnRate: number;
}

export interface BudgetPlanningItem {
  category: string;
  planned: number;
  actual: number;
  variance?: number;
}

export interface CashFlowPoint {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
}

export interface FinancialPlanningMapNode {
  region: string;
  budgetWeight: number;
  projectedRevenue: number;
  priority: string;
}

export interface FinancialPlanningSection {
  runwayScenarios: FinancialRunwayScenario[];
  budgetAllocation: BudgetPlanningItem[];
  cashFlowTimeline: CashFlowPoint[];
  financialPlanningMap: FinancialPlanningMapNode[];
  strategicNotes: string[];
}

export interface SentimentVoiceSection {
  newsSentiment: { source: string; sentiment: string; summary: string; link: string }[];
  socialTone: { platform: string; positive: number; neutral: number; negative: number }[];
  reputationIndex: { period: string; score: number }[];
  emergingPhrases: { phrase: string; frequency: number; sentiment: string }[];
  trendingStories: NewsStory[];
  competitorCoverage: CompetitorNewsStory[];
}

export interface RiskComplianceSection {
  policyScores: { region: string; score: number; risk: string }[];
  technologyRisk: { area: string; status: string; notes: string }[];
  ipConflicts: { competitor: string; issue: string; severity: string }[];
  financialGeopolitical: { factor: string; impact: string; probability: number }[];
  riskMatrix: { risk: string; impact: number; probability: number; owner: string }[];
  complianceStatus: { framework: string; status: string; notes: string }[];
}

export interface PredictiveDashboardSection {
  competitorMoves: { competitor: string; predictedMove: string; likelihood: number; timeframe: string }[];
  userAdoption: { period: string; adoptionRate: number; sentimentScore: number }[];
  scenarios: { scenario: string; growthRate: number; revenueProjection: number; confidence: number }[];
}

export interface StrategicRecommendation {
  title: string;
  description: string;
  priority: string;
  owner: string;
  timeline: string;
  roi: number;
  confidence: number;
  category: string;
}

export interface StrategicRecommendationsSection {
  actions: StrategicRecommendation[];
}

export interface SourceRecord {
  name: string;
  type: string;
  url: string;
  retrievedAt: string;
}

export interface SourceAttributionSection {
  sources: SourceRecord[];
}

export interface NewsStory {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  summary: string;
  sentiment: string;
  relevance: string;
}

export interface CompetitorNewsStory extends NewsStory {
  competitor: string;
  impact: string;
}

export interface LegacyAnalysisData {
  competitors: any[];
  buyerPersonas: any[];
  marketTrends: any[];
  swotAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  marketReadinessScore: number;
  readinessAdvice: string;
}

export interface ReportPayload {
  reportVersion: string;
  generatedAt: string;
  executiveSummary: ExecutiveSummarySection;
  marketEnvironment: MarketEnvironmentSection;
  competitiveLandscape: CompetitiveLandscapeSection;
  customerInsights: CustomerInsightsSection;
  productEvaluation: ProductEvaluationSection;
  opportunityForecast: OpportunityForecastSection;
  gtmStrategy: GtmStrategySection;
  financialBenchmark: FinancialBenchmarkSection;
  financialPlanning: FinancialPlanningSection;
  sentimentAnalysis: SentimentVoiceSection;
  riskCompliance: RiskComplianceSection;
  predictiveDashboard: PredictiveDashboardSection;
  strategicRecommendations: StrategicRecommendationsSection;
  sourceAttribution: SourceAttributionSection;
  legacy: LegacyAnalysisData;
}
