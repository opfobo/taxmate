
import { supabase } from './client';

// Make sure the order_images bucket exists
export const initOrderImagesStorage = async () => {
  // Check if the bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === 'order_images');
  
  if (!bucketExists) {
    // Create the bucket if it doesn't exist
    const { error } = await supabase.storage.createBucket('order_images', {
      public: true,
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (error) {
      console.error('Error creating order_images bucket:', error);
    }
  }
};

// Initialize storage when this module is imported
initOrderImagesStorage().catch(console.error);
