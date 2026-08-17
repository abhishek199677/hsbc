ALTER TABLE "Feedback" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "TeamMember" ADD COLUMN "inviteExpiresAt" TIMESTAMP(3);

CREATE INDEX "Feedback_organizationId_idx" ON "Feedback"("organizationId");

ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
