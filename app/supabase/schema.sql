-- 원장 글방: Supabase SQL Editor에 통째로 붙여넣고 Run (1회)

create type public.user_status as enum ('pending','approved','rejected','suspended');

-- 1. 회원
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  name text,
  phone text,
  academy_name text,
  region text,
  signup_note text,
  signup_completed_at timestamptz,
  status public.user_status not null default 'pending',
  is_admin boolean not null default false,
  academy_profile jsonb not null default '{}',
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

-- 로그인 시 회원 행 자동 생성
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users for each row execute function public.handle_new_user();

-- 승인 여부 (RLS에서 사용)
create function public.is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and (status = 'approved' or is_admin));
$$;

-- 2. 인터뷰 답변 (2단계)
create table public.interviews (
  user_id uuid references public.profiles(id) on delete cascade,
  series_no int check (series_no between 1 and 6),
  answers jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, series_no)
);

-- 3. 글 (2단계)
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  series_no int,
  titles jsonb,
  body text,
  highlight text,
  source text,
  status text not null default 'ready' check (status in ('ready','published','skipped')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- 4. 메모 (3단계)
create table public.memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('scene','event','direction')),
  body text,
  event jsonb,
  target_date date,
  used_post_id uuid references public.posts(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 5. 연재 설정 (3단계)
create table public.schedules (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  weekdays int[] not null default '{1,3,5}',
  active boolean not null default true,
  notify_email text
);

-- 6. 사용량 (서버만 기록)
create table public.usage_log (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  kind text,
  input_tokens int,
  output_tokens int,
  created_at timestamptz not null default now()
);

-- ===== 보안 (RLS) =====
alter table public.profiles  enable row level security;
alter table public.interviews enable row level security;
alter table public.posts     enable row level security;
alter table public.memos     enable row level security;
alter table public.schedules enable row level security;
alter table public.usage_log enable row level security;

create policy "본인 프로필 조회" on public.profiles for select using (id = auth.uid());
create policy "본인 프로필 수정" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- 승인 상태·관리자 여부는 본인이 못 바꾸게: 수정 가능한 칸만 허용
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (name, phone, academy_name, region, signup_note, signup_completed_at, academy_profile)
  on public.profiles to authenticated;

create policy "승인 회원 본인 데이터" on public.interviews for all
  using (user_id = auth.uid() and public.is_approved()) with check (user_id = auth.uid() and public.is_approved());
create policy "승인 회원 본인 데이터" on public.posts for all
  using (user_id = auth.uid() and public.is_approved()) with check (user_id = auth.uid() and public.is_approved());
create policy "승인 회원 본인 데이터" on public.memos for all
  using (user_id = auth.uid() and public.is_approved()) with check (user_id = auth.uid() and public.is_approved());
create policy "승인 회원 본인 데이터" on public.schedules for all
  using (user_id = auth.uid() and public.is_approved()) with check (user_id = auth.uid() and public.is_approved());
create policy "본인 사용량 조회" on public.usage_log for select using (user_id = auth.uid());
