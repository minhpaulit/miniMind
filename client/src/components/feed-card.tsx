import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Feed, Connection } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import EditFeedModal from "@/components/modals/edit-feed-modal";
import { Pencil, PauseCircle, PlayCircle, AlertCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface FeedCardProps {
  feed: Feed;
  connectionName: string;
}

export default function FeedCard({ feed, connectionName }: FeedCardProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch all connections for the edit modal
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
    enabled: isEditing, // Only fetch when editing modal is open
  });
  
  // Toggle feed active status
  const toggleFeedStatusMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/feeds/${feed.id}/toggle`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feeds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: feed.active ? "Feed paused" : "Feed activated",
        description: feed.active ? "The feed has been paused and will no longer send content." : "The feed has been activated and will resume sending content.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating feed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleToggleStatus = () => {
    toggleFeedStatusMutation.mutate();
  };

  // Calculate the date strings
  const getLastSentDate = () => {
    if (feed.updated_at) {
      return formatDistanceToNow(new Date(feed.updated_at), { addSuffix: true });
    }
    return "Not sent yet";
  };
  
  const getStartDate = () => {
    if (feed.created_at) {
      return format(new Date(feed.created_at), 'MMM dd, yyyy');
    }
    return "Unknown";
  };
  
  // Calculate completion rate for the progress bar
  const completionRate = feed.contents.length > 0 
    ? Math.round((feed.num_sent / feed.contents.length) * 100) 
    : 0;

  return (
    <>
      <div className={`block hover:bg-gray-50 ${!feed.active ? 'bg-gray-50' : ''}`}>
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <p className={`text-sm font-medium truncate ${feed.active ? 'text-primary' : 'text-gray-500'}`}>
                {feed.name}
              </p>
              {!feed.active && (
                <Badge variant="outline" className="ml-2 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
            <div className="ml-2 flex-shrink-0 flex">
              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                {feed.frequency}
              </p>
            </div>
          </div>
          <div className="mt-2 sm:flex sm:justify-between">
            <div className="sm:flex">
              <p className="flex items-center text-sm text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{connectionName}</span>
              </p>
            </div>
            
            {/* Last sent date */}
            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>
                Last sent: <time>{getLastSentDate()}</time>
              </p>
            </div>
          </div>
          
          {/* Start date */}
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
            <p>Started: <time>{getStartDate()}</time></p>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-500">Completion</span>
              <span className="text-xs font-medium text-gray-500">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <div className="mt-1 text-xs text-gray-500 flex justify-between">
              <span>{feed.num_sent} of {feed.contents.length} items sent</span>
              <span>{feed.contents.length - feed.num_sent} remaining</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="mt-3 flex justify-end space-x-2">
            <button 
              type="button" 
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-secondary hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="mr-1 h-3 w-3" />
              Edit
            </button>
            <button 
              type="button" 
              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={handleToggleStatus}
              disabled={toggleFeedStatusMutation.isPending}
            >
              {feed.active ? (
                <>
                  <PauseCircle className="mr-1 h-3 w-3" />
                  Pause
                </>
              ) : (
                <>
                  <PlayCircle className="mr-1 h-3 w-3" />
                  Activate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Feed Modal */}
      <EditFeedModal
        open={isEditing}
        onOpenChange={setIsEditing}
        feed={feed}
        connections={connections}
      />
    </>
  );
}
