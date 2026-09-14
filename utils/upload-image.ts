import type { ImagePickerAsset } from "expo-image-picker";
import { Platform } from "react-native";
import {
  getDownloadURL,
  ref,
  uploadString,
  uploadBytes,
  type FirebaseStorage,
} from "firebase/storage";

const MAX_UPLOAD_BYTES = 9.5 * 1024 * 1024;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

function extensionFor(asset: ImagePickerAsset, fallback: string) {
  const fromName = asset.fileName?.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();

  const fromMime = asset.mimeType?.split("/").pop();
  if (fromMime) return fromMime === "jpeg" ? "jpg" : fromMime;

  return fallback;
}

function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new Error("Could not read selected image."));
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
}

async function getAssetUploadData(asset: ImagePickerAsset) {
  const webFile = (asset as ImagePickerAsset & { file?: Blob }).file;
  if (Platform.OS === "web" && webFile) return webFile;

  if (Platform.OS === "web") {
    try {
      return await (await fetch(asset.uri)).blob();
    } catch {
      return uriToBlob(asset.uri);
    }
  }

  try {
    return await (await fetch(asset.uri)).blob();
  } catch {
    return uriToBlob(asset.uri);
  }
}

function storageErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: string }).code)
    : "";
}

export function getImageUploadErrorMessage(error: unknown) {
  const code = storageErrorCode(error);

  if (code === "storage/quota-exceeded") {
    return "Firebase Storage says this bucket is out of quota. Uploads are paused until the Firebase quota or billing setting is fixed.";
  }

  if (code === "storage/unauthorized") {
    return "Firebase blocked this upload. Make sure you are signed in, then redeploy the latest Storage rules.";
  }

  if (code === "storage/retry-limit-exceeded") {
    return "The upload timed out. Try again on a stronger connection or use a smaller image.";
  }

  if (error instanceof Error && error.message) return error.message;

  return "Could not upload this image. Try a smaller JPG or PNG.";
}

function assertImageSize(size?: number) {
  if (size && size > MAX_UPLOAD_BYTES) {
    throw new Error("That image is too large. Pick a smaller photo or screenshot under 9 MB.");
  }
}

export async function uploadPickedImage({
  storage,
  asset,
  pathPrefix,
  fallbackName,
}: {
  storage: FirebaseStorage;
  asset: ImagePickerAsset;
  pathPrefix: string;
  fallbackName: string;
}) {
  const extension = extensionFor(asset, "jpg");
  const baseName = sanitizeFileName(asset.fileName || `${fallbackName}.${extension}`);
  const fileRef = ref(storage, `${pathPrefix}/${Date.now()}-${baseName}`);
  const metadata = {
    contentType: asset.mimeType || "image/jpeg",
  };

  assertImageSize(asset.fileSize);

  if (Platform.OS === "web" && asset.uri.startsWith("data:")) {
    await uploadString(fileRef, asset.uri, "data_url", metadata);
    return getDownloadURL(fileRef);
  }

  const uploadData = await getAssetUploadData(asset);
  assertImageSize(uploadData.size);
  await uploadBytes(fileRef, uploadData, metadata);

  return getDownloadURL(fileRef);
}
