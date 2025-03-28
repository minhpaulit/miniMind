import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Connection } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  Pencil, 
  ZapOff, 
  CheckCircle, 
  Loader2, 
  Zap
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConnectionCardProps {
  connection: Connection;
}

export default function ConnectionCard({ connection }: ConnectionCardProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  
  // Toggle connection status (connect/disconnect)
  const toggleConnectionMutation = useMutation({
    mutationFn: async () => {
      // In a real app, we would actually connect/disconnect here
      // For this demo, we'll just toggle the connection status
      const newStatus = connection.status === "Connected" ? "Disconnected" : "Connected";
      const res = await apiRequest("PATCH", `/api/connections/${connection.id}`, { 
        status: newStatus 
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      const action = connection.status === "Connected" ? "disconnected" : "connected";
      toast({
        title: `Connection ${action}`,
        description: `${connection.name} has been ${action}.`,
      });
      setConfirmDisconnect(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating connection",
        description: error.message,
        variant: "destructive",
      });
      setConfirmDisconnect(false);
    }
  });

  // Delete connection
  const deleteConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/connections/${connection.id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Connection removed",
        description: `${connection.name} has been removed.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing connection",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleToggleConnection = () => {
    if (connection.status === "Connected") {
      setConfirmDisconnect(true);
    } else {
      toggleConnectionMutation.mutate();
    }
  };

  const handleDeleteConnection = () => {
    if (confirm(`Are you sure you want to permanently delete ${connection.name}?`)) {
      deleteConnectionMutation.mutate();
    }
  };

  const isConnected = connection.status === "Connected";
  const isPending = toggleConnectionMutation.isPending;

  return (
    <>
      <div className={`bg-white shadow rounded-lg p-6 ${!isConnected ? 'border border-gray-200' : ''}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <img 
              className={`h-10 w-10 rounded-full ${!isConnected ? 'opacity-60' : ''}`}
              src={connection.icon} 
              alt={connection.name}
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).src = "https://placehold.co/40x40?text=" + connection.name.charAt(0);
              }}
            />
          </div>
          <div className="ml-4">
            <h4 className="text-lg font-medium text-gray-900">{connection.name}</h4>
            {isConnected ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                <ZapOff className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 px-3 text-xs"
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
          
          <Button 
            variant={isConnected ? "destructive" : "outline"}
            size="sm"
            onClick={handleToggleConnection}
            disabled={isPending}
            className={`h-8 px-3 text-xs ${isConnected ? 'bg-red-600 hover:bg-red-700' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                {isConnected ? "Disconnecting..." : "Connecting..."}
              </>
            ) : (
              <>
                {isConnected ? (
                  <>
                    <ZapOff className="h-3.5 w-3.5 mr-1" />
                    Disconnect
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 mr-1" />
                    Connect
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disconnect {connection.name}?</DialogTitle>
            <DialogDescription>
              This will disable the connection. You can reconnect at any time.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDisconnect(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => toggleConnectionMutation.mutate()}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Connection Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Connection</DialogTitle>
            <DialogDescription>
              Modify your connection settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center mb-4">
            <img 
              src={connection.icon}
              alt={connection.name}
              className="h-10 w-10 mr-3"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://placehold.co/40x40?text=" + connection.name.charAt(0);
              }}
            />
            <div>
              <h3 className="text-md font-medium">{connection.name}</h3>
              {isConnected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mt-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 mt-1">
                  <ZapOff className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
          </div>
          
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-500">Name</label>
              <input 
                id="name" 
                defaultValue={connection.name}
                className="col-span-3 h-9 rounded-md border border-input px-3 py-1 text-sm shadow-sm"
              />
            </div>
            
            {/* Add more fields as needed */}
          </div>
          
          <div className="mt-4 flex justify-between">
            <Button 
              variant="destructive"
              onClick={handleDeleteConnection}
            >
              Delete
            </Button>
            
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  toast({
                    title: "Changes saved",
                    description: "Your connection has been updated."
                  });
                  setIsEditing(false);
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
