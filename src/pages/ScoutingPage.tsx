
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
};

export default function ScoutingPage() {
  const [searchRequests, setSearchRequests] = useState<ScoutingOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
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

        setSearchRequests(data || []);
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

    fetchSearchRequests();
  }, [toast]);

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

  return (
    <PageLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Scouting Requests</h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading scouting requests...</p>
          </div>
        ) : searchRequests.length === 0 ? (
          <div className="bg-muted/50 p-8 rounded-lg text-center">
            <h3 className="text-xl font-medium mb-2">No search requests found</h3>
            <p className="text-muted-foreground">
              Start creating search requests to see them here.
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
                {searchRequests.map((request) => (
                  <TableRow key={request.id}>
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
                        >
                          {request.link}
                        </a>
                      ) : (
                        "No link provided"
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{request.status || "new"}</span>
                    </TableCell>
                    <TableCell>{formatDate(request.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
