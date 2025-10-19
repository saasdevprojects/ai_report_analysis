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
  const model = Deno.env.get("GOOGLE_GEMINI_MODEL") ?? Deno.env.get("VITE_GOOGLE_GEMINI_MODEL") ?? "gemini-1.5-pro-latest";
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
  while (attempts < 2) {
    try {
      const raw = await callGemini(prompt);
      const parsed = JSON.parse(sanitizeGeminiText(raw));
      return ensureReportStructure(parsed, timestamp, research);
    } catch (error) {
      console.error("generateReport attempt failed", { attempt: attempts + 1, error });
      attempts += 1;
      if (attempts >= 2) {
        throw error instanceof Error ? error : new Error("Failed to generate report");
      }
    }
  }
  throw new Error("Failed to generate report");
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
