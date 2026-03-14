import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BikeRacingGame from "./components/BikeRacingGame";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BikeRacingGame />
    </QueryClientProvider>
  );
}
