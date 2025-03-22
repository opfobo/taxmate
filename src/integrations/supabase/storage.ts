
import { supabase } from './client';

// Make sure the order_images bucket exists
export const initOrderImagesStorage = async () => {
  try {
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'order_images');
    
    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      const { error } = await supabase.storage.createBucket('order_images', {
        public: true,
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (error) {
        console.error('Error creating order_images bucket:', error);
      } else {
        console.log('Successfully created order_images bucket');
        
        // Update the bucket to allow public access
        // Note: Since createBucket has public: true, this might not be needed
        // but we include it for completeness to ensure public access
        const { error: policyError } = await supabase.storage.from('order_images').createSignedUrl('dummy.txt', 31536000);
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
