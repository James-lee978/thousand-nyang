const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const FIRESTORE_IMAGE_BUDGET = 720 * 1024;

type ImageDataUrlOptions = {
  maxSize?: number;
  quality?: number;
  maxBytes?: number;
};

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽지 못했습니다."));
    };
    image.src = url;
  });
}

function renderImageDataUrl(
  image: HTMLImageElement,
  maxSize: number,
  quality: number,
) {
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("이미지 변환을 준비하지 못했습니다.");
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/webp", quality);
}

export async function prepareImageDataUrl(
  file: File,
  options: ImageDataUrlOptions = {},
) {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 등록할 수 있습니다.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("이미지는 10MB 이하로 선택해 주세요.");
  }

  const image = await loadImage(file);
  const maxBytes = options.maxBytes ?? FIRESTORE_IMAGE_BUDGET;
  const attempts = [
    { maxSize: options.maxSize ?? 520, quality: options.quality ?? 0.5 },
    { maxSize: 460, quality: 0.42 },
    { maxSize: 380, quality: 0.36 },
    { maxSize: 320, quality: 0.3 },
    { maxSize: 260, quality: 0.24 },
  ];

  for (const attempt of attempts) {
    const dataUrl = renderImageDataUrl(
      image,
      Math.min(options.maxSize ?? attempt.maxSize, attempt.maxSize),
      Math.min(options.quality ?? attempt.quality, attempt.quality),
    );
    if (dataUrl.length <= maxBytes) return dataUrl;
  }

  throw new Error(
    "이미지를 Firestore에 저장할 수 있을 만큼 줄이지 못했습니다. 더 작은 이미지를 선택해 주세요.",
  );
}
