-- Composite index matching listSessions: WHERE ownerId ORDER BY startedAt DESC.
-- Replaces the separate ownerId + startedAt indexes from init.
DROP INDEX IF EXISTS "WorkoutSession_ownerId_idx";
DROP INDEX IF EXISTS "WorkoutSession_startedAt_idx";
CREATE INDEX "WorkoutSession_ownerId_startedAt_idx" ON "WorkoutSession"("ownerId", "startedAt");
