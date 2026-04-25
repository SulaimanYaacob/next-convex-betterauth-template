"use client";
import { useConvexAuth } from "convex/react";

export default function Home() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return <div className="m-auto">Fresh Start</div>;
}
