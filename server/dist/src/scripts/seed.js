"use strict";
// src/scripts/seedAdmin.ts
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
const auth_client_1 = require("../../prisma/generated/auth-client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function seedAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        const prisma = new auth_client_1.PrismaClient();
        try {
            console.log("Starting to seed admin user...");
            // Check if user already exists
            const existingUser = yield prisma.user.findUnique({
                where: { email: "admin@example.com" }
            });
            if (existingUser) {
                console.log("Admin user already exists");
                return;
            }
            // Create new admin user
            // Using the same hashed password from your hardcoded user
            const user = yield prisma.user.create({
                data: {
                    email: "admin@example.com",
                    password: "$2a$10$r0qjaDXvPi5e8baza.FT3uNOFHUo4WSbcyYszsszrDLHHuALcP5PC", // admin123
                    name: "Administrator"
                }
            });
            console.log("✅ Admin user created successfully:");
            console.log(`ID: ${user.id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Name: ${user.name}`);
            console.log("Password: admin123 (hashed in database)");
        }
        catch (error) {
            console.error("Error seeding admin user:", error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
// Run the function
seedAdmin()
    .then(() => console.log("Seeding completed"))
    .catch(e => console.error("Seeding failed:", e));
