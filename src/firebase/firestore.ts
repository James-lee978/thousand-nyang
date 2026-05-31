import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";
import { generateRandomName } from "@/lib/random-name";
import type {
  Artwork,
  Exhibition,
  ExhibitionComment,
  ExhibitionInput,
  NotificationQueueItem,
  ExhibitionReply,
  User,
} from "@/types";
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
    email: existing?.email || firebaseUser.email || undefined,
    role: existing?.role,
    profileImage: existing?.profileImage || firebaseUser.photoURL || undefined,
    createdAt: existing?.createdAt || new Date().toISOString(),
    followerCount: existing?.followerCount ?? 0,
    followingCount: existing?.followingCount ?? 0,
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

export function subscribeToUserProfile(
  uid: string,
  callback: (profile: User | null) => void,
): () => void {
  const d = getFirestoreDb();
  if (!d) {
    callback(null);
    return () => {};
  }

  return onSnapshot(doc(d, "users", uid), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as User) : null);
  });
}

export function subscribeToFollowState(
  viewerId: string | null | undefined,
  curatorId: string,
  callback: (following: boolean) => void,
): () => void {
  const d = getFirestoreDb();
  if (!d || !viewerId || viewerId === curatorId) {
    callback(false);
    return () => {};
  }

  return onSnapshot(
    doc(d, "users", viewerId, "following", curatorId),
    (snapshot) => callback(snapshot.exists()),
  );
}

export async function toggleFollowCurator(
  viewerId: string,
  curatorId: string,
): Promise<boolean> {
  const d = db();
  const followRef = doc(d, "users", viewerId, "following", curatorId);
  const viewerRef = doc(d, "users", viewerId);
  const curatorRef = doc(d, "users", curatorId);

  return runTransaction(d, async (transaction) => {
    const snap = await transaction.get(followRef);

    if (snap.exists()) {
      transaction.delete(followRef);
      transaction.set(
        viewerRef,
        { followingCount: increment(-1) },
        { merge: true },
      );
      transaction.set(
        curatorRef,
        { followerCount: increment(-1) },
        { merge: true },
      );
      return false;
    }

    transaction.set(followRef, {
      curatorId,
      followedAt: serverTimestamp(),
    });
    transaction.set(
      viewerRef,
      { followingCount: increment(1) },
      { merge: true },
    );
    transaction.set(
      curatorRef,
      { followerCount: increment(1) },
      { merge: true },
    );
    return true;
  });
}

export async function setUserRole(uid: string, role: "host" | "guest") {
  const d = db();
  await setDoc(doc(d, "users", uid), { role }, { merge: true });
}

export async function createExhibition(data: ExhibitionInput) {
  const d = db();
  const { artworks, ...exhibition } = data;
  const ref = await addDoc(collection(d, "exhibitions"), {
    likes: 0,
    dislikes: 0,
    commentCount: 0,
    commentReactionCount: 0,
    reactions: {},
    artworks: [],
    artworkCount: artworks.length,
    ...exhibition,
  });
  await saveArtworkDocuments(ref.id, artworks);
}

async function queueNotification(
  item: Omit<NotificationQueueItem, "id" | "status" | "createdAt" | "attempts">,
) {
  const d = db();
  if (item.hostId === item.actorId) return;
  await addDoc(collection(d, "notificationQueue"), {
    ...item,
    status: "pending",
    attempts: 0,
    createdAt: new Date().toISOString(),
  });
}

export async function updateExhibition(
  exhibitionId: string,
  data: Partial<ExhibitionInput>,
) {
  const d = db();
  const { artworks, ...exhibition } = data;
  await updateDoc(doc(d, "exhibitions", exhibitionId), {
    ...exhibition,
    ...(artworks ? { artworks: [], artworkCount: artworks.length } : {}),
  });
  if (artworks) await replaceArtworkDocuments(exhibitionId, artworks);
}

async function saveArtworkDocuments(exhibitionId: string, artworks: Artwork[]) {
  const d = db();
  await Promise.all(
    artworks.map((artwork, index) =>
      setDoc(doc(d, "exhibitions", exhibitionId, "artworks", artwork.id), {
        ...artwork,
        order: index,
      }),
    ),
  );
}

async function replaceArtworkDocuments(exhibitionId: string, artworks: Artwork[]) {
  const d = db();
  const snap = await getDocs(collection(d, "exhibitions", exhibitionId, "artworks"));
  await Promise.all(snap.docs.map((docSnap) => deleteDoc(docSnap.ref)));
  await saveArtworkDocuments(exhibitionId, artworks);
}

