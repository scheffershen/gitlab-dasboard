import { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "GitLab Dashboard",
  description: "GitLab Activity Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 