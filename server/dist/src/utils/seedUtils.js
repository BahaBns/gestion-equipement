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
exports.withDatabaseUrl = withDatabaseUrl;
// utils/seedUtils.ts
const client_1 = require("@prisma/client");
// Create a function that sets the active database URL environment variable
function withDatabaseUrl(databaseUrl, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        // Store the original DATABASE_URL
        const originalUrl = process.env.DATABASE_URL;
        try {
            // Set the DATABASE_URL to the target database
            process.env.DATABASE_URL = databaseUrl;
            // Create a new Prisma client with this database URL
            const prisma = new client_1.PrismaClient();
            // Run the callback with the prisma client
            yield callback(prisma);
            // Cleanup
            yield prisma.$disconnect();
        }
        finally {
            // Restore the original DATABASE_URL
            process.env.DATABASE_URL = originalUrl;
        }
    });
}
