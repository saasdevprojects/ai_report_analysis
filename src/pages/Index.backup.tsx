import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Zap, BarChart3, Users, TrendingUp, Target, Sparkles, Check, Shield, Clock, Layers } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import PublicLayout from "@/components/layout/PublicLayout";

const Index = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 app-gradient"></div>
        <div className="absolute inset-0 app-starfield pointer-events-none opacity-60"></div>
        <div className="relative">
          <section className="relative overflow-hidden py-20">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-[-25%] h-96 w-96 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"></div>
              <div className="absolute bottom-[-10%] left-12 h-72 w-72 rounded-full bg-secondary/20 blur-3xl"></div>
            </div>

            <div className="container relative z-10 mx-auto px-4">
              <div className="mx-auto max-w-6xl">
                <div className="grid gap-8 lg:grid-cols-2 items-center">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 mb-6">
                      👋 We are hiring! View open roles →
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                      Discover mentors that helps you grow
                    </h1>
                    <p className="mt-6 text-lg text-muted-foreground max-w-lg">
                      Get the best-in-class group mentoring plans and professional benefits for your team
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                      <Button size="lg" onClick={() => navigate("/sign-up")} className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 shadow-xl text-lg px-8 py-6">
                        Join Free for 30 Days
                      </Button>
                      <Button size="lg" variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 text-lg px-8 py-6">
                        📞 Book a call
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="grid gap-4">
                      <div className="surface-3d p-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                            <img src="/placeholder.svg" alt="Brooklyn Simons" className="w-10 h-10 rounded-full" />
                          </div>
                          <div>
                            <div className="font-semibold">Brooklyn Simons</div>
                            <div className="text-sm text-muted-foreground">Senior UX Designer, Groove</div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">$120/hour/session</div>
                      </div>
                      <div className="surface-3d p-4 rounded-2xl bg-gradient-to-br from-green-100 to-teal-100 ml-8">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-pink-400 flex items-center justify-center">
                            <img src="/placeholder.svg" alt="Jane Cooper" className="w-10 h-10 rounded-full" />
                          </div>
                          <div>
                            <div className="font-semibold">Jane Cooper</div>
                            <div className="text-sm text-muted-foreground">Product Manager, Dropbox</div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">$110/hour/session</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-6xl text-center">
              <p className="text-sm font-semibold text-muted-foreground mb-8 tracking-wide">
                TRUSTED AND LOVED BY 100+ TECH FIRST TEAMS
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">L</span>
                  </div>
                  <span className="font-semibold text-gray-700">Logoipsum</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">L</span>
                  </div>
                  <span className="font-semibold text-gray-700">Logoipsum</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">L</span>
                  </div>
                  <span className="font-semibold text-gray-700">Logoipsum</span>
                </div>
              </div>
            </div>
          </section>
          <section className="container mx-auto px-4 py-16">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight">Pick a plan</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elemen.
                </p>
                <p className="mt-4 text-muted-foreground">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Volut pat tempor condimentum commodo tincidunt sit dictumst. Eu placerat ante at sem vitae eros, purus non, eu. Adipiscing vitae amet nunc volutpat sit. Enim eu integer duis arou.
                </p>
              </div>
              <div className="surface-3d p-6 rounded-2xl">
                <div className="text-sm font-semibold text-muted-foreground mb-4">FEATURES INCLUDED:</div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>3 Team Members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>1200+ UI Blocks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>10 GB Cloud Storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Individual Email Account</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Premium Support</span>
                  </li>
                </ul>
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">PRO PACKAGE</div>
                    <div className="text-sm text-muted-foreground">Best for Startups & Small Businesses</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">$49<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                    <div className="text-sm text-muted-foreground">Billed annually</div>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90">
                  Start 14 days free trial
                </Button>
              </div>
            </div>
          </section>
          <section className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                Collaborate efficiently with the teams today
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Amet minim mollit non deserunt ullamco.
              </p>
              <Button className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 text-lg px-8 py-4">
                Join Free for 30 Days
              </Button>
              <div className="flex items-center justify-center gap-2 mt-6">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-400 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-pink-400 border-2 border-white"></div>
                </div>
                <span className="text-sm text-muted-foreground ml-2">Join 250+ other startup founders</span>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-5xl text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold">Don't just take our word for it</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="surface-3d p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">JJ</span>
                  </div>
                  <div>
                    <div className="font-semibold">Jacob Jones</div>
                    <div className="text-sm text-muted-foreground">@BROOKLYSIM</div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  If you haven't tried out Flaro App yet, I would definitely recommend it for both designers and developers 👍
                </p>
                <div className="text-sm text-muted-foreground mt-3">3 days ago</div>
              </div>
              
              <div className="surface-3d p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">WW</span>
                  </div>
                  <div>
                    <div className="font-semibold">Wade Warren</div>
                    <div className="text-sm text-muted-foreground">@BROOKLYSIM</div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  If you are thinking of a design partner to help you convert more customers, Flaro is a great choice.
                </p>
                <div className="text-sm text-muted-foreground mt-3">3 days ago</div>
              </div>
              
              <div className="surface-3d p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-pink-400 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">BC</span>
                  </div>
                  <div>
                    <div className="font-semibold">Bessie Cooper</div>
                    <div className="text-sm text-muted-foreground">@BROOKLYSIM</div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  We have built a few web apps using Flaro. It saves us a lot of time, because we don't have to build design features from scratch.
                </p>
                <div className="text-sm text-muted-foreground mt-3">3 days ago</div>
              </div>
              
              <div className="surface-3d p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">EH</span>
                  </div>
                  <div>
                    <div className="font-semibold">Esther Howard</div>
                    <div className="text-sm text-muted-foreground">@BROOKLYSIM</div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Wrike is great to make work visible and collaborative. People can pass tasks off as they complete their parts, allowing you to see the flow of work.
                </p>
                <div className="text-sm text-muted-foreground mt-3">3 days ago</div>
              </div>
              
              <div className="surface-3d p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AF</span>
                  </div>
                  <div>
                    <div className="font-semibold">Albert Flores</div>
                    <div className="text-sm text-muted-foreground">@BROOKLYSIM</div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Ease of use and efficiency of design tools. The ability for the integrated marketing team to see all aspects of a project.
                </p>
                <div className="text-sm text-muted-foreground mt-3">3 days ago</div>
              </div>
              
              <div className="surface-3d p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">JB</span>
                  </div>
                  <div>
                    <div className="font-semibold">Jerome Bell</div>
                    <div className="text-sm text-muted-foreground">@BROOKLYSIM</div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Very very easy for customer information to get secured if all orders are on one device.
                </p>
                <div className="text-sm text-muted-foreground mt-3">3 days ago</div>
              </div>
            </div>
          </section>
          <section className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-5xl text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold">What founders say</h2>
              <p className="text-lg text-muted-foreground">Real outcomes from early-stage teams.</p>
            </div>
            <div className="relative max-w-4xl mx-auto">
              <Carousel className="w-full">
                <CarouselContent>
                  <CarouselItem>
                    <div className="surface-3d p-6">
                      <p className="text-lg">“Within a day we had a clear view of our market and stopped a month of guesswork.”</p>
                      <div className="mt-4 text-sm text-muted-foreground">Product Lead, SaaS</div>
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="surface-3d p-6">
                      <p className="text-lg">“The readiness score and competitor breakdown guided our launch plan.”</p>
                      <div className="mt-4 text-sm text-muted-foreground">Founder, Fintech</div>
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="surface-3d p-6">
                      <p className="text-lg">“Replaced scattered docs with a single, repeatable report we can share.”</p>
                      <div className="mt-4 text-sm text-muted-foreground">PM, Marketplace</div>
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </section>
          <section className="container mx-auto px-4 py-16">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="order-2 lg:order-1">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Customer-first approach to data privacy</h2>
                <p className="text-muted-foreground mb-4">We prioritize privacy and control. Your analyses are generated with a focus on confidentiality and responsible use of data.</p>
                <ul className="grid gap-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Clear data handling policy</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Opt-out friendly where applicable</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Transparent and simple controls</li>
                </ul>
              </div>
              <div className="order-1 lg:order-2 surface-3d p-3">
                <AspectRatio ratio={4/3}>
                  <img src="/placeholder.svg" alt="Privacy focus" className="h-full w-full rounded-md object-cover" />
                </AspectRatio>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-20">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Everything You Need to Validate Your Product
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="surface-3d p-6">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Competitor Analysis</h3>
                <p className="text-muted-foreground">Discover leading competitors with pricing, traffic insights, and key differentiators</p>
              </div>
              <div className="surface-3d p-6">
                <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Buyer Personas</h3>
                <p className="text-muted-foreground">Detailed ideal customer profiles with company size, pain points, and motivations</p>
              </div>
              <div className="surface-3d p-6">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Market Trends</h3>
                <p className="text-muted-foreground">Latest industry news and emerging patterns to stay ahead</p>
              </div>
              <div className="surface-3d p-6">
                <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">SWOT Analysis</h3>
                <p className="text-muted-foreground">Complete strategic assessment of strengths, weaknesses, opportunities, and threats</p>
              </div>
              <div className="surface-3d p-6">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Readiness Score</h3>
                <p className="text-muted-foreground">Market readiness rating with AI-powered improvement recommendations</p>
              </div>
              <div className="surface-3d p-6">
                <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Reports</h3>
                <p className="text-muted-foreground">Generate comprehensive analysis without the manual busywork</p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary to-secondary py-16 -mx-4 sm:mx-0">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Analyze Your Product?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join entrepreneurs and startups using AI to validate their ideas faster
              </p>
              <Button 
                size="lg"
                onClick={() => navigate("/sign-up")}
                className="bg-white text-primary hover:bg-white/90 shadow-xl text-lg px-8 py-6"
              >
                Start Your Free Analysis
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Index;
