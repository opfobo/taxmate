import { supabase } from "./client";

// Simple utility to check if bucket is reachable
export const checkOrderImagesAccess = async () => {
  try {
    // Attempt to list files in the 'order-images' bucket root
    const { data, error } = await supabase.storage
      .from("order-images")
      .list("", {
        limit: 1,
      });

    if (error) {
      console.error("Access error on order-images bucket:", error.message);
    } else {
      console.log("✅ order-images bucket is accessible.");
    }
  } catch (error) {
    console.error("Unexpected error when accessing order-images bucket:", error);
  }
};

// Optional: run once on import for diagnostics only (can be removed in production)
checkOrderImagesAccess().catch(console.error);
