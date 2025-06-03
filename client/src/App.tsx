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
import FacebookFriends from "@/pages/facebook-friends";
import FacebookBatchManagement from "@/pages/facebook-batch-management";
import FacebookAccountGeneration from "@/pages/facebook-account-generation";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/data-collection" component={DataCollection} />
            <Route path="/data-management" component={DataManagement} />
            <Route path="/export-data" component={ExportData} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/settings" component={Settings} />
            <Route path="/facebook-accounts" component={FacebookAccounts} />
            <Route path="/facebook-friends" component={FacebookFriends} />
            <Route path="/facebook-batch-management" component={FacebookBatchManagement} />
            <Route component={NotFound} />
          </Switch>
        </div>
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
