import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseStorage } from "./config";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function getImageExtension(file: File) {
  const fromType = file.type.split("/")[1];
  if (fromType) return fromType.replace("jpeg", "jpg");

  const fromName = file.name.split(".").pop();
  return fromName || "jpg";
}

export async function uploadImage(file: File, pathPrefix = "images") {
  const storage = getFirebaseStorage();
  if (!storage) {
    throw new Error("Firebase Storage가 준비되지 않았습니다.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("이미지는 10MB 이하로 업로드해 주세요.");
  }

  const extension = getImageExtension(file);
  const storageRef = ref(
    storage,
    `${pathPrefix}/${crypto.randomUUID()}.${extension}`,
  );

  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
    },
  });

  return getDownloadURL(storageRef);
}
