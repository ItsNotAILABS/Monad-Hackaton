import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from 'sonner';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Templates from '@/pages/Templates';
import Builder from '@/pages/Builder';
import Preview from '@/pages/Preview';
import Workspace from '@/pages/Workspace';
import Platform from '@/pages/Platform';
import AIStudio from '@/pages/AIStudio';
import Learn from '@/pages/Learn';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { AIPageContextProvider, useAIPageContext } from '@/lib/aiPageContext';

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4 font-mono">404</h1>
        <p className="text-lg text-white/60">System not found.</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/templates" component={Templates} />
      <Route path="/builder/:id" component={Builder} />
      <Route path="/preview/:id" component={Preview} />
      <Route path="/workspace" component={Workspace} />
      <Route path="/platform" component={Platform} />
      <Route path="/ai" component={AIStudio} />
      <Route path="/learn" component={Learn} />
      <Route component={NotFound} />
    </Switch>
  );
}

/** Reads the current AI page context and passes it to the floating assistant. */
function AIAssistantWithContext() {
  const { context } = useAIPageContext();
  return <AIAssistant context={context || undefined} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AIPageContextProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
          {/* Global floating AI assistant — context-aware via AIPageContext */}
          <AIAssistantWithContext />
          {/* Global toast notifications */}
          <Toaster position="bottom-right" theme="dark" richColors closeButton />
        </WouterRouter>
      </AIPageContextProvider>
    </QueryClientProvider>
  );
}

export default App;
