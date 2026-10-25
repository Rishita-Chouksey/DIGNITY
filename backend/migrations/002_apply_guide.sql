-- DIGNITY application guidance: information only; no submissions or ID storage.
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS apply_url TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS application_mode TEXT CHECK (application_mode IN ('online','offline','both'));
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS application_steps JSONB NOT NULL DEFAULT '[]';
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS helpline TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS offline_office TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS procedure_source_url TEXT;

-- Preserve all existing document names while moving to the richer object shape.
UPDATE schemes
SET required_documents = CASE
  WHEN jsonb_typeof(required_documents) = 'array' THEN COALESCE((
    SELECT jsonb_agg(
      CASE WHEN jsonb_typeof(value) = 'string'
        THEN jsonb_build_object('name', value #>> '{}', 'where_to_get', NULL, 'note', NULL)
        ELSE value
      END
    )
    FROM jsonb_array_elements(required_documents)
  ), '[]'::jsonb)
  ELSE '[]'::jsonb
END;
