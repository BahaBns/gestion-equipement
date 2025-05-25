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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/seedAuthUser.ts
const auth_client_1 = require("@prisma/auth-client"); // Adjust path if your auth-client is elsewhere
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new auth_client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Start seeding User table in auth_db...");
        const adminEmail = "admin@insight-times.com";
        const adminPassword = "admin123"; // The plain text password
        const adminName = "Admin"; // Optional: if you want to seed the name
        const saltRounds = 10;
        const adminEmail1 = "admin@lagomcons.com";
        const adminPassword1 = "admin123"; // The plain text password
        const adminName1 = "Admin"; // Optional: if you want to seed the name
        const saltRounds1 = 10;
        const hashedPassword = yield bcryptjs_1.default.hash(adminPassword, saltRounds);
        console.log(`Password "${adminPassword}" hashed.`);
        const hashedPassword1 = yield bcryptjs_1.default.hash(adminPassword1, saltRounds1);
        try {
            const adminUser = yield prisma.user.upsert({
                where: { email: adminEmail },
                update: {
                    password: hashedPassword,
                    name: adminName, // Add name here if you want to update it
                },
                create: {
                    email: adminEmail,
                    password: hashedPassword,
                    name: adminName, // Add name here for creation
                },
            });
            const adminUser1 = yield prisma.user.upsert({
                where: { email: adminEmail1 },
                update: {
                    password: hashedPassword1,
                    name: adminName1, // Add name here if you want to update it
                },
                create: {
                    email: adminEmail1,
                    password: hashedPassword1,
                    name: adminName1, // Add name here for creation
                },
            });
            console.log(`Successfully seeded user: ${adminUser.email} ${adminUser1.email} `);
        }
        catch (error) {
            console.error("Error seeding user:", error);
            process.exit(1);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
main()
    .then(() => {
    console.log("Finished seeding.");
})
    .catch((e) => {
    console.error(e);
    process.exit(1);
});
