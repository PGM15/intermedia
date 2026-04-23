import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

export const uploadImageBuffer = async (buffer, folder = "bildyapp/signatures") => {
  const result = await uploadBuffer(buffer, {
    folder,
    resource_type: "image",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

export const uploadPdfBuffer = async (buffer, folder = "bildyapp/pdfs") => {
  const result = await uploadBuffer(buffer, {
    folder,
    resource_type: "raw",
    format: "pdf",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

export default cloudinary;