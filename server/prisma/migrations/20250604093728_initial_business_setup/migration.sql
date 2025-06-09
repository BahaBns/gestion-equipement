-- AlterTable
ALTER TABLE "EmployeeActif" ADD COLUMN     "statusId" TEXT;

-- AlterTable
ALTER TABLE "EmployeeLicense" ADD COLUMN     "statusId" TEXT;

-- AddForeignKey
ALTER TABLE "EmployeeActif" ADD CONSTRAINT "EmployeeActif_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("statusId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLicense" ADD CONSTRAINT "EmployeeLicense_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("statusId") ON DELETE SET NULL ON UPDATE CASCADE;
