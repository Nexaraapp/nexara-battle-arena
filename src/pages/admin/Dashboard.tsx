import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define SystemLog type
interface SystemLog {
  id: string;
  admin_id: string;
  action: string;
  details?: string;
  created_at: string;
}

const Dashboard = () => {
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  const fetchSystemLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching system logs:", error);
        toast.error("Failed to load system logs");
      } else {
        setSystemLogs(data as SystemLog[] || []);
      }
    } catch (error) {
      console.error("Error in fetchSystemLogs:", error);
    }
  };

  useEffect(() => {
    fetchSystemLogs();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">System Logs</h2>
        {systemLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-4 border-b">ID</th>
                  <th className="py-2 px-4 border-b">Admin ID</th>
                  <th className="py-2 px-4 border-b">Action</th>
                  <th className="py-2 px-4 border-b">Details</th>
                  <th className="py-2 px-4 border-b">Created At</th>
                </tr>
              </thead>
              <tbody>
                {systemLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border-b">{log.id}</td>
                    <td className="py-2 px-4 border-b">{log.admin_id}</td>
                    <td className="py-2 px-4 border-b">{log.action}</td>
                    <td className="py-2 px-4 border-b">{log.details || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No system logs found.</p>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
