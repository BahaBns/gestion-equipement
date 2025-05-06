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
            console.log("Starting to seed etats...");
            // Create the states
            const etats = [
                { name: "opérationnel" },
                { name: "en maintenance" },
                { name: "en panne" },
                { name: "expiré" },
            ];
            // Insert each state with a unique ID
            for (const etat of etats) {
                yield prisma.etat.upsert({
                    where: { name: etat.name },
                    update: {}, // No updates if already exists
                    create: {
                        etatId: etat.name.replace(/\s+/g, "_").toLowerCase(), // Create ID from name (e.g., "en_panne")
                        name: etat.name,
                    },
                });
                console.log(`Created etat: ${etat.name}`);
            }
            console.log("Etats seeded successfully");
        }
        catch (error) {
            console.error("Error seeding data:", error);
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
