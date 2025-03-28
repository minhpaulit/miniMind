import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Connection } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Eye } from "lucide-react";

interface CreateFeedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connections: Connection[];
}

const feedFormSchema = z.object({
  name: z.string().min(3, { message: "Feed name must be at least 3 characters" }),
  description: z.string().optional(),
  full_text: z.string().min(10, { message: "Content must be at least 10 characters" }),
  separator: z.string(),
  frequency: z.enum(["Daily", "Weekly", "Monthly"]),
  connection_id: z.number(),
  active: z.boolean().default(true),
});

type FeedFormValues = z.infer<typeof feedFormSchema>;

export default function CreateFeedModal({ open, onOpenChange, connections }: CreateFeedModalProps) {
  const { toast } = useToast();
  
  const form = useForm<FeedFormValues>({
    resolver: zodResolver(feedFormSchema),
    defaultValues: {
      name: "",
      description: "",
      full_text: "",
      separator: "\\n",
      frequency: "Daily",
      connection_id: connections[0]?.id || 0,
      active: true,
    },
  });

  // Parse the content based on the separator
  const splitContent = (text: string, separator: string) => {
    // Replace special separator placeholders with actual characters
    let actualSeparator = separator;
    if (separator === "\\n") actualSeparator = "\n";
    if (separator === "\\n\\n") actualSeparator = "\n\n";
    
    // Split the text and filter out empty items
    return text.split(actualSeparator)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  };

  // Watch form values for preview
  const formValues = useWatch({
    control: form.control,
    defaultValue: form.getValues()
  });
  
  // Compute preview items
  const [previewItems, setPreviewItems] = useState<string[]>([]);
  
  useEffect(() => {
    if (formValues.full_text && formValues.separator) {
      const items = splitContent(formValues.full_text, formValues.separator);
      setPreviewItems(items);
    } else {
      setPreviewItems([]);
    }
  }, [formValues.full_text, formValues.separator]);

  // Get connection name for preview
  const getConnectionName = (connectionId: number | undefined) => {
    if (!connectionId) return 'Unknown';
    const connection = connections.find(conn => conn.id === connectionId);
    return connection ? connection.name : 'Unknown';
  };

  const createFeedMutation = useMutation({
    mutationFn: async (data: FeedFormValues) => {
      // Create contents array from the full text
      const contents = splitContent(data.full_text, data.separator);
      
      // Add contents to the data
      const dataWithContents = {
        ...data,
        contents,
        completed_contents: []
      };
      
      const res = await apiRequest("POST", "/api/feeds", dataWithContents);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feeds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Feed created",
        description: "Your new feed has been created successfully.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create feed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FeedFormValues) {
    createFeedMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <DialogTitle className="text-lg leading-6 font-medium">Create New Feed</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Set up a new feed to deliver content to your connections.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              Feed Configuration
            </h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feed Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Daily Motivation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="A set of motivational quotes delivered daily" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="full_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter your full content here. It will be split according to the separator."
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="separator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Separator</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a separator" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="\\n">New Line</SelectItem>
                          <SelectItem value="\\n\\n">Paragraph Break</SelectItem>
                          <SelectItem value="---">Three Dashes (---)</SelectItem>
                          <SelectItem value=";">Semicolon (;)</SelectItem>
                          <SelectItem value=",">Comma (,)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="connection_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Connection</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a connection" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {connections.length > 0 ? (
                            connections.map(connection => (
                              <SelectItem key={connection.id} value={connection.id.toString()}>
                                {connection.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="0" disabled>No connections available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Activate immediately</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="sm:mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    className="mr-3"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createFeedMutation.isPending}>
                    {createFeedMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Feed"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
          
          {/* Right Column - Preview */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </h3>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  {formValues.name || "Untitled Feed"}
                  <Badge variant={formValues.active ? "default" : "outline"} className="ml-2">
                    {formValues.active ? "Active" : "Inactive"}
                  </Badge>
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {formValues.description || "No description"}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {formValues.frequency}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {formValues.connection_id ? getConnectionName(formValues.connection_id) : 'Select a connection'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-medium text-sm text-muted-foreground mb-2">
                    Content Items ({previewItems.length}):
                  </div>
                  {previewItems.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {previewItems.map((item, index) => (
                        <div 
                          key={index} 
                          className="p-3 border rounded-md text-sm bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 text-muted-foreground text-sm">
                      No content items to preview. Add content and select a separator.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}