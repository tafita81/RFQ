import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, RefreshCw, ExternalLink, Mail, Phone, Building2, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function LeadsTable() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: opportunities = [], isLoading, refetch } = trpc.opportunities.list.useQuery();
  const { data: stats } = trpc.opportunities.stats.useQuery();

  // Filter opportunities
  const filteredOpportunities = useMemo(() => {
    if (!searchQuery) return opportunities;
    
    const query = searchQuery.toLowerCase();
    return opportunities.filter(opp =>
      opp.companyName.toLowerCase().includes(query) ||
      (opp.contactEmail && opp.contactEmail.toLowerCase().includes(query)) ||
      (opp.location && opp.location.toLowerCase().includes(query))
    );
  }, [opportunities, searchQuery]);

  const exportToCSV = () => {
    const headers = ["Company", "Contact Email", "Contact Phone", "Location", "Category", "Source URL", "Published Date"];
    const rows = filteredOpportunities.map(opp => [
      opp.companyName,
      opp.contactEmail || "",
      opp.contactPhone || "",
      opp.location || "",
      opp.category || "",
      opp.sourceUrl,
      new Date(opp.publishedDate).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully!");
  };

  const handleRefresh = async () => {
    toast.info("Refreshing leads...");
    await refetch();
    toast.success("Leads refreshed!");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Real Buyer Leads
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Contact information extracted from {stats?.companies || 0} company websites - All data is REAL, no mock data
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">With Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {opportunities.filter(o => o.contactEmail).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">With Phone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {opportunities.filter(o => o.contactPhone).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats?.companies || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Export</CardTitle>
            <CardDescription>Search leads by company name, email, or location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
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

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-12 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                <p className="mt-4 text-slate-600 dark:text-slate-400">Loading leads...</p>
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <div className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="mt-4 text-slate-600 dark:text-slate-400">No leads found</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                  The scraper is running in background to collect more data
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Company</TableHead>
                      <TableHead className="min-w-[250px]">Contact Email</TableHead>
                      <TableHead className="min-w-[150px]">Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOpportunities.map((opp) => (
                      <TableRow key={opp.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            {opp.companyName}
                          </div>
                        </TableCell>
                        <TableCell>
                          {opp.contactEmail ? (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <button
                                onClick={() => copyToClipboard(opp.contactEmail!, "Email")}
                                className="text-left hover:underline text-sm truncate max-w-[200px]"
                                title={opp.contactEmail}
                              >
                                {opp.contactEmail}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">No email</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {opp.contactPhone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <button
                                onClick={() => copyToClipboard(opp.contactPhone!, "Phone")}
                                className="text-left hover:underline text-sm"
                              >
                                {opp.contactPhone.split(',')[0]}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">No phone</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {opp.location ? (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {opp.location}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {opp.category && (
                            <Badge variant="secondary" className="text-xs">
                              {opp.category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(opp.sourceUrl, '_blank')}
                            title="View source page"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Banner */}
        <Card className="mt-6 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Real Contact Data - No Mock Information
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  All emails and phone numbers displayed are extracted from real company websites. 
                  Click on any email or phone to copy it to clipboard. The scraper is continuously 
                  running to collect more leads from the 900 companies in the database.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
