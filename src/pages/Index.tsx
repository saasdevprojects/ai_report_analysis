import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";
import {
  FileText,
  BarChart3,
  LayoutDashboard,
  Plus,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Minus,
  Check,
} from "lucide-react";


const valuePillars = [
  {
    title: "Live intelligence",
    description: "Pulse surfaces market moves, regulatory shifts, and fresh sentiment the moment they change.",
  },
  {
    title: "Strategic reasoning",
    description: "Orion turns raw signals into story-driven guidance your leadership and clients can act on.",
  },
  {
    title: "Enterprise delivery",
    description: "Secure workspaces, CRM and BI integrations, and exports tailored for agency and product teams.",
  },
];

const workflowSteps = [
  {
    label: "Step I",
    title: "Capture your vision",
    description: "Drop in the product idea, target accounts, and goals. Upload briefs or type a quick prompt—either works.",
    icon: FileText,
  },
  {
    label: "Step II",
    title: "Activate dual AI research",
    description: "Orion frames the narrative while Pulse pulls live data, competitor moves, and regulatory signals.",
    icon: Sparkles,
  },
  {
    label: "Step III",
    title: "Deliver ready-made intelligence",
    description: "Review dashboards, market readiness scores, and recommendations. Export or sync to teams instantly.",
    icon: LayoutDashboard,
  },
];

const uniquePoints = [
  "Learns from every report to sharpen future benchmarks and recommendations.",
  "Combines BI-style visualization with narrative guidance for executive-ready delivery.",
  "Eliminates analyst bottlenecks with pricing designed for fast-moving B2B teams.",
  "Secures client workspaces with role-based access and audit-ready sourcing.",
];

const deliverables = [
  "AI report PDF featuring charts, insights, and verified sources.",
  "Live dashboard with KPI graphs, competitor mapping, and sentiment layers.",
  "Weekly trend digest highlighting fresh opportunities and threats.",
];

const pricingFaqs = [
  [
    {
      question: "Which payment methods do you support?",
      answer: "Subscriptions can be processed via credit card, Stripe, or corporate invoicing upon request.",
    },
    {
      question: "Is there a trial period?",
      answer: "Yes. Activate a 14-day sandbox with full Infinity features—no credit card required to start.",
    },
  ],
  [
    {
      question: "How do your plans scale?",
      answer: "Starter is perfect for early validation. Infinity unlocks automation, reporting depth, and advanced collaboration.",
    },
    {
      question: "Can I switch or cancel anytime?",
      answer: "You can upgrade, downgrade, or cancel monthly. Annual plans prorate remaining time if you adjust mid-cycle.",
    },
  ],
];

