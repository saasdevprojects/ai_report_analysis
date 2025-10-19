import { useState } from "react";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Check, CalendarDays, FileText, LineChart, NotebookPen, Users } from "lucide-react";
import { Link } from "react-router-dom";

const heroImage = "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80";

const featureHighlights = [
  {
    icon: NotebookPen,
    title: "Product Analyzer",
    description:
      "Enter any product or idea and convert it into a consulting-grade research report in minutes.",
  },
  {
    icon: FileText,
    title: "Market & Competitor Insights",
    description:
      "Benchmark pricing, positioning, and sentiment with live intelligence that spotlights real-time market shifts.",
  },
  {
    icon: CalendarDays,
    title: "Ideal Customer Profiles (ICP)",
    description:
      "Generate tailored B2B personas, buying motivations, and decision journeys ready for sales activation.",
  },
  {
    icon: LineChart,
    title: "Trend & Regulatory Tracking",
    description:
      "Stay ahead of industry developments and compliance moves to inform proactive go-to-market plays.",
  },
];

const featureSpotlights = [
  {
    tag: "Step 1",
    title: "Input Your Product Data",
    description:
      "Describe your product, industry, and target market to activate the intelligence workflow instantly.",
    image: "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1000&q=80",
  },
  {
    tag: "Step 2",
    title: "AI Research Activation",
    description:
      "Gemini interprets your context while Exa gathers live intelligence across the web ecosystem.",
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1000&q=80",
  },
  {
    tag: "Step 3",
    title: "Comprehensive Report Delivery",
    description:
      "Receive dashboards, SWOT tables, readiness scores, and recommendations prepared for executive briefings.",
    image: "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1000&q=80",
  },
];

const faqs = [
  {
    question: "How does the platform merge Gemini and Exa?",
    answer: "Gemini provides contextual reasoning while Exa streams live market intelligence, creating a unified 360° analysis.",
  },
  {
    question: "What deliverables should teams expect?",
    answer: "Every analysis unlocks AI report PDFs, interactive dashboards, and source-backed data grids ready to share.",
  },
  {
    question: "Can results improve over time?",
    answer: "Yes. Each report trains future runs, evolving benchmarks and insights unique to your organization.",
  },
  {
    question: "Is it built for agencies and enterprise teams?",
    answer: "Secure workspaces with permissions, integrations, and weekly digests keep agencies and B2B teams aligned.",
  },
];

export default function Features() {
  const [_, setFocus] = useState(false);

  return (
    <PublicLayout>
      <div className="relative min-h-screen overflow-hidden bg-white">
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-r from-[#431139] via-[#fd8628] to-transparent"></div>
        <div className="pointer-events-none absolute -left-[220px] bottom-[-160px] h-[420px] w-[420px] rounded-full bg-[#fdc58f] -z-10"></div>
        <div className="pointer-events-none absolute right-12 top-16 h-64 w-64 rounded-[48px] bg-[#fd8628]/70 blur-3xl -z-10"></div>

        <div className="container relative z-10 mx-auto px-6 py-24 lg:px-10">
          <section className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center">
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-sm font-semibold uppercase tracking-[0.3em] text-[#fd8628]">Instant Intelligence</span>
                <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Instant AI-Powered Product & Market Analysis for B2B Innovators</h1>
                <p className="max-w-xl text-base text-muted-foreground">
                  Transform any product idea into a full-scale business insight report within minutes. Powered by Gemini and Exa AI, our platform delivers market trends, competitor breakdowns, buyer personas, and go-to-market strategies — all in one beautiful, data-backed dashboard.
                </p>
              </div>

              <div className="inline-flex items-center gap-3 rounded-full border border-[#efd9c3] bg-white px-4 py-2 shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#431139] text-xs font-semibold text-white">AI</span>
                <p className="text-sm text-muted-foreground">Gemini reasoning plus Exa intelligence delivers executive-ready reports on demand.</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Button asChild className="rounded-full bg-[#fd8628] px-6 py-3 text-base font-semibold text-black hover:bg-[#fd8628]/85">
                  <Link to="/sign-up">Start your first analysis</Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border border-[#efd9c3] px-6 py-3 text-base font-semibold text-foreground transition hover:bg-[#431139] hover:text-white"
                  onMouseEnter={() => setFocus(true)}
                  onMouseLeave={() => setFocus(false)}
                >
                  Explore the platform
                </Button>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute -top-6 right-10 h-24 w-24 rounded-full bg-[#fd8628]/20 blur-2xl"></div>
              <div className="relative overflow-hidden rounded-[32px] border border-[#f3d5ba] bg-white p-4 shadow-xl">
                <div className="rounded-[24px] bg-[#431139] p-3">
                  <img
                    src={heroImage}
                    alt="Team collaborating in a modern workspace"
                    className="h-80 w-full rounded-[20px] object-cover"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-20 grid gap-8 md:grid-cols-2">
            {featureHighlights.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-5 rounded-3xl border border-[#f0e1d4] bg-white p-6 shadow-sm">
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-[#fff3e4] text-[#fd8628]">
                  <Icon className="h-6 w-6" />
                </span>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="mt-24 grid gap-12 lg:grid-cols-3">
            {featureSpotlights.map(({ tag, title, description, image }) => (
              <div key={title} className="flex flex-col gap-5 rounded-[32px] border border-[#f3d5ba] bg-white p-6 shadow-md">
                <div className="overflow-hidden rounded-[24px] border border-[#fbe6d2]">
                  <img src={image} alt={title} className="h-48 w-full object-cover" />
                </div>
                <span className="inline-flex w-fit items-center rounded-full bg-[#fdf2e9] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#fd8628]">
                  {tag}
                </span>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="mt-24 space-y-8">
            <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Platform FAQs</h2>
            <div className="grid gap-8 md:grid-cols-2">
              {faqs.map(({ question, answer }) => (
                <div key={question} className="space-y-2 border-b border-[#f0e1d4] pb-6">
                  <h3 className="text-lg font-semibold text-foreground">{question}</h3>
                  <p className="text-sm text-muted-foreground">{answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-24 rounded-[36px] bg-[#431139] px-8 py-12 text-center text-white shadow-xl">
            <div className="mx-auto max-w-2xl space-y-4">
              <h3 className="text-3xl font-semibold sm:text-4xl">Turn Ideas Into Intelligence</h3>
              <p className="text-base text-white/80">
                Automate consulting-grade analysis and deliver unique benchmarking, actionable strategies, and investor-ready storytelling without the research overhead.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild className="rounded-full bg-white px-6 py-3 text-base font-semibold text-[#431139] transition hover:border hover:border-[#fd8628] hover:bg-[#fd8628] hover:text-white">
                  <Link to="/sign-up">Start your AI report</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-white/40 px-6 py-3 text-base font-semibold text-black transition hover:border-[#fd8628] hover:bg-[#fd8628] hover:text-white">
                  <Link to="/pricing">See pricing options</Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
