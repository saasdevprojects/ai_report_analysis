import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";

const Index = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 app-gradient"></div>
        <div className="absolute inset-0 app-starfield pointer-events-none opacity-60"></div>
        <div className="relative">
          {/* Hero Section */}
          <section className="relative overflow-hidden py-24">
            {/* Background shapes */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-purple-100 opacity-50 blur-3xl"></div>
              <div className="absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-blue-100 opacity-50 blur-3xl"></div>
            </div>

            <div className="container relative z-10 mx-auto px-4">
              <div className="mx-auto max-w-7xl">
                <div className="grid gap-12 lg:grid-cols-2 items-center">
                  {/* Left Column */}
                  <div className="max-w-2xl">
                    <div className="inline-block mb-6 px-2 py-1 font-semibold bg-green-100 rounded-full">
                      <div className="flex flex-wrap items-center -m-1">
                        <div className="w-auto p-1"><a className="text-sm" href="">👋 We are hiring! View open roles</a></div>
                        <div className="w-auto p-1">
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.66667 3.41675L12.75 7.50008M12.75 7.50008L8.66667 11.5834M12.75 7.50008L2.25 7.50008" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <h1 className="mb-6 text-6xl md:text-8xl lg:text-10xl font-bold font-heading md:max-w-xl leading-none">Discover mentors that helps you grow</h1>
                    <p className="mb-11 text-lg text-gray-900 font-medium md:max-w-md">Get the best-in-class group mentoring plans and professional benefits for your team</p>
                    <div className="flex flex-wrap -m-2.5 mb-20">
                      <div className="w-full md:w-auto p-2.5">
                        <Button 
                          size="lg" 
                          onClick={() => navigate("/sign-up")} 
                          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                          Join Free for 30 Days
                        </Button>
                      </div>
                      <div className="w-full md:w-auto p-2.5">
                        <Button 
                          size="lg" 
                          variant="outline" 
                          className="border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-medium text-lg px-8 py-6 rounded-xl transition-colors duration-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                            <path d="M15 7v2a4 4 0 01-4 4H9.828l-2.766 2.767c.28.149.599.233.938.233h8.84a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                          </svg>
                          Book a call
                        </Button>
                      </div>
                    </div>
                    <p className="mb-6 text-sm text-gray-500 font-semibold uppercase">Trusted and loved by 100+ tech first teams</p>
                    <div className="flex flex-wrap -m-4 md:pb-20">
                      <div className="w-auto p-4">
                        <img className="h-7" src="flaro-assets/logos/brands/brand.png" alt=""/>
                      </div>
                      <div className="w-auto p-4">
                        <img className="h-7" src="flaro-assets/logos/brands/brand2.png" alt=""/>
                      </div>
                      <div className="w-auto p-4">
                        <img className="h-7" src="flaro-assets/logos/brands/brand3.png" alt=""/>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="relative">
                    <img className="transform hover:-translate-y-16 transition ease-in-out duration-1000" src="flaro-assets/images/headers/header.png" alt=""/>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Trusted by section */}
          <section className="py-12 bg-gray-50 border-t border-gray-100">
            <div className="container mx-auto px-4">
              <p className="text-sm font-medium text-center text-gray-500 uppercase tracking-wider mb-8">
                TRUSTED BY INNOVATIVE TEAMS WORLDWIDE
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-items-center max-w-5xl mx-auto">
                {[
                  { name: 'Google', color: 'text-blue-500' },
                  { name: 'Microsoft', color: 'text-green-500' },
                  { name: 'Stripe', color: 'text-purple-500' },
                  { name: 'Slack', color: 'text-yellow-500' },
                  { name: 'Netflix', color: 'text-red-500' },
                ].map((company, index) => (
                  <div key={index} className={`text-2xl font-bold ${company.color} opacity-80 hover:opacity-100 transition-opacity`}>
                    {company.name}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Index;
