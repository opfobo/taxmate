import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/common/PageLayout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash, Image, Plus, Filter } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ScoutingRequestDetailsDrawer } from "@/components/ScoutingRequestDetailsDrawer";

// Define a local type for search-request orders
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

// Form data type
type ScoutingFormData = {
  search_description: string;
  price_limit: number | null;
  link: string | null;
  status: string;
  image_urls?: string[] | null;
};

// Define status options
const statusOptions = [
  "all",
  "new", 
  "in_progress", 
  "found", 
  "not_found", 
  "ordered", 
  "fulfilled", 
  "canceled"
];

export default function ScoutingPage() {
  const [searchRequests, setSearchRequests] = useState<ScoutingOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<ScoutingFormData>({
    search_description: "",
    price_limit: null,
    link: null,
    status: "new",
    image_urls: [],
  });
  
  // Image upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Add new state for the details drawer
  const [selectedRequest, setSelectedRequest] = useState<ScoutingOrder | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchSearchRequests();
  }, [toast]);

  const fetchSearchRequests = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_type", "search-request")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      // Get images for each order
      const ordersWithImages = await Promise.all((data || []).map(async (order) => {
        const { data: imageData } = await supabase
          .from("order_images")
          .select("image_url")
          .eq("order_id", order.id);
        
        return {
          ...order,
          image_urls: imageData?.map(img => img.image_url) || [],
        };
      }));

      setSearchRequests(ordersWithImages || []);
    } catch (err) {
      console.error("Error fetching search requests:", err);
      setError("Failed to load search requests. Please try again later.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load search requests",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'price_limit') {
      const numValue = value === '' ? null : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];

    setUploading(true);
    setUploadError(null);
    const uploadedUrls: string[] = [];

    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `order-images/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('order-images')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: publicUrl } = supabase.storage
          .from('order-images')
          .getPublicUrl(filePath);

        if (publicUrl) {
          uploadedUrls.push(publicUrl.publicUrl);
        }
      }

      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      setUploadError("Failed to upload one or more images.");
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "User not identified. Please log in again.",
      });
      return;
    }
    
    if (!formData.search_description) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a search description",
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // Upload images if any
      let imageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        imageUrls = await uploadImages();
      }
      
      // Submit order data to database without image_urls
      const { data, error } = await supabase
        .from("orders")
        .insert([
          {
            search_description: formData.search_description,
            price_limit: formData.price_limit,
            link: formData.link,
            status: formData.status,
            order_type: "search-request",
            currency: "EUR", // Default currency
            amount: 0, // Required field based on error
            order_number: `SR-${Date.now()}`, // Required field based on error
            user_id: user?.id, // 🧩 wichtig für RLS!

          },
        ])
        .select();

      if (error) {
        throw error;
      }

      // After successful order insert, add image references to order_images table
      if (imageUrls.length > 0 && data && data.length > 0) {
        const orderId = data[0].id;
        const userId = (await supabase.auth.getUser()).data.user?.id;
        
        // Insert each image reference
        for (const imageUrl of imageUrls) {
          const { error: imageError } = await supabase
            .from("order_images")
            .insert([
              { 
                order_id: orderId, 
                image_url: imageUrl, 
                uploaded_by: userId || null
              }
            ]);
            
          if (imageError) {
            console.error("Error saving image reference:", imageError);
          }
        }
      }

      // Success
      toast({
        title: "Success",
        description: "Search request created successfully",
      });
      
      // Reset form
      setFormData({
        search_description: "",
        price_limit: null,
        link: null,
        status: "new",
        image_urls: [],
      });
      setSelectedFiles([]);
      
      // Refresh the list
      fetchSearchRequests();
    } catch (err) {
      console.error("Error creating search request:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create search request",
      });
    } finally {
      setUploading(false);
    }
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

  // Row highlight class based on status
  const getRowHighlightClass = (status: string | null) => {
    const safeStatus = status || "new";
    
    const rowHighlightMap: Record<string, string> = {
      new: "hover:bg-gray-50",
      in_progress: "bg-orange-50/30 hover:bg-orange-50/50",
      found: "bg-yellow-50/30 hover:bg-yellow-50/50",
      not_found: "bg-red-50/30 hover:bg-red-50/50",
      ordered: "bg-blue-50/30 hover:bg-blue-50/50",
      fulfilled: "bg-green-50/30 hover:bg-green-50/50",
      canceled: "bg-gray-50/30 hover:bg-gray-50/50"
    };
    
    return rowHighlightMap[safeStatus] || rowHighlightMap["new"];
  };

  const renderImageThumbnail = (imageUrl: string | null | undefined) => {
    if (!imageUrl) {
      return (
        <div className="bg-gray-200 rounded-md flex items-center justify-center w-16 h-16">
          <span className="text-gray-400 text-xs">No image</span>
        </div>
      );
    }

    return (
      <div className="w-16 h-16 overflow-hidden rounded-md">
        <AspectRatio ratio={1 / 1}>
          <img
            src={imageUrl}
            alt="Product"
            className="object-cover w-full h-full"
          />
        </AspectRatio>
      </div>
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM d, yyyy");
  };
  
  // Filter search requests by status
  const filteredSearchRequests = searchRequests.filter((request) => {
    if (statusFilter === "all") return true;
    return request.status === statusFilter;
  });

  // Open the drawer when a row is clicked
  const handleRowClick = (request: ScoutingOrder) => {
    setSelectedRequest(request);
    setIsDrawerOpen(true);
  };

  // Close the drawer
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <PageLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Scouting Requests</h1>

        {/* Create new scouting request form */}
        <div className="mb-8 p-6 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-4">Create New Search Request</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="search_description">Search Description <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="search_description"
                  name="search_description"
                  placeholder="Describe what you are looking for..."
                  value={formData.search_description}
                  onChange={handleFormChange}
                  className="mt-1"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_limit">Price Limit</Label>
                  <Input
                    id="price_limit"
                    name="price_limit"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Maximum price"
                    value={formData.price_limit ?? ''}
                    onChange={handleFormChange}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={handleStatusChange}
                  >
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
              </div>
              
              <div>
                <Label htmlFor="link">Reference Link</Label>
                <Input
                  id="link"
                  name="link"
                  type="url"
                  placeholder="https://"
                  value={formData.link ?? ''}
                  onChange={handleFormChange}
                  className="mt-1"
                />
              </div>
              
              {/* Image Upload */}
              <div>
                <Label>Product Images</Label>
                <div className="mt-2 space-y-4">
                  {/* File Input */}
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="mr-2"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Add Image
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedFiles.length} file(s) selected
                    </span>
                  </div>
                  
                  {/* Preview selected files */}
                  {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                      {selectedFiles.map((file, index) => (
                        <div 
                          key={index} 
                          className="relative border rounded-md p-1 bg-background"
                        >
                          <div className="aspect-square w-full rounded-md overflow-hidden">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Selected file ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => removeFile(index)}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {uploadError && (
                    <div className="text-sm text-destructive mt-1">{uploadError}</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit"
                disabled={!formData.search_description || uploading}
                className="flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                {uploading ? "Creating..." : "Create Search Request"}
              </Button>
            </div>
          </form>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status filter */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center mr-2">
            <Filter className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Filter by status:</span>
          </div>
          
          {statusOptions.map((status) => (
            <Badge 
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              className={`
                cursor-pointer capitalize
                ${statusFilter === status ? "bg-primary" : "hover:bg-muted"}
              `}
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All" : status.replace("_", " ")}
            </Badge>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading scouting requests...</p>
          </div>
        ) : filteredSearchRequests.length === 0 ? (
          <div className="bg-muted/50 p-8 rounded-lg text-center">
            <h3 className="text-xl font-medium mb-2">No search requests found</h3>
            <p className="text-muted-foreground">
              {statusFilter !== "all" 
                ? `No requests with status "${statusFilter}" found. Try a different filter.`
                : "Start creating search requests to see them here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableCaption>List of all search requests</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead className="max-w-xs">Description</TableHead>
                  <TableHead>Price Limit</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSearchRequests.map((request) => (
                  <TableRow 
                    key={request.id} 
                    className={`${getRowHighlightClass(request.status)} cursor-pointer`}
                    onClick={() => handleRowClick(request)}
                  >
                    <TableCell>{renderImageThumbnail(request.image_urls ? request.image_urls[0] : null)}</TableCell>
                    <TableCell className="max-w-xs break-words">
                      {request.search_description || "No description provided"}
                    </TableCell>
                    <TableCell>
                      {request.price_limit
                        ? `${request.price_limit} ${request.currency}`
                        : "No limit"}
                    </TableCell>
                    <TableCell>
                      {request.link ? (
                        <a
                          href={request.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline truncate max-w-[150px] inline-block"
                          onClick={(e) => e.stopPropagation()} // Prevent row click when clicking the link
                        >
                          {request.link}
                        </a>
                      ) : (
                        "No link provided"
                      )}
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>{formatDate(request.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Add the drawer component */}
        <ScoutingRequestDetailsDrawer 
          isOpen={isDrawerOpen} 
          onClose={handleCloseDrawer}
          request={selectedRequest}
          onUpdate={fetchSearchRequests}
        />
      </div>
    </PageLayout>
  );
}
