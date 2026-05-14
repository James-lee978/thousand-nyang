import type { Exhibition } from "@/types";

export const MOCK_EXHIBITIONS: Exhibition[] = [
  {
    id: "mock-grain",
    title: "Grain Boundary",
    description: "재료공학 속 결정립계에서 영감을 받은 온라인 전시.",
    thumbnail:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
    hostId: "demo-host",
    hostName: "재료공학과 김OO",
    category: "재료공학",
    createdAt: new Date().toISOString(),
    price: 1000,
    artworks: [
      {
        id: "a1",
        title: "결정 입계 #1",
        description: "현미경 이미지에서 발견한 패턴.",
        imageUrl:
          "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "mock-life",
    title: "Microscopic Life",
    description: "세포 이미지로 만든 추상적 리듬.",
    thumbnail:
      "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=1200&auto=format&fit=crop",
    hostId: "demo-host-2",
    hostName: "생명공학과 박OO",
    category: "생명공학",
    createdAt: new Date().toISOString(),
    price: 1000,
    artworks: [
      {
        id: "b1",
        title: "배양 접시 위의 풍경",
        description: "실험실에서 본 색의 층위.",
        imageUrl:
          "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
];
