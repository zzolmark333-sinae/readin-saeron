# 학원 블로그 글 생성 앱 — 설계서 v2

> 이 파일을 프로젝트 루트(`docs/SPEC.md`)에 두고 Claude Code에 "SPEC.md 기준으로 구축해줘"라고 지시하는 용도입니다.

## 0. 한 줄 정의
국어·독서 학원 원장님이 질문에 답만 하면, 원장님 이야기가 담긴 '문의로 이어지는' 네이버 블로그 글 6편을 만들고, 이후에는 원장님 메모를 재료로 주 N편을 자동으로 써 두는 승인제 무료 웹앱.
글은 수정 단계 없이 완성본 1회 생성, 발행은 원장님이 직접 (네이버는 공식 글쓰기 API 없음).

## 1. 기술 스택
- Next.js 15 (App Router, TypeScript) + Tailwind
- Supabase: Auth(카카오·구글 로그인), Postgres, RLS
- Anthropic API (서버 라우트에서만 호출, 키는 서버 환경변수)
- Vercel 배포
- 네이버 로그인은 Supabase 기본 제공이 아니므로 2차 작업(커스텀 OAuth)으로 미룸

### 환경변수
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # 서버 전용
ANTHROPIC_API_KEY=              # 서버 전용
ANTHROPIC_MODEL=claude-sonnet-5-5
ADMIN_EMAILS=관리자@이메일      # 쉼표 구분, 승인 권한자
DAILY_GENERATION_LIMIT=5        # 1인 하루 생성 한도 (수동 생성 기준)
CRON_SECRET=                    # 예약 생성 API 보호
RESEND_API_KEY=                 # 새 글 알림 이메일
```

## 2. 승인 흐름
1. 로그인(카카오/구글) → `profiles` 행 자동 생성, `status = 'pending'`
2. 가입 신청서 1회 입력: 이름, 학원명, 지역, 연락처, 가입 경로
3. pending 사용자는 "승인 대기 중" 화면만 보임
4. 관리자(`/admin`)가 승인/거절 → `approved`만 앱 사용 가능
5. 관리자는 언제든 `suspended`로 정지 가능
6. 보호는 2중: Next.js middleware(화면) + Supabase RLS·API 라우트 검사(데이터·AI 호출)

## 3. 사용자 흐름
로그인 → (승인 대기) → 공통 프로필 → 편 선택(1~6) → 인터뷰(문항별 자동 저장, 예시 답변 제공) → 완성본 생성 → 결과 화면(제목 후보 3개·본문·사진 추천) → 복사 / 워드(.docx) 받기 → 네이버에 직접 발행 → "발행 완료" 체크

6편 완료 후(또는 병행): 메모 남기기 → 예약 요일 새벽에 자동 생성 → 이메일 알림 → 확인·발행

## 4. 공통 프로필 (최초 1회, 이후 수정 가능)
- 화자: 원장님 / 강사·선생님
- 학원명, 지역(동 단위)
- 형태: 학원 / 교습소 / 공부방 / 개인과외
- 대상: 초등 / 중등 / 고등 (복수)
- 주력 과정: 독서 / 국어 / 논술 / 문해력 / 글쓰기 (복수)
- 문의 채널: 카카오톡 채널 / 전화 / 네이버 톡톡
- 글 말투: 따뜻하게 / 담백하게

## 5. 6편 구조와 질문 세트
각 문항: `question`(질문), `why`(왜 묻는지 한 줄), `example`(예시 답변). 필수 표시 문항만 비어 있으면 생성 불가.

### 1편 원장 소개 + 사람 이야기 — 목표: 발견·호감
1. (필수) 학원을 열기 전 무슨 일을 하셨고, 어떤 계기로 내 학원을 열게 됐는지 순서대로 적어주세요.
2. 학원을 열기로 마음먹을 즈음 들은 말 중 지금도 기억나는 한마디가 있나요?
3. (필수) 전공, 자격증, 가르친 햇수, 가르친 곳과 학년, 따로 배운 것까지 빠짐없이 적어주세요.
4. 출근해서 마지막 수업이 끝날 때까지 하루가 어떻게 흘러가나요? 책상이나 벽에 늘 두는 물건이 있다면요.
5. 다른 학원은 흔히 하지만 원장님은 하지 않기로 한 것이 있나요? 이유와, 대신 하는 것은요?

### 2편 학원의 강점·증거 — 목표: 신뢰
1. (필수) 동네 학부모님들 사이에서 우리 학원은 어떤 학원으로 통하나요? 들은 말 그대로 적어주세요.
2. (필수) 다른 독서·국어 학원과 다른 점 한 가지와, 그게 드러나는 수업 장면 하나.
3. 숫자로 말할 수 있는 것: 평균 재원 기간, 반 인원, 누적 독서량, 휴원율 등 (아는 것만)
4. 쓰는 교재·프로그램·도구, 그리고 원장님이 직접 만든 자료가 있나요?

### 3편 왜 우리 학원이어야 할까 — 목표: 자기 일로 받아들이게
1. (필수) 우리 학원에 특히 잘 맞는 아이는 어떤 아이인가요?
2. 솔직히 우리 학원과 잘 안 맞는 아이는요?
3. (필수) 상담 때 학부모님이 가장 많이 하는 걱정 3가지와, 원장님이 실제로 하는 대답.

### 4편 수업·운영 시스템 — 목표: 안심
1. (필수) 아이가 들어와서 나갈 때까지 수업 1회 흐름.
2. 독서 기록·피드백은 어떻게 남기고, 학부모님께는 얼마나 자주 어떻게 알리나요?
3. 책을 안 읽어오거나 숙제를 못 했을 때 어떻게 하나요?
4. 처음 온 아이의 수준 진단과 반 편성은 어떻게 하나요?

### 5편 성장 사례 — 목표: 믿음
1. (필수) 기억에 남는 학생 한 명이 처음 왔을 때의 모습 (장면으로). ※ 이름·학교 등 개인정보 제외
2. (필수) 무엇을 바꿨고, 변화가 보이기까지 얼마나 걸렸나요?
3. 지금 그 아이의 모습과, 학부모님이 하신 말.
4. (선택) 성적·독서량 등 수치 변화. 사실인 것만.

### 6편 학부모 진입장벽 풀기 — 목표: 결심 → 문의
1. 원비·시간표·반 인원 중 공개 가능한 범위.
2. (필수) 처음 문의하면 어떤 순서로 진행되나요? (상담 → 진단 → 체험 등)
3. 학부모님이 문의 전에 망설이는 이유로 짐작되는 것.
4. (필수) 문의 방법과, 상담에서 학부모님이 얻어 가는 것.

## 5-2. 메모 & 자동 연재

### 메모 종류 (`/memos`, 모바일에서 10초 안에 쓰게)
| 종류 | 입력 칸 | 쓰임 |
|---|---|---|
| 수업 장면 | 자유 1~3줄 | 다음 자동 글의 첫 장면·사례 재료 |
| 특별 행사 | 행사명, 일시, 대상, 내용, 신청 방법, 마감일 | 행사 안내 글 우선 생성 |
| 글 방향 | 자유 1~2줄 (예: "이번엔 중등 내신 대비 강조") | 다음 글 1편의 주제·톤 지시 |

- 메모에는 "다음 글에 반영 / 특정 날짜 글에 반영" 선택
- 사용된 메모는 `used_post_id` 기록, 같은 메모 재사용 안 함

### 자동 생성 규칙
- 원장님이 요일 선택(기본 월·수·금), 매일 05:00 KST 크론이 해당 요일 원장님 글만 생성
- 소재 우선순위: ① 마감 전 특별 행사 → ② 글 방향 메모 → ③ 수업 장면 메모 → ④ 메모 없으면 시기별 정보형 글감(`lib/topics.ts`: 신학기 상담, 방학 독서, 시험기간 국어, 독서 습관 등)
- 행사 글: 마감 7일 전까지 1회, 원하면 마감 2일 전 리마인드 1회
- 최근 10편 제목·첫 문단을 함께 넘겨 중복 주제·같은 도입부 회피
- 생성 후 이메일 알림 "새 글이 준비됐어요"
- 미발행 글이 3편 쌓이면 자동 생성 일시 정지 (비용·글 낭비 방지)

## 6. 글 구조 (모든 편 공통 뼈대)
1. 장면으로 시작하는 첫 문단 (원장님 답변 속 구체 장면 활용)
2. 배경·경력 또는 해당 편의 핵심 정보
3. 원장님의 신념 한 문장 (본문 중간, 강조 1회)
4. 구체 사례·디테일
5. 📷 사진 추천 2~3개 (본문 흐름 안에 박스로)
6. 다음 편 예고 한 줄
7. 부담 없는 문의 유도 (판매 톤 금지, "궁금한 점 편하게" 톤)

분량: 공백 포함 1,500~2,500자, 2~3문장마다 줄바꿈 (네이버 모바일 가독성).

## 7. 프롬프트

### 7-1. 생성 (system)
```
너는 국어·독서 학원 원장의 블로그 글을 대신 써주는 작가다.
목표는 '나를 판다'가 아니라, 학부모가 이 원장을 알게 되고 자연스럽게 문의하게 만드는 글이다.

