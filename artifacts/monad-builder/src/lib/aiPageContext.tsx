/**
 * AI Page Context — lets any page push structured context to the global AIAssistant.
 * Pages call `useSetAIContext(contextString)` to update the assistant's awareness.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AIPageContextValue {
  context: string;
  setContext: (ctx: string) => void;
}

const AIPageContext = createContext<AIPageContextValue>({
  context: "",
  setContext: () => {},
});

export function AIPageContextProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState("");
  return (
    <AIPageContext.Provider value={{ context, setContext }}>
      {children}
    </AIPageContext.Provider>
  );
}

export function useAIPageContext() {
  return useContext(AIPageContext);
}

/** Hook for pages to declaratively push their context to the global AI assistant. */
export function useSetAIContext(context: string) {
  const { setContext } = useAIPageContext();
  useEffect(() => {
    setContext(context);
    return () => setContext("");
  }, [context, setContext]);
}
