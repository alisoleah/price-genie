import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import sharp from "sharp";

/**
 * Upload product image to S3 and return the URL
 * Automatically resizes and optimizes images
 */
export async function uploadProductImage(
  imageBuffer: Buffer,
  productId: number,
  originalFilename?: string
): Promise<{ url: string; key: string }> {
  try {
    // Optimize image: resize to max 800x800, convert to WebP for better compression
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(800, 800, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Generate unique key with random suffix to prevent enumeration
    const randomSuffix = nanoid(10);
    const extension = "webp";
    const fileKey = `products/${productId}/${randomSuffix}.${extension}`;

    // Upload to S3
    const result = await storagePut(fileKey, optimizedBuffer, "image/webp");

    return {
      url: result.url,
      key: fileKey,
    };
  } catch (error) {
    console.error("Error uploading product image:", error);
    throw new Error("Failed to upload product image");
  }
}

/**
 * Download image from URL and upload to S3
 * Used for scraping product images from e-commerce platforms
 */
export async function downloadAndUploadImage(
  imageUrl: string,
  productId: number
): Promise<{ url: string; key: string } | null> {
  try {
    // Download image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to download image from ${imageUrl}: ${response.statusText}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    return await uploadProductImage(buffer, productId);
  } catch (error) {
    console.error(`Error downloading and uploading image from ${imageUrl}:`, error);
    return null;
  }
}

/**
 * Generate thumbnail from image buffer
 * Returns a smaller version for list views
 */
export async function generateThumbnail(
  imageBuffer: Buffer,
  productId: number
): Promise<{ url: string; key: string }> {
  try {
    // Create thumbnail: 200x200, WebP
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(200, 200, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 80 })
      .toBuffer();

    // Generate unique key
    const randomSuffix = nanoid(10);
    const fileKey = `products/${productId}/thumb-${randomSuffix}.webp`;

    // Upload to S3
    const result = await storagePut(fileKey, thumbnailBuffer, "image/webp");

    return {
      url: result.url,
      key: fileKey,
    };
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    throw new Error("Failed to generate thumbnail");
  }
}

/**
 * Process and upload multiple product images
 * Returns array of uploaded image URLs
 */
export async function uploadProductImages(
  images: Array<{ buffer: Buffer; filename?: string }>,
  productId: number
): Promise<Array<{ url: string; key: string; thumbnail?: { url: string; key: string } }>> {
  const results = [];

  for (const image of images) {
    try {
      // Upload main image
      const mainImage = await uploadProductImage(image.buffer, productId, image.filename);

      // Generate thumbnail
      const thumbnail = await generateThumbnail(image.buffer, productId);

      results.push({
        url: mainImage.url,
        key: mainImage.key,
        thumbnail: {
          url: thumbnail.url,
          key: thumbnail.key,
        },
      });
    } catch (error) {
      console.error(`Error processing image for product ${productId}:`, error);
      // Continue with other images even if one fails
    }
  }

  return results;
}

/**
 * Validate image file type and size
 */
export function validateImage(buffer: Buffer, maxSizeMB: number = 10): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  const sizeMB = buffer.length / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `Image size (${sizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
    };
  }

  // Check if it's a valid image using sharp
  try {
    sharp(buffer);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: "Invalid image format. Supported formats: JPEG, PNG, WebP, GIF",
    };
  }
}

/**
 * Get placeholder image URL for products without images
 */
export function getPlaceholderImageUrl(category?: string): string {
  // You can customize placeholder images based on category
  const placeholders: Record<string, string> = {
    Electronics: "https://placehold.co/800x800/1e40af/white?text=Electronics",
    Groceries: "https://placehold.co/800x800/16a34a/white?text=Groceries",
    "Food & Beverage": "https://placehold.co/800x800/ea580c/white?text=Food",
    "Personal Care": "https://placehold.co/800x800/9333ea/white?text=Personal+Care",
    "Home & Kitchen": "https://placehold.co/800x800/0891b2/white?text=Home",
  };

  return category && placeholders[category]
    ? placeholders[category]
    : "https://placehold.co/800x800/6b7280/white?text=Product";
}
