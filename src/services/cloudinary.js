const CLOUDINARY_CLOUD_NAME =
  import.meta.env
    .VITE_CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env
    .VITE_CLOUDINARY_UPLOAD_PRESET;

export function isCloudinaryConfigured() {
  return Boolean(
    CLOUDINARY_CLOUD_NAME &&
      CLOUDINARY_UPLOAD_PRESET
  );
}

export async function uploadInventoryImage(
  file
) {
  if (
    !CLOUDINARY_CLOUD_NAME
  ) {
    throw new Error(
      "Cloudinary cloud name is missing. Add VITE_CLOUDINARY_CLOUD_NAME to your .env file."
    );
  }

  if (
    !CLOUDINARY_UPLOAD_PRESET
  ) {
    throw new Error(
      "Cloudinary upload preset is missing. Add VITE_CLOUDINARY_UPLOAD_PRESET to your .env file."
    );
  }

  if (
    !file
  ) {
    throw new Error(
      "No image was selected."
    );
  }

  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
  );

  const uploadUrl =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const response =
    await fetch(
      uploadUrl,
      {
        method:
          "POST",

        body:
          formData,
      }
    );

  const result =
    await response.json();

  if (
    !response.ok
  ) {
    throw new Error(
      result?.error?.message ||
        "Cloudinary could not upload the image."
    );
  }

  if (
    !result.secure_url
  ) {
    throw new Error(
      "Cloudinary uploaded the image but did not return an image URL."
    );
  }

  return {
    photoUrl:
      result.secure_url,

    cloudinaryPublicId:
      result.public_id ||
      "",

    cloudinaryAssetId:
      result.asset_id ||
      "",

    photoWidth:
      result.width ||
      null,

    photoHeight:
      result.height ||
      null,
  };
}