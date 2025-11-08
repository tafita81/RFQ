import { Button } from "@/components/ui/button";
import { ShoppingCart, TrendingUp, Calendar, FileText } from "lucide-react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * All content in this page are only for example, replace with your own feature implementation
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-slate-50 mb-6">
            Buyer Opportunities Dashboard
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            Discover RFQs, tenders, and procurement opportunities from 900+ companies worldwide
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/opportunities">
              <Button size="lg" className="text-lg px-8 py-6">
                <ShoppingCart className="mr-2 h-5 w-5" />
                View Opportunities
              </Button>
            </Link>
            <Link href="/leads">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <FileText className="mr-2 h-5 w-5" />
                Company Contacts
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-2 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
            <CardHeader>
              <ShoppingCart className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mb-2" />
              <CardTitle>RFQs & Tenders</CardTitle>
              <CardDescription>
                Real procurement opportunities extracted from company websites using AI-powered scraping
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
            <CardHeader>
              <Calendar className="h-10 w-10 text-orange-600 dark:text-orange-400 mb-2" />
              <CardTitle>Recent Opportunities</CardTitle>
              <CardDescription>
                Filter by last 7, 14, or 30 days to find the freshest business opportunities
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-2" />
              <CardTitle>Smart Analysis</CardTitle>
              <CardDescription>
                AI extracts titles, descriptions, deadlines, values, and requirements from each opportunity
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
