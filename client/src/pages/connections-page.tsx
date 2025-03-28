import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Connection } from "@shared/schema";
import { Loader2, Plus } from "lucide-react";
import ConnectionCard from "@/components/connection-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ConnectionModal from "@/components/modals/connection-modal";

export default function ConnectionsPage() {
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  
  // Fetch connections
  const {
    data: connections = [],
    isLoading
  } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
  });

  return (
    <div className="flex-1 px-4 py-6 md:px-8 overflow-auto">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Connections</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your external service connections</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            onClick={() => setConnectionModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Connection
          </Button>
        </div>
      </div>

      {/* Connections Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connections && connections.map(connection => (
            <ConnectionCard key={connection.id} connection={connection} />
          ))}
          
          {/* Add New Connection Card */}
          <div 
            className="bg-gray-50 shadow rounded-lg p-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setConnectionModalOpen(true)}
          >
            <Plus className="h-12 w-12 text-gray-400" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">Add New Connection</h4>
            <p className="mt-1 text-xs text-gray-500">Connect to Gmail, TickTick, and more</p>
          </div>
          
          {connections.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="pt-6 flex flex-col items-center justify-center h-32 text-center">
                <p className="text-gray-500">No connections added yet</p>
                <Button 
                  variant="link"
                  className="mt-2"
                  onClick={() => setConnectionModalOpen(true)}
                >
                  Add your first connection
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Connection Modal */}
      <ConnectionModal
        open={connectionModalOpen}
        onOpenChange={setConnectionModalOpen}
      />
    </div>
  );
}