import { useEffect, useState, MouseEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileText, Calendar, TrendingUp, Trash2, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Analysis {
  id: string;
  product_name: string;
  product_description: string;
  market_readiness_score: number;
  created_at: string;
}

interface AnalysisListProps {
  userId: string;
}

export const AnalysisList = ({ userId }: AnalysisListProps) => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleShare = async (analysis: Analysis) => {
    const shareUrl = `https://ai-report-analysis.vercel.app/analysis/${analysis.id}`;

    const shareData = {
      title: analysis.product_name,
      text: analysis.product_description,
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({ title: "Share link sent" });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied", description: "Share it with your team." });
      }
    } catch (error) {
      console.error("Share failed", error);
      toast({
        variant: "destructive",
        title: "Unable to share",
        description: "Try again or copy the link manually."
      });
    }
  };

  const handleDelete = async (analysis: Analysis) => {
    const confirmDelete = window.confirm("Delete this analysis? This cannot be undone.");
    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(analysis.id);
      const { error } = await supabase
        .from("product_analyses")
        .delete()
        .eq("id", analysis.id)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      setAnalyses((prev) => prev.filter((item) => item.id !== analysis.id));
      toast({ title: "Analysis deleted" });
    } catch (error) {
      console.error("Delete analysis failed", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Please try again."
      });
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadAnalyses = async () => {
      if (!userId) {
        return;
      }

      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('product_analyses')
          .select('id, product_name, product_description, market_readiness_score, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!isMounted) {
          return;
        }

        setAnalyses(data || []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error('Error loading analyses:', error);
      } finally {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      }
    };

    void loadAnalyses();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No analyses yet</h3>
          <p className="text-muted-foreground">
            Create your first product analysis to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {analyses.map((analysis) => (
        <Card
          key={analysis.id}
          className="group relative overflow-hidden border border-slate-200/80 bg-white/90 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl focus-visible:-translate-y-1 focus-visible:shadow-2xl cursor-pointer"
          onClick={() => navigate(`/analysis/${analysis.id}`)}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900/20 via-indigo-900/15 to-sky-700/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100 group-focus-visible:opacity-100" />
          <CardHeader className="relative z-10 pb-4">
            <div className="min-w-0 pr-10">
              <CardTitle className="text-lg font-semibold transition-colors duration-300 group-hover:text-white group-active:text-white group-focus-visible:text-white line-clamp-1">
                {analysis.product_name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 text-xs transition-colors duration-300 group-hover:text-slate-200 group-active:text-slate-200 group-focus-visible:text-slate-200">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="absolute top-3 right-3 rounded-full p-1.5 transition-colors hover:bg-primary/10"
                  onClick={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
                  aria-label="Open analysis actions"
                >
                  <span className="flex flex-col items-center justify-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary group-hover:bg-white"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary group-hover:bg-white"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary group-hover:bg-white"></span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44"
                onClick={(event) => event.stopPropagation()}
              >
                <DropdownMenuItem
                  onSelect={() => {
                    void handleShare(analysis);
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={deletingId === analysis.id}
                  className="text-destructive focus:bg-red-500 focus:text-white data-[highlighted]:bg-red-500 data-[highlighted]:text-white"
                  onSelect={() => {
                    void handleDelete(analysis);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deletingId === analysis.id ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="relative z-10 pt-0">
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 transition-colors duration-300 group-hover:text-slate-200 group-active:text-slate-200 group-focus-visible:text-slate-200">
              {analysis.product_description}
            </p>
            <div className="flex items-center justify-between text-sm font-medium">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary transition-colors group-hover:text-white group-active:text-white group-focus-visible:text-white" />
                <span className="text-slate-600 transition-colors duration-300 group-hover:text-slate-200 group-active:text-slate-200 group-focus-visible:text-slate-200">Readiness</span>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors duration-300 group-hover:bg-white/20 group-hover:text-white group-active:bg-white/25 group-active:text-white group-focus-visible:bg-white/20 group-focus-visible:text-white">
                {Math.round((analysis.market_readiness_score ?? 0) / 10)}/10
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};