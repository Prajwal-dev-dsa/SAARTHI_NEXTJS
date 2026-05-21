"use client";

import { RootState } from "../store";
import UserDashboard from "../components/dashboards/UserDashboard";
import { useSelector } from "react-redux";
import PartnerDashboard from "@/components/dashboards/PartnerDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";

export default function HomePage() {
  const user = useSelector((state: RootState) => state.auth.user);

  // Conditional Rendering based on Role
  if (user?.role === "PARTNER") {
    return <PartnerDashboard />;
  }

  if (user?.role === "ADMIN") {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
}