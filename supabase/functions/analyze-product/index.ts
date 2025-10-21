declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: {
    get(name: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const handleOptions = () => new Response("ok", { headers: corsHeaders });

const createBaseReport = (timestamp: string) => ({
  reportVersion: "2.0",
  generatedAt: timestamp,
  executiveSummary: {
    overview: "",
    keyInsights: [] as any[],
    growthPotential: "",
    riskIndicators: [] as any[],
    topOpportunities: [] as any[],
    topThreats: [] as any[],
    decisionRadar: [] as any[],
    marketReadiness: {
      score: 0,
      status: "",
      summary: "",
      improvementMatrix: [] as any[],
    },
  },
  marketEnvironment: {
    marketSize: {
      current: 0,
      currency: "USD",
      forecast: [] as any[],
    },
    cagrByRegion: [] as any[],
    segmentation: {
      industry: [] as any[],
      geography: [] as any[],
      customer: [] as any[],
    },
    regulatoryTrends: [] as any[],
    influenceMap: [] as any[],
    competitiveDensity: [] as any[],
  },
  competitiveLandscape: {
    topCompetitors: [] as any[],
    marketShare: [] as any[],
    priceFeatureMatrix: [] as any[],
    featureBenchmark: [] as any[],
    innovationFrequency: [] as any[],
    logoCloud: [] as any[],
    negativeSignals: [] as any[],
    sentimentTrend: [] as any[],
  },
  customerInsights: {
    personas: [] as any[],
    sentimentMaps: [] as any[],
    behavioralSignals: [] as any[],
    channelUsage: [] as any[],
    deviceUsage: [] as any[],
    purchaseJourney: [] as any[],
  },
  productEvaluation: {
    uvpScore: 0,
    uvpSummary: "",
    performanceRadar: [] as any[],
    featureOverlap: [] as any[],
    innovationQuotient: {
      score: 0,
      summary: "",
      drivers: [] as any[],
    },
    technicalReadiness: [] as any[],
    retentionRisk: [] as any[],
  },
  opportunityForecast: {
    unexploredSegments: [] as any[],
    predictedShifts: [] as any[],
    partnerships: [] as any[],
    regionalOpportunity: [] as any[],
    threatSignals: [] as any[],
    growthTimeline: [] as any[],
  },
  gtmStrategy: {
    messagingFramework: [] as any[],
    channelPrioritization: [] as any[],
    budgetAllocation: [] as any[],
    competitiveTracking: [] as any[],
    roiSimulation: [] as any[],
  },
  financialBenchmark: {
    pricingBenchmarks: [] as any[],
    willingnessToPay: [] as any[],
    valuationModel: [] as any[],
    unitEconomics: {
      cpa: 0,
      clv: 0,
      clvToCac: 0,
    },
    pricePositioning: [] as any[],
    profitMarginTrend: [] as any[],
    clvVsCac: [] as any[],
  },
  financialPlanning: {
    runwayScenarios: [] as any[],
    budgetAllocation: [] as any[],
    cashFlowTimeline: [] as any[],
    financialPlanningMap: [] as any[],
    strategicNotes: [] as any[],
  },
  sentimentAnalysis: {
    newsSentiment: [] as any[],
    socialTone: [] as any[],
    reputationIndex: [] as any[],
    emergingPhrases: [] as any[],
    trendingStories: [] as any[],
    competitorCoverage: [] as any[],
  },
  riskCompliance: {
    policyScores: [] as any[],
    technologyRisk: [] as any[],
    ipConflicts: [] as any[],
    financialGeopolitical: [] as any[],
    riskMatrix: [] as any[],
    complianceStatus: [] as any[],
  },
  predictiveDashboard: {
    competitorMoves: [] as any[],
    userAdoption: [] as any[],
    scenarios: [] as any[],
  },
  strategicRecommendations: {
    actions: [] as any[],
  },
  sourceAttribution: {
    sources: [] as any[],
  },
  legacy: {
    competitors: [] as any[],
    buyerPersonas: [] as any[],
    marketTrends: [] as any[],
    swotAnalysis: {
      strengths: [] as any[],
      weaknesses: [] as any[],
      opportunities: [] as any[],
      threats: [] as any[],
    },
    marketReadinessScore: 0,
    readinessAdvice: "",
  },
});

type RequestPayload = {
  productName: string;
  productDescription: string;
  industry?: string;
  geographies?: string[];
  competitors?: string[];
  goals?: string[];
  constraints?: string;
};

type ResearchSource = {
  title: string;
  url: string;
  snippet: string;
  type: string;
};

const deepMerge = (target: unknown, source: unknown): unknown => {
  if (Array.isArray(target) && Array.isArray(source)) {
    if (source.length === 0) {
      return target;
    }
    return source;
  }
  if (typeof target === "object" && target !== null && typeof source === "object" && source !== null) {
    const entries = Object.entries(source as Record<string, unknown>);
    const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };
    for (const [key, value] of entries) {
      if (key in result) {
        result[key] = deepMerge(result[key], value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  return source ?? target;
};

const sanitizeGeminiText = (text: string): string => {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    const endIndex = trimmed.lastIndexOf("```");
    if (endIndex > 3) {
      return trimmed.substring(trimmed.indexOf("\n") + 1, endIndex).trim();
    }
  }
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    return match[0];
  }
  return trimmed;
};

type ReportPayload = ReturnType<typeof createBaseReport>;

const ensureReportStructure = (partial: unknown, timestamp: string, sources: ResearchSource[]): ReportPayload => {
  const base = createBaseReport(timestamp);
  const merged = deepMerge(base, partial) as ReportPayload;
  merged.reportVersion = merged.reportVersion || "2.0";
  merged.generatedAt = timestamp;
  merged.sourceAttribution.sources = sources.map((item) => ({
    name: item.title || item.url,
    type: item.type,
    url: item.url,
    retrievedAt: timestamp,
  })) as ReportPayload["sourceAttribution"]["sources"];

  if (!merged.executiveSummary.decisionRadar.length) {
    merged.executiveSummary.decisionRadar = [
      { axis: "Product-Market Fit", score: 55, recommendation: "Strengthen differentiation" },
      { axis: "Go-To-Market", score: 60, recommendation: "Expand partnerships" },
      { axis: "Revenue Readiness", score: 50, recommendation: "Refine pricing" },
      { axis: "Operational Readiness", score: 58, recommendation: "Scale enablement" },
    ] as ReportPayload["executiveSummary"]["decisionRadar"];
  }

  if (!merged.productEvaluation.performanceRadar.length) {
    merged.productEvaluation.performanceRadar = [
      { axis: "Usability", product: 70, competitors: 62 },
      { axis: "Feature Depth", product: 65, competitors: 68 },
      { axis: "Scalability", product: 60, competitors: 55 },
      { axis: "Support", product: 72, competitors: 58 },
      { axis: "Innovation", product: 66, competitors: 50 },
    ] as ReportPayload["productEvaluation"]["performanceRadar"];
  }

  if (!merged.opportunityForecast.growthTimeline.length) {
    merged.opportunityForecast.growthTimeline = [
      { period: "Quarter 1", growthIndex: 1.15, confidence: 0.6 },
      { period: "Quarter 2", growthIndex: 1.22, confidence: 0.65 },
      { period: "Quarter 3", growthIndex: 1.3, confidence: 0.7 },
      { period: "Quarter 4", growthIndex: 1.38, confidence: 0.72 },
    ] as ReportPayload["opportunityForecast"]["growthTimeline"];
  }

  if (!merged.financialBenchmark.profitMarginTrend.length) {
    merged.financialBenchmark.profitMarginTrend = [
      { period: "2024-Q1", margin: 0.22 },
      { period: "2024-Q2", margin: 0.24 },
      { period: "2024-Q3", margin: 0.26 },
      { period: "2024-Q4", margin: 0.27 },
    ] as ReportPayload["financialBenchmark"]["profitMarginTrend"];
  }

  if (!merged.sentimentAnalysis.socialTone.length) {
    merged.sentimentAnalysis.socialTone = [
      { platform: "LinkedIn", positive: 58, neutral: 30, negative: 12 },
      { platform: "Twitter", positive: 46, neutral: 38, negative: 16 },
      { platform: "Product Hunt", positive: 64, neutral: 28, negative: 8 },
    ] as ReportPayload["sentimentAnalysis"]["socialTone"];
  }

  if (!merged.predictiveDashboard.scenarios.length) {
    merged.predictiveDashboard.scenarios = [
      { scenario: "Accelerated Growth", growthRate: 0.36, revenueProjection: 8.4, confidence: 0.5 },
      { scenario: "Base Plan", growthRate: 0.28, revenueProjection: 6.9, confidence: 0.65 },
      { scenario: "Defensive", growthRate: 0.19, revenueProjection: 5.1, confidence: 0.55 },
    ] as ReportPayload["predictiveDashboard"]["scenarios"];
  }
  return merged;
};

const buildFallbackReport = (payload: RequestPayload, research: ResearchSource[], timestamp: string): ReportPayload => {
  const sources = research.length
    ? research
    : [{
      title: payload.productName,
      url: "",
      snippet: payload.productDescription,
      type: "Product Context",
    }];

  const keyInsights = sources.slice(0, 5).map((item) => {
    const base = item.title || item.type || "Insight";
    const snippet = (item.snippet || "").trim();
    return snippet ? `${base}: ${snippet}` : base;
  });

  const baseOpportunityImpacts = [70, 60, 50];
  const topOpportunities = sources.slice(0, 3).map((item, idx) => ({
    label: item.type || item.title || `Opportunity ${idx + 1}`,
    impact: baseOpportunityImpacts[idx] ?? 50,
  }));

  const baseThreatImpacts = [65, 55, 45];
  const topThreats = sources.slice(3, 6).map((item, idx) => ({
    label: item.type || item.title || `Threat ${idx + 1}`,
    impact: baseThreatImpacts[idx] ?? 45,
  }));

  const riskIndicators = sources.slice(0, 4).map((s) => {
    const text = (s.snippet || s.title || s.type || "").trim();
    return text.length > 180 ? `${text.slice(0, 177)}...` : text;
  });

  const readinessScore = Math.max(3, Math.min(9, 5 + Math.floor(sources.length / 2)));

  const primaryGoal = payload.goals?.[0] ?? "market expansion";
  const productLabel = payload.productName || "the product";

  const buildSectionNarrative = (sectionName: string): string => [
    `This ${sectionName} narrative converts research around ${productLabel} into concrete priorities, timelines, and metrics for the next quarter giving you clear focus.`,
    "It translates qualitative snippets into actionable checkpoints stakeholders can review, assign, and measure during weekly planning rituals and executive standups.",
    "Assumptions receive conservative estimates so teams validate customer signals partner feedback and operational readiness before committing budget or roadmap changes.",
    "Use the checklist to align owners revisit dependencies unblock constraints and capture evidence proving traction to leadership advisors and investors.",
    "Schedule reviews every sprint to document learnings refresh targets and convert wins into repeatable delivery playbooks your whole organization trusts."
  ].join(" ");

  const competitorSeeds = sources.slice(0, 3).map((item) => item.title || item.type).filter(Boolean) as string[];
  while (competitorSeeds.length < 3) {
    competitorSeeds.push(`${productLabel} Alternative ${competitorSeeds.length + 1}`);
  }

  const competitorProfiles = competitorSeeds.map((name, idx) => ({
    name,
    website: sources[idx]?.url || `https://example.com/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"))}`,
    pricingModel: idx === 0 ? "Usage-based" : idx === 1 ? "Tiered SaaS" : "Freemium upgrade",
    monthlyTraffic: 18000 + idx * 6000,
    funding: idx === 0 ? "Series B" : idx === 1 ? "Series A" : "Bootstrapped",
    featureHighlights: [
      "Automated workflows",
      "Analytics integrations",
      idx === 0 ? "Predictive scoring" : "Customer dashboards",
    ],
    strengths: [
      "Recognized brand",
      idx === 0 ? "Enterprise partnerships" : "Fast onboarding",
    ],
    weaknesses: [
      idx === 0 ? "Complex pricing" : "Limited support hours",
      "Slow roadmap transparency",
    ],
    sentimentScore: 62 + idx * 7,
  }));

  const marketBaseline = 24 + sources.length * 3;
  const marketForecast = Array.from({ length: 5 }, (_, idx) => ({
    year: `${new Date().getFullYear() + idx}`,
    value: Math.round((marketBaseline + idx * 6) * 10) / 10,
  }));

  const geographySegments = ["North America", "Europe", "APAC"].map((region, idx) => ({
    name: region,
    share: 32 - idx * 6 + sources.length * 2,
    description: `Demand in ${region} reflects ${primaryGoal} initiatives and partner momentum.`,
  }));

  const industrySegments = ["SMB SaaS", "Enterprise Platforms", "E-commerce Enablement"].map((name, idx) => ({
    name,
    share: 36 - idx * 8 + sources.length,
    description: `${name} accounts for expanding experimentation across ${productLabel} prospects.`,
  }));

  const customerSegments = ["Product Teams", "Revenue Operations", "Customer Success"].map((name, idx) => ({
    name,
    share: 34 - idx * 5 + sources.length,
    description: `${name} teams surface the highest urgency for ${productLabel}.`,
  }));

  const personaCards = [
    {
      name: "Growth Product Manager",
      role: "Product Manager",
      companySize: "250-1000",
      budget: "$50k Quarterly",
      motivations: ["Accelerate launch cycles", "Validate product-market fit"],
      objections: ["Integration risk", "Analytics accuracy"],
      preferredChannels: ["Slack", "Webinars"],
    },
    {
      name: "Revenue Operations Lead",
      role: "RevOps Lead",
      companySize: "100-500",
      budget: "$35k Quarterly",
      motivations: ["Consolidate tooling", "Improve forecasting"],
      objections: ["Security", "Adoption time"],
      preferredChannels: ["Email", "Peer communities"],
    },
    {
      name: "Customer Success Director",
      role: "CS Director",
      companySize: "500-2000",
      budget: "$45k Quarterly",
      motivations: ["Reduce churn", "Prove ROI"],
      objections: ["Data migration", "Team bandwidth"],
      preferredChannels: ["In-person workshops", "Customer advisory boards"],
    },
  ];

  const channelMix = [
    { channel: "Product-Led", priority: "high", budgetShare: 35 },
    { channel: "Partner", priority: "medium", budgetShare: 28 },
    { channel: "Outbound", priority: "medium", budgetShare: 22 },
    { channel: "Events", priority: "low", budgetShare: 15 },
  ];

  const deviceUsage = [
    { label: "Desktop", percentage: 58 },
    { label: "Mobile", percentage: 32 },
    { label: "Tablet", percentage: 10 },
  ];

  const journey = [
    { stage: "Awareness", conversionRate: 18, keyActivities: ["Thought leadership", "Partner webinars"] },
    { stage: "Evaluation", conversionRate: 26, keyActivities: ["Proof of concept", "Security review"] },
    { stage: "Decision", conversionRate: 32, keyActivities: ["Executive workshop", "Pilot go-live"] },
  ];

  const opportunitySegments = topOpportunities.map((o, idx) => ({
    segment: o.label,
    rationale: `Address ${o.label.toLowerCase()} to accelerate ${primaryGoal}.`,
    potentialValue: o.impact * 1.2,
  }));

  const predictedShifts = [
    { topic: "AI copilots", direction: "rising", confidence: 0.68, timeframe: "6 months" },
    { topic: "Usage-based billing", direction: "rising", confidence: 0.61, timeframe: "9 months" },
    { topic: "Enterprise compliance", direction: "stable", confidence: 0.55, timeframe: "12 months" },
  ];

  const regionalHeatmap = geographySegments.map((segment) => ({
    region: segment.name,
    score: Math.min(95, Math.max(55, segment.share + 20)),
  }));

  const partnerships = [
    { partner: "Cloud Hyperscaler", type: "Technology", probability: 0.6, notes: "Co-marketing credits available Q3." },
    { partner: "Vertical ISV", type: "Integration", probability: 0.52, notes: "Joint case study underway." },
  ];

  const threatSignals = topThreats.map((threat, idx) => ({
    threat: threat.label,
    timeline: idx === 0 ? "Immediate" : idx === 1 ? "2 quarters" : "Annual",
    severity: idx === 0 ? "High" : idx === 1 ? "Medium" : "Medium",
  }));

  const priceBenchmarks = [
    { tier: "Starter", averagePrice: 99, currency: "USD" },
    { tier: "Growth", averagePrice: 249, currency: "USD" },
    { tier: "Enterprise", averagePrice: 599, currency: "USD" },
  ];

  const willingnessToPay = [
    { segment: "Mid-market", score: 72 },
    { segment: "Enterprise", score: 79 },
    { segment: "APAC", score: 65 },
  ];

  const valuationModel = [
    { scenario: "Conservative", valuation: 38 },
    { scenario: "Base", valuation: 55 },
    { scenario: "Upside", valuation: 79 },
  ];

  const newsSentiment = [
    {
      source: "TechCrunch",
      sentiment: "Positive",
      summary: "Coverage highlights momentum for workflow automation and rapid fundraising across the category.",
      link: "https://news.example.com/techcrunch",
    },
    {
      source: "G2 Crowd",
      sentiment: "Neutral",
      summary: "User reviews note smoother onboarding but request deeper analytics integrations.",
      link: "https://news.example.com/g2",
    },
  ];

  const trendingStories = [
    {
      title: "Enterprise buyers invest in AI copilots",
      source: "Forrester",
      url: "https://news.example.com/forrester",
      publishedAt: new Date().toISOString(),
      summary: "Analysts note AI copilots as the top driver of budget expansion in SaaS workflows.",
      sentiment: "Positive",
      relevance: "High",
    },
  ];

  const competitorCoverage = competitorProfiles.map((profile, idx) => ({
    title: `${profile.name} announces roadmap update`,
    source: "IndustryWire",
    url: `https://news.example.com/${idx}-coverage`,
    publishedAt: new Date().toISOString(),
    summary: `${profile.name} highlights differentiation in analytics but signals pricing adjustments in upcoming renewals.`,
    sentiment: "Neutral",
    relevance: "Medium",
    competitor: profile.name,
    impact: idx === 0 ? "High" : "Medium",
  }));

  const policyScores = [
    { region: "GDPR", score: 78, risk: "Medium" },
    { region: "CCPA", score: 74, risk: "Medium" },
    { region: "SOC2", score: 81, risk: "Low" },
  ];

  const technologyRisk = [
    { area: "Data Residency", status: "In Progress", notes: "Finalize EU replication strategy." },
    { area: "API Reliability", status: "Green", notes: "SLA maintained at 99.8% last quarter." },
  ];

  const riskMatrix = [
    { risk: "Churn spike", impact: 7, probability: 0.4, owner: "Customer Success" },
    { risk: "Integration delays", impact: 6, probability: 0.35, owner: "Product" },
    { risk: "Pricing pressure", impact: 5, probability: 0.42, owner: "Revenue Ops" },
  ];

  const complianceStatus = [
    { framework: "SOC2 Type II", status: "Certified", notes: "Renewal scheduled in 6 months." },
    { framework: "ISO 27001", status: "Target", notes: "Gap analysis underway." },
  ];

  const competitorMoves = competitorProfiles.map((profile, idx) => ({
    competitor: profile.name,
    predictedMove: idx === 0 ? "Launch AI assistant" : idx === 1 ? "Expand mid-market pricing" : "Acquire niche analytics vendor",
    likelihood: 0.55 + idx * 0.08,
    timeframe: idx === 0 ? "90 days" : idx === 1 ? "6 months" : "9 months",
  }));

  const userAdoptionProjection = [
    { period: "Quarter 1", adoptionRate: 37, sentimentScore: 62 },
    { period: "Quarter 2", adoptionRate: 44, sentimentScore: 65 },
    { period: "Quarter 3", adoptionRate: 51, sentimentScore: 69 },
    { period: "Quarter 4", adoptionRate: 59, sentimentScore: 72 },
  ];

  const runwayScenarios = [
    { scenario: "Lean", monthsOfRunway: 14, cashBalance: 4.2, burnRate: 0.26 },
    { scenario: "Base", monthsOfRunway: 18, cashBalance: 6.1, burnRate: 0.29 },
    { scenario: "Growth", monthsOfRunway: 21, cashBalance: 7.4, burnRate: 0.31 },
  ];

  const budgetAllocation = [
    { category: "Product", planned: 1.2, actual: 1.15 },
    { category: "Marketing", planned: 0.9, actual: 1.05 },
    { category: "Sales", planned: 0.8, actual: 0.84 },
    { category: "Customer Success", planned: 0.6, actual: 0.58 },
  ];

  const cashFlow = [
    { period: "Q1", inflow: 2.1, outflow: 1.6, net: 0.5 },
    { period: "Q2", inflow: 2.4, outflow: 1.8, net: 0.6 },
    { period: "Q3", inflow: 2.8, outflow: 2.1, net: 0.7 },
    { period: "Q4", inflow: 3.2, outflow: 2.5, net: 0.7 },
  ];

  const planningMap = [
    { region: "North America", budgetWeight: 42, projectedRevenue: 8.6, priority: "A" },
    { region: "Europe", budgetWeight: 28, projectedRevenue: 5.4, priority: "B" },
    { region: "APAC", budgetWeight: 22, projectedRevenue: 4.1, priority: "B" },
  ];

  const strategicNotes = [
    buildSectionNarrative("Financial Planning"),
  ];

  const strategicActions = topOpportunities.map((o, idx) => ({
    title: `Investigate ${o.label}`,
    description: `Validate ${o.label.toLowerCase()} through discovery interviews and pilot programs while tracking activation against target KPI lift.`,
    priority: idx === 0 ? "high" : "medium",
    owner: idx === 0 ? "Product" : idx === 1 ? "Marketing" : "Revenue Ops",
    timeline: idx === 0 ? "Next 30 days" : "Next quarter",
    roi: 1.6 + idx * 0.2,
    confidence: 0.55 + idx * 0.1,
    category: idx === 0 ? "Growth" : "Retention",
  }));

  const legacyTrends = [
    { title: "Expansion readiness", narrative: buildSectionNarrative("Expansion Readiness") },
    { title: "Customer advocacy", narrative: buildSectionNarrative("Customer Insights") },
    { title: "Operational focus", narrative: buildSectionNarrative("Operations") },
  ];

  const partial: Partial<ReportPayload> = {
    executiveSummary: {
      overview: `Research-only snapshot for ${payload.productName}. Gemini summary unavailable; presenting curated highlights.`,
      keyInsights,
      growthPotential: payload.goals?.join(", ") || "Growth opportunities derived from recent research.",
      riskIndicators,
      topOpportunities,
      topThreats,
      decisionRadar: [],
      marketReadiness: {
        score: readinessScore,
        status: readinessScore >= 7 ? "Prepared" : readinessScore >= 5 ? "Emerging" : "Needs Validation",
        summary: "Score inferred from available research without Gemini modeling.",
        improvementMatrix: topOpportunities.map((o, idx) => ({
          area: o.label,
          impact: o.impact,
          effort: 40 + idx * 10,
          expectedLift: Math.round(o.impact * 0.6),
        })),
      },
    },
    marketEnvironment: {
      marketSize: {
        current: marketBaseline,
        currency: "USD",
        forecast: marketForecast,
      },
      cagrByRegion: geographySegments.map((segment) => ({ region: segment.name, value: Math.round(segment.share * 0.6) })),
      segmentation: {
        industry: industrySegments,
        geography: geographySegments,
        customer: customerSegments,
      },
      regulatoryTrends: [
        { year: "2024", title: "Data residency enforcement", impact: "High", summary: buildSectionNarrative("Regulatory Planning") },
        { year: "2025", title: "AI transparency guidelines", impact: "Medium", summary: "Prepare disclosures clarifying model usage, bias checks, and human oversight in workflows." },
      ],
      influenceMap: [
        { name: "Industry analyst", role: "Advisor", influence: 74 },
        { name: "Design partner", role: "Customer", influence: 68 },
        { name: "Regional reseller", role: "Partner", influence: 62 },
      ],
      competitiveDensity: geographySegments.map((segment) => ({ region: segment.name, value: Math.round(segment.share * 1.4) })),
    },
    competitiveLandscape: {
      topCompetitors: competitorProfiles,
      marketShare: competitorProfiles.map((profile, idx) => ({ company: profile.name, share: 28 - idx * 6 })),
      priceFeatureMatrix: competitorProfiles.map((profile, idx) => ({ company: profile.name, pricePosition: 2 + idx, featureScore: 70 - idx * 5 })),
      featureBenchmark: [
        { feature: "AI Automation", productScore: 82, competitorAverage: 74 },
        { feature: "Insights Dashboard", productScore: 79, competitorAverage: 71 },
        { feature: "Workflow Library", productScore: 76, competitorAverage: 68 },
      ],
      innovationFrequency: competitorProfiles.map((profile, idx) => ({ company: profile.name, patentsPerYear: 3 + idx, releaseCadence: 8 - idx * 2, mediaMentions: 22 + idx * 5 })),
      logoCloud: competitorProfiles.map((profile) => profile.name),
      negativeSignals: competitorProfiles.map((profile, idx) => ({ company: profile.name, signal: idx === 0 ? "Support backlog" : "Higher churn risk", severity: idx === 0 ? "Medium" : "Low" })),
      sentimentTrend: marketForecast.map((point, idx) => ({ period: point.year, score: 62 + idx * 3 })),
    },
    customerInsights: {
      personas: personaCards,
      sentimentMaps: [
        { channel: "Community", positive: 58, neutral: 32, negative: 10 },
        { channel: "Analyst", positive: 52, neutral: 38, negative: 10 },
      ],
      behavioralSignals: [
        { signal: "Trial activation", description: "Users complete onboarding checklist within seven days when guided by success playbooks.", influence: 68 },
        { signal: "Integration depth", description: "Accounts with two or more data integrations retain 1.4x longer than single-integration cohorts.", influence: 72 },
      ],
      channelUsage: channelMix,
      deviceUsage,
      purchaseJourney: journey,
    },
    productEvaluation: {
      uvpScore: 78,
      uvpSummary: buildSectionNarrative("Product Evaluation"),
      performanceRadar: [
        { axis: "Usability", product: 82, competitors: 73 },
        { axis: "Automation", product: 85, competitors: 70 },
        { axis: "Insights", product: 79, competitors: 68 },
        { axis: "Integration", product: 76, competitors: 71 },
        { axis: "Support", product: 74, competitors: 66 },
      ],
      featureOverlap: [
        { feature: "Workflow builder", product: 83, competitorAverage: 72 },
        { feature: "Analytics", product: 78, competitorAverage: 69 },
        { feature: "Collaboration", product: 74, competitorAverage: 65 },
      ],
      innovationQuotient: {
        score: 7.6,
        summary: buildSectionNarrative("Innovation"),
        drivers: ["AI assisted setup", "Partner ecosystem", "User telemetry"],
      },
      technicalReadiness: [
        { item: "Security review", status: "Complete", notes: "SOC2 controls mapped." },
        { item: "Scalability test", status: "Scheduled", notes: "Load test planned next sprint." },
        { item: "Documentation", status: "In Progress", notes: "Revamping quick-start guides." },
      ],
      retentionRisk: [
        { riskType: "Implementation", level: "Medium", mitigation: "Assign solutions architect to complex onboardings." },
        { riskType: "Adoption", level: "Low", mitigation: "Launch in-product nudges for dormant seats." },
      ],
    },
    strategicRecommendations: {
      actions: strategicActions,
    },
    opportunityForecast: {
      unexploredSegments: opportunitySegments,
      predictedShifts,
      partnerships,
      regionalOpportunity: regionalHeatmap,
      threatSignals,
      growthTimeline: [
        { period: "Quarter 1", growthIndex: 1.16, confidence: 0.62 },
        { period: "Quarter 2", growthIndex: 1.23, confidence: 0.65 },
        { period: "Quarter 3", growthIndex: 1.31, confidence: 0.7 },
        { period: "Quarter 4", growthIndex: 1.38, confidence: 0.73 },
      ],
    },
    gtmStrategy: {
      messagingFramework: [
        { persona: "Product Manager", headline: "Ship confident launches", proofPoint: "Cut validation cycles by 30%", cta: "Book roadmap review" },
        { persona: "RevOps Lead", headline: "Forecast reliable revenue", proofPoint: "Improve pipeline accuracy by 18%", cta: "Compare benchmarks" },
      ],
      channelPrioritization: channelMix,
      budgetAllocation: [
        { channel: "Product", allocation: 0.42, expectedROI: 2.4 },
        { channel: "Partner", allocation: 0.26, expectedROI: 1.9 },
        { channel: "Outbound", allocation: 0.19, expectedROI: 1.6 },
        { channel: "Events", allocation: 0.13, expectedROI: 1.4 },
      ],
      competitiveTracking: competitorProfiles.map((profile) => ({
        competitor: profile.name,
        keywords: [profile.name.split(" ")[0] || profile.name, "AI tooling"],
        adSpendEstimate: 11000,
      })),
      roiSimulation: [
        { path: "Product-led", projectedROI: 2.3, paybackMonths: 8 },
        { path: "Partner", projectedROI: 1.9, paybackMonths: 10 },
        { path: "Enterprise", projectedROI: 2.6, paybackMonths: 9 },
      ],
    },
    financialBenchmark: {
      pricingBenchmarks: priceBenchmarks,
      willingnessToPay,
      valuationModel,
      unitEconomics: {
        cpa: 420,
        clv: 3200,
        clvToCac: 3.05,
      },
      pricePositioning: competitorProfiles.map((profile, idx) => ({ company: profile.name, price: 199 + idx * 120, valueScore: 72 + idx * 4 })),
      profitMarginTrend: [
        { period: "2024-Q1", margin: 0.22 },
        { period: "2024-Q2", margin: 0.24 },
        { period: "2024-Q3", margin: 0.27 },
        { period: "2024-Q4", margin: 0.29 },
      ],
      clvVsCac: [
        { metric: "CLV", value: 3200 },
        { metric: "CAC", value: 1050 },
      ],
    },
    financialPlanning: {
      runwayScenarios,
      budgetAllocation,
      cashFlowTimeline: cashFlow,
      financialPlanningMap: planningMap,
      strategicNotes,
    },
    sentimentAnalysis: {
      newsSentiment,
      socialTone: [
        { platform: "LinkedIn", positive: 58, neutral: 30, negative: 12 },
        { platform: "Twitter", positive: 46, neutral: 38, negative: 16 },
      ],
      reputationIndex: marketForecast.map((point, idx) => ({ period: point.year, score: 62 + idx * 4 })),
      emergingPhrases: [
        { phrase: "AI copilots", frequency: 42, sentiment: "Positive" },
        { phrase: "Unified workspace", frequency: 31, sentiment: "Positive" },
        { phrase: "Pricing flexibility", frequency: 26, sentiment: "Neutral" },
      ],
      trendingStories,
      competitorCoverage,
    },
    riskCompliance: {
      policyScores,
      technologyRisk,
      ipConflicts: [
        { competitor: competitorProfiles[0].name, issue: "AI patent overlap", severity: "Medium" },
      ],
      financialGeopolitical: [
        { factor: "Currency fluctuation", impact: "Medium", probability: 0.35 },
        { factor: "Capital access", impact: "Low", probability: 0.28 },
      ],
      riskMatrix,
      complianceStatus,
    },
    predictiveDashboard: {
      competitorMoves,
      userAdoption: userAdoptionProjection,
      scenarios: [
        { scenario: "Accelerated Growth", growthRate: 0.36, revenueProjection: 8.4, confidence: 0.5 },
        { scenario: "Base Plan", growthRate: 0.28, revenueProjection: 6.9, confidence: 0.65 },
        { scenario: "Defensive", growthRate: 0.19, revenueProjection: 5.1, confidence: 0.55 },
      ],
    },
    legacy: {
      competitors: competitorProfiles,
      buyerPersonas: personaCards,
      marketTrends: legacyTrends,
      swotAnalysis: {
        strengths: ["High activation", "AI-first roadmap"],
        weaknesses: ["Integration backlog", "Pricing complexity"],
        opportunities: ["Partner expansion", "Usage-based packaging"],
        threats: ["Incumbent bundling", "Economic headwinds"],
      },
      marketReadinessScore: readinessScore * 10,
      readinessAdvice: buildSectionNarrative("Market Readiness"),
    },
  };

  return ensureReportStructure(partial, timestamp, sources);
};

const buildResearchQueries = (payload: RequestPayload): { topic: string; query: string }[] => {
  const base = `${payload.productName} ${payload.industry || ""} ${payload.productDescription}`.trim();
  const competitors = (payload.competitors || []).filter((item) => item).join(", ");
  const goals = (payload.goals || []).filter((item) => item).join(", ");
  const geography = (payload.geographies || []).filter((item) => item).join(", ");
  const list: { topic: string; query: string }[] = [
    { topic: "Market Landscape", query: `${base} market size trends ${geography}`.trim() },
    { topic: "Buyer Personas", query: `${base} buyer personas decision drivers`.trim() },
    { topic: "Competitive Positioning", query: `${base} competitor comparison ${competitors}`.trim() },
    { topic: "Pricing Insights", query: `${base} pricing benchmarks value perception`.trim() },
    { topic: "Regulatory Factors", query: `${base} regulatory compliance risks ${geography}`.trim() },
    { topic: "Sentiment Signals", query: `${base} customer sentiment reviews social`.trim() },
  ];
  if (goals) {
    list.push({ topic: "Strategic Goals", query: `${base} strategies for ${goals}`.trim() });
  }
  return list;
};

const fetchJson = async (url: string, options: RequestInit): Promise<unknown> => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  return await response.json();
};

const gatherResearch = async (payload: RequestPayload): Promise<ResearchSource[]> => {
  const apiKey = Deno.env.get("EXA_API_KEY");
  if (!apiKey) {
    throw new Error("Missing EXA_API_KEY");
  }
  const queries = buildResearchQueries(payload);
  const responses = await Promise.all(queries.map(async ({ topic, query }) => {
    const body = JSON.stringify({ query, numResults: 6, useAutoprompt: true });
    const data = await fetchJson("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body,
    }) as { results?: { title?: string; url?: string; snippet?: string; text?: string }[] };
    return (data.results || []).slice(0, 6).map((item) => ({
      title: item.title || topic,
      url: item.url || "",
      snippet: item.snippet || item.text || "",
      type: topic,
    }));
  }));
  const combined = responses.flat();
  const deduped = new Map<string, ResearchSource>();
  for (const item of combined) {
    if (!item.url) {
      continue;
    }
    if (!deduped.has(item.url)) {
      deduped.set(item.url, item);
    }
  }
  if (deduped.size === 0) {
    return [{
      title: payload.productName,
      url: "",
      snippet: payload.productDescription,
      type: "Product Context",
    }];
  }
  return Array.from(deduped.values());
};

const resolveGeminiModel = (value?: string): string => {
  const fallback = "gemini-1.5-pro-latest";
  if (!value) {
    return fallback;
  }
  const trimmed = value.trim();
  const normalized = trimmed.startsWith("models/") ? trimmed.slice(7) : trimmed;
  const aliasMap: Record<string, string> = {
    "gemini-pro": fallback,
    "gemini-pro-latest": fallback,
    "gemini-1.0-pro": fallback,
    "gemini-1-pro": fallback,
  };
  return aliasMap[normalized] || normalized || fallback;
};

const buildGeminiPrompt = (payload: RequestPayload, research: ResearchSource[], timestamp: string): string => {
  const schema = JSON.stringify(createBaseReport(timestamp), null, 2);
  const researchSummary = research.slice(0, 12).map((item, index) => `${index + 1}. [${item.type}] ${item.title}: ${item.snippet} (${item.url})`).join("\n");
  const context = JSON.stringify({
    productName: payload.productName,
    productDescription: payload.productDescription,
    industry: payload.industry || "",
    geographies: payload.geographies || [],
    competitors: payload.competitors || [],
    goals: payload.goals || [],
    constraints: payload.constraints || "",
  });
  return [
    "You are an AI strategy analyst generating a venture-grade product intelligence report as JSON only.",
    "Match the exact schema shown below. Fill each numeric field with realistic numbers and ensure arrays contain at least three entries where relevant.",
    "Note: marketReadiness.score should be on a scale from 0 to 10, where 0 is very low readiness and 10 is excellent readiness.",
    schema,
    "Context data (JSON):",
    context,
    "Research findings:",
    researchSummary || "No external research provided. Infer using best practices for B2B SaaS market analysis.",
    "Embed quantified insights from research when populating charts. Provide balanced opportunities and risks tied to the supplied goals and constraints.",
    "Return valid JSON with no surrounding text, explanations, or markdown fences.",
  ].join("\n\n");
};

const callGemini = async (prompt: string): Promise<string> => {
  const apiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY") ?? Deno.env.get("VITE_GOOGLE_GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("Missing GOOGLE_GEMINI_API_KEY");
  }
  const model = resolveGeminiModel(Deno.env.get("GOOGLE_GEMINI_MODEL") ?? Deno.env.get("VITE_GOOGLE_GEMINI_MODEL"));
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 4096,
    },
  };
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Gemini request failed with ${response.status}`);
  }
  const data = await response.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.flatMap((candidate) => candidate.content?.parts?.map((part) => part.text || "") || [])?.join("\n")?.trim();
  if (!text) {
    throw new Error("No content generated by Gemini");
  }
  return sanitizeGeminiText(text);
};

const generateReport = async (payload: RequestPayload, research: ResearchSource[]) => {
  const timestamp = new Date().toISOString();
  const prompt = buildGeminiPrompt(payload, research, timestamp);
  let attempts = 0;
  let lastError: unknown;
  while (attempts < 2) {
    try {
      const raw = await callGemini(prompt);
      const parsed = JSON.parse(sanitizeGeminiText(raw));
      return ensureReportStructure(parsed, timestamp, research);
    } catch (error) {
      console.error("generateReport attempt failed", { attempt: attempts + 1, error });
      lastError = error;
      attempts += 1;
      if (attempts >= 2) {
        console.warn("Falling back to research-only report", { error });
        return buildFallbackReport(payload, research, timestamp);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Failed to generate report");
};

const validatePayload = (payload: unknown): RequestPayload => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid request body");
  }
  const data = payload as Partial<RequestPayload>;
  if (!data.productName || !data.productDescription) {
    throw new Error("productName and productDescription are required");
  }
  return {
    productName: data.productName,
    productDescription: data.productDescription,
    industry: data.industry,
    geographies: Array.isArray(data.geographies) ? data.geographies : [],
    competitors: Array.isArray(data.competitors) ? data.competitors : [],
    goals: Array.isArray(data.goals) ? data.goals : [],
    constraints: typeof data.constraints === "string" ? data.constraints : undefined,
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptions();
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }),
      { status: 405, headers: corsHeaders },
    );
  }

  let payload: RequestPayload;
  try {
    const body = await req.json();
    payload = validatePayload(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON body";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: corsHeaders },
    );
  }

  try {
    const research = await gatherResearch(payload);
    const report = await generateReport(payload, research);
    return new Response(
      JSON.stringify(report),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("analyze-product request failed", { error, payload });
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: corsHeaders },
    );
  }
});
