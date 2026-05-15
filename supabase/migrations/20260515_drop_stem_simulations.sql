-- ─────────────────────────────────────────────────────────────────────────
-- Drop the `stem_simulations` table and everything attached to it.
--
-- The Virtual Lab feature was removed from the codebase on 2026-05-15
-- (no public route, no admin manager, no UI surface). This migration
-- finishes the cleanup on the database side so the table doesn't sit
-- as orphaned schema.
--
-- The original `20260404_create_stem_simulations.sql` migration is left
-- in place — it represents historical truth. New environments will
-- create the table then drop it as the migrations replay forward, which
-- is correct.
--
-- Idempotent: safe to re-run on environments where the table is already
-- gone.
-- ─────────────────────────────────────────────────────────────────────────

drop policy if exists "Public can read published simulations" on public.stem_simulations;

drop index if exists public.idx_stem_simulations_subject_status;
drop index if exists public.idx_stem_simulations_slug;

drop table if exists public.stem_simulations;
