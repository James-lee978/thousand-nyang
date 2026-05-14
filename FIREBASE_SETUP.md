# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 만들기" 클릭
3. 프로젝트 이름 입력 (예: `thousand-nyang`)
4. Google Analytics는 선택사항 (비활성화 가능)
5. "프로젝트 만들기" 클릭

## 2. Authentication 설정

1. Firebase Console에서 왼쪽 메뉴에서 **Authentication** 선택
2. **시작하기** 클릭
3. **Sign-in method** 탭에서 **Google** 선택
4. 토글 스위치를 켜고 **저장** 클릭

## 3. Firestore Database 설정

1. Firebase Console에서 왼쪽 메뉴에서 **Firestore Database** 선택
2. **데이터베이스 만들기** 클릭
3. 위치 선택 (예: `asia-northeast3` - 서울)
4. **시작 모드**에서 **테스트 모드** 선택 (개발용)
5. **사용 설정** 클릭

## 4. 프로젝트 설정 확인

1. Firebase Console 왼쪽 메뉴에서 **프로젝트 설정** (톱니바퀴 아이콘) 클릭
2. **일반** 탭 하단의 **앱** 섹션에서 **</>** (웹 아이콘) 클릭
3. 앱 이름 입력 (예: `thousand-nyang-web`)
4. **앱 등록** 클릭
5. Firebase SDK 스니펫이 표시되면 **Config** 섹션의 값을 복사

## 5. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 값을 입력:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

각 값은 Firebase Console의 **프로젝트 설정 > 일반 > 앱** 섹션에서 확인할 수 있습니다.

## 6. 개발 서버 재시작

환경변수를 설정한 후 개발 서버를 재시작해야 적용됩니다:

```bash
npm run dev
```

## 7. Vercel 배포 시 환경변수 설정

Vercel에 배포할 때는 다음 단계를 따르세요:

1. Vercel 프로젝트 대시보드에서 **Settings** > **Environment Variables**로 이동
2. 위의 6개 환경변수를 모두 추가
3. **Redeploy** 클릭하여 변경사항 적용

## 확인 방법

- Firebase가 올바르게 설정되면 헤더의 "Firebase 미설정" 메시지가 사라집니다
- Google 로그인 버튼이 정상적으로 작동해야 합니다
- 가입자 수가 헤더에 표시되어야 합니다
