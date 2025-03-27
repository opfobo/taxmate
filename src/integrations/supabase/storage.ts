import { supabase } from './client';

// Make sure the order-images bucket exists
export const initOrderImagesStorage = async () => {
  try {
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError || !buckets) {
      console.warn("Skipping bucket creation: unable to list buckets or no data returned.");
      return;
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'order-images');
    if (bucketExists) {
      console.log('Bucket already exists, skipping creation.');
      return;
    }

    const { error } = await supabase.storage.createBucket("order-images", {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    });

    if (error && error.message !== "The resource already exists") {
      console.error("Error creating bucket:", error.message);
    } else {
      console.log("Successfully created order-images bucket");

      // Optional test: Try creating a signed URL (may fail if file doesn't exist)
      const { error: policyError } = await supabase
        .storage
        .from("order-images")
        .createSignedUrl("dummy.txt", 60);

      if (policyError && !policyError.message.includes("not found")) {
        console.error("Error setting public access policy:", policyError.message);
      }
    }
  } catch (error) {
    console.error("Error in initOrderImagesStorage:", error);
  }
};

// Initialize storage when this module is imported
initOrderImagesStorage().catch(console.error);
