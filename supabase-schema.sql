create table if not exists pupils (
  storage_key text primary key,
  class_name text not null,
  student_name text not null,
  access_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table pupils add column if not exists access_code text;

create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  storage_key text not null references pupils(storage_key) on delete cascade,
  lesson_id int not null check (lesson_id between 1 and 12),
  completed boolean not null default false,
  quiz_submitted boolean not null default false,
  quiz_score int check (quiz_score is null or quiz_score between 0 and 10),
  quiz_answers jsonb,
  screenshot text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(storage_key, lesson_id)
);

alter table pupils enable row level security;
alter table lesson_progress enable row level security;

drop policy if exists "Allow classroom pupil reads" on pupils;
create policy "Allow classroom pupil reads"
on pupils for select
to anon
using (true);

drop policy if exists "Allow classroom pupil writes" on pupils;
create policy "Allow classroom pupil writes"
on pupils for insert
to anon
with check (true);

drop policy if exists "Allow classroom pupil updates" on pupils;
create policy "Allow classroom pupil updates"
on pupils for update
to anon
using (true)
with check (true);

drop policy if exists "Allow classroom pupil deletes" on pupils;
create policy "Allow classroom pupil deletes"
on pupils for delete
to anon
using (true);

drop policy if exists "Allow classroom progress reads" on lesson_progress;
create policy "Allow classroom progress reads"
on lesson_progress for select
to anon
using (true);

drop policy if exists "Allow classroom progress writes" on lesson_progress;
create policy "Allow classroom progress writes"
on lesson_progress for insert
to anon
with check (true);

drop policy if exists "Allow classroom progress updates" on lesson_progress;
create policy "Allow classroom progress updates"
on lesson_progress for update
to anon
using (true)
with check (true);

drop policy if exists "Allow classroom progress deletes" on lesson_progress;
create policy "Allow classroom progress deletes"
on lesson_progress for delete
to anon
using (true);
