import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseStorage } from "./config";

export async function uploadImage(file: File, pathPrefix = "images") {
  const storage = getFirebaseStorage();
  if (!storage) {
    throw new Error("Firebase Storage가 준비되지 않았습니다.");
  }
  const storageRef = ref(storage, `${pathPrefix}/${Date.now()}-${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
