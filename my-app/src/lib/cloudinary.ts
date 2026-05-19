import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (
  file: Blob,
): Promise<string | null> => {
  if (!file) return null;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return reject(error);
          else return resolve(result?.secure_url || null);
        },
      );
      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error("Error uploading image on Cloudinary:", error);
    return null;
  }
};
