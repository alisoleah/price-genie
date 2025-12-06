import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Activity, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Play
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function Admin() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: scrapeJobs, isLoading } = trpc.admin.scrapeJobs.useQuery();
  const { data: platforms } = trpc.platforms.list.useQuery();

  const triggerScrapeMutation = trpc.admin.triggerScrape.useMutation({
    onSuccess: () => {
      utils.admin.scrapeJobs.invalidate();
      toast.success("Scrape job started");
    },
    onError: () => {
      toast.error("Failed to start scrape job");
    },
  });

  const handleTriggerScrape = (platformId: number) => {
    triggerScrapeMutation.mutate({ platformId });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'running':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Trigger Scrape
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            {platforms?.map(platform => (
              <Button
                key={platform.id}
                variant="outline"
                onClick={() => handleTriggerScrape(platform.id)}
                disabled={triggerScrapeMutation.isPending}
              >
                Scrape {platform.displayName}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Scrape Jobs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Scrape Jobs
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => utils.admin.scrapeJobs.invalidate()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : scrapeJobs && scrapeJobs.length > 0 ? (
              scrapeJobs.map(job => (
                <div key={job.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{job.platformName}</h3>
                        {getStatusBadge(job.status)}
                      </div>
                      {job.category && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Category: {job.category}
                        </p>
                      )}
                    </div>
                    {job.productsScraped !== null && job.productsScraped > 0 && (
                      <Badge variant="secondary">
                        {job.productsScraped} products
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {job.startedAt && (
                      <span>
                        Started {formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })}
                      </span>
                    )}
                    {job.completedAt && (
                      <span>
                        Completed {formatDistanceToNow(new Date(job.completedAt), { addSuffix: true })}
                      </span>
                    )}
                    {job.retryCount !== null && job.retryCount > 0 && (
                      <span className="text-yellow-600">
                        Retries: {job.retryCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No scrape jobs found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {platforms?.map(platform => (
              <div key={platform.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <h3 className="font-semibold">{platform.displayName}</h3>
                  <p className="text-sm text-muted-foreground">{platform.name}</p>
                </div>
                <Badge variant={platform.isActive ? "default" : "secondary"}>
                  {platform.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
