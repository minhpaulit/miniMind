import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ConnectionType = "gmail" | "ticktick" | "notion" | "slack";

type AuthField = {
  name: string;
  label: string;
  type: string;
  hint?: string;
};

const connectionServices = [
  {
    id: "gmail",
    name: "Gmail",
    icon: "https://mail.google.com/favicon.ico",
    description: "Send content via email",
    url: "https://mail.google.com",
    authFields: [
      { name: "email", label: "Email Address", type: "email" },
      { name: "app_password", label: "App Password", type: "password", hint: "Create an App Password in your Google Account settings" }
    ]
  },
  {
    id: "ticktick",
    name: "TickTick",
    icon: "https://ticktick.com/favicon.ico",
    description: "Create tasks from content",
    url: "https://api.ticktick.com/open/v1/project",
    hasProjects: true,
    projects: [
      { id: "6796d6648f08687489478cfc", name: "My New Project Paul" },
      { id: "67ca45548f08ced866d9763a", name: "project2" },
    ],
    authFields: [
      { name: "api_key", label: "API Key", type: "password" },
      { name: "username", label: "Username", type: "text" }
    ]
  },
  {
    id: "notion",
    name: "Notion",
    icon: "https://www.notion.so/front-static/favicon.ico",
    description: "Add content to your pages",
    url: "https://www.notion.so/api/v3",
    authFields: [
      { name: "api_key", label: "Integration Token", type: "password", hint: "Create an integration in Notion and copy the secret" }
    ]
  },
  {
    id: "slack",
    name: "Slack",
    icon: "https://a.slack-edge.com/80588/marketing/img/meta/favicon-32.png",
    description: "Send content to channels",
    url: "https://slack.com/api",
    authFields: [
      { name: "bot_token", label: "Bot Token", type: "password", hint: "Create a Slack app and install it to your workspace" },
      { name: "channel_id", label: "Default Channel ID", type: "text" }
    ]
  },
];

const connectionFormSchema = z.object({
  name: z.string().min(3, { message: "Connection name must be at least 3 characters" }),
  ticktick_project: z.string().optional(),
  auth_method: z.enum(["oauth", "apikey"]),
  api_key: z.string().optional(),
  email: z.string().email().optional(),
  app_password: z.string().optional(),
  bot_token: z.string().optional(),
  channel_id: z.string().optional(),
  username: z.string().optional(),
});

type ConnectionFormValues = z.infer<typeof connectionFormSchema>;

