-- Fix campaign status enum issue
-- Run this SQL script directly in your PostgreSQL database

-- Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE campaignobjective AS ENUM (
        'OUTCOME_TRAFFIC',
        'OUTCOME_ENGAGEMENT',
        'OUTCOME_AWARENESS',
        'OUTCOME_LEADS',
        'OUTCOME_SALES'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE campaignstatus AS ENUM (
        'ACTIVE',
        'PAUSED',
        'DELETED',
        'ARCHIVED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE adsetstatus AS ENUM (
        'ACTIVE',
        'PAUSED',
        'DELETED',
        'ARCHIVED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE adstatus AS ENUM (
        'ACTIVE',
        'PAUSED',
        'DELETED',
        'ARCHIVED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Convert ad_campaigns.objective from VARCHAR to enum
ALTER TABLE ad_campaigns 
ALTER COLUMN objective TYPE campaignobjective 
USING objective::campaignobjective;

-- Convert ad_campaigns.status from VARCHAR to enum
ALTER TABLE ad_campaigns 
ALTER COLUMN status TYPE campaignstatus 
USING status::campaignstatus;

-- Convert ad_sets.status from VARCHAR to enum
ALTER TABLE ad_sets 
ALTER COLUMN status TYPE adsetstatus 
USING status::adsetstatus;

-- Convert ads.status from VARCHAR to enum
ALTER TABLE ads 
ALTER COLUMN status TYPE adstatus 
USING status::adstatus;
