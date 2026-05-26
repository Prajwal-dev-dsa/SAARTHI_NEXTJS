"use client";

import { RootState } from "../store";
import UserDashboard from "../components/dashboards/UserDashboard";
import { useSelector } from "react-redux";
import PartnerDashboard from "@/components/dashboards/PartnerDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import GeoLocationUpdater from "@/hooks/GeoLocationUpdater";

export default function HomePage() {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <>
      <GeoLocationUpdater />
      {/* Conditional Rendering based on Role */}
      {user?.role === "PARTNER" && <PartnerDashboard />}
      {user?.role === "ADMIN" && <AdminDashboard />}
      {user?.role !== "PARTNER" && user?.role !== "ADMIN" && <UserDashboard />}
    </>
  );
}