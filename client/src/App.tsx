import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/layout/sidebar";
import Footer from "@/components/layout/footer";
import Dashboard from "@/pages/dashboard";
import DataCollection from "@/pages/data-collection";
import DataManagement from "@/pages/data-management";
import ExportData from "@/pages/export-data";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import FacebookAccounts from "@/pages/facebook-accounts";
import FacebookAccountManager from "@/pages/facebook-account-manager";
import FacebookBatchManagement from "@/pages/facebook-batch-management";
import FacebookAccountGeneration from "@/pages/facebook-account-generation";
import AutoMessaging from "@/pages/auto-messaging";
import AdManager from "@/pages/ad-manager";
import FacebookApiTest from "@/pages/facebook-api-test";
import FacebookAdsAnalytics from "@/pages/facebook-ads-analytics";
import FacebookAdContentExtractor from "@/pages/facebook-ad-content-extractor";
import NotFound from "@/pages/not-found";

function Router() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className="flex-1 flex flex-col min-h-0">
        <main className="flex-1 overflow-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/data-collection" component={DataCollection} />
            <Route path="/data-management" component={DataManagement} />
            <Route path="/export-data" component={ExportData} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/settings" component={Settings} />
            <Route path="/facebook-accounts" component={FacebookAccounts} />
            <Route path="/facebook-account-manager" component={FacebookAccountManager} />
            <Route path="/facebook-account-generation" component={FacebookAccountGeneration} />
            <Route path="/facebook-batch-management" component={FacebookBatchManagement} />
            <Route path="/facebook-api-test" component={FacebookApiTest} />
            <Route path="/facebook-ads-analytics" component={FacebookAdsAnalytics} />
            <Route path="/facebook-ad-content-extractor" component={FacebookAdContentExtractor} />
            <Route path="/auto-messaging" component={AutoMessaging} />
            <Route path="/ad-manager" component={AdManager} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
