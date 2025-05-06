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
exports.main = main;
const client_1 = require("@prisma/client");
// Default client for backward compatibility
const defaultPrisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, arguments, void 0, function* (prisma = defaultPrisma) {
        try {
            console.log("Starting to seed database with status types...");
            // Define status types
            const statusTypes = [
                {
                    statusId: "STATUS_DISPONIBLE",
                    name: "Disponible",
                },
                {
                    statusId: "STATUS_RESERVE",
                    name: "Réservé",
                },
                {
                    statusId: "STATUS_ASSIGNE",
                    name: "Assigné",
                },
            ];
            // Create all the status types
            for (const status of statusTypes) {
                try {
                    yield prisma.status.upsert({
                        where: { statusId: status.statusId },
                        update: {
                            name: status.name,
                        },
                        create: {
                            statusId: status.statusId,
                            name: status.name,
                        },
                    });
                    console.log(`Created status: ${status.name}`);
                }
                catch (error) {
                    console.error(`Error creating status ${status.name}:`, error);
                }
            }
            console.log("Status database seeding completed successfully!");
        }
        catch (error) {
            console.error("Error seeding database:", error);
            throw error;
        }
        // No need to disconnect here, as it will be handled by the calling function
    });
}
// For direct execution of this seed file
if (require.main === module) {
    main()
        .then(() => __awaiter(void 0, void 0, void 0, function* () {
        yield defaultPrisma.$disconnect();
    }))
        .catch((e) => __awaiter(void 0, void 0, void 0, function* () {
        console.error(e);
        yield defaultPrisma.$disconnect();
        process.exit(1);
    }));
}
