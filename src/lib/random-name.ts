// 랜덤 이름 생성을 위한 단어 리스트
const adjectives = [
  "행복한", "슬픈", "신나는", "조용한", "빠른", "느린", "큰", "작은", "밝은", "어두운",
  "따뜻한", "차가운", "달콤한", "시큼한", "매운", "부드러운", "거친", "깨끗한", "지저분한", "새로운",
  "오래된", "젊은", "늙은", "강한", "약한", "용감한", "겁쟁이", "현명한", "어리석은", "친절한",
  "무서운", "귀여운", "멋진", "우아한", "단순한", "복잡한", "자유로운", "억압된", "평화로운", "전쟁 같은"
];

const nouns = [
  "호랑이", "사자", "고양이", "강아지", "토끼", "거북이", "독수리", "참새", "고래", "상어",
  "나비", "벌", "개미", "거미", "뱀", "원숭이", "판다", "코끼리", "기린", "얼룩말",
  "사슴", "여우", "늑대", "돼지", "소", "말", "당나귀", "양", "염소", "닭",
  "오리", "거위", "비둘기", "까마귀", "올빼미", "부엉이", "독수리", "매", "독수리", "참새",
  "꿀벌", "나비", "잠자리", "잠자리", "메뚜기", "귀뚜라미", "지렁이", "달팽이", "해파리", "해삼"
];

const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function generateRandomName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = numbers[Math.floor(Math.random() * numbers.length)];
  
  return `${adjective}${noun}${number}`;
}

export function getRandomName(): string {
  // localStorage에서 기존 이름 확인
  if (typeof window !== "undefined") {
    const savedName = localStorage.getItem("randomName");
    if (savedName) {
      return savedName;
    }
    
    // 새로운 이름 생성 및 저장
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
