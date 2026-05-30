export type ExhibitionMusic = {
  id: string;
  title: string;
  mood: string;
  tempo: number;
  scale: number[];
  bass: number[];
};

export const EXHIBITION_MUSIC: ExhibitionMusic[] = [
  {
    id: "moonlit-adagio",
    title: "Moonlit Adagio",
    mood: "차분한 야간 전시",
    tempo: 860,
    scale: [261.63, 329.63, 392, 493.88, 523.25, 659.25],
    bass: [130.81, 164.81, 196, 246.94],
  },
  {
    id: "gallery-waltz",
    title: "Gallery Waltz",
    mood: "우아한 왈츠",
    tempo: 620,
    scale: [293.66, 369.99, 440, 554.37, 587.33, 739.99],
    bass: [146.83, 185, 220, 277.18],
  },
  {
    id: "quiet-nocturne",
    title: "Quiet Nocturne",
    mood: "느린 피아노 독백",
    tempo: 980,
    scale: [246.94, 311.13, 369.99, 415.3, 493.88, 622.25],
    bass: [123.47, 155.56, 207.65, 246.94],
  },
  {
    id: "glass-atelier",
    title: "Glass Atelier",
    mood: "맑고 투명한 작업실",
    tempo: 700,
    scale: [329.63, 392, 493.88, 587.33, 659.25, 783.99],
    bass: [164.81, 196, 246.94, 293.66],
  },
  {
    id: "warm-chamber",
    title: "Warm Chamber",
    mood: "실내악 같은 따뜻함",
    tempo: 760,
    scale: [261.63, 349.23, 392, 440, 523.25, 698.46],
    bass: [130.81, 174.61, 196, 220],
  },
  {
    id: "silver-foyer",
    title: "Silver Foyer",
    mood: "입장 전 은은한 로비",
    tempo: 820,
    scale: [277.18, 329.63, 415.3, 554.37, 659.25, 830.61],
    bass: [138.59, 164.81, 207.65, 277.18],
  },
  {
    id: "velvet-hall",
    title: "Velvet Hall",
    mood: "커튼 뒤의 깊은 홀",
    tempo: 900,
    scale: [220, 261.63, 329.63, 392, 440, 523.25],
    bass: [110, 130.81, 164.81, 196],
  },
  {
    id: "morning-study",
    title: "Morning Study",
    mood: "밝은 아침 연습곡",
    tempo: 560,
    scale: [349.23, 392, 440, 523.25, 587.33, 659.25],
    bass: [174.61, 196, 220, 261.63],
  },
  {
    id: "deep-canvas",
    title: "Deep Canvas",
    mood: "묵직한 캔버스",
    tempo: 1040,
    scale: [196, 246.94, 293.66, 392, 493.88, 587.33],
    bass: [98, 123.47, 146.83, 196],
  },
  {
    id: "starlit-archive",
    title: "Starlit Archive",
    mood: "별빛 아카이브",
    tempo: 680,
    scale: [311.13, 392, 466.16, 622.25, 783.99, 932.33],
    bass: [155.56, 196, 233.08, 311.13],
  },
];

export const DEFAULT_MUSIC_ID = EXHIBITION_MUSIC[0].id;

export function getExhibitionMusic(id?: string) {
  return EXHIBITION_MUSIC.find((item) => item.id === id) ?? EXHIBITION_MUSIC[0];
}