async function listArtworkDocuments(exhibitionId: string): Promise<Artwork[]> {
  const d = getFirestoreDb();
  if (!d) return [];
  const snap = await getDocs(collection(d, "exhibitions", exhibitionId, "artworks"));
  const rows = snap.docs.map((docSnap) => {
    const data = docSnap.data() as Artwork & { order?: number };
    return { ...data, id: data.id || docSnap.id };
  });
  rows.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return rows.map(({ id, title, description, imageUrl }) => ({
    id,
    title,
    description,
    imageUrl,
  }));
}

export function subscribeToComments(
  exhibitionId: string,
  callback: (comments: ExhibitionComment[]) => void,
): () => void {
  const d = getFirestoreDb();
  if (!d) {
    callback([]);
    return () => {};
  }

  return onSnapshot(
    collection(d, "exhibitions", exhibitionId, "comments"),
    (snapshot) => {
      const comments = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Omit<ExhibitionComment, "id">;
        return { id: docSnap.id, ...data };
      });
      comments.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
      callback(comments);
    },
  );
}

export async function addExhibitionComment(
  exhibitionId: string,
  uid: string,
  nickname: string,
  body: string,
) {
  const d = db();
  const now = new Date().toISOString();
  await addDoc(collection(d, "exhibitions", exhibitionId, "comments"), {
    exhibitionId,
    uid,
    nickname,
    body,
    createdAt: now,
    likes: 0,
    dislikes: 0,
    replyCount: 0,
    reactions: {},
  });
  await updateDoc(doc(d, "exhibitions", exhibitionId), {
    commentCount: increment(1),
  });
  const exhibitionSnap = await getDoc(doc(d, "exhibitions", exhibitionId));
  if (exhibitionSnap.exists()) {
    const exhibition = exhibitionSnap.data() as Omit<Exhibition, "id">;
    await queueNotification({
      type: "comment",
      exhibitionId,
      exhibitionTitle: exhibition.title,
      hostId: exhibition.hostId,
      actorId: uid,
      actorName: nickname,
      message: `${nickname}님이 '${exhibition.title}' 전시에 댓글을 남겼습니다.`,
    });
  }
}

