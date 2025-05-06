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
// src/scripts/verify_login.ts
const auth_client_1 = require("../../prisma/generated/auth-client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Email and password to test
const testEmail = "admin@insight.com";
const testPassword = "admin123";
function verifyCredentials() {
    return __awaiter(this, void 0, void 0, function* () {
        const prisma = new auth_client_1.PrismaClient();
        try {
            console.log(`Testing login for: ${testEmail}`);
            const user = yield prisma.user.findUnique({
                where: { email: testEmail }
            });
            if (!user) {
                console.log("❌ User not found in database");
                return;
            }
            console.log("✅ User found:");
            console.log(`- ID: ${user.id}`);
            console.log(`- Email: ${user.email}`);
            console.log(`- Name: ${user.name}`);
            const validPassword = yield bcryptjs_1.default.compare(testPassword, user.password);
            if (validPassword) {
                console.log("✅ Password is correct");
            }
            else {
                console.log("❌ Password is incorrect");
                // Check if the hash format is valid
                if (!user.password.startsWith('$2a$')) {
                    console.log("⚠️ Hash doesn't appear to be bcrypt format");
                }
            }
        }
        catch (error) {
            console.error("Error:", error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
verifyCredentials()
    .then(() => console.log("Verification complete"))
    .catch(e => console.error("Verification failed:", e));
