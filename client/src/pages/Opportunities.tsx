import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, RefreshCw, ExternalLink, Calendar, DollarSign, Building2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Opportunities() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [daysFilter, setDaysFilter] = useState<number>(7);
  
  const { data: opportunities = [], isLoading, refetch } = trpc.opportunities.recent.useQuery();
  const { data: stats } = trpc.opportunities.stats.useQuery();

  // Extract unique types
  const types = useMemo(() => {
    const unique = new Set(opportunities.map(o => o.opportunityType).filter(Boolean));
    return Array.from(unique).sort();
  }, [opportunities]);

  // Filter opportunities
  const filteredOpportunities = useMemo(() => {
    let filtered = opportunities;
    
    // Filter by days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysFilter);
    filtered = filtered.filter(opp => new Date(opp.publishedDate) >= cutoffDate);
    
    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter(opp => opp.opportunityType === typeFilter);
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(opp =>
        opp.title.toLowerCase().includes(query) ||
        opp.companyName.toLowerCase().includes(query) ||
        (opp.description && opp.description.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [opportunities, searchQuery, typeFilter, daysFilter]);

  const exportToCSV = () => {
    const headers = ["Company", "Title", "Type", "Category", "Value", "Published", "Deadline", "Location", "Source URL"];
    const rows = filteredOpportunities.map(opp => [
      opp.companyName,
      opp.title,
      opp.opportunityType || "",
      opp.category || "",
      opp.value || "",
      new Date(opp.publishedDate).toLocaleDateString(),
      opp.deadline ? new Date(opp.deadline).toLocaleDateString() : "",
      opp.location || "",
      opp.sourceUrl,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `opportunities-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully!");
  };

  const handleRefresh = async () => {
    toast.info("Refreshing opportunities...");
    await refetch();
    toast.success("Opportunities refreshed!");
  };

  const getDaysUntilDeadline = (deadline: Date | string | null) => {
    if (!deadline) return null;
    const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
    const days = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Buyer Opportunities
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            RFQs, tenders, and procurement opportunities from {stats?.companies || 0} companies
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.recent || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">With Deadline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats?.withDeadline || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.companies || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters & Actions</CardTitle>
            <CardDescription>Search and filter opportunities, or export data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search opportunities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map(type => (
                    <SelectItem key={type} value={type ?? ''}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={daysFilter.toString()} onValueChange={(v) => setDaysFilter(parseInt(v))}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <Button onClick={exportToCSV} variant="default">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                  <p className="mt-4 text-slate-600 dark:text-slate-400">Loading opportunities...</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredOpportunities.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Building2 className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="mt-4 text-slate-600 dark:text-slate-400">No opportunities found</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                    Try adjusting your filters or run the scraper to collect new data
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredOpportunities.map((opp) => {
              const daysUntilDeadline = getDaysUntilDeadline(opp.deadline);
              const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 7;
              
              return (
                <Card key={opp.id} className={isUrgent ? "border-orange-300 dark:border-orange-700" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{opp.title}</CardTitle>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {opp.companyName}
                          </Badge>
                          {opp.opportunityType && (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                              {opp.opportunityType}
                            </Badge>
                          )}
                          {opp.category && (
                            <Badge variant="secondary">{opp.category}</Badge>
                          )}
                          {opp.value && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {opp.value}
                            </Badge>
                          )}
                        </div>
                        {opp.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {opp.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(opp.sourceUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Published: {new Date(opp.publishedDate).toLocaleDateString()}
                      </div>
                      {opp.deadline && (
                        <div className={`flex items-center gap-1 ${isUrgent ? 'text-orange-600 dark:text-orange-400 font-semibold' : ''}`}>
                          {isUrgent && <AlertCircle className="h-4 w-4" />}
                          <Calendar className="h-4 w-4" />
                          Deadline: {new Date(opp.deadline).toLocaleDateString()}
                          {daysUntilDeadline !== null && (
                            <span className="ml-1">
                              ({daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : 'Expired'})
                            </span>
                          )}
                        </div>
                      )}
                      {opp.location && (
                        <div>Location: {opp.location}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
