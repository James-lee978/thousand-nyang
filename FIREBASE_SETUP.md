# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속합니다.
2. 프로젝트를 만들고 웹 앱을 추가합니다.
3. Firebase SDK config 값을 복사합니다.

## 2. Authentication 설정

1. Firebase Console에서 **Authentication**으로 이동합니다.
2. **Sign-in method**에서 **Google** 제공업체를 활성화합니다.
3. **Settings > Authorized domains**에 배포 도메인을 추가합니다.

Vercel 배포 후 Google 로그인이 실패하면 이 항목을 가장 먼저 확인하세요.

- `localhost`는 로컬 개발용으로 필요합니다.
- `your-project.vercel.app`처럼 실제 Vercel 배포 도메인을 추가해야 합니다.
- 커스텀 도메인을 연결했다면 그 도메인도 추가해야 합니다.

## 3. Firestore Database 설정

1. Firebase Console에서 **Firestore Database**로 이동합니다.
2. 데이터베이스를 생성합니다.
3. 위치는 필요에 맞게 선택합니다. 한국 서비스라면 `asia-northeast3`을 사용할 수 있습니다.
4. 개발 중에는 테스트 모드로 시작할 수 있지만, 배포 전에는 보안 규칙을 점검하세요.

## 4. 환경변수 설정

프로젝트 루트의 `.env.local`에 다음 값을 넣습니다.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Vercel에서는 **Project Settings > Environment Variables**에 같은 값을 추가한 뒤 반드시 재배포해야 합니다.

## 5. 로그인 방식

이 프로젝트는 로컬 개발에서는 팝업 로그인을 사용하고, Vercel 같은 배포 환경에서는 리다이렉트 로그인을 사용합니다. 배포 환경에서 `auth/popup-closed-by-user` 또는 팝업 차단 문제가 나는 것을 피하기 위한 설정입니다.
