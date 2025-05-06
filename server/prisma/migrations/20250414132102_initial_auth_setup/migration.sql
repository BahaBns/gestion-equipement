/*
  Warnings:

  - You are about to drop the `Actif` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActifHashtag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivityLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AssignmentToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Attachment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Employee` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmployeeActif` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmployeeLicense` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Etat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Fournisseur` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FournisseurContact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Hashtag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `License` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LicenseAttachment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LicenseHashtag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LicenseType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Marque` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Modele` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Specification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `actifType` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Actif" DROP CONSTRAINT "Actif_actifTypeId_fkey";

-- DropForeignKey
ALTER TABLE "Actif" DROP CONSTRAINT "Actif_etatId_fkey";

-- DropForeignKey
ALTER TABLE "Actif" DROP CONSTRAINT "Actif_fournisseurId_fkey";

-- DropForeignKey
ALTER TABLE "Actif" DROP CONSTRAINT "Actif_marqueId_fkey";

-- DropForeignKey
ALTER TABLE "Actif" DROP CONSTRAINT "Actif_modeleId_fkey";

-- DropForeignKey
ALTER TABLE "Actif" DROP CONSTRAINT "Actif_statusId_fkey";

-- DropForeignKey
ALTER TABLE "ActifHashtag" DROP CONSTRAINT "ActifHashtag_actifId_fkey";

-- DropForeignKey
ALTER TABLE "ActifHashtag" DROP CONSTRAINT "ActifHashtag_hashtagId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_actifId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_licenseId_fkey";

-- DropForeignKey
ALTER TABLE "AssignmentToken" DROP CONSTRAINT "AssignmentToken_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_actifId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeActif" DROP CONSTRAINT "EmployeeActif_actifId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeActif" DROP CONSTRAINT "EmployeeActif_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeLicense" DROP CONSTRAINT "EmployeeLicense_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeLicense" DROP CONSTRAINT "EmployeeLicense_licenseId_fkey";

-- DropForeignKey
ALTER TABLE "FournisseurContact" DROP CONSTRAINT "FournisseurContact_fournisseurId_fkey";

-- DropForeignKey
ALTER TABLE "License" DROP CONSTRAINT "License_etatId_fkey";

-- DropForeignKey
ALTER TABLE "License" DROP CONSTRAINT "License_licenseTypeId_fkey";

-- DropForeignKey
ALTER TABLE "License" DROP CONSTRAINT "License_statusId_fkey";

-- DropForeignKey
ALTER TABLE "LicenseAttachment" DROP CONSTRAINT "LicenseAttachment_licenseId_fkey";

-- DropForeignKey
ALTER TABLE "LicenseHashtag" DROP CONSTRAINT "LicenseHashtag_hashtagId_fkey";

-- DropForeignKey
ALTER TABLE "LicenseHashtag" DROP CONSTRAINT "LicenseHashtag_licenseId_fkey";

-- DropForeignKey
ALTER TABLE "LicenseType" DROP CONSTRAINT "LicenseType_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Marque" DROP CONSTRAINT "Marque_actifTypeId_fkey";

-- DropForeignKey
ALTER TABLE "Modele" DROP CONSTRAINT "Modele_marqueId_fkey";

-- DropForeignKey
ALTER TABLE "Specification" DROP CONSTRAINT "Specification_actifId_fkey";

-- DropForeignKey
ALTER TABLE "actifType" DROP CONSTRAINT "actifType_categoryId_fkey";

-- DropTable
DROP TABLE "Actif";

-- DropTable
DROP TABLE "ActifHashtag";

-- DropTable
DROP TABLE "ActivityLog";

-- DropTable
DROP TABLE "AssignmentToken";

-- DropTable
DROP TABLE "Attachment";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Employee";

-- DropTable
DROP TABLE "EmployeeActif";

-- DropTable
DROP TABLE "EmployeeLicense";

-- DropTable
DROP TABLE "Etat";

-- DropTable
DROP TABLE "Fournisseur";

-- DropTable
DROP TABLE "FournisseurContact";

-- DropTable
DROP TABLE "Hashtag";

-- DropTable
DROP TABLE "License";

-- DropTable
DROP TABLE "LicenseAttachment";

-- DropTable
DROP TABLE "LicenseHashtag";

-- DropTable
DROP TABLE "LicenseType";

-- DropTable
DROP TABLE "Marque";

-- DropTable
DROP TABLE "Modele";

-- DropTable
DROP TABLE "Specification";

-- DropTable
DROP TABLE "Status";

-- DropTable
DROP TABLE "actifType";

-- DropEnum
DROP TYPE "ActivityType";

-- DropEnum
DROP TYPE "TokenStatus";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatabaseAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "databaseName" TEXT NOT NULL,

    CONSTRAINT "DatabaseAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DatabaseAccess_userId_databaseName_key" ON "DatabaseAccess"("userId", "databaseName");

-- AddForeignKey
ALTER TABLE "DatabaseAccess" ADD CONSTRAINT "DatabaseAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
