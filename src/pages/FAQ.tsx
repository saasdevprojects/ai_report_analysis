import { useState } from "react";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Minus, Plus, MessageCircle } from "lucide-react";

const faqGroups = [
  {
    title: "Platform",
    items: [
      {
        question: "Who is Solstice designed for?",
        answer:
          "Solstice is built for B2B product, marketing, and strategy teams that need fast market intelligence without hiring analysts.",
      },
      {
        question: "How quickly can I produce my first report?",
        answer:
          "Most teams launch their first AI-generated report in under ten minutes—add your idea, target audience, and goals to begin.",
      },
      {
        question: "Does Solstice track competitors automatically?",
        answer:
          "Yes. Solstice continuously monitors competitor positioning, sentiment signals, and regulatory changes so your dashboard stays current.",
      },
    ],
  },
  {
    title: "Collaboration",
    items: [
      {
        question: "What integrations are available out of the box?",
        answer:
          "Connect to Salesforce, HubSpot, Slack, and your preferred BI tools to sync insights and automate stakeholder updates.",
      },
      {
        question: "Can my clients access shared dashboards?",
        answer:
          "Invite clients or executives as viewers with granular permissions so they can explore live dashboards securely.",
      },
      {
        question: "Does the system improve over time?",
        answer:
          "Each report influences the next, sharpening benchmarks, personas, and recommendations unique to your organization.",
      },
    ],
  },
  {
    title: "Pricing & Plans",
    items: [
      {
        question: "Is there a trial period?",
        answer: "Start with a 14-day sandbox featuring Infinity capabilities—no credit card required.",
      },
      {
        question: "Can I switch plans anytime?",
        answer:
          "You can upgrade, downgrade, or cancel monthly plans anytime. Annual subscriptions prorate remaining time if you adjust mid-cycle.",
      },
      {
        question: "Do you support procurement approvals?",
        answer:
          "Enterprise customers can request security documentation, SOC reports, and custom invoicing to streamline procurement.",
      },
    ],
  },
];

export default function FAQ() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <PublicLayout>
      <div className="relative min-h-screen overflow-hidden bg-white">
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-r from-[#431139] via-[#fd8628] to-transparent"></div>
        <div className="pointer-events-none absolute -left-[200px] bottom-[-160px] h-[420px] w-[420px] rounded-full bg-[#fdc58f]"></div>
        <div className="pointer-events-none absolute right-16 top-12 h-64 w-64 rounded-[48px] bg-[#fd8628]/70 blur-3xl"></div>

        <section className="container relative z-10 mx-auto px-6 py-24 lg:px-10">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fd8628]/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#431139]">
              FAQ
            </span>
            <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Frequently Asked Questions</h1>
            <p className="text-base text-muted-foreground">
              Find quick answers about AI research workflows, collaboration, and pricing. Need something more specific? Talk to our team anytime.
            </p>
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[280px_1fr]">
            <div className="space-y-5 rounded-[32px] border border-[#fd8628]/30 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground">Still need help?</h2>
              <p className="text-sm text-muted-foreground">
                Reach out for tailored walkthroughs, security documentation, or integration guidance.
              </p>
              <Button
                asChild
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#431139] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2f0b25]"
              >
                <a href="/contact">
                  <MessageCircle className="h-4 w-4" />
                  Talk to us
                </a>
              </Button>
            </div>

            <div className="space-y-8">
              {faqGroups.map(({ title, items }) => (
                <div key={title} className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                  <div className="space-y-3">
                    {items.map(({ question, answer }) => {
                      const expanded = openItem === question;
                      return (
                        <div key={question} className="rounded-3xl border border-[#fd8628]/20 bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() => setOpenItem(expanded ? null : question)}
                            className="flex w-full items-center justify-between gap-4 rounded-3xl px-6 py-4 text-left text-sm font-semibold text-foreground"
                            aria-expanded={expanded}
                          >
                            <span>{question}</span>
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#fd8628]/15 text-[#fd8628]">
                              {expanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </span>
                          </button>
                          {expanded && <div className="border-t border-[#fd8628]/10 px-6 pb-5 text-sm text-muted-foreground">{answer}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
