import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Feed, Connection } from "@shared/schema";
import { Loader2, Plus } from "lucide-react";
import FeedCard from "@/components/feed-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CreateFeedModal from "@/components/modals/create-feed-modal";

export default function FeedsPage() {
  const [createFeedModalOpen, setCreateFeedModalOpen] = useState(false);
  
  // Fetch feeds
  const {
    data: feeds = [],
    isLoading: feedsLoading
  } = useQuery<Feed[]>({
    queryKey: ["/api/feeds"],
  });

  // Fetch connections
  const {
    data: connections = [],
    isLoading: connectionsLoading
  } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
  });

  // Loading state
  const isLoading = feedsLoading || connectionsLoading;

  return (
    <div className="flex-1 px-4 py-6 md:px-8 overflow-auto">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feeds</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your content feeds</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            onClick={() => setCreateFeedModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Feed
          </Button>
        </div>
      </div>

      {/* Feeds List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {feeds && feeds.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {feeds.map(feed => (
                  <li key={feed.id}>
                    <FeedCard 
                      feed={feed} 
                      connectionName={(connections?.find(c => c.id === feed.connection_id)?.name) || "Unknown"}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 flex flex-col items-center justify-center h-32 text-center">
                <p className="text-gray-500">No feeds created yet</p>
                <Button 
                  variant="link"
                  className="mt-2"
                  onClick={() => setCreateFeedModalOpen(true)}
                >
                  Create your first feed
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create Feed Modal */}
      <CreateFeedModal 
        open={createFeedModalOpen} 
        onOpenChange={setCreateFeedModalOpen} 
        connections={connections || []}
      />
    </div>
  );
}