
import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  Dialog,
  DialogContent,
  DialogClose
} from "@/components/ui/dialog";
import { X } from "lucide-react";

// Define types for the component props
type ScoutingOrder = {
  id: string;
  created_at: string;
  search_description: string | null;
  price_limit: number | null;
  link: string | null;
  status: string | null;
  currency: string | null;
  image_urls?: string[] | null;
  notes?: string | null;
};

interface ScoutingRequestDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  request: ScoutingOrder | null;
  onUpdate: () => void;
}

export function ScoutingRequestDetailsDrawer({
  isOpen,
  onClose,
  request,
  onUpdate,
}: ScoutingRequestDetailsDrawerProps) {
  const { toast } = useToast();
  
  // Local state for form values
  const [status, setStatus] = useState<string | null>(request?.status || "new");
  const [notes, setNotes] = useState<string | null>(request?.notes || "");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Image preview states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset form state when request changes
  React.useEffect(() => {
    if (request) {
      setStatus(request.status || "new");
      setNotes(request.notes || "");
    }
  }, [request]);

  // Get the currently selected image for preview
  const getCurrentImage = (): string => {
    if (!request?.image_urls || !request.image_urls.length) return "";
    return request.image_urls[currentImageIndex];
  };

  // Navigation functions for the image preview
  const goToPreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!request?.image_urls || !request.image_urls.length) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? request.image_urls!.length - 1 : prev - 1
    );
  };

  const goToNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!request?.image_urls || !request.image_urls.length) return;
    setCurrentImageIndex((prev) => 
      prev === request.image_urls!.length - 1 ? 0 : prev + 1
    );
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewOpen) return;
      
      if (e.key === "ArrowLeft") {
        setCurrentImageIndex((prev) => {
          if (!request?.image_urls || !request.image_urls.length) return prev;
          return prev === 0 ? request.image_urls.length - 1 : prev - 1;
        });
      } else if (e.key === "ArrowRight") {
        setCurrentImageIndex((prev) => {
          if (!request?.image_urls || !request.image_urls.length) return prev;
          return prev === request.image_urls.length - 1 ? 0 : prev + 1;
        });
      } else if (e.key === "Escape") {
        setPreviewOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewOpen, request?.image_urls]);

  // Open image preview with the clicked image
  const openImagePreview = (index: number) => {
    setCurrentImageIndex(index);
    setPreviewOpen(true);
  };

  // Status badge component
  const renderStatusBadge = (status: string | null) => {
    const safeStatus = status || "new";
    
    // Badge variants map based on status
    const badgeVariantMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      new: { variant: "outline", className: "bg-gray-100 text-gray-700" },
      in_progress: { variant: "outline", className: "bg-orange-100 text-orange-700 border-orange-200" },
      found: { variant: "outline", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      not_found: { variant: "destructive", className: "" },
      ordered: { variant: "outline", className: "bg-blue-100 text-blue-700 border-blue-200" },
      fulfilled: { variant: "outline", className: "bg-green-100 text-green-700 border-green-200" },
      canceled: { variant: "outline", className: "bg-gray-100 text-gray-500 line-through" }
    };
    
    const { variant, className } = badgeVariantMap[safeStatus] || badgeVariantMap["new"];
    
    return (
      <Badge variant={variant} className={className}>
        {safeStatus.replace("_", " ")}
      </Badge>
    );
  };

  const handleSave = async () => {
    if (!request) return;
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Search request updated successfully",
      });
      
      onUpdate(); // Refresh the parent component
      onClose(); // Close the drawer
    } catch (err) {
      console.error("Error updating search request:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update the search request"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Search Request Details</SheetTitle>
            <SheetDescription>
              Created on {request ? formatDate(request.created_at) : ""}
            </SheetDescription>
          </SheetHeader>
          
          {request && (
            <ScrollArea className="h-[calc(100vh-180px)] pr-4">
              <div className="space-y-6">
                {/* Status Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Current Status</h3>
                    {renderStatusBadge(status)}
                  </div>
                  
                  <Select value={status || "new"} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="found">Found</SelectItem>
                      <SelectItem value="not_found">Not Found</SelectItem>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="fulfilled">Fulfilled</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Description Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Search Description</h3>
                  <div className="p-3 bg-muted/30 rounded-md">
                    <p className="whitespace-pre-wrap">{request.search_description || "No description provided"}</p>
                  </div>
                </div>
                
                {/* Price Limit Section */}
                {request.price_limit && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Price Limit</h3>
                    <div className="p-3 bg-muted/30 rounded-md">
                      <p>{request.price_limit} {request.currency || "EUR"}</p>
                    </div>
                  </div>
                )}
                
                {/* Reference Link Section */}
                {request.link && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Reference Link</h3>
                    <div className="p-3 bg-muted/30 rounded-md overflow-hidden">
                      <a 
                        href={request.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-words"
                      >
                        {request.link}
                      </a>
                    </div>
                  </div>
                )}
                
                {/* Images Section */}
                {request.image_urls && request.image_urls.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Images</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {request.image_urls.map((imageUrl, index) => (
                        <div 
                          key={index} 
                          className="rounded-md overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={() => openImagePreview(index)}
                        >
                          <AspectRatio ratio={1}>
                            <img
                              src={imageUrl}
                              alt={`Reference image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </AspectRatio>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Notes Section */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Internal Notes</h3>
                  <Textarea
                    value={notes || ""}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes or comments..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </ScrollArea>
          )}
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Full-screen Image Preview */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[90vw] h-[90vh] p-0 border-none bg-black/80 shadow-xl flex items-center justify-center">
          <div className="relative w-full h-full overflow-auto scrollbar-hidden bg-black p-4">
            {/* Navigation controls */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10">
              <div className="text-white bg-black/50 px-2 py-1 rounded text-sm">
                {request?.image_urls && request.image_urls.length > 0 ? (
                  `${currentImageIndex + 1} of ${request.image_urls.length}`
                ) : ""}
              </div>
              <DialogClose className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
            
            {/* Image display */}
            <img 
              src={getCurrentImage()} 
              alt="Preview" 
              className="mx-auto my-0"
            />
            
            {/* Previous button */}
            {request?.image_urls && request.image_urls.length > 1 && (
              <Button 
                variant="outline" 
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 border-none text-white hover:bg-black/70 h-10 w-10 rounded-full"
                onClick={goToPreviousImage}
              >
                <span className="sr-only">Previous</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </Button>
            )}
            
            {/* Next button */}
            {request?.image_urls && request.image_urls.length > 1 && (
              <Button 
                variant="outline" 
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 border-none text-white hover:bg-black/70 h-10 w-10 rounded-full"
                onClick={goToNextImage}
              >
                <span className="sr-only">Next</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
