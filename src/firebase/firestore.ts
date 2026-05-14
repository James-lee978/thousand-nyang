import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import type { Exhibition, ExhibitionInput, User } from "@/types";
import type { User as FirebaseUser } from "firebase/auth";
import { getFirestoreDb } from "./config";

function db() {
  const d = getFirestoreDb();
  if (!d) throw new Error("Firestore가 준비되지 않았습니다.");
  return d;
}

export async function ensureUserDocument(firebaseUser: FirebaseUser) {
  const d = getFirestoreDb();
  if (!d) return;
  const ref = doc(d, "users", firebaseUser.uid);
  const snap = await getDoc(ref);
  const base: User = {
    uid: firebaseUser.uid,
    nickname: firebaseUser.displayName || "게스트",
    profileImage: firebaseUser.photoURL || undefined,
    createdAt: new Date().toISOString(),
  };
  if (!snap.exists()) {
    await setDoc(ref, base);
    return;
  }
  await setDoc(
    ref,
    {
      nickname: firebaseUser.displayName || snap.data()?.nickname,
      profileImage: firebaseUser.photoURL || snap.data()?.profileImage,
    },
    { merge: true },
  );
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const d = getFirestoreDb();
  if (!d) return null;
  const snap = await getDoc(doc(d, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as User;
}

export async function setUserRole(uid: string, role: "host" | "guest") {
  const d = db();
  await setDoc(doc(d, "users", uid), { role }, { merge: true });
}

export async function createExhibition(data: ExhibitionInput) {
  const d = db();
  await addDoc(collection(d, "exhibitions"), data);
}

export async function listExhibitions(): Promise<Exhibition[]> {
  const d = getFirestoreDb();
  if (!d) return [];
  const snap = await getDocs(collection(d, "exhibitions"));
  const rows = snap.docs.map((docSnap) => {
    const data = docSnap.data() as Omit<Exhibition, "id">;
    return { id: docSnap.id, ...data } as Exhibition;
  });
  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return rows;
}

export async function getExhibition(id: string): Promise<Exhibition | null> {
  const d = getFirestoreDb();
  if (!d) return null;
  const snap = await getDoc(doc(d, "exhibitions", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Exhibition, "id">) };
}

export async function listExhibitionsByHost(
  hostId: string,
): Promise<Exhibition[]> {
  const d = getFirestoreDb();
  if (!d) return [];
  const q = query(collection(d, "exhibitions"), where("hostId", "==", hostId));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => {
    const data = docSnap.data() as Omit<Exhibition, "id">;
    return { id: docSnap.id, ...data } as Exhibition;
  });
}
