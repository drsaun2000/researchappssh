-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector; -- if pgvector is installed

-- Users
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  created_at timestamptz default now()
);

-- Papers
create table if not exists papers (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  authors text[] not null,
  abstract text,
  journal text,
  publication_date date,
  doi text,
  source text check (source in ('upload','pubmed')) default 'upload',
  subspecialties text[],
  text_content text,
  created_at timestamptz default now()
);

-- Analyses
create table if not exists analyses (
  id uuid primary key default uuid_generate_v4(),
  paper_id uuid references papers(id) on delete cascade,
  summary text,
  methodology text,
  findings text,
  limitations text,
  clinical_relevance text,
  quality_score int,
  applicability_score int,
  evidence_level text,
  risk_of_bias jsonb,
  key_stats text,
  confidence numeric,
  model text,
  created_at timestamptz default now()
);

-- Bookmarks
create table if not exists bookmarks (
  user_id uuid references users(id) on delete cascade,
  paper_id uuid references papers(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, paper_id)
);

-- Embeddings (optional, for semantic search)
create table if not exists paper_embeddings (
  paper_id uuid primary key references papers(id) on delete cascade,
  embedding vector(1536)
);

create index if not exists idx_papers_fts on papers using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(abstract,'')));
