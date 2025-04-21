
import React, { useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import { AdminGestureDetector } from "../admin/AdminGestureDetector";
import { cn } from "@/lib/utils";

type MainLayoutProps = {
  children: ReactNode;
};

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  
  return (
    <div className="flex flex-col min-h-screen bg-nexara-bg">
      {!isAdminRoute && <Navbar />}
      
      <main className={cn(
        "flex-1 container mx-auto px-4 pb-20 pt-4",
        isAdminRoute ? "pt-4" : "pt-20"
      )}>
        {children}
      </main>
      
      {!isAdminRoute && <BottomNav />}
      
      {/* Hidden admin gesture detector */}
      <AdminGestureDetector />
    </div>
  );
};

export default MainLayout;
