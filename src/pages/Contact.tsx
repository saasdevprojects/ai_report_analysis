import PublicLayout from "@/components/layout/PublicLayout";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

const schema = z.object({
  firstName: z.string().min(2, "Enter your first name"),
  lastName: z.string().min(2, "Enter your last name"),
  email: z.string().email("Enter a valid email"),
  message: z.string().min(10, "Message should be at least 10 characters"),
});

export default function Contact() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", email: "", message: "" },
  });

  const onSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success("Thanks for reaching out! We'll get back to you soon.");
    form.reset();
  };

  return (
    <PublicLayout>
      <div className="relative min-h-screen overflow-hidden bg-white">
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-r from-[#431139] via-[#fd8628] to-transparent"></div>
        <div className="pointer-events-none absolute -left-[220px] bottom-[-160px] h-[420px] w-[420px] rounded-full bg-[#fdc58f]"></div>
        <div className="pointer-events-none absolute -right-[140px] -top-24 h-72 w-72 rounded-[36px] bg-[#fd8628]/70 blur-xl"></div>

        <div className="container relative z-10 mx-auto px-6 py-24 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-[1.1fr_1fr] lg:items-start">
            <div className="space-y-10">
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">About the Product</h1>
                <p className="max-w-xl text-base text-muted-foreground">
                  This is a next-generation intelligence platform for agencies, consultancies, and enterprise product teams who need deep, actionable analysis — not just summaries. By combining real-time web intelligence (Exa) and contextual reasoning (Gemini), it translates simple inputs into 360° strategic insights ready for boardrooms and client pitches.
                </p>
                <div className="h-1 w-20 rounded-full bg-[#fd8628]"></div>
              </div>

              <div className="rounded-3xl border border-[#fd8628]/30 bg-white/90 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#fd8628]">Why It’s Unique</p>
                    <p className="mt-1 text-base text-foreground">Unlike generic AI tools, this system evolves with your data, refining benchmarks and producing unique, actionable intelligence no competitor can replicate.</p>
                  </div>
                  <Button
                    asChild
                    className="rounded-full bg-[#431139] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2f0b25]"
                  >
                    <a href="/faq">See how it works</a>
                  </Button>
                </div>
              </div>

              <div className="space-y-6 text-sm text-muted-foreground">
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[#fd8628]"></div>
                  <p>Intuitive automation delivers consulting-grade reports for your team at $50/month, eliminating manual research and analyst overhead.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[#fd8628]"></div>
                  <p>Deliverables include AI report PDFs with source links, live dashboards with KPI graphs and sentiment maps, weekly trend digests, and secure workspaces with permissions for agencies and consultants.</p>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute inset-0 top-10 rounded-[48px] bg-[#431139]/90"></div>
              <div className="relative w-full max-w-xl rounded-[40px] border border-[#f3d5ba] bg-white p-10 shadow-[0_20px_60px_rgba(67,17,57,0.18)]">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="First name"
                                {...field}
                                className="rounded-full border border-[#f0e1d4] bg-white px-5 py-3 text-sm shadow-sm focus-visible:ring-[#fd8628]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Last name"
                                {...field}
                                className="rounded-full border border-[#f0e1d4] bg-white px-5 py-3 text-sm shadow-sm focus-visible:ring-[#fd8628]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john@email.com"
                              {...field}
                              className="rounded-full border border-[#f0e1d4] bg-white px-5 py-3 text-sm shadow-sm focus-visible:ring-[#fd8628]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={5}
                              placeholder="Enter your message"
                              {...field}
                              className="min-h-[140px] rounded-3xl border border-[#f0e1d4] bg-white px-5 py-3 text-sm shadow-sm focus-visible:ring-[#fd8628]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="rounded-full bg-[#431139]/5 p-[3px]">
                      <Button
                        type="submit"
                        className="flex w-full items-center justify-center rounded-full bg-[#fd8628] py-3 text-base font-semibold text-white shadow-md transition hover:bg-[#fd8628]/85"
                      >
                        Submit
                      </Button>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
                      We process your information in accordance with our {" "}
                      <a href="/privacy" className="font-semibold text-[#431139] hover:underline">
                        Privacy Policy
                      </a>
                      .
                    </p>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
