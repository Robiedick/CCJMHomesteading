-- Create table for reusable homepage presets
CREATE TABLE "HomepagePreset" (
  "id" SERIAL PRIMARY KEY,
  "locale" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX "HomepagePreset_locale_idx" ON "HomepagePreset" ("locale");

CREATE UNIQUE INDEX "HomepagePreset_locale_name_key" ON "HomepagePreset" ("locale", "name");

-- Keep updatedAt current
CREATE OR REPLACE FUNCTION set_current_timestamp_on_homepagepreset()
RETURNS trigger AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON "HomepagePreset"
FOR EACH ROW
EXECUTE PROCEDURE set_current_timestamp_on_homepagepreset();