export default function ConnectionModal({ open, onOpenChange }: ConnectionModalProps) {
  const { toast } = useToast();
  const [selectedConnectionType, setSelectedConnectionType] = useState<ConnectionType | null>(null);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState<string>("");
  
  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      name: "",
      ticktick_project: "6796d6648f08687489478cfc",
      auth_method: "apikey",
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (data: ConnectionFormValues) => {
      if (!selectedConnectionType) {
        throw new Error("Please select a connection type");
      }
      
      // For demo purposes, we'll simulate a successful test after 1.5 seconds
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, we would actually test the connection here
      // For this demo, most tests "succeed" except for Gmail if no app password is provided
      if (selectedConnectionType === 'gmail' && (!data.email || !data.app_password)) {
        throw new Error("Invalid Gmail credentials. Please provide both email and app password.");
      }
      
      return { message: `Successfully connected to ${selectedConnectionType}` };
    },
  });

  const testConnection = async () => {
    setTestStatus("testing");
    try {
      const result = await testConnectionMutation.mutateAsync(form.getValues());
      setTestStatus("success");
      setTestMessage(result.message);
    } catch (error: any) {
      setTestStatus("error");
      setTestMessage(error.message);
    }
  };

  const createConnectionMutation = useMutation({
    mutationFn: async (data: ConnectionFormValues) => {
      if (!selectedConnectionType) {
        throw new Error("Please select a connection type");
      }
      
      const selectedService = connectionServices.find(s => s.id === selectedConnectionType);
      if (!selectedService) {
        throw new Error("Invalid connection type");
      }
      
      // In a real app, we would handle OAuth flow or API key validation here
      // For this demo, we'll simulate a successful connection
      
      const connectionData = {
        name: data.name || selectedService.name,
        url: selectedService.url,
        token: `mock_token_for_${selectedConnectionType}`,
        status: "Connected",
        icon: selectedService.icon,
        projects: selectedConnectionType === 'ticktick' && data.ticktick_project
          ? JSON.stringify([{ id: data.ticktick_project, name: connectionServices.find(s => s.id === 'ticktick')?.projects?.find(p => p.id === data.ticktick_project)?.name || '' }])
          : null
      };
      
      const res = await apiRequest("POST", "/api/connections", connectionData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Connection added",
        description: "Your new connection has been added successfully.",
      });
      form.reset();
      setSelectedConnectionType(null);
      setTestStatus("idle");
      setTestMessage("");
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to add connection",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ConnectionFormValues) {
    if (testStatus !== "success") {
      toast({
        title: "Test connection first",
        description: "Please test your connection before saving.",
        variant: "destructive",
      });
      return;
    }
    createConnectionMutation.mutate(data);
  }

  const selectedService = selectedConnectionType 
    ? connectionServices.find(s => s.id === selectedConnectionType) 
    : null;

  const resetForm = () => {
    form.reset();
    setSelectedConnectionType(null);
    setTestStatus("idle");
    setTestMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <DialogTitle className="text-lg leading-6 font-medium">Add New Connection</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Connect to your preferred apps to deliver your feed content.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {!selectedConnectionType ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
            {connectionServices.map((service) => (
              <div 
                key={service.id}
                className="bg-gray-50 rounded-lg p-4 hover:bg-blue-50 transition-colors cursor-pointer border-2 border-transparent hover:border-primary"
                onClick={() => setSelectedConnectionType(service.id as ConnectionType)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                    <img 
                      src={service.icon} 
                      alt={service.name} 
                      className="h-8 w-8"
                      onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLImageElement).src = "https://placehold.co/32x32?text=" + service.name.charAt(0);
                      }}
                    />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                    <p className="text-xs text-gray-500">{service.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="settings">Connection Settings</TabsTrigger>
              <TabsTrigger value="preview">Connection Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 flex items-center">
                    <img 
                      src={selectedService?.icon} 
                      alt={selectedService?.name} 
                      className="h-5 w-5 mr-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/32x32?text=" + selectedService?.name?.charAt(0);
                      }}
                    />
                    Connect to {selectedService?.name}
                  </h4>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Connection Name</FormLabel>
                        <FormControl>
                          <Input placeholder={`My ${selectedService?.name}`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Authentication Fields */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium text-gray-700">Authentication Details</h5>
                    
                    {selectedService?.authFields?.map((authField: AuthField) => (
                      <FormField
                        key={authField.name}
                        control={form.control}
                        name={authField.name as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{authField.label}</FormLabel>
                            <FormControl>
                              <Input 
                                type={authField.type}
                                placeholder={`Enter ${authField.label.toLowerCase()}`} 
                                {...field} 
                              />
                            </FormControl>
                            {authField.hint && (
                              <p className="text-xs text-gray-500 mt-1">{authField.hint}</p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  
                  {selectedConnectionType === 'ticktick' && (
                    <FormField
                      control={form.control}
                      name="ticktick_project"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Project</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedService?.projects?.map(project => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Test Connection Status */}
                  {testStatus !== "idle" && (
                    <Card className={`border ${
                      testStatus === "testing" ? "border-gray-200" : 
                      testStatus === "success" ? "border-green-200" : 
                      "border-red-200"
                    }`}>
                      <CardContent className="p-4 flex items-center">
                        {testStatus === "testing" && <Loader2 className="h-5 w-5 mr-2 text-gray-500 animate-spin" />}
                        {testStatus === "success" && <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />}
                        {testStatus === "error" && <AlertCircle className="h-5 w-5 mr-2 text-red-500" />}
                        <p className={`text-sm ${
                          testStatus === "testing" ? "text-gray-600" : 
                          testStatus === "success" ? "text-green-600" : 
                          "text-red-600"
                        }`}>
                          {testStatus === "testing" ? "Testing connection..." : testMessage}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="pt-2 flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedConnectionType(null)}
                    >
                      Back
                    </Button>
                    
                    <div className="space-x-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={testConnection}
                        disabled={testConnectionMutation.isPending}
                      >
                        {testConnectionMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          "Test Connection"
                        )}
                      </Button>
                      
                      <Button 
                        type="submit" 
                        disabled={createConnectionMutation.isPending || testStatus !== "success"}
                      >
                        {createConnectionMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="preview">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center mb-4">
                    <img 
                      src={selectedService?.icon}
                      alt={selectedService?.name}
                      className="h-12 w-12 mr-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/48x48?text=" + selectedService?.name?.charAt(0);
                      }}
                    />
                    <div>
                      <h3 className="text-lg font-medium">
                        {form.watch("name") || `My ${selectedService?.name}`}
                      </h3>
                      <div className="flex items-center mt-1">
                        {testStatus === "success" ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Not Connected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-500">Service Type:</span>
                      <span className="col-span-2 font-medium">{selectedService?.name}</span>
                    </div>
                    
                    {selectedConnectionType === 'gmail' && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-500">Email:</span>
                        <span className="col-span-2 font-medium">{form.watch("email") || "Not set"}</span>
                      </div>
                    )}
                    
                    {selectedConnectionType === 'ticktick' && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-500">Project:</span>
                        <span className="col-span-2 font-medium">
                          {selectedService?.projects?.find(p => p.id === form.watch("ticktick_project"))?.name || "Not set"}
                        </span>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-gray-500">Status:</span>
                      <span className="col-span-2 font-medium">
                        {testStatus === "success" ? "Ready to use" : "Not connected"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      This connection will be used to send your feed content to {selectedService?.name}.
                      {testStatus !== "success" && " Please test the connection before saving."}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-4 flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setSelectedConnectionType(null)}
                >
                  Back
                </Button>
                
                <Button 
                  onClick={testConnection}
                  disabled={testConnectionMutation.isPending}
                >
                  {testConnectionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