const generalFaqs = [
  {
    question: "Who is ReactArch designed for?",
    answer:
      "ReactArch is built for B2B product, marketing, and strategy teams that need fast market intelligence without hiring analysts.",
  },
  {
    question: "How quickly can I produce my first report?",
    answer:
      "Most teams launch their first AI-generated report in under ten minutes—just add your idea, target audience, and goals to begin.",
  },
  {
    question: "Does ReactArch track competitors and market shifts automatically?",
    answer:
      "Yes. ReactArch continuously monitors competitor positioning, sentiment signals, and regulatory changes so your dashboard stays current.",
  },
  {
    question: "What integrations are available out of the box?",
    answer:
      "Connect to Salesforce, HubSpot, Slack, and your preferred BI tools to sync insights and automate stakeholder updates.",
  },
  {
    question: "Can my clients or stakeholders access shared dashboards?",
    answer:
      "Invite clients or executives as viewers with granular permissions so they can explore live dashboards and sourced narratives securely.",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const infinityMonthlyPrice = 30;
  const infinityAnnualPrice = Math.round(infinityMonthlyPrice * 12 * 0.85);
  const infinityPrice = billingCycle === "monthly" ? `$${infinityMonthlyPrice}` : `$${infinityAnnualPrice}`;
  const infinitySuffix = billingCycle === "monthly" ? "/month" : "/year";
  const starterSuffix = billingCycle === "monthly" ? "/month" : "/year";

  return (
    <PublicLayout>
      <div className="relative min-h-screen overflow-hidden bg-white">
        <div className="relative z-10">
          <section className="container mx-auto px-4 py-24 sm:py-32">
            <div className="mx-auto max-w-4xl text-center space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fd8628]/20 px-4 py-2 text-sm font-semibold text-black">
                <span className="inline-flex h-2 w-2 rounded-full bg-[#fd8628]"></span>
                Built for B2B innovators
              </div>
              <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl">
                Instant AI-Powered Product & Market Analysis for B2B Innovators
              </h1>
              <p className="text-lg text-muted-foreground sm:text-xl">
                Transform any product idea into a board-ready intelligence report within minutes. Orion and Pulse blend live market signals with strategic reasoning so your team moves first.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => navigate("/sign-up")}
                  className="w-full bg-[#fd8628] text-black shadow-xl transition hover:bg-[#fd8628]/90 sm:w-auto"
                >
                  Start analyzing now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/contact")}
                  className="w-full border border-[#fd8628] bg-white text-black hover:border-[#431139] hover:bg-[#431139] hover:text-white sm:w-auto"
                >
                  View sample report
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                <span className="rounded-full border border-[#fd8628] px-4 py-1 text-black">Market trends in minutes</span>
                <span className="rounded-full border border-[#fd8628] px-4 py-1 text-black">Buyer personas ready to present</span>
                <span className="rounded-full border border-[#fd8628] px-4 py-1 text-black">GTM guidance backed by data</span>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 pb-24">
            <div className="mx-auto max-w-3xl text-center space-y-4">
              <span className="text-sm font-semibold uppercase tracking-wide text-primary">About the product</span>
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Intelligence made for agencies, consultancies, and enterprise product teams</h2>
              <p className="text-base text-muted-foreground">
                Orion handles context. Pulse captures live momentum. Together they convert simple briefs into 360° analysis that is ready for boardrooms and client pitches.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {valuePillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-3xl border border-border bg-white p-6 text-left shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-foreground">{pillar.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{pillar.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="container mx-auto px-4 pb-24">
            <div className="mx-auto max-w-3xl text-center space-y-4">
              <span className="text-sm font-semibold uppercase tracking-wide text-primary">How it works</span>
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">From concept intake to board-ready brief in minutes</h2>
              <p className="text-base text-muted-foreground">
                Follow three focused moves to turn raw ideas into revenue-ready intelligence.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {workflowSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.label}
                    className="relative flex h-full flex-col overflow-hidden rounded-[32px] border border-[#fd8628] bg-white p-8 shadow-sm"
                  >
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute -bottom-12 right-6 h-32 w-32 rounded-3xl bg-[#fd8628]/15"></div>
                      <div className="absolute -top-10 left-6 h-24 w-24 rounded-3xl border border-[#fd8628]/40"></div>
                    </div>
                    <span className="relative inline-flex items-center gap-2 self-start rounded-full bg-[#1f1f1f] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      <Icon className="h-3.5 w-3.5" />
                      {step.label}
                    </span>
                    <h3 className="relative mt-8 text-xl font-semibold text-foreground">{step.title}</h3>
                    <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="container mx-auto px-4 pb-24">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <div className="space-y-5">
                <span className="text-sm font-semibold uppercase tracking-wide text-primary">Why it’s unique</span>
                <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Analyst-grade intelligence that keeps learning from your data</h2>
                <p className="text-base text-muted-foreground">
                  Every insight, benchmark, and recommendation improves with each run, giving your team a proprietary edge that generic AI tools can’t match.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {uniquePoints.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#f97315]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative overflow-hidden rounded-[36px] border border-border bg-white p-8 shadow-sm">
                <div className="pointer-events-none absolute -top-10 right-0 h-32 w-32 rounded-full bg-[#fd8628]/15"></div>
                <div className="pointer-events-none absolute -bottom-12 left-4 h-28 w-28 rounded-[28px] border border-[#fd8628]/40"></div>
                <div className="relative flex flex-col gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Performance console</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Monitor market readiness, buyer momentum, and priority actions inside a single, executive-friendly view.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-dashed border-[#fd8628]/40 bg-[#fff1e3] p-6">
                    <div className="text-sm font-semibold text-black">Signal quality index</div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      A live scorecard shows which channels fuel momentum, where sentiment dips, and what move to make next.
                    </p>
                    <div className="mt-4 rounded-full border border-[#fd8628]/60 bg-white px-5 py-2 text-center text-xs font-semibold uppercase tracking-wide text-black">
                      Updated hourly · Export as PDF
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 pb-24">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
              <div className="space-y-4">
                <span className="text-sm font-semibold uppercase tracking-wide text-primary">Deliverables</span>
                <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">What your team receives every cycle</h2>
                <p className="text-base text-muted-foreground">
                  Reports are designed for executive reviews, investor updates, and client presentations.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {deliverables.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#f97315]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative overflow-hidden rounded-[36px] border border-border bg-white p-8 shadow-sm">
                <div className="pointer-events-none absolute -right-10 top-8 h-28 w-28 rounded-full bg-[#fd8628]/15"></div>
                <div className="pointer-events-none absolute -left-10 bottom-6 h-24 w-24 rounded-[28px] border border-[#fd8628]/40"></div>
                <div className="relative space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Built for operations at scale</h3>
                  <p className="text-sm text-muted-foreground">
                    Share dashboards with stakeholders, keep institutional knowledge organized, and hand off execution without slowing momentum.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-dashed border-[#fd8628]/40 bg-[#fff1e3] p-4">
                      <h4 className="text-sm font-semibold text-foreground">Insight library</h4>
                      <p className="mt-2 text-xs text-muted-foreground">Bookmark reports, tag opportunities, and keep every presentation-ready deliverable in one place.</p>
                    </div>
                    <div className="rounded-2xl border border-dashed border-[#fd8628]/40 bg-[#fff1e3] p-4">
                      <h4 className="text-sm font-semibold text-foreground">Execution handoff</h4>
                      <p className="mt-2 text-xs text-muted-foreground">Turn recommendations into task lists for sales, product, and success teams with a single export.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 pb-24">
            <div className="relative overflow-hidden rounded-[48px] border border-border bg-white px-6 py-16 sm:px-10 sm:py-20">
              <div className="pointer-events-none absolute -left-24 top-1/2 h-56 w-56 -translate-y-1/2 rounded-[120px] bg-muted/40"></div>
              <div className="pointer-events-none absolute -right-24 top-1/2 h-56 w-56 -translate-y-1/2 rounded-[120px] bg-muted/40"></div>
              <div className="relative z-10 mx-auto max-w-3xl text-center space-y-6">
                <h2 className="text-4xl font-semibold text-foreground sm:text-5xl">
                  Turn ideas into intelligence.
                </h2>
                <p className="text-base text-muted-foreground sm:text-lg">
                  Launch your first AI-powered analysis today and capture the competitive edge without building a research team.
                </p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Button className="w-full sm:w-auto rounded-full bg-[#fd8628] px-8 py-3 text-black shadow-md hover:bg-[#fd8628]/85">
                    Start free trial
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto rounded-full border border-[#fd8628] px-8 py-3 text-black hover:border-[#431139] hover:bg-[#431139] hover:text-white">
                    Talk to sales
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 pb-24">
            <div className="mx-auto max-w-5xl">
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-semibold text-foreground">Pricing</h2>
                <p className="text-base text-muted-foreground">
                  Choose the plan that matches your launch velocity. Start with a free sandbox, upgrade when you’re ready to scale.
                </p>
              </div>

              <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-start">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-sm font-semibold text-foreground">
                    <span className={billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}>Monthly</span>
                    <button
                      type="button"
                      aria-pressed={billingCycle === "annually"}
                      onClick={() =>
                        setBillingCycle((prev) => (prev === "monthly" ? "annually" : "monthly"))
                      }
                      className={`relative inline-flex h-8 w-16 items-center rounded-full px-1 transition ${
                        billingCycle === "annually" ? "bg-[#fd8628]" : "bg-[#fd8628]/30"
                      }`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-bold text-black shadow-sm transition-transform ${
                          billingCycle === "annually" ? "translate-x-8" : "translate-x-0"
                        }`}
                      >
                        ∞
                      </span>
                    </button>
                    <span className={billingCycle === "annually" ? "text-foreground" : "text-muted-foreground"}>Annually</span>
                  </div>
                  {billingCycle === "annually" && (
                    <span className="inline-flex w-max items-center gap-2 rounded-full bg-[#ffe1c4] px-4 py-1.5 text-xs font-semibold text-black">
                      Annual plan unlocks $306/year (15% off)
                    </span>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">What you'll get</h3>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <li>Product Analyzer: AI reports in minutes.</li>
                      <li>Market Intel: Live competitor snapshots.</li>
                      <li>ICP Personas: Buyer journeys mapped.</li>
                      <li>Trend & Compliance Alerts: Stay ahead.</li>
                      <li>Readiness Score: Launch with confidence.</li>
                    </ul>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="flex flex-col rounded-[32px] border border-[#fd8628] bg-white p-10 shadow-sm">
                    <div className="text-sm font-semibold text-muted-foreground">Starter</div>
                    <div className="mt-6 text-4xl font-semibold text-foreground">
                      $0
                      <span className="ml-2 text-base font-normal text-muted-foreground">{starterSuffix}</span>
                    </div>
                    <Button
                      variant="outline"
                      className="mt-6 w-full rounded-full border border-[#fd8628] bg-white text-black hover:border-[#431139] hover:bg-[#431139] hover:text-white"
                    >
                      Start 14-day free trial
                    </Button>
                    <div className="mt-10 flex-1 rounded-3xl bg-[#ffe4cc] p-6">
                      <div className="space-y-4 text-sm text-foreground">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#431139]">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          Product Analyzer AI reports in minutes.
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#431139]">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          Live competitor snapshots.
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#431139]">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          Buyer journeys mapped.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col rounded-[32px] bg-gradient-to-b from-[#fd8628] to-[#431139] p-[1px] shadow-lg">
                    <div className="flex h-full flex-col rounded-[32px] bg-gradient-to-b from-[#fd9b4d] via-[#fd8628] to-[#431139]">
                      <div className="p-8 text-white">
                        <div className="text-sm font-semibold uppercase tracking-wide">Infinity</div>
                        <div className="mt-4 text-4xl font-semibold">
                          {infinityPrice}
                          <span className="ml-2 text-base font-normal opacity-80">{infinitySuffix}</span>
                        </div>
                        <Button className="mt-6 w-full rounded-full bg-white text-black hover:bg-white/90">
                          Sign up today
                        </Button>
                      </div>
                      <div className="flex-1 rounded-[28px] bg-[#431139] p-6">
                        <div className="space-y-4 text-sm text-white">
                          {
                            [
                              "Product Analyzer AI reports in minutes.",
                              "Market Intel Live competitor snapshots.",
                              "ICP Personas Buyer journeys mapped.",
                              "Trend & Compliance Alerts Stay ahead.",
                              "Readiness Score Launch with confidence.",
                            ].map((benefit) => (
                              <div key={benefit} className="flex items-center gap-3">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#431139]">
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                                {benefit}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 pb-24">
            <div className="mx-auto max-w-5xl">
              <h2 className="text-4xl font-semibold text-foreground">Pricing FAQs</h2>
              <div className="mt-10 grid gap-10 md:grid-cols-2">
                {pricingFaqs.flat().map((faq, index) => (
                  <div key={faq.question} className={`space-y-2 ${index >= 2 ? "pt-10 border-t border-border" : ""}`}>
                    <h3 className="text-lg font-semibold text-foreground">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 pb-24">
            <div className="rounded-[40px] border border-[#fd8628] bg-white px-6 py-10 sm:px-10">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,260px)_1fr]">
                <div className="flex flex-col gap-6">
                  <h2 className="text-3xl font-bold text-foreground">FAQ</h2>
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-foreground">
                      Still have more questions? Talk to our customer happiness team.
                    </p>
                    <Button
                      asChild
                      className="inline-flex w-max items-center gap-2 rounded-full bg-[#431139] px-5 py-2 text-white hover:bg-[#2f0b25]"
                    >
                      <a href="/contact">
                        <MessageCircle className="h-4 w-4" />
                        Talk to us
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {generalFaqs.map((faq, index) => {
                    const expanded = openFaq === index;
                    return (
                      <div key={faq.question} className="rounded-3xl border border-[#f97315]/20 bg-white shadow-sm">
                        <button
                          type="button"
                          onClick={() => setOpenFaq(expanded ? null : index)}
                          className="flex w-full items-center justify-between gap-4 rounded-3xl px-6 py-4 text-left text-sm font-semibold text-foreground"
                          aria-expanded={expanded}
                        >
                          <span>{faq.question}</span>
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f97315]/15 text-[#f97315]">
                            {expanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                          </span>
                        </button>
                        {expanded && (
                          <div className="border-t border-[#f97315]/15 px-6 pb-5 text-sm text-muted-foreground">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <footer className="border-t border-border bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-[1.5fr_2fr_1fr] items-start">
            <div className="space-y-4">
              <div className="text-2xl font-bold text-foreground">ReactArch</div>
              <p className="text-sm text-muted-foreground">AI product intelligence for ambitious teams.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3 text-sm">
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-foreground">Platform</div>
                <ul className="space-y-2 text-muted-foreground">
                  <li><a href="#features" className="hover:text-foreground">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-foreground">How it works</a></li>
                  <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                  <li><a href="#events" className="hover:text-foreground">Events</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-foreground">Company</div>
                <ul className="space-y-2 text-muted-foreground">
                  <li><a href="#about" className="hover:text-foreground">About</a></li>
                  <li><a href="#mission" className="hover:text-foreground">Our mission</a></li>
                  <li className="inline-flex items-center gap-2"><a href="/careers" className="hover:text-foreground">Careers</a><span className="rounded-full bg-[#f97315]/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#f97315]">Hiring</span></li>
                  <li><a href="/contact" className="hover:text-foreground">Contact</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-foreground">Resources</div>
                <ul className="space-y-2 text-muted-foreground">
                  <li><a href="#tutorials" className="hover:text-foreground">Tutorials</a></li>
                  <li><a href="#blog" className="hover:text-foreground">Blog</a></li>
                  <li><a href="#help" className="hover:text-foreground">Help Center</a></li>
                  <li><a href="#support" className="hover:text-foreground">Support</a></li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f97315]/10 text-[#f97315]">
                  <i className="fa-brands fa-square-x-twitter text-xl"></i>
                </span>
                <a href="https://twitter.com" className="text-sm font-semibold text-foreground hover:underline">Follow us on Twitter</a>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5a134e]/10 text-[#5a134e]">
                  <i className="fa-brands fa-square-instagram text-xl"></i>
                </span>
                <a href="https://instagram.com" className="text-sm font-semibold text-foreground hover:underline">Follow us on Instagram</a>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0a66c2]/10 text-[#0a66c2]">
                  <i className="fa-brands fa-linkedin text-xl"></i>
                </span>
                <a href="https://linkedin.com" className="text-sm font-semibold text-foreground hover:underline">Follow us on LinkedIn</a>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            Made with heart © {new Date().getFullYear()} ReactArch. All rights reserved.
          </div>
        </div>
      </footer>
    </PublicLayout>
  );
};

export default Index;
