CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE categories (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, description TEXT);
CREATE TABLE schemes (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), scheme_name TEXT NOT NULL, description TEXT NOT NULL,
 description_embedding vector(384), category TEXT REFERENCES categories(name), state TEXT NOT NULL,
 min_age INT, max_age INT, occupation TEXT, education_level TEXT, income_limit NUMERIC,
 gender TEXT, special_category TEXT, eligibility_conditions JSONB NOT NULL DEFAULT '{}',
 required_documents JSONB NOT NULL DEFAULT '[]', benefits TEXT, application_deadline DATE,
 official_url TEXT NOT NULL, source_name TEXT, last_verified TIMESTAMP, verification_status TEXT NOT NULL DEFAULT 'verification_due' CHECK (verification_status IN ('verified','verification_due')),
 created_at TIMESTAMP NOT NULL DEFAULT now(), updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE TABLE search_queries (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), raw_text TEXT NOT NULL, extracted_profile JSONB NOT NULL DEFAULT '{}', need_embedding vector(384), top_results JSONB NOT NULL DEFAULT '[]', created_at TIMESTAMP NOT NULL DEFAULT now());
CREATE INDEX schemes_embedding_hnsw ON schemes USING hnsw (description_embedding vector_cosine_ops);
CREATE INDEX schemes_state_idx ON schemes(state); CREATE INDEX schemes_category_idx ON schemes(category); CREATE INDEX schemes_verification_idx ON schemes(verification_status);