[반드시 지킬 것]
- 원장의 답변에 있는 사실·수치·사례만 쓴다. 답변에 없는 경력, 숫자, 학생 사례, 성과를 지어내지 않는다.
- 답변이 짧으면 글을 짧게 쓴다. 빈 곳을 일반론으로 채우지 않는다.
- 화자는 {speaker}이며 1인칭으로 쓴다. 말투는 {tone}.
- 학생 실명·학교명 등 개인정보를 쓰지 않는다.
- "최고", "1등", "100% 보장", "무조건" 같은 과장·보장 표현을 쓰지 않는다.
- 첫 문단은 답변 속 구체적인 장면으로 시작한다.
- 2~3문장마다 줄을 바꾼다. 분량은 1,500~2,500자.
- 사진이 들어가면 좋을 자리에 [[PHOTO: 찍을 장면 설명]]을 2~3개 넣는다.
- 마지막은 다음 편 예고 한 줄 + {contact_channel}로 편하게 묻도록 안내한다.

[이번 글]
- 시리즈 {series_no}편: {series_title} / 목표: {series_goal}
- 학원 정보: {profile_json}
- 원장 답변: {answers_json}

JSON만 출력한다. 마크다운 코드블록 금지.
{"titles": ["제목1","제목2","제목3"], "body": "본문", "highlight": "본문 속 강조할 신념 한 문장"}
```

### 7-2. 자동 연재 글 (system 추가 지시)
```
이번 글은 6편 시리즈 이후의 연재 글이다.
- 소재: {source_type} / 메모: {memo_text}
- 특별 행사 글이면 메모의 일시·대상·신청 방법·마감일을 정확히 옮긴다. 메모에 없는 정보는 지어내지 말고 [확인 필요]로 표시한다.
- 글 방향 메모가 있으면 그 방향을 최우선으로 따른다.
- 원장 배경은 기존 인터뷰 답변({answers_json})에서만 가져온다.
- 최근 글({recent_posts})과 주제·첫 문장이 겹치지 않게 쓴다.
- 메모가 없는 정보형 글은 원장의 실제 수업 방식(답변)과 연결해 일반론으로 끝나지 않게 한다.
출력 형식은 7-1과 동일.
```

## 8. 데이터 모델 (Supabase SQL)
```sql
create type user_status as enum ('pending','approved','rejected','suspended');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  name text,
  phone text,
  academy_name text,
  region text,
  signup_note text,              -- 가입 경로
  status user_status not null default 'pending',
  is_admin boolean not null default false,
  academy_profile jsonb default '{}', -- 4장 공통 프로필
  created_at timestamptz default now(),
  approved_at timestamptz
);

