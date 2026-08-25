-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "failureReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "openai_usage_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "model" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "interviewId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "openai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "website" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_requisitions" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requirements" TEXT,
    "location" TEXT,
    "jobType" TEXT NOT NULL DEFAULT 'full-time',
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "experienceMin" INTEGER,
    "experienceMax" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "openings" INTEGER NOT NULL DEFAULT 1,
    "filledCount" INTEGER NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_candidates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "naukriId" TEXT,
    "linkedinUrl" TEXT,
    "resumeUrl" TEXT,
    "currentRole" TEXT,
    "currentCompany" TEXT,
    "totalExperience" TEXT,
    "skills" TEXT,
    "location" TEXT,
    "expectedSalary" INTEGER,
    "noticePeriod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sourced',
    "notes" TEXT,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_submissions" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobRequisitionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "feedback" TEXT,
    "interviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placements" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "jobRequisitionId" TEXT,
    "organizationId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "salary" INTEGER,
    "commissionRate" DOUBLE PRECISION,
    "commissionAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SSOConfiguration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerName" TEXT,
    "samlMetadataUrl" TEXT,
    "samlEntityId" TEXT,
    "samlSsoUrl" TEXT,
    "samlSloUrl" TEXT,
    "samlCertificate" TEXT,
    "samlSignatureAlg" TEXT NOT NULL DEFAULT 'RSA-SHA256',
    "samlDigestAlg" TEXT NOT NULL DEFAULT 'SHA256',
    "oidcClientId" TEXT,
    "oidcClientSecret" TEXT,
    "oidcIssuerUrl" TEXT,
    "oidcAuthUrl" TEXT,
    "oidcTokenUrl" TEXT,
    "oidcUserInfoUrl" TEXT,
    "oidcScopes" TEXT NOT NULL DEFAULT 'openid,email,profile',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "enforceSso" BOOLEAN NOT NULL DEFAULT false,
    "defaultRole" TEXT NOT NULL DEFAULT 'member',
    "emailAttribute" TEXT NOT NULL DEFAULT 'email',
    "nameAttribute" TEXT NOT NULL DEFAULT 'name',
    "roleAttribute" TEXT,
    "groupsAttribute" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SSOConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "permissions" TEXT[] NOT NULL,
    "rateLimitPerMin" INTEGER NOT NULL DEFAULT 60,
    "rateLimitPerDay" INTEGER NOT NULL DEFAULT 10000,
    "allowedIpAddresses" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "totalRequests" BIGINT NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "changes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[] NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "contentType" TEXT NOT NULL DEFAULT 'application/json',
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "retryDelayMs" INTEGER NOT NULL DEFAULT 5000,
    "lastTriggeredAt" TIMESTAMP(3),
    "lastStatus" TEXT,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandingConfiguration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoDarkUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#4f46e5',
    "secondaryColor" TEXT NOT NULL DEFAULT '#7c3aed',
    "accentColor" TEXT NOT NULL DEFAULT '#06b6d4',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "surfaceColor" TEXT NOT NULL DEFAULT '#f9fafb',
    "textColor" TEXT NOT NULL DEFAULT '#111827',
    "fontFamily" TEXT,
    "headingFont" TEXT,
    "customDomain" TEXT,
    "domainVerified" BOOLEAN NOT NULL DEFAULT false,
    "sslEnabled" BOOLEAN NOT NULL DEFAULT true,
    "hideTechcittaBranding" BOOLEAN NOT NULL DEFAULT false,
    "customFooterText" TEXT,
    "customLoginMessage" TEXT,
    "emailFromName" TEXT,
    "emailFromAddress" TEXT,
    "emailTemplateId" TEXT,
    "customTermsUrl" TEXT,
    "customPrivacyUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandingConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewMetrics" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "avgResponseLen" DOUBLE PRECISION NOT NULL,
    "technicalTerms" INTEGER NOT NULL,
    "positiveSignals" INTEGER NOT NULL,
    "negativeSignals" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "codingPassRate" DOUBLE PRECISION,
    "performanceScores" TEXT NOT NULL,
    "llmScore" DOUBLE PRECISION NOT NULL,
    "recommendation" TEXT NOT NULL,
    "proctorFlags" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "LoginLog_userId_idx" ON "LoginLog"("userId");

-- CreateIndex
CREATE INDEX "LoginLog_organizationId_idx" ON "LoginLog"("organizationId");

-- CreateIndex
CREATE INDEX "LoginLog_createdAt_idx" ON "LoginLog"("createdAt");

-- CreateIndex
CREATE INDEX "LoginLog_email_idx" ON "LoginLog"("email");

-- CreateIndex
CREATE INDEX "clients_organizationId_idx" ON "clients"("organizationId");

-- CreateIndex
CREATE INDEX "job_requisitions_organizationId_idx" ON "job_requisitions"("organizationId");

-- CreateIndex
CREATE INDEX "job_requisitions_clientId_idx" ON "job_requisitions"("clientId");

-- CreateIndex
CREATE INDEX "agency_candidates_organizationId_idx" ON "agency_candidates"("organizationId");

-- CreateIndex
CREATE INDEX "agency_candidates_naukriId_idx" ON "agency_candidates"("naukriId");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_submissions_candidateId_jobRequisitionId_key" ON "candidate_submissions"("candidateId", "jobRequisitionId");

-- CreateIndex
CREATE INDEX "candidate_submissions_organizationId_idx" ON "candidate_submissions"("organizationId");

-- CreateIndex
CREATE INDEX "placements_organizationId_idx" ON "placements"("organizationId");

-- CreateIndex
CREATE INDEX "placements_clientId_idx" ON "placements"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "SSOConfiguration_organizationId_key" ON "SSOConfiguration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_webhookId_createdAt_idx" ON "WebhookDelivery"("webhookId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BrandingConfiguration_organizationId_key" ON "BrandingConfiguration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandingConfiguration_customDomain_key" ON "BrandingConfiguration"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewMetrics_interviewId_key" ON "InterviewMetrics"("interviewId");

-- CreateIndex
CREATE INDEX "InterviewMetrics_userId_idx" ON "InterviewMetrics"("userId");

-- CreateIndex
CREATE INDEX "InterviewMetrics_experienceLevel_idx" ON "InterviewMetrics"("experienceLevel");

-- CreateIndex
CREATE INDEX "InterviewMetrics_llmScore_idx" ON "InterviewMetrics"("llmScore");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginLog" ADD CONSTRAINT "LoginLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "openai_usage_logs" ADD CONSTRAINT "openai_usage_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "openai_usage_logs" ADD CONSTRAINT "openai_usage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_candidates" ADD CONSTRAINT "agency_candidates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_submissions" ADD CONSTRAINT "candidate_submissions_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "agency_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_submissions" ADD CONSTRAINT "candidate_submissions_jobRequisitionId_fkey" FOREIGN KEY ("jobRequisitionId") REFERENCES "job_requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_submissions" ADD CONSTRAINT "candidate_submissions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "agency_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_jobRequisitionId_fkey" FOREIGN KEY ("jobRequisitionId") REFERENCES "job_requisitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSOConfiguration" ADD CONSTRAINT "SSOConfiguration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandingConfiguration" ADD CONSTRAINT "BrandingConfiguration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewMetrics" ADD CONSTRAINT "InterviewMetrics_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewMetrics" ADD CONSTRAINT "InterviewMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Add results unlock columns to Interview
ALTER TABLE "Interview" ADD COLUMN "resultsUnlocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Interview" ADD COLUMN "resultsPaymentId" TEXT;
