-- PostgreSQL Production Schema for DAIP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE scan_status_enum AS ENUM ('pending', 'processing', 'complete', 'failed');
CREATE TYPE risk_level_enum AS ENUM ('none', 'low', 'medium', 'high');
CREATE TYPE match_type_enum AS ENUM ('exact', 'structural', 'semantic');

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE repos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_repo_id BIGINT UNIQUE NOT NULL,
    owner_login TEXT NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT UNIQUE NOT NULL,
    primary_language TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    last_pushed_at TIMESTAMPTZ NOT NULL,
    scan_status scan_status_enum NOT NULL DEFAULT 'pending',
    last_scanned_at TIMESTAMPTZ,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE contributors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_user_id BIGINT UNIQUE NOT NULL,
    login TEXT NOT NULL,
    email_hash CHAR(64) NOT NULL, -- SHA-256 hash of developer email
    account_age_days INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE repo_contributors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id UUID NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
    contributor_id UUID NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
    first_commit_at TIMESTAMPTZ,
    last_commit_at TIMESTAMPTZ,
    total_commits INT DEFAULT 0,
    lines_added BIGINT DEFAULT 0,
    lines_removed BIGINT DEFAULT 0,
    CONSTRAINT unique_repo_contributor UNIQUE(repo_id, contributor_id)
);

CREATE TABLE commits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sha CHAR(40) UNIQUE NOT NULL,
    repo_id UUID NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
    contributor_id UUID NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
    authored_at TIMESTAMPTZ NOT NULL,
    committed_at TIMESTAMPTZ NOT NULL,
    message TEXT NOT NULL,
    files_changed INT DEFAULT 0,
    lines_added INT DEFAULT 0,
    lines_removed INT DEFAULT 0,
    timezone_offset INT NOT NULL
);

CREATE TABLE commit_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commit_id UUID NOT NULL REFERENCES commits(id) ON DELETE CASCADE,
    burst_score REAL NOT NULL,
    message_quality_score REAL NOT NULL,
    timing_anomaly_score REAL NOT NULL,
    file_diversity_score REAL NOT NULL,
    complexity_delta REAL NOT NULL,
    evolution_coherence REAL NOT NULL
);

CREATE TABLE similarity_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commit_id UUID NOT NULL REFERENCES commits(id) ON DELETE CASCADE,
    source_file TEXT NOT NULL,
    matched_repo_full TEXT NOT NULL,
    matched_sha CHAR(40),
    similarity_score REAL NOT NULL,
    match_type match_type_enum NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_detection_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commit_id UUID NOT NULL REFERENCES commits(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    entropy_score REAL NOT NULL,
    perplexity_score REAL NOT NULL,
    stylometric_drift REAL NOT NULL,
    structural_regularity REAL NOT NULL,
    composite_ai_score REAL NOT NULL,
    confidence_low REAL NOT NULL,
    confidence_high REAL NOT NULL
);

CREATE TABLE contributor_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_contributor_id UUID NOT NULL REFERENCES repo_contributors(id) ON DELETE CASCADE,
    contribution_score REAL NOT NULL,
    authenticity_score REAL NOT NULL,
    copy_risk_flag risk_level_enum NOT NULL,
    ai_risk_flag risk_level_enum NOT NULL,
    low_effort_risk_flag risk_level_enum NOT NULL,
    score_version TEXT NOT NULL,
    explanation_json JSONB NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_superseded BOOLEAN DEFAULT FALSE
);

-- Optimization Indices for High-Volume Lookups
CREATE INDEX idx_repos_tenant ON repos(tenant_id);
CREATE INDEX idx_commits_sha ON commits(sha);
CREATE INDEX idx_commits_repo_contrib ON commits(repo_id, contributor_id);
CREATE INDEX idx_contributor_scores_lookup ON contributor_scores(repo_contributor_id) WHERE NOT is_superseded;