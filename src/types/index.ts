export interface User {
  uid: string;
  nickname: string;
  role?: "host" | "guest";
  profileImage?: string;
  createdAt: string;
  followerCount?: number;
  followingCount?: number;
}

export interface Artwork {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface Exhibition {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  hostId: string;
  hostName: string;
  category: string;
  createdAt: string;
  price: number;
  musicId?: string;
  artworks: Artwork[];
  likes?: number;
  dislikes?: number;
  commentCount?: number;
  commentReactionCount?: number;
  reactions?: Record<string, "like" | "dislike">;
}

export interface ExhibitionInput {
  title: string;
  description: string;
  thumbnail: string;
  hostId: string;
  hostName: string;
  category: string;
  createdAt: string;
  price: number;
  musicId?: string;
  artworks: Artwork[];
  likes?: number;
  dislikes?: number;
  commentCount?: number;
  commentReactionCount?: number;
  reactions?: Record<string, "like" | "dislike">;
}

export interface ExhibitionComment {
  id: string;
  exhibitionId: string;
  uid: string;
  nickname: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  likes?: number;
  dislikes?: number;
  replyCount?: number;
  reactions?: Record<string, "like" | "dislike">;
}

export interface ExhibitionReply {
  id: string;
  exhibitionId: string;
  commentId: string;
  uid: string;
  nickname: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}
