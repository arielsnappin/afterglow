import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@workspace/afterglow-design-system/components/ui/toaster';
import { TooltipProvider } from '@workspace/afterglow-design-system/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { Shell } from '@/components/shell';
import HomePage from '@/pages/home';
import EventsPage from '@/pages/events';
import EventDetailPage from '@/pages/event-detail';
import PeoplePage from '@/pages/people';
import FollowUpsPage from '@/pages/follow-ups';
import ImportsPage from '@/pages/imports';
import SettingsPage from '@/pages/settings';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } });

function Router() {
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/events" component={EventsPage} />
          <Route path="/events/:id" component={EventDetailPage} />
          <Route path="/people" component={PeoplePage} />
          <Route path="/follow-ups" component={FollowUpsPage} />
          <Route path="/integrations" component={ImportsPage} />
          <Route path="/imports" component={ImportsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Shell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
