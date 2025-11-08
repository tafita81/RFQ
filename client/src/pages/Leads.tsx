import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, RefreshCw, ExternalLink, Mail, Phone, Building2, Globe } from "lucide-react";
import { toast } from "sonner";

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [focusFilter, setFocusFilter] = useState<string>("all");
  
  const { data: leads = [], isLoading, refetch } = trpc.leads.list.useQuery();
  const { data: stats } = trpc.leads.stats.useQuery();

  // Extract unique countries and focus areas
  const countries = useMemo(() => {
    const unique = new Set(leads.map(l => l.country).filter(Boolean));
    return Array.from(unique).sort();
  }, [leads]);

  const focusAreas = useMemo(() => {
    const unique = new Set(leads.map(l => l.focus).filter(Boolean));
    return Array.from(unique).sort();
  }, [leads]);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = !searchQuery || 
        lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.url.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCountry = countryFilter === "all" || lead.country === countryFilter;
      const matchesFocus = focusFilter === "all" || lead.focus === focusFilter;
      
      return matchesSearch && matchesCountry && matchesFocus;
    });
  }, [leads, searchQuery, countryFilter, focusFilter]);

  const parseJsonArray = (str: string | null): string[] => {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return str.split(',').map(s => s.trim()).filter(Boolean);
    }
  };

  const exportToCSV = () => {
    const headers = ["Company", "URL", "Country", "Focus", "Emails", "Phones", "Vendor Portal", "RFQ System", "Last Checked"];
    const rows = filteredLeads.map(lead => [
      lead.companyName,
      lead.url,
      lead.country || "",
      lead.focus || "",
      parseJsonArray(lead.emails).join("; "),
      parseJsonArray(lead.phones).join("; "),
      lead.hasVendorPortal ? "Yes" : "No",
      lead.hasRfqSystem ? "Yes" : "No",
      new Date(lead.lastChecked).toLocaleString(),
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
    toast.info("Refreshing leads data...");
    await refetch();
    toast.success("Leads data refreshed!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Leads Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Web scraping results from {leads.length} companies
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">With Emails</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.withEmails || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Vendor Portals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.withVendorPortal || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">RFQ Systems</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats?.withRfqSystem || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters & Actions</CardTitle>
            <CardDescription>Search and filter leads, or export data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search companies or URLs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country} value={country ?? ''}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={focusFilter} onValueChange={setFocusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Focus Areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Focus Areas</SelectItem>
                  {focusAreas.map(focus => (
                    <SelectItem key={focus} value={focus ?? ''}>{focus}</SelectItem>
                  ))}
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

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leads ({filteredLeads.length})</CardTitle>
            <CardDescription>Showing {filteredLeads.length} of {leads.length} total leads</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                <p className="mt-4 text-slate-600 dark:text-slate-400">Loading leads...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="mt-4 text-slate-600 dark:text-slate-400">No leads found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Focus</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead>Last Checked</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => {
                      const emails = parseJsonArray(lead.emails);
                      const phones = parseJsonArray(lead.phones);
                      
                      return (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-slate-400" />
                              {lead.companyName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{lead.country ?? "N/A"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{lead.focus ?? "N/A"}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                              {emails.length > 0 && (
                                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                  <Mail className="h-3 w-3" />
                                  {emails.length} email{emails.length > 1 ? 's' : ''}
                                </div>
                              )}
                              {phones.length > 0 && (
                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <Phone className="h-3 w-3" />
                                  {phones.length} phone{phones.length > 1 ? 's' : ''}
                                </div>
                              )}
                              {emails.length === 0 && phones.length === 0 && (
                                <span className="text-slate-400">No contact</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {lead.hasVendorPortal === 1 && (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Vendor
                                </Badge>
                              )}
                              {lead.hasRfqSystem === 1 && (
                                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                  RFQ
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(lead.lastChecked).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(lead.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
