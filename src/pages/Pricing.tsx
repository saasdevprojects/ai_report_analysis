import { useState } from "react";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const planPricing = {
  starter: {
    monthly: { price: "$0", suffix: "/month" },
    annually: { price: "$0", suffix: "/month" },
  },
  infinity: {
    monthly: { price: "$30", suffix: "/month" },
    annually: { price: "$306", suffix: "/year" },
  },
} as const;

const features = [
  "Product Analyzer: AI reports in minutes.",
  "Market Intel: Live competitor snapshots.",
  "ICP Personas: Buyer journeys mapped.",
  "Trend & Compliance Alerts: Stay ahead.",
  "Readiness Score: Launch with confidence.",
];

const faqs = [
  {
    question: "How does the workflow run?",
    answer: "Describe your product; Orion and Pulse assemble a 360° report in minutes.",
  },
  {
    question: "What makes it different?",
    answer: "Every analysis learns from your data, sharpening benchmarks over time.",
  },
  {
    question: "What do we receive?",
    answer: "Downloadable AI PDFs, live dashboards, and verified source links ready to share.",
  },
  {
    question: "Can we integrate outputs?",
    answer: "Share, export, and connect insights into your existing business tools.",
  },
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");

  const starterPrice = planPricing.starter[billingCycle];
  const infinityPrice = planPricing.infinity[billingCycle];

  return (
    <PublicLayout>
      <div className="relative min-h-screen overflow-hidden bg-white">
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-r from-[#431139] via-[#fd8628] to-transparent"></div>
        <div className="pointer-events-none absolute -left-[240px] bottom-[-160px] h-[460px] w-[460px] rounded-full bg-[#fdc58f] -z-10"></div>
        <div className="pointer-events-none absolute right-16 top-10 h-64 w-64 rounded-[48px] bg-[#fd8628]/70 blur-3xl -z-10"></div>

        <div className="container relative z-10 mx-auto px-6 py-24 lg:px-10">
          <div className="space-y-16">
            <div className="flex flex-col items-center text-center space-y-4">
              <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">AI Analysis Pricing</h1>
              <p className="max-w-2xl text-base text-muted-foreground">
                Unlock instant market, competitor, and persona insights—start your first AI-powered analysis today.
              </p>

              <div className="flex flex-col items-center gap-4">
                <div className="inline-flex items-center rounded-full border border-[#fd8628]/60 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("monthly")}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                      billingCycle === "monthly"
                        ? "bg-[#fd8628] text-black shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("annually")}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                      billingCycle === "annually"
                        ? "bg-[#fd8628] text-black shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Annually
                  </button>
                </div>
                <span className="inline-flex items-center rounded-full bg-[#fdf2e9] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[#fd8628]">
                  Annual plan unlocks $306/year (15% off)
                </span>
              </div>
            </div>

            <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="space-y-6">
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-foreground">What you'll get</h2>
                  <ul className="space-y-4 text-sm text-muted-foreground">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff3e4] text-[#fd8628]">
                          <Check className="h-4 w-4" />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-[36px] border border-[#f0e1d4] bg-white p-8 shadow-sm">
                  <div className="space-y-4 text-center">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Starter</h3>
                    <div className="text-4xl font-semibold text-foreground">
                      {starterPrice.price}
                      <span className="ml-1 text-base font-normal text-muted-foreground">{starterPrice.suffix}</span>
                    </div>
                    <Button className="w-full rounded-full border border-[#fd8628] bg-white text-sm font-semibold text-black hover:bg-[#fd8628]/10">
                      Start AI trial
                    </Button>
                  </div>
                  <div className="mt-6 rounded-3xl bg-[#fff3e4] p-5">
                    <ul className="space-y-3 text-sm text-foreground">
                      {features.slice(0, 3).map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#fd8628]">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-[36px] bg-[#fd8628] p-1 shadow-lg">
                  <div className="h-full rounded-[32px] bg-[#fd8628] p-7 text-white">
                    <div className="space-y-4 text-center">
                      <h3 className="text-sm font-semibold uppercase tracking-wide">Infinity</h3>
                      <div className="text-4xl font-semibold">
                        {infinityPrice.price}
                        <span className="ml-1 text-base font-normal opacity-80">{infinityPrice.suffix}</span>
                      </div>
                      <Button
                        asChild
                        className="w-full rounded-full bg-white text-sm font-semibold text-[#431139] hover:bg-white/90"
                      >
                        <Link to="/sign-up">Book demo</Link>
                      </Button>
                    </div>
                    <div className="mt-6 rounded-3xl bg-[#431139] p-5">
                      <ul className="space-y-3 text-sm">
                        {features.map((feature) => (
                          <li key={feature} className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#431139]">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Pricing FAQs</h2>
              <div className="grid gap-8 md:grid-cols-2">
                {faqs.map(({ question, answer }) => (
                  <div key={question} className="space-y-2 border-b border-border pb-6">
                    <h3 className="text-lg font-semibold text-foreground">{question}</h3>
                    <p className="text-sm text-muted-foreground">{answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
