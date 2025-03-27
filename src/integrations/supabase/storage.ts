import { supabase } from './client';

// Make sure the order-images bucket exists
export const initOrderImagesStorage = async () => {
  try {
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError.message);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'order-images');

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket("order-images", {
        public: true, // set to false if you want private access only
        fileSizeLimit: 10485760, // 10MB limit
      });

      if (error && error.message !== "The resource already exists") {
        console.error("Error creating bucket:", error.message);
      } else {
        console.log("Successfully created order-images bucket");

        // Optional: Trigger a signed URL creation to confirm access
        // This won't succeed unless a file exists, so only log error if it's a policy issue
        const { error: policyError } = await supabase
          .storage
          .from("order-images")
          .createSignedUrl("dummy.txt", 60);

        if (policyError && !policyError.message.includes("not found")) {
          console.error("Error setting public access policy:", policyError.message);
        }
      }
    }
  } catch (error) {
    console.error("Error in initOrderImagesStorage:", error);
  }
};

// Initialize storage when this module is imported
initOrderImagesStorage().catch(console.error);
