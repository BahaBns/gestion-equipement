/*
  Warnings:

  - You are about to drop the `DatabaseAccess` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('ACTIF_ASSIGNED', 'ACTIF_RESERVED', 'ACTIF_ACCEPTED', 'ACTIF_REJECTED', 'ACTIF_REMOVED', 'LICENSE_ASSIGNED', 'LICENSE_RESERVED', 'LICENSE_ACCEPTED', 'LICENSE_REJECTED', 'LICENSE_REMOVED');

-- DropForeignKey
ALTER TABLE "DatabaseAccess" DROP CONSTRAINT "DatabaseAccess_userId_fkey";

-- DropTable
DROP TABLE "DatabaseAccess";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Actif" (
    "actifId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "actifType" TEXT NOT NULL,
    "dateAjout" TIMESTAMP(3) NOT NULL,
    "actifTypeId" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "etatId" TEXT NOT NULL,
    "marqueId" TEXT,
    "modeleId" TEXT,
    "fournisseurId" TEXT,
    "warrantyEnd" TIMESTAMP(3),
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "Actif_pkey" PRIMARY KEY ("actifId")
);

-- CreateTable
CREATE TABLE "Etat" (
    "etatId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Etat_pkey" PRIMARY KEY ("etatId")
);

-- CreateTable
CREATE TABLE "Status" (
    "statusId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("statusId")
);

-- CreateTable
CREATE TABLE "Specification" (
    "specificationId" TEXT NOT NULL,
    "actifId" TEXT NOT NULL,
    "ram" TEXT,
    "cpu" TEXT,
    "stockage" TEXT,
    "graphique" TEXT,

    CONSTRAINT "Specification_pkey" PRIMARY KEY ("specificationId")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "attachmentId" TEXT NOT NULL,
    "actifId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("attachmentId")
);

-- CreateTable
CREATE TABLE "Employee" (
    "employeeId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("employeeId")
);

-- CreateTable
CREATE TABLE "AssignmentToken" (
    "tokenId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "actifIds" TEXT[],
    "licenseIds" TEXT[],
    "type" TEXT NOT NULL DEFAULT 'actif',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "status" "TokenStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "AssignmentToken_pkey" PRIMARY KEY ("tokenId")
);

-- CreateTable
CREATE TABLE "EmployeeActif" (
    "employeeId" TEXT NOT NULL,
    "actifId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "EmployeeActif_pkey" PRIMARY KEY ("employeeId","actifId")
);

-- CreateTable
CREATE TABLE "Category" (
    "categoryId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("categoryId")
);

-- CreateTable
CREATE TABLE "actifType" (
    "actifTypeId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "actifType_pkey" PRIMARY KEY ("actifTypeId")
);

-- CreateTable
CREATE TABLE "License" (
    "licenseId" TEXT NOT NULL,
    "softwareName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "licenseQuantity" INTEGER NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "vendorContact" TEXT NOT NULL,
    "supportContact" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "statusId" TEXT NOT NULL,
    "etatId" TEXT NOT NULL,
    "assignedTo" TEXT,
    "licenseTypeId" TEXT NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("licenseId")
);

-- CreateTable
CREATE TABLE "LicenseType" (
    "licenseTypeId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "LicenseType_pkey" PRIMARY KEY ("licenseTypeId")
);

-- CreateTable
CREATE TABLE "EmployeeLicense" (
    "employeeId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "EmployeeLicense_pkey" PRIMARY KEY ("employeeId","licenseId")
);

-- CreateTable
CREATE TABLE "LicenseAttachment" (
    "attachmentId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,

    CONSTRAINT "LicenseAttachment_pkey" PRIMARY KEY ("attachmentId")
);

-- CreateTable
CREATE TABLE "Hashtag" (
    "hashtagId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hashtag_pkey" PRIMARY KEY ("hashtagId")
);

-- CreateTable
CREATE TABLE "ActifHashtag" (
    "actifId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActifHashtag_pkey" PRIMARY KEY ("actifId","hashtagId")
);

-- CreateTable
CREATE TABLE "LicenseHashtag" (
    "licenseId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseHashtag_pkey" PRIMARY KEY ("licenseId","hashtagId")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "logId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeeId" TEXT,
    "actifId" TEXT,
    "licenseId" TEXT,
    "userId" TEXT,
    "details" TEXT,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("logId")
);

-- CreateTable
CREATE TABLE "Marque" (
    "marqueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "actifTypeId" TEXT NOT NULL,

    CONSTRAINT "Marque_pkey" PRIMARY KEY ("marqueId")
);

-- CreateTable
CREATE TABLE "Modele" (
    "modeleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "marqueId" TEXT NOT NULL,

    CONSTRAINT "Modele_pkey" PRIMARY KEY ("modeleId")
);

-- CreateTable
CREATE TABLE "Fournisseur" (
    "fournisseurId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,

    CONSTRAINT "Fournisseur_pkey" PRIMARY KEY ("fournisseurId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Actif_serialNumber_key" ON "Actif"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Etat_name_key" ON "Etat"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Status_name_key" ON "Status"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Specification_actifId_key" ON "Specification"("actifId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentToken_token_key" ON "AssignmentToken"("token");

-- CreateIndex
CREATE INDEX "AssignmentToken_status_idx" ON "AssignmentToken"("status");

-- CreateIndex
CREATE INDEX "AssignmentToken_employeeId_idx" ON "AssignmentToken"("employeeId");

-- CreateIndex
CREATE INDEX "AssignmentToken_type_idx" ON "AssignmentToken"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Hashtag_name_key" ON "Hashtag"("name");

-- CreateIndex
CREATE INDEX "ActivityLog_employeeId_idx" ON "ActivityLog"("employeeId");

-- CreateIndex
CREATE INDEX "ActivityLog_actifId_idx" ON "ActivityLog"("actifId");

-- CreateIndex
CREATE INDEX "ActivityLog_licenseId_idx" ON "ActivityLog"("licenseId");

-- CreateIndex
CREATE INDEX "ActivityLog_activityType_idx" ON "ActivityLog"("activityType");

-- CreateIndex
CREATE INDEX "ActivityLog_timestamp_idx" ON "ActivityLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Marque_name_actifTypeId_key" ON "Marque"("name", "actifTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Modele_name_marqueId_key" ON "Modele"("name", "marqueId");

-- CreateIndex
CREATE UNIQUE INDEX "Fournisseur_name_key" ON "Fournisseur"("name");

-- AddForeignKey
ALTER TABLE "Actif" ADD CONSTRAINT "Actif_actifTypeId_fkey" FOREIGN KEY ("actifTypeId") REFERENCES "actifType"("actifTypeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actif" ADD CONSTRAINT "Actif_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("statusId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actif" ADD CONSTRAINT "Actif_etatId_fkey" FOREIGN KEY ("etatId") REFERENCES "Etat"("etatId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actif" ADD CONSTRAINT "Actif_marqueId_fkey" FOREIGN KEY ("marqueId") REFERENCES "Marque"("marqueId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actif" ADD CONSTRAINT "Actif_modeleId_fkey" FOREIGN KEY ("modeleId") REFERENCES "Modele"("modeleId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actif" ADD CONSTRAINT "Actif_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseur"("fournisseurId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specification" ADD CONSTRAINT "Specification_actifId_fkey" FOREIGN KEY ("actifId") REFERENCES "Actif"("actifId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_actifId_fkey" FOREIGN KEY ("actifId") REFERENCES "Actif"("actifId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentToken" ADD CONSTRAINT "AssignmentToken_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeActif" ADD CONSTRAINT "EmployeeActif_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeActif" ADD CONSTRAINT "EmployeeActif_actifId_fkey" FOREIGN KEY ("actifId") REFERENCES "Actif"("actifId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actifType" ADD CONSTRAINT "actifType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("statusId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_etatId_fkey" FOREIGN KEY ("etatId") REFERENCES "Etat"("etatId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_licenseTypeId_fkey" FOREIGN KEY ("licenseTypeId") REFERENCES "LicenseType"("licenseTypeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseType" ADD CONSTRAINT "LicenseType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLicense" ADD CONSTRAINT "EmployeeLicense_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLicense" ADD CONSTRAINT "EmployeeLicense_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("licenseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseAttachment" ADD CONSTRAINT "LicenseAttachment_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("licenseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActifHashtag" ADD CONSTRAINT "ActifHashtag_actifId_fkey" FOREIGN KEY ("actifId") REFERENCES "Actif"("actifId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActifHashtag" ADD CONSTRAINT "ActifHashtag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag"("hashtagId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseHashtag" ADD CONSTRAINT "LicenseHashtag_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("licenseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseHashtag" ADD CONSTRAINT "LicenseHashtag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag"("hashtagId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actifId_fkey" FOREIGN KEY ("actifId") REFERENCES "Actif"("actifId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("licenseId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marque" ADD CONSTRAINT "Marque_actifTypeId_fkey" FOREIGN KEY ("actifTypeId") REFERENCES "actifType"("actifTypeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modele" ADD CONSTRAINT "Modele_marqueId_fkey" FOREIGN KEY ("marqueId") REFERENCES "Marque"("marqueId") ON DELETE RESTRICT ON UPDATE CASCADE;
