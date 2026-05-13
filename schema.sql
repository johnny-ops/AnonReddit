-- schema.sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null, -- client generated anon uuid
  author_name text default 'Anonymous',
  title text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade,
  author_id uuid not null, -- client generated anon uuid
  author_name text default 'Anonymous',
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  author_id uuid not null,
  vote_type integer not null check (vote_type in (1, -1)),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  ),
  unique (post_id, author_id),
  unique (comment_id, author_id)
);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  author_id uuid not null,
  reaction_type text not null check (reaction_type in ('like', 'love', 'haha', 'wow', 'sad', 'angry')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  ),
  unique (post_id, author_id, reaction_type),
  unique (comment_id, author_id, reaction_type)
);

alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;
alter table public.reactions enable row level security;

create policy "Allow public read access to posts" on public.posts for select using (true);
create policy "Allow public insert access to posts" on public.posts for insert with check (true);

create policy "Allow public read access to comments" on public.comments for select using (true);
create policy "Allow public insert access to comments" on public.comments for insert with check (true);

create policy "Allow public read access to votes" on public.votes for select using (true);
create policy "Allow public insert access to votes" on public.votes for insert with check (true);
create policy "Allow public update access to votes" on public.votes for update using (true);
create policy "Allow public delete access to votes" on public.votes for delete using (true);

create policy "Allow public read access to reactions" on public.reactions for select using (true);
create policy "Allow public insert access to reactions" on public.reactions for insert with check (true);
create policy "Allow public delete access to reactions" on public.reactions for delete using (true);
