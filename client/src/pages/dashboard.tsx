import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Feed, Connection } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import FeedCard from "@/components/feed-card";
import ConnectionCard from "@/components/connection-card";
import CreateFeedModal from "@/components/modals/create-feed-modal";
import ConnectionModal from "@/components/modals/connection-modal";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const { user } = useAuth();
  const [createFeedModalOpen, setCreateFeedModalOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  
  // Fetch stats
  const { 
    data: stats,
    isLoading: statsLoading
  } = useQuery<{ activeFeeds: number; connectedApps: number; contentDelivered: number }>({
    queryKey: ["/api/stats"],
  });

  // Fetch feeds
  const {
    data: feeds,
    isLoading: feedsLoading
  } = useQuery<Feed[]>({
    queryKey: ["/api/feeds"],
  });

  // Fetch connections
  const {
    data: connections,
    isLoading: connectionsLoading
  } = useQuery<Connection[]>({
    queryKey: ["/api/connections"],
  });

  // Filter active feeds
  const activeFeeds = feeds?.filter(feed => feed.active) || [];

  // Loading state
  const isLoading = statsLoading || feedsLoading || connectionsLoading;

  return (
    <div className="flex-1">
      {/* Dashboard Content */}
      <div className="px-4 py-6 md:px-8 bg-gray-50 min-h-screen">
        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Dashboard Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p className="mt-1 text-sm text-gray-500">Manage your feeds and connections</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button 
                  type="button" 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  onClick={() => setConnectionModalOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Add Connection
                </button>
                <button 
                  type="button" 
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  onClick={() => setCreateFeedModalOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Feed
                </button>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {/* Active Feeds Card */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Feeds</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.activeFeeds || 0}</dd>
                  </dl>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <a href="#feeds" className="font-medium text-primary hover:text-blue-600">View all feeds</a>
                  </div>
                </div>
              </div>
              
              {/* Connected Apps */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Connected Apps</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.connectedApps || 0}</dd>
                  </dl>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <a href="#connections" className="font-medium text-primary hover:text-blue-600">Manage connections</a>
                  </div>
                </div>
              </div>
              
              {/* Content Delivered */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Content Delivered</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.contentDelivered || 0}</dd>
                  </dl>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <a href="#feeds" className="font-medium text-primary hover:text-blue-600">View delivery history</a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* All Feeds List */}
            <div className="mb-8" id="feeds">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Feeds</h3>
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
                    <button 
                      className="mt-2 text-primary hover:underline text-sm font-medium"
                      onClick={() => setCreateFeedModalOpen(true)}
                    >
                      Create your first feed
                    </button>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Connections */}
            <div id="connections">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Connections</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {connections && connections.map(connection => (
                  <ConnectionCard key={connection.id} connection={connection} />
                ))}
                
                {/* Add New Connection Card */}
                <div 
                  className="bg-gray-50 shadow rounded-lg p-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setConnectionModalOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <h4 className="mt-2 text-sm font-medium text-gray-900">Add New Connection</h4>
                  <p className="mt-1 text-xs text-gray-500">Connect to Gmail, TickTick, and more</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <CreateFeedModal 
        open={createFeedModalOpen} 
        onOpenChange={setCreateFeedModalOpen} 
        connections={connections || []}
      />
      <ConnectionModal
        open={connectionModalOpen}
        onOpenChange={setConnectionModalOpen}
      />
    </div>
  );
}
