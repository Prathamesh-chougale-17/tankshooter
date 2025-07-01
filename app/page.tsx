"use client";
import { ClusterChecker } from "@/components/cluster/cluster-ui";
import { ErrorBoundary } from "@/components/error-boundary";
import HomePage from "@/components/ui/home";

const Home = () => {
  return (
    <ClusterChecker>
      <ErrorBoundary>
        <HomePage />
      </ErrorBoundary>
    </ClusterChecker>
  );
};

export default Home;
