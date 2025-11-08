import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, RefreshCw, ExternalLink, Building2, MapPin, Link as LinkIcon, Shield } from "lucide-react";
import { toast } from "sonner";

export default function PortalMapping() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: portals = [], isLoading, refetch } = trpc.portals.list.useQuery();
  const { data: stats } = trpc.portals.stats.useQuery();

  // Filter portals
  const filteredPortals = useMemo(() => {
    if (!searchQuery) return portals;
    
    const query = searchQuery.toLowerCase();
    return portals.filter(portal =>
      portal.companyName.toLowerCase().includes(query) ||
      (portal.procurementPortalUrl && portal.procurementPortalUrl.toLowerCase().includes(query)) ||
      (portal.portalName && portal.portalName.toLowerCase().includes(query))
    );
  }, [portals, searchQuery]);

  const exportToCSV = () => {
    const headers = ["Company", "Country", "Focus Area", "Portal URL", "Portal Type", "Portal Name", "Registration URL", "Notes"];
    const rows = filteredPortals.map(portal => [
      portal.companyName,
      portal.country || "",
      portal.focus || "",
      portal.procurementPortalUrl || "",
      portal.portalType || "",
      portal.portalName || "",
      portal.registrationUrl || "",
      portal.portalNotes || "",
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portal-mapping-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Portal mapping exported!");
  };

  const handleRefresh = async () => {
    toast.info("Refreshing portal data...");
    await refetch();
    toast.success("Data refreshed!");
  };

  const getPortalTypeBadge = (type: string | null) => {
    if (!type) return null;
    
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      "public": { variant: "default", label: "Public" },
      "login-required": { variant: "secondary", label: "Login Required" },
      "registration-required": { variant: "secondary", label: "Registration Required" },
      "third-party": { variant: "outline", label: "Third-Party" },
    };
    
    const config = variants[type] || { variant: "outline" as const, label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Procurement Portal Mapping
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Mapped RFQ/procurement portals for {stats?.withPortals || 0} out of {stats?.total || 900} companies
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">With Portals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats?.withPortals || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Public Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats?.byType?.public || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Third-Party</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats?.byType?.['third-party'] || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Export</CardTitle>
            <CardDescription>Find portals by company name or portal URL</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search companies or portals..."
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
                <p className="mt-4 text-slate-600 dark:text-slate-400">Loading portal data...</p>
              </div>
            ) : filteredPortals.length === 0 ? (
              <div className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="mt-4 text-slate-600 dark:text-slate-400">No portals found</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                  The portal mapping scraper is running in background
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Company</TableHead>
                      <TableHead>Portal URL</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Portal Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPortals.map((portal) => (
                      <TableRow key={portal.companyId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <div>
                              <div>{portal.companyName}</div>
                              {portal.focus && (
                                <div className="text-xs text-slate-500">{portal.focus}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {portal.procurementPortalUrl ? (
                            <div className="flex items-center gap-2">
                              <LinkIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <a
                                href={portal.procurementPortalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm hover:underline truncate max-w-[300px]"
                                title={portal.procurementPortalUrl}
                              >
                                {new URL(portal.procurementPortalUrl).hostname}
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getPortalTypeBadge(portal.portalType)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-[200px] truncate" title={portal.portalName || undefined}>
                            {portal.portalName || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {portal.country && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {portal.country}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {portal.procurementPortalUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(portal.procurementPortalUrl!, '_blank')}
                                title="Open portal"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            {portal.registrationUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(portal.registrationUrl!, '_blank')}
                                title="Registration page"
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
        <Card className="mt-6 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <LinkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Portal Access Information
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  This table shows which portal each company uses to publish RFQs/procurement opportunities.
                  <strong> Public</strong> portals can be accessed directly. <strong>Login Required</strong> portals need registration.
                  <strong> Third-Party</strong> portals use platforms like Ariba, Coupa, or Workday.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
