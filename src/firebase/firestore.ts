import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { generateRandomName } from "@/lib/random-name";
import type { Exhibition, ExhibitionInput, User } from "@/types";
import { getFirestoreDb } from "./config";

function db() {
  const d = getFirestoreDb();
  if (!d) throw new Error("Firestore가 준비되지 않았습니다.");
  return d;
}

export async function ensureUserDocument(
  firebaseUser: FirebaseUser,
): Promise<User> {
  const d = db();
  const ref = doc(d, "users", firebaseUser.uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? (snap.data() as Partial<User>) : null;

  const profile: User = {
    uid: firebaseUser.uid,
    nickname: existing?.nickname || generateRandomName(),
    role: existing?.role,
    profileImage: existing?.profileImage || firebaseUser.photoURL || undefined,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  await setDoc(ref, profile, { merge: true });
  return profile;
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

export async function getTotalUserCount(): Promise<number> {
  const d = getFirestoreDb();
  if (!d) return 0;
  const snap = await getDocs(collection(d, "users"));
  return snap.size;
}

export function subscribeToUserCount(
  callback: (count: number) => void,
  onError?: (error: Error) => void,
): () => void {
  const d = getFirestoreDb();
  if (!d) {
    callback(0);
    return () => {};
  }

  return onSnapshot(
    collection(d, "users"),
    (snapshot) => {
      callback(snapshot.size);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export function subscribeToExhibitions(
  callback: (exhibitions: Exhibition[]) => void,
): () => void {
  const d = getFirestoreDb();
  if (!d) {
    callback([]);
    return () => {};
  }

  return onSnapshot(collection(d, "exhibitions"), (snapshot) => {
    const exhibitions = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<Exhibition, "id">;
      return { id: docSnap.id, ...data } as Exhibition;
    });
    callback(exhibitions);
  });
}
