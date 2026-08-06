-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "planStatus" TEXT;
ALTER TABLE "Organization" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "stripePriceId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "trialEndsAt" DATETIME;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" DATETIME;

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "resumeUrl" TEXT,
    "resumeFileName" TEXT,
    "aboutYou" TEXT,
    "whatDrivesYou" TEXT,
    "strengths" TEXT,
    "currentRole" TEXT,
    "totalExperience" TEXT,
    "currentLocation" TEXT,
    "noticePeriod" TEXT,
    "skills" TEXT,
    "currentCompany" TEXT,
    "education" TEXT,
    "jobType" TEXT,
    "salaryRange" TEXT,
    "preferredLocation" TEXT,
    "workMode" TEXT,
    "preferredDate" TEXT,
    "preferredTimeSlot" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "step" INTEGER NOT NULL DEFAULT 1,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("aboutYou", "createdAt", "currentCompany", "currentLocation", "currentRole", "education", "id", "isComplete", "jobType", "noticePeriod", "preferredDate", "preferredLocation", "preferredTimeSlot", "resumeFileName", "resumeUrl", "salaryRange", "skills", "step", "strengths", "totalExperience", "updatedAt", "userId", "whatDrivesYou", "workMode") SELECT "aboutYou", "createdAt", "currentCompany", "currentLocation", "currentRole", "education", "id", "isComplete", "jobType", "noticePeriod", "preferredDate", "preferredLocation", "preferredTimeSlot", "resumeFileName", "resumeUrl", "salaryRange", "skills", "step", "strengths", "totalExperience", "updatedAt", "userId", "whatDrivesYou", "workMode" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeCustomerId_key" ON "Organization"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeSubscriptionId_key" ON "Organization"("stripeSubscriptionId");
