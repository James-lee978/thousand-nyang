export interface User {
  uid: string;
  nickname: string;
  role?: "host" | "guest";
  profileImage?: string;
  createdAt: string;
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
  artworks: Artwork[];
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
  artworks: Artwork[];
}
