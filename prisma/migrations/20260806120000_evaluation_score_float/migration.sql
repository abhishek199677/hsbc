-- AlterTable
-- Change evaluationScore from INTEGER to REAL so decimal scores (e.g. 7.5) can be stored.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Interview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "mode" TEXT NOT NULL DEFAULT 'AI Video Interview',
    "type" TEXT NOT NULL DEFAULT 'Technical + Behavioral Assessment',
    "duration" INTEGER NOT NULL DEFAULT 15,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "videoUrl" TEXT,
    "captionUrl" TEXT,
    "transcript" TEXT,
    "evaluation" TEXT,
    "evaluationScore" REAL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "reminder24hSent" BOOLEAN NOT NULL DEFAULT false,
    "reminder1hSent" BOOLEAN NOT NULL DEFAULT false,
    "reminder15mSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderNowSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Interview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Interview" ("captionUrl", "createdAt", "date", "duration", "emailSent", "evaluation", "evaluationScore", "id", "mode", "reminder15mSent", "reminder1hSent", "reminder24hSent", "reminderNowSent", "status", "time", "timezone", "transcript", "type", "updatedAt", "userId", "videoUrl", "whatsappSent") SELECT "captionUrl", "createdAt", "date", "duration", "emailSent", "evaluation", "evaluationScore", "id", "mode", "reminder15mSent", "reminder1hSent", "reminder24hSent", "reminderNowSent", "status", "time", "timezone", "transcript", "type", "updatedAt", "userId", "videoUrl", "whatsappSent" FROM "Interview";
DROP TABLE "Interview";
ALTER TABLE "new_Interview" RENAME TO "Interview";
CREATE UNIQUE INDEX "Interview_userId_key" ON "Interview"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
