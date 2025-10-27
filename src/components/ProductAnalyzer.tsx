import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { ReportPayload } from "@/types/report";
import type { Json } from "@/integrations/supabase/types";

interface ProductAnalyzerProps {
  onComplete?: () => void;
  className?: string;
}

export const ProductAnalyzer = ({ onComplete, className }: ProductAnalyzerProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    productName: "",
    productDescription: "",
    industry: "",
    industryOther: "",
    geographies: "",
    geographiesOther: "",
    competitors: [""],
    goals: "",
    goalsOther: "",
    constraints: ""
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const industries = ['SaaS', 'Healthcare', 'Fintech', 'Edtech', 'E-commerce', 'Other'];
  const geographyOptions = ['USA', 'Europe', 'Asia', 'Canada', 'Australia', 'Other'];
  const businessGoals = ['Launch', 'Partnership', 'Fundraising', 'Market Entry', 'Other'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('competitor-')) {
      const index = parseInt(name.split('-')[1]);
      setFormData(prev => {
        const newCompetitors = [...prev.competitors];
        newCompetitors[index] = value;
        return { ...prev, competitors: newCompetitors };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addCompetitor = () => {
    setFormData(prev => ({ ...prev, competitors: [...prev.competitors, ""] }));
  };

  const removeCompetitor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index)
    }));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      // Call the edge function to analyze the product
      const { data: analysisData, error: functionError } = await supabase.functions.invoke<ReportPayload>(
        'analyze-product',
        {
          body: {
            productName: formData.productName,
            productDescription: formData.productDescription,
            industry: formData.industry === 'Other' ? formData.industryOther : formData.industry,
            geographies: (formData.geographies === 'Other' ? formData.geographiesOther : formData.geographies) ? [formData.geographies === 'Other' ? formData.geographiesOther : formData.geographies] : [],
            competitors: formData.competitors.filter(c => c.trim()),
            goals: (formData.goals === 'Other' ? formData.goalsOther : formData.goals) ? [formData.goals === 'Other' ? formData.goalsOther : formData.goals] : [],
            constraints: formData.constraints
          },
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
        }
      );

      if (functionError) {
        throw functionError;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const legacy = analysisData?.legacy;
      const readinessIndex = analysisData?.executiveSummary?.marketReadiness?.score;
      const readinessScore = legacy?.marketReadinessScore ?? (typeof readinessIndex === 'number' ? Math.round(readinessIndex) : null);
      const readinessAdvice = legacy?.readinessAdvice ?? analysisData?.executiveSummary?.marketReadiness?.summary ?? null;
      const serializedReport = analysisData
        ? (JSON.parse(JSON.stringify(analysisData)) as Json)
        : null;

      // Save the analysis to the database
      const { data, error } = await supabase
        .from('product_analyses')
        .insert({
          user_id: user.id,
          product_name: formData.productName,
          product_description: formData.productDescription,
          industry: formData.industry === 'Other' ? formData.industryOther : formData.industry,
          geographies: (formData.geographies === 'Other' ? formData.geographiesOther : formData.geographies) ? [formData.geographies === 'Other' ? formData.geographiesOther : formData.geographies] : [],
          competitors_input: formData.competitors.filter(c => c.trim()),
          business_goals: (formData.goals === 'Other' ? formData.goalsOther : formData.goals) ? [formData.goals === 'Other' ? formData.goalsOther : formData.goals] : [],
          constraints: formData.constraints,
          competitors: legacy?.competitors ?? null,
          buyer_personas: legacy?.buyerPersonas ?? null,
          market_trends: legacy?.marketTrends ?? null,
          swot_analysis: legacy?.swotAnalysis ?? null,
          market_readiness_score: readinessScore,
          readiness_advice: readinessAdvice,
          report_version: analysisData.reportVersion,
          report_payload: serializedReport,
          generated_at: analysisData.generatedAt,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Analysis complete!");
      
      // Navigate to the analysis results page
      navigate(`/analysis/${data.id}`);
      
      if (onComplete) onComplete();
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || "Failed to analyze product");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className={cn("shadow-xl", className)}>
      <CardHeader>
        <CardTitle className="text-2xl">Ai Report Analysis</CardTitle>
        <CardDescription>
          Enter your product details and get comprehensive AI-powered market research
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAnalyze} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="productName">Product or Idea Name</Label>
            <Input
              id="productName"
              name="productName"
              placeholder="e.g., TaskMaster Pro"
              value={formData.productName}
              onChange={handleInputChange}
              required
              disabled={isAnalyzing}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="productDescription">Product Description</Label>
            <Textarea
              id="productDescription"
              name="productDescription"
              placeholder="Describe your product, its features, target market, and what problem it solves..."
              value={formData.productDescription}
              onChange={handleInputChange}
              required
              disabled={isAnalyzing}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry/Vertical Selection</Label>
            <Select value={formData.industry} onValueChange={(value) => handleSelectChange('industry', value)} disabled={isAnalyzing}>
              <SelectTrigger>
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.industry === 'Other' && (
              <Input
                name="industryOther"
                placeholder="Please specify your industry"
                value={formData.industryOther}
                onChange={handleInputChange}
                disabled={isAnalyzing}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="geographies">Geography/Region</Label>
            <Select value={formData.geographies} onValueChange={(value) => handleSelectChange('geographies', value)} disabled={isAnalyzing}>
              <SelectTrigger>
                <SelectValue placeholder="Select a region" />
              </SelectTrigger>
              <SelectContent>
                {geographyOptions.map(geo => (
                  <SelectItem key={geo} value={geo}>{geo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.geographies === 'Other' && (
              <Input
                name="geographiesOther"
                placeholder="Please specify your region"
                value={formData.geographiesOther}
                onChange={handleInputChange}
                disabled={isAnalyzing}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Main Competitors (Optional)</Label>
            {formData.competitors.map((competitor, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  name={`competitor-${index}`}
                  placeholder="Competitor name"
                  value={competitor}
                  onChange={handleInputChange}
                  disabled={isAnalyzing}
                />
                {formData.competitors.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeCompetitor(index)}
                    disabled={isAnalyzing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCompetitor}
              disabled={isAnalyzing}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Competitor
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Desired Business Goal</Label>
            <Select value={formData.goals} onValueChange={(value) => handleSelectChange('goals', value)} disabled={isAnalyzing}>
              <SelectTrigger>
                <SelectValue placeholder="Select a business goal" />
              </SelectTrigger>
              <SelectContent>
                {businessGoals.map(goal => (
                  <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.goals === 'Other' && (
              <Input
                name="goalsOther"
                placeholder="Please specify your business goal"
                value={formData.goalsOther}
                onChange={handleInputChange}
                disabled={isAnalyzing}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="constraints">Additional Constraints/Requirements</Label>
            <Textarea
              id="constraints"
              name="constraints"
              placeholder="Technical, timeline, integration, or product-specific requirements"
              value={formData.constraints}
              onChange={handleInputChange}
              disabled={isAnalyzing}
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#431139] text-white shadow-lg hover:bg-[#2f0b25]"
            disabled={isAnalyzing}
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              "Generate AI Market Analysis"
            )}
          </Button>

          {isAnalyzing && (
            <p className="text-sm text-muted-foreground text-center">
              This may take up to 30 seconds. Our AI is conducting comprehensive market research...
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};