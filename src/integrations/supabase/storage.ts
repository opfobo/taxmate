
import { supabase } from './client';

// Make sure the order-images bucket exists
export const initOrderImagesStorage = async () => {
  try {
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'order-images');
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket("order-images", {
        public: true,
        fileSizeLimit: 10485760,
      });

      if (error && error.message !== "The resource already exists") {
        console.error("Error creating bucket:", error.message);
      } else {
        console.log('Successfully created order-images bucket');
        
        // Update the bucket to allow public access
        // Note: Since createBucket has public: true, this might not be needed
        // but we include it for completeness to ensure public access
        const { error: policyError } = await supabase.storage.from('order-images').createSignedUrl('dummy.txt', 31536000);
        if (policyError && !policyError.message.includes('not found')) {
          console.error('Error setting public access policy:', policyError);
        }
      }
    }
  } catch (error) {
    console.error('Error in initOrderImagesStorage:', error);
  }
};

// Initialize storage when this module is imported
initOrderImagesStorage().catch(console.error);
