-- T.O.P. CRM v2 — Reference schema (foundation)
-- Source of truth for Drizzle migrations. Apply via drizzle-kit, not manually in prod.
-- Version: 0.1

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE job_status AS ENUM (
  'lead',
  'inspection_scheduled',
  'inspection_complete',
  'claim_filed',
  'adjuster_meeting_scheduled',
  'approved',
  'contract_signed',
  'material_ordered',
  'production_scheduled',
  'installed',
  'invoiced',
  'paid',
  'closed'
);

CREATE TYPE job_event_type AS ENUM ('ku', 'ci');

CREATE TYPE claim_status AS ENUM (
  'draft', 'filed', 'pending', 'approved', 'denied', 'supplement'
);

CREATE TYPE appointment_type AS ENUM (
  'inspection', 'adjuster_meeting', 'production', 'other'
);

CREATE TYPE appointment_status AS ENUM (
  'scheduled', 'completed', 'cancelled', 'no_show'
);

CREATE TYPE task_status AS ENUM ('open', 'done', 'cancelled');

CREATE TYPE document_type AS ENUM (
  'contract', 'estimate', 'invoice', 'insurance', 'other'
);

CREATE TYPE estimate_status AS ENUM (
  'draft', 'sent', 'accepted', 'rejected'
);

CREATE TYPE invoice_status AS ENUM (
  'draft', 'sent', 'partial', 'paid', 'void'
);

CREATE TYPE payment_method AS ENUM (
  'check', 'ach', 'card', 'cash', 'other'
);

CREATE TYPE production_status AS ENUM (
  'not_scheduled', 'scheduled', 'in_progress', 'complete'
);

-- Auth / users (PR-001)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  phone         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  description   TEXT
);

CREATE TABLE role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission    TEXT NOT NULL,
  PRIMARY KEY (role_id, permission)
);

CREATE TABLE user_roles (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- Customers & properties (PR-004)
CREATE TABLE customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  notes         TEXT,
  created_by    UUID REFERENCES users(id),
  updated_by    UUID REFERENCES users(id),
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_name ON customers (last_name, first_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_phone ON customers (phone) WHERE deleted_at IS NULL AND phone IS NOT NULL;

CREATE TABLE properties (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES customers(id),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  zip           TEXT NOT NULL,
  latitude      NUMERIC(10, 7),
  longitude     NUMERIC(10, 7),
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  created_by    UUID REFERENCES users(id),
  updated_by    UUID REFERENCES users(id),
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_customer ON properties (customer_id);

-- Jobs (PR-005+)
CREATE TABLE jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       UUID NOT NULL REFERENCES properties(id),
  job_number        TEXT NOT NULL UNIQUE,
  status            job_status NOT NULL DEFAULT 'lead',
  lead_source       TEXT,
  assigned_to       UUID REFERENCES users(id),
  storm_date        DATE,
  insurance_carrier TEXT,
  notes             TEXT,
  closed_at         TIMESTAMPTZ,
  created_by        UUID REFERENCES users(id),
  updated_by        UUID REFERENCES users(id),
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON jobs (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_assigned ON jobs (assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_property ON jobs (property_id);
CREATE INDEX idx_jobs_created ON jobs (created_at DESC);

CREATE TABLE job_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  event_type    job_event_type NOT NULL,
  occurred_at   TIMESTAMPTZ NOT NULL,
  recorded_by   UUID NOT NULL REFERENCES users(id),
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, event_type)
);

CREATE INDEX idx_job_events_job ON job_events (job_id);
CREATE INDEX idx_job_events_type ON job_events (event_type, occurred_at);

CREATE TABLE claims (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                UUID NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  claim_number          TEXT,
  carrier               TEXT NOT NULL,
  policy_number         TEXT,
  date_of_loss          DATE,
  deductible_cents      BIGINT,
  adjuster_name         TEXT,
  adjuster_phone        TEXT,
  adjuster_email        TEXT,
  status                claim_status NOT NULL DEFAULT 'draft',
  approved_amount_cents BIGINT,
  notes                 TEXT,
  created_by            UUID REFERENCES users(id),
  updated_by            UUID REFERENCES users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  type            appointment_type NOT NULL,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end   TIMESTAMPTZ,
  status          appointment_status NOT NULL DEFAULT 'scheduled',
  assigned_to     UUID REFERENCES users(id),
  location_notes  TEXT,
  completed_at    TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id),
  updated_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_start ON appointments (scheduled_start);
CREATE INDEX idx_appointments_job ON appointments (job_id);
CREATE INDEX idx_appointments_assignee ON appointments (assigned_to, scheduled_start)
  WHERE status = 'scheduled';

CREATE TABLE tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID REFERENCES jobs(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  due_at        TIMESTAMPTZ,
  status        task_status NOT NULL DEFAULT 'open',
  assigned_to   UUID REFERENCES users(id),
  created_by    UUID REFERENCES users(id),
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  storage_key   TEXT NOT NULL,
  caption       TEXT,
  taken_at      TIMESTAMPTZ,
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  doc_type      document_type NOT NULL,
  storage_key   TEXT NOT NULL,
  filename      TEXT NOT NULL,
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE estimates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  version       INT NOT NULL DEFAULT 1,
  status        estimate_status NOT NULL DEFAULT 'draft',
  total_cents   BIGINT NOT NULL,
  line_items    JSONB NOT NULL,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  invoice_number  TEXT NOT NULL UNIQUE,
  status          invoice_status NOT NULL DEFAULT 'draft',
  total_cents     BIGINT NOT NULL,
  due_date        DATE,
  sent_at         TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id),
  updated_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_job ON invoices (job_id);
CREATE INDEX idx_invoices_status ON invoices (status);

CREATE TABLE payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount_cents  BIGINT NOT NULL CHECK (amount_cents > 0),
  method        payment_method NOT NULL,
  received_at   TIMESTAMPTZ NOT NULL,
  reference     TEXT,
  recorded_by   UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE production_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id              UUID NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  status              production_status NOT NULL DEFAULT 'not_scheduled',
  scheduled_date      DATE,
  crew_lead           UUID REFERENCES users(id),
  material_ordered_at TIMESTAMPTZ,
  installed_at        TIMESTAMPTZ,
  notes               TEXT,
  updated_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only timeline
CREATE TABLE activity_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID REFERENCES jobs(id) ON DELETE SET NULL,
  customer_id   UUID REFERENCES customers(id) ON DELETE SET NULL,
  actor_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type    TEXT NOT NULL,
  subject_type  TEXT,
  subject_id    UUID,
  payload       JSONB NOT NULL DEFAULT '{}',
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_job ON activity_events (job_id, occurred_at DESC);
CREATE INDEX idx_activity_customer ON activity_events (customer_id, occurred_at DESC);
CREATE INDEX idx_activity_type ON activity_events (event_type);

-- No UPDATE/DELETE policies on activity_events enforced at application layer.
