"use client";
import { ClusterChecker } from "@/components/cluster/cluster-ui";
import HomePage from "@/components/ui/home";

const Home = () => {
  return (
    <ClusterChecker>
      <HomePage />
    </ClusterChecker>
  );
};

export default Home;
