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
// scripts/seed-auth-db.ts
// If you're using a separate client for auth, use this import instead:
const auth_client_1 = require("../../prisma/generated/auth-client");
function seedAuthDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        // Use environment variable for auth database
        const prisma = new auth_client_1.PrismaClient({
            datasources: {
                db: {
                    url: process.env.AUTH_DATABASE_URL,
                },
            },
        });
        try {
            console.log("Seeding auth database...");
            // Create admin user with already hashed password
            const user = yield prisma.user.create({
                data: {
                    id: "1", // Adding an ID (modify as needed)
                    email: "admin@example.com",
                    password: "$2a$10$r0qjaDXvPi5e8baza.FT3uNOFHUo4WSbcyYszsszrDLHHuALcP5PC", // Pre-hashed password
                    name: "admin user",
                },
            });
            console.log("Created user:", user);
            // Grant database access to both business databases
            yield prisma.databaseAccess.createMany({
                data: [
                    {
                        userId: user.id,
                        databaseName: "lagom",
                    },
                    {
                        userId: user.id,
                        databaseName: "insight",
                    },
                ],
            });
            console.log("Database access granted to user for lagom and insight databases");
            console.log("Auth database seeding completed successfully!");
        }
        catch (error) {
            console.error("Error seeding auth database:", error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
// Execute the seed function
seedAuthDatabase();
