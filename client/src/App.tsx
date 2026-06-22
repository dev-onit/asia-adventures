import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CalendarPage from "./pages/CalendarPage";

// On pplx.app, the Express backend runs on port 5000 and must be accessed
// via the /port/5000/ proxy prefix. On localhost/dev, /api works directly.
const API_BASE = window.location.hostname.includes("pplx.app")
  ? "/port/5000"
  : "";

export { API_BASE };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const path = queryKey[0] as string;
        const res = await fetch(`${API_BASE}${path}`);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      },
      staleTime: 0,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CalendarPage />
    </QueryClientProvider>
  );
}
