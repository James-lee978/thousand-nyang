const adjectives = [
  "빛나는",
  "조용한",
  "푸른",
  "맑은",
  "따뜻한",
  "느린",
  "깊은",
  "작은",
  "선명한",
  "자유로운",
  "은은한",
  "새로운",
  "단단한",
  "부드러운",
  "고요한",
];

const nouns = [
  "별",
  "달",
  "구름",
  "파도",
  "숲",
  "강",
  "돌",
  "꽃",
  "새벽",
  "노을",
  "바람",
  "섬",
  "정원",
  "계단",
  "창문",
];

export function generateRandomName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 900) + 100;

  return `${adjective}${noun}${number}`;
}

export function getRandomName(): string {
  if (typeof window !== "undefined") {
    const savedName = localStorage.getItem("randomName");
    if (savedName) return savedName;

    const newName = generateRandomName();
    localStorage.setItem("randomName", newName);
    return newName;
  }

  return generateRandomName();
}

export function resetRandomName(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("randomName");
  }
}
