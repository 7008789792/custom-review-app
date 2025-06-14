/*
  Warnings:

  - You are about to drop the column `content` on the `ReviewSnippet` table. All the data in the column will be lost.
  - Added the required column `snippet` to the `ReviewSnippet` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReviewSnippet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "snippet" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ReviewSnippet" ("createdAt", "id", "productId", "updatedAt") SELECT "createdAt", "id", "productId", "updatedAt" FROM "ReviewSnippet";
DROP TABLE "ReviewSnippet";
ALTER TABLE "new_ReviewSnippet" RENAME TO "ReviewSnippet";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
