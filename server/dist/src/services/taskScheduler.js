"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTaskScheduler = void 0;
// services/taskScheduler.ts
const client_1 = require("@prisma/client");
const cron_1 = require("cron");
const tokenService_1 = require("./tokenService");
const prisma = new client_1.PrismaClient();
/**
 * Process expired assignment tokens and return equipment/licenses to available status
 */
const processExpiredAssignments = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Checking for expired assignment tokens...");
        // Find expired tokens that are still pending
        const expiredTokens = yield prisma.assignmentToken.findMany({
            where: {
                status: "PENDING",
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
        if (expiredTokens.length === 0) {
            console.log("No expired tokens found");
            return;
        }
        console.log(`Found ${expiredTokens.length} expired assignment tokens to process`);
        // Find "Disponible" status for resetting items
        const availableStatus = yield prisma.status.findFirst({
            where: { name: "Disponible" },
        });
        if (!availableStatus) {
            console.error('Status "Disponible" not found in the system');
            return;
        }
        // Process each expired token
        for (const tokenRecord of expiredTokens) {
            yield prisma.$transaction((prismaClient) => __awaiter(void 0, void 0, void 0, function* () {
                // Handle based on token type
                if (tokenRecord.type === "actif") {
                    // Update actif status back to available
                    for (const actifId of tokenRecord.actifIds) {
                        yield prismaClient.actif.update({
                            where: { actifId },
                            data: { statusId: availableStatus.statusId },
                        });
                        // Remove employee-actif relationship
                        yield prismaClient.employeeActif.deleteMany({
                            where: {
                                employeeId: tokenRecord.employeeId,
                                actifId,
                            },
                        });
                        // Log the expiration
                        yield prismaClient.activityLog.create({
                            data: {
                                activityType: "ACTIF_REJECTED",
                                employeeId: tokenRecord.employeeId,
                                actifId,
                                details: "Réservation expirée automatiquement après 7 jours",
                                timestamp: new Date(),
                            },
                        });
                    }
                }
                else if (tokenRecord.type === "license") {
                    // Update license status back to available
                    for (const licenseId of tokenRecord.licenseIds) {
                        yield prismaClient.license.update({
                            where: { licenseId },
                            data: { statusId: availableStatus.statusId },
                        });
                        // Remove employee-license relationship
                        yield prismaClient.employeeLicense.deleteMany({
                            where: {
                                employeeId: tokenRecord.employeeId,
                                licenseId,
                            },
                        });
                        // Log the expiration
                        yield prismaClient.activityLog.create({
                            data: {
                                activityType: "LICENSE_REJECTED",
                                employeeId: tokenRecord.employeeId,
                                licenseId,
                                details: "Réservation expirée automatiquement après 7 jours",
                                timestamp: new Date(),
                            },
                        });
                    }
                }
                // Mark token as expired
                yield (0, tokenService_1.updateTokenStatus)(tokenRecord.token, "EXPIRED");
            }));
            console.log(`Processed expired token ${tokenRecord.tokenId} for employee ${tokenRecord.employeeId}`);
        }
        console.log("Finished processing expired assignment tokens");
    }
    catch (error) {
        console.error("Error processing expired assignments:", error);
    }
});
/**
 * Initialize the task scheduler
 */
const initializeTaskScheduler = () => {
    // Run every day at midnight
    const dailyJob = new cron_1.CronJob("0 0 * * *", processExpiredAssignments);
    // Start the job
    dailyJob.start();
    console.log("Task scheduler initialized for processing expired assignments");
};
exports.initializeTaskScheduler = initializeTaskScheduler;