export async function updateExhibitionComment(
  exhibitionId: string,
  commentId: string,
  body: string,
) {
  const d = db();
  await updateDoc(doc(d, "exhibitions", exhibitionId, "comments", commentId), {
    body,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteExhibitionComment(
  exhibitionId: string,
  commentId: string,
) {
  const d = db();
  const ref = doc(d, "exhibitions", exhibitionId, "comments", commentId);
  const snap = await getDoc(ref);
  const replyCount = snap.exists()
    ? ((snap.data() as Partial<ExhibitionComment>).replyCount ?? 0)
    : 0;
  await deleteDoc(ref);
  await updateDoc(doc(d, "exhibitions", exhibitionId), {
    commentCount: increment(-1 * (1 + replyCount)),
  });
}

export function subscribeToReplies(
  exhibitionId: string,
  commentId: string,
  callback: (replies: ExhibitionReply[]) => void,
): () => void {
  const d = getFirestoreDb();
  if (!d) {
    callback([]);
    return () => {};
  }

  return onSnapshot(
    collection(d, "exhibitions", exhibitionId, "comments", commentId, "replies"),
    (snapshot) => {
      const replies = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Omit<ExhibitionReply, "id">;
        return { id: docSnap.id, ...data };
      });
      replies.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
      callback(replies);
    },
  );
}

export async function addExhibitionReply(
  exhibitionId: string,
  commentId: string,
  uid: string,
  nickname: string,
  body: string,
) {
  const d = db();
  const now = new Date().toISOString();
  await addDoc(
    collection(d, "exhibitions", exhibitionId, "comments", commentId, "replies"),
    {
      exhibitionId,
      commentId,
      uid,
      nickname,
      body,
      createdAt: now,
    },
  );
  await updateDoc(doc(d, "exhibitions", exhibitionId, "comments", commentId), {
    replyCount: increment(1),
  });
  await updateDoc(doc(d, "exhibitions", exhibitionId), {
    commentCount: increment(1),
  });
}

export async function updateExhibitionReply(
  exhibitionId: string,
  commentId: string,
  replyId: string,
  body: string,
) {
  const d = db();
  await updateDoc(
    doc(d, "exhibitions", exhibitionId, "comments", commentId, "replies", replyId),
    {
      body,
      updatedAt: new Date().toISOString(),
    },
  );
}

export async function deleteExhibitionReply(
  exhibitionId: string,
  commentId: string,
  replyId: string,
) {
  const d = db();
  await deleteDoc(
    doc(d, "exhibitions", exhibitionId, "comments", commentId, "replies", replyId),
  );
  await updateDoc(doc(d, "exhibitions", exhibitionId, "comments", commentId), {
    replyCount: increment(-1),
  });
  await updateDoc(doc(d, "exhibitions", exhibitionId), {
    commentCount: increment(-1),
  });
}

export async function reactToComment(
  exhibitionId: string,
  commentId: string,
  uid: string,
  actorName: string,
  reaction: "like" | "dislike",
): Promise<ExhibitionComment | null> {
  const d = db();
  const ref = doc(d, "exhibitions", exhibitionId, "comments", commentId);
  const exhibitionRef = doc(d, "exhibitions", exhibitionId);

  const result = await runTransaction(d, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return null;

    const current = snap.data() as Omit<ExhibitionComment, "id">;
    const reactions = { ...(current.reactions ?? {}) };
    const previous = reactions[uid];
    let likes = current.likes ?? 0;
    let dislikes = current.dislikes ?? 0;
    let delta = 0;

    if (previous === reaction) {
      delete reactions[uid];
      delta = -1;
      if (reaction === "like") likes = Math.max(0, likes - 1);
      if (reaction === "dislike") dislikes = Math.max(0, dislikes - 1);
    } else {
      if (previous === "like") likes = Math.max(0, likes - 1);
      if (previous === "dislike") dislikes = Math.max(0, dislikes - 1);
      if (!previous) delta = 1;
      reactions[uid] = reaction;
      if (reaction === "like") likes += 1;
      if (reaction === "dislike") dislikes += 1;
    }

    transaction.update(ref, { likes, dislikes, reactions });
    if (delta !== 0) {
      transaction.update(exhibitionRef, {
        commentReactionCount: increment(delta),
      });
    }
    const shouldNotify = previous !== reaction;
    return {
      comment: { id: snap.id, ...current, likes, dislikes, reactions },
      shouldNotify,
    };
  });

  if (result?.shouldNotify) {
    const exhibitionSnap = await getDoc(doc(d, "exhibitions", exhibitionId));
    if (exhibitionSnap.exists()) {
      const exhibition = exhibitionSnap.data() as Omit<Exhibition, "id">;
      await queueNotification({
        type: reaction === "like" ? "comment_like" : "comment_dislike",
        exhibitionId,
        exhibitionTitle: exhibition.title,
        hostId: exhibition.hostId,
        actorId: uid,
        actorName,
        targetCommentId: commentId,
        message: `${actorName}님이 '${exhibition.title}' 전시의 댓글에 ${reaction === "like" ? "좋아요" : "싫어요"}를 눌렀습니다.`,
      });
    }
  }

  return result?.comment ?? null;
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
  const data = snap.data() as Omit<Exhibition, "id">;
  const subcollectionArtworks = await listArtworkDocuments(id);
  return {
    id: snap.id,
    ...data,
    artworks: subcollectionArtworks.length ? subcollectionArtworks : data.artworks ?? [],
  };
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

export async function reactToExhibition(
  exhibitionId: string,
  uid: string,
  actorName: string,
  reaction: "like" | "dislike",
): Promise<Exhibition | null> {
  const d = db();
  const ref = doc(d, "exhibitions", exhibitionId);

  const result = await runTransaction(d, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return null;

    const current = snap.data() as Omit<Exhibition, "id">;
    const reactions = { ...(current.reactions ?? {}) };
    const previous = reactions[uid];
    let likes = current.likes ?? 0;
    let dislikes = current.dislikes ?? 0;

    if (previous === reaction) {
      delete reactions[uid];
      if (reaction === "like") likes = Math.max(0, likes - 1);
      if (reaction === "dislike") dislikes = Math.max(0, dislikes - 1);
    } else {
      if (previous === "like") likes = Math.max(0, likes - 1);
      if (previous === "dislike") dislikes = Math.max(0, dislikes - 1);
      reactions[uid] = reaction;
      if (reaction === "like") likes += 1;
      if (reaction === "dislike") dislikes += 1;
    }

    transaction.update(ref, { likes, dislikes, reactions });
    return {
      exhibition: { id: snap.id, ...current, likes, dislikes, reactions },
      shouldNotify: previous !== reaction,
    };
  });

  if (result?.shouldNotify) {
    await queueNotification({
      type: reaction === "like" ? "exhibition_like" : "exhibition_dislike",
      exhibitionId,
      exhibitionTitle: result.exhibition.title,
      hostId: result.exhibition.hostId,
      actorId: uid,
      actorName,
      message: `${actorName}님이 '${result.exhibition.title}' 전시에 ${reaction === "like" ? "좋아요" : "싫어요"}를 눌렀습니다.`,
    });
  }

  return result?.exhibition ?? null;
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
