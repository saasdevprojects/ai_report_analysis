import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AnalysisDetail from "./AnalysisDetail";
import BusinessIntelligenceDetail from "./BusinessIntelligenceDetail";
import MarketResearchDetail from "./MarketResearchDetail";

const ReportRouter = () => {
  const { id } = useParams();
  const [reportType, setReportType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("product_analyses")
          .select("report_type")
          .eq("id", id)
          .single();
        if (error) throw error;
        if (!mounted) return;
        setReportType((data as any)?.report_type ?? null);
      } catch (e) {
        setReportType(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (reportType === "business_intelligence") {
    return <BusinessIntelligenceDetail />;
  }
  if (reportType === "market_research") {
    return <MarketResearchDetail />;
  }
  // Fallback to legacy/strategy detail
  return <AnalysisDetail />;
};

export default ReportRouter;
