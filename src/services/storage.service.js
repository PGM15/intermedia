import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

const configureCloudinary = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      "Cloudinary credentials are missing. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET"
    );
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
};

const uploadBuffer = async (buffer, options = {}) => {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error("Cloudinary no devolvió resultado"));
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export const uploadImageBuffer = async (
  buffer,
  folder = "bildyapp/signatures"
) => {
  if (process.env.NODE_ENV === "test") {
    const fileName = folder.includes("logos") ? "logo.webp" : "signature.webp";
    const publicName = folder.includes("logos") ? "logo" : "signature";

    return {
      url: `https://cloudinary.test/${folder}/${fileName}`,
      publicId: `${folder}/${publicName}`,
    };
  }

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
  if (process.env.NODE_ENV === "test") {
    return {
      url: `https://cloudinary.test/${folder}/deliverynote.pdf`,
      publicId: `${folder}/deliverynote`,
    };
  }

  const result = await uploadBuffer(buffer, {
    folder,
    resource_type: "image",
    format: "pdf",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

export default cloudinary;