create table interviews (
  user_id uuid references profiles(id) on delete cascade,
  series_no int check (series_no between 1 and 6),
  answers jsonb not null default '{}',
  updated_at timestamptz default now(),
  primary key (user_id, series_no)
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  series_no int,
  titles jsonb,
  body text,
  highlight text,
  source text,                   -- 'series' | 'memo_scene' | 'memo_event' | 'memo_direction' | 'topic'
  status text not null default 'ready',  -- 'ready' | 'published' | 'skipped'
  published_at timestamptz,
  created_at timestamptz default now()
);

create table memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  kind text not null,            -- 'scene' | 'event' | 'direction'
  body text,                     -- 장면·방향 자유 입력
  event jsonb,                   -- {name, date, target, detail, how_to_apply, deadline}
  target_date date,              -- 특정 날짜 글에 반영 (없으면 다음 글)
  used_post_id uuid references posts(id),
  created_at timestamptz default now()
);

create table schedules (
  user_id uuid primary key references profiles(id) on delete cascade,
  weekdays int[] not null default '{1,3,5}',  -- 1=월
  active boolean not null default true,
  notify_email text
);

create table usage_log (
  id bigserial primary key,
  user_id uuid references profiles(id),
  kind text,                     -- 'generate' | 'revise'
  input_tokens int, output_tokens int,
  created_at timestamptz default now()
);
```
RLS: 본인 행만 읽기/쓰기, `status='approved'`일 때만 interviews·posts 쓰기 허용. `status`·`is_admin` 변경은 service role(관리자 API)만.

## 9. 화면 목록
| 경로 | 내용 |
|---|---|
| `/` | 소개 + 로그인 버튼 |
| `/signup` | 가입 신청서 |
| `/pending` | 승인 대기 안내 |
| `/profile` | 공통 프로필 |
| `/write` | 6편 진행 현황 |
| `/write/[n]` | n편 인터뷰 (한 화면 한 질문, 진행률 바, 자동 저장) |
| `/posts` | 준비된 글 / 발행 완료 목록 |
| `/posts/[id]` | 결과·복사·워드 받기·발행 완료 체크 |
| `/memos` | 메모 쓰기·목록 (수업 장면 / 특별 행사 / 글 방향) |
| `/settings` | 자동 연재 요일, 알림 이메일, 일시 정지 |
| `/admin` | 신청자 목록, 승인/거절/정지, 사용량 |

## 10. 무료 운영 비용 관리
- 수정 단계 없음 → 글 1편 약 70원, 10곳 × 주 3편 기준 월 약 1만 원
- 수동 생성은 1인 하루 `DAILY_GENERATION_LIMIT` 제한, 자동 생성은 예약 요일만
- 미발행 3편 누적 시 자동 생성 일시 정지
- 같은 편 재생성 시 확인 창
- `usage_log`로 관리자 화면에 원장별 사용량 표시

## 11. 구축 순서 (Claude Code 지시용)
1. Next.js + Supabase 연결, 스키마·RLS 적용
2. 로그인 → 가입 신청 → 승인 게이트(middleware) → 관리자 승인 화면
3. 공통 프로필 + 인터뷰 화면(질문 데이터는 `lib/questions.ts`)
4. 생성 API(`app/api/generate`) + 결과 화면 + 복사·워드 받기·발행 체크
5. 메모 화면 + 설정 화면 + 예약 생성(`app/api/cron/generate`, Vercel Cron 1일 1회) + 이메일 알림
6. 사용량 제한·미발행 누적 정지
7. Vercel 배포 → 본인 1편 생성 → 지인 원장 1명 승인 테스트
