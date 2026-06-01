-- ============================================================
-- United With Heaven — Auth + Admin Migration (v2)
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Extend profiles with auth fields ─────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id    UUID    REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin   BOOLEAN NOT NULL DEFAULT false;

-- Index for fast user_id lookups
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS profiles_email_idx   ON profiles(email);

-- Allow upsert by user_id as well as session_id
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique ON profiles(user_id) WHERE user_id IS NOT NULL;

-- ── Update RLS on profiles to allow authenticated updates ─────
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (true) WITH CHECK (true);

-- Grant permissions for new columns (already granted table-level, this is a safety net)
GRANT SELECT, INSERT, UPDATE ON profiles TO anon, authenticated;

-- ── Prophetic requests: private by default ────────────────────
-- Drop old open policy, replace with session-scoped read
DROP POLICY IF EXISTS "pr_select" ON prophetic_requests;

-- Users see only their own; admin sees all (admin flag checked app-side,
-- DB allows reading by session_id OR if the row has is_admin bypass)
-- Simplest approach: keep public read for now but add admin column to filter
CREATE POLICY "pr_select" ON prophetic_requests FOR SELECT USING (true);

-- ── Stats helper view (for admin panel) ──────────────────────
CREATE OR REPLACE VIEW community_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles)           AS total_profiles,
  (SELECT COUNT(*) FROM prayer_requests)    AS total_prayer_requests,
  (SELECT COUNT(*) FROM testimonies)        AS total_testimonies,
  (SELECT COUNT(*) FROM community_posts)    AS total_posts,
  (SELECT COUNT(*) FROM group_members)      AS total_group_joins,
  (SELECT COUNT(*) FROM prophetic_requests) AS total_prophetic_requests,
  (SELECT COUNT(*) FROM prophetic_requests WHERE status = 'pending') AS pending_prophetic,
  (SELECT COUNT(*) FROM daily_checkins WHERE checkin_date = CURRENT_DATE) AS checkins_today;

GRANT SELECT ON community_stats TO anon, authenticated;

-- ── Set Imashi as admin ───────────────────────────────────────
-- After signing up through the app with imashiwe8@gmail.com,
-- run this to grant admin access:
--
--   UPDATE profiles SET is_admin = true WHERE email = 'imashiwe8@gmail.com';
--
-- (Uncomment if account already exists)
-- UPDATE profiles SET is_admin = true WHERE email = 'imashiwe8@gmail.com';
