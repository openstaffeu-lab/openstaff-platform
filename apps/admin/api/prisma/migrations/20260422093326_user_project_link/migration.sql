/*
  Warnings:

  - You are about to drop the `Contract` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Invoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Profile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Wallet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ContractToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EscoSkillToProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_NaceToProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `cityId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `countryId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `regionId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `uniclassId` on the `Project` table. All the data in the column will be lost.
  - Added the required column `createdById` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Contract_code_key";

-- DropIndex
DROP INDEX "Profile_userId_key";

-- DropIndex
DROP INDEX "Wallet_userId_key";

-- DropIndex
DROP INDEX "_ContractToUser_B_index";

-- DropIndex
DROP INDEX "_ContractToUser_AB_unique";

-- DropIndex
DROP INDEX "_EscoSkillToProfile_B_index";

-- DropIndex
DROP INDEX "_EscoSkillToProfile_AB_unique";

-- DropIndex
DROP INDEX "_NaceToProfile_B_index";

-- DropIndex
DROP INDEX "_NaceToProfile_AB_unique";

-- DropTable
DROP TABLE "Contract";

-- DropTable
DROP TABLE "Invoice";

-- DropTable
DROP TABLE "Profile";

-- DropTable
DROP TABLE "Wallet";

-- DropTable
DROP TABLE "_ContractToUser";

-- DropTable
DROP TABLE "_EscoSkillToProfile";

-- DropTable
DROP TABLE "_NaceToProfile";

-- RedefineTables
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("createdAt", "id", "location", "name", "status") SELECT "createdAt", "id", "location", "name", "status" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
