# 원장 글방 — 1단계 (로그인 + 승인 게이트)

## 1. Supabase
1. 새 프로젝트 생성
2. SQL Editor → `supabase/schema.sql` 전체 붙여넣기 → Run
3. Authentication → URL Configuration
   - Site URL: `http://localhost:3000` (배포 후 Vercel 주소로 변경)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://<vercel주소>/auth/callback`
4. Authentication → Providers
   - Google: Google Cloud Console에서 OAuth 클라이언트 생성,
     승인된 리디렉션 URI = `https://<프로젝트>.supabase.co/auth/v1/callback`, Client ID/Secret 입력
   - Kakao(선택, 나중에 가능): developers.kakao.com 앱 생성 → 카카오 로그인 ON →
     Redirect URI = 위와 같은 Supabase 주소, REST API 키 / Client Secret 입력
     ※ 이메일 동의 항목은 비즈 앱 전환이 필요할 수 있음
5. Settings → API에서 URL, anon key, service_role key 복사

## 2. 로컬 실행
```bash
npm install
cp .env.example .env.local   # 윈도우: copy .env.example .env.local
# .env.local에 키 입력, ADMIN_EMAILS에 원장님 로그인 이메일
npm run dev
```
http://localhost:3000 접속

## 3. 테스트 순서
1. 원장님 계정(ADMIN_EMAILS)으로 로그인 → `/admin` 회원 관리로 이동되면 성공
2. 다른 구글 계정(시크릿 창)으로 로그인 → 가입 신청 → "승인을 기다리고 있어요"
3. 원장님 창에서 승인 → 다른 계정 새로고침 → `/write` 열리면 성공
4. 승인 전 계정으로 `/write`, `/admin` 주소 직접 입력 → 막히면 성공

## 4. Vercel 배포
1. GitHub에 올리기 → Vercel에서 Import
2. Environment Variables에 `.env.local` 값 그대로 입력
3. 배포 주소를 Supabase Site URL·Redirect URLs에 추가
