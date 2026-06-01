-- ============================================================
-- United With Heaven — Community Features Migration
-- Run this entire file in Supabase Dashboard → SQL Editor
-- ============================================================

-- Add session_id to existing tables (non-breaking, nullable)
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE testimonies     ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS session_id TEXT;

-- ── Profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    TEXT    UNIQUE NOT NULL,
  display_name  TEXT    NOT NULL DEFAULT 'Friend',
  avatar_emoji  TEXT    NOT NULL DEFAULT '🙏',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (true);

-- ── Reactions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reactions (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    TEXT    NOT NULL,
  parent_type   TEXT    NOT NULL CHECK (parent_type IN ('prayer_request','testimony','community_post','group_post')),
  parent_id     UUID    NOT NULL,
  reaction_type TEXT    NOT NULL CHECK (reaction_type IN ('pray','amen')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, parent_type, parent_id, reaction_type)
);
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reactions_select" ON reactions;
DROP POLICY IF EXISTS "reactions_insert" ON reactions;
DROP POLICY IF EXISTS "reactions_delete" ON reactions;
CREATE POLICY "reactions_select" ON reactions FOR SELECT USING (true);
CREATE POLICY "reactions_insert" ON reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "reactions_delete" ON reactions FOR DELETE USING (true);

-- ── Comments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    TEXT    NOT NULL,
  display_name  TEXT    NOT NULL DEFAULT 'Anonymous',
  parent_type   TEXT    NOT NULL CHECK (parent_type IN ('testimony','message','group_post')),
  parent_id     UUID    NOT NULL,
  content       TEXT    NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select" ON comments;
DROP POLICY IF EXISTS "comments_insert" ON comments;
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (true);

-- ── Prayer Room Messages (real-time, ephemeral) ───────────────
CREATE TABLE IF NOT EXISTS prayer_room_messages (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    TEXT    NOT NULL,
  display_name  TEXT    NOT NULL DEFAULT 'Anonymous',
  content       TEXT    NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE prayer_room_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prm_select" ON prayer_room_messages;
DROP POLICY IF EXISTS "prm_insert" ON prayer_room_messages;
CREATE POLICY "prm_select" ON prayer_room_messages FOR SELECT USING (true);
CREATE POLICY "prm_insert" ON prayer_room_messages FOR INSERT WITH CHECK (true);

-- Enable Realtime on prayer_room_messages (required for live updates)
-- Go to: Supabase Dashboard → Database → Replication → prayer_room_messages → toggle ON

-- ── Groups ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT    NOT NULL,
  description   TEXT,
  icon          TEXT    NOT NULL DEFAULT '🙏',
  color         TEXT    NOT NULL DEFAULT '#B8722A',
  member_count  INT     DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "groups_select" ON groups;
CREATE POLICY "groups_select" ON groups FOR SELECT USING (true);

-- Seed default groups (safe to run multiple times)
INSERT INTO groups (name, description, icon, color) VALUES
  ('Morning Prayer Warriors',  'Start each day in prayer together. We meet daily at dawn.', '☀️', '#B8722A'),
  ('New Believers',            'A safe, encouraging space for those new to faith.', '🌱', '#2A8A5A'),
  ('Worship & Song',           'For those who lead in song, music, and worship.', '🎵', '#4A4AAA'),
  ('Healing & Restoration',    'Believing together for healing miracles and wholeness.', '💛', '#C9973A'),
  ('Prophetic Community',      'Grow and develop your prophetic gift in community.', '⚡', '#8B6820'),
  ('Women of Heaven',          'A community space for women walking in faith and grace.', '🌸', '#AA4A80')
ON CONFLICT DO NOTHING;

-- ── Group Members ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id    UUID    REFERENCES groups(id) ON DELETE CASCADE,
  session_id  TEXT    NOT NULL,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, session_id)
);
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gm_select" ON group_members;
DROP POLICY IF EXISTS "gm_insert" ON group_members;
DROP POLICY IF EXISTS "gm_delete" ON group_members;
CREATE POLICY "gm_select" ON group_members FOR SELECT USING (true);
CREATE POLICY "gm_insert" ON group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "gm_delete" ON group_members FOR DELETE USING (true);

-- ── Group Posts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_posts (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id      UUID    REFERENCES groups(id) ON DELETE CASCADE,
  session_id    TEXT    NOT NULL,
  display_name  TEXT    NOT NULL DEFAULT 'Anonymous',
  content       TEXT    NOT NULL,
  likes         INT     DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gp_select" ON group_posts;
DROP POLICY IF EXISTS "gp_insert" ON group_posts;
DROP POLICY IF EXISTS "gp_update" ON group_posts;
CREATE POLICY "gp_select" ON group_posts FOR SELECT USING (true);
CREATE POLICY "gp_insert" ON group_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "gp_update" ON group_posts FOR UPDATE USING (true);

-- ── Prophetic Requests ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prophetic_requests (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    TEXT    NOT NULL,
  display_name  TEXT    NOT NULL DEFAULT 'Anonymous',
  request       TEXT    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','answered')),
  response      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  answered_at   TIMESTAMPTZ
);
ALTER TABLE prophetic_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pr_select" ON prophetic_requests;
DROP POLICY IF EXISTS "pr_insert" ON prophetic_requests;
DROP POLICY IF EXISTS "pr_update" ON prophetic_requests;
CREATE POLICY "pr_select"  ON prophetic_requests FOR SELECT USING (true);
CREATE POLICY "pr_insert"  ON prophetic_requests FOR INSERT  WITH CHECK (true);
CREATE POLICY "pr_update"  ON prophetic_requests FOR UPDATE  USING (true);

-- ── Daily Check-ins ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_checkins (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    TEXT    NOT NULL,
  checkin_date  DATE    NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, checkin_date)
);
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dc_select" ON daily_checkins;
DROP POLICY IF EXISTS "dc_insert" ON daily_checkins;
CREATE POLICY "dc_select" ON daily_checkins FOR SELECT USING (true);
CREATE POLICY "dc_insert" ON daily_checkins FOR INSERT WITH CHECK (true);

-- ── Notifications ─────────────────────────────────────────────
-- View: unread activity for a session (used by NotificationBell)
-- Actual notifications are fetched per-session in the app.
-- No extra table needed — we query reactions/comments filtered by session.
