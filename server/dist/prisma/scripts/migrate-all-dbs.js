"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
// scripts/setup-all-dbs.ts
const child_process_1 = require("child_process");
const dotenv = __importStar(require("dotenv"));
const pg_1 = require("pg");
// Load environment variables
dotenv.config();
function createDatabaseIfNotExists(dbName) {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = new pg_1.Pool({
            user: "postgres",
            password: "Insight_h38UNZq64",
            host: "localhost",
            port: 5432,
            database: "postgres", // Connect to default database
        });
        try {
            // Check if database exists
            const result = yield pool.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
            if (result.rowCount === 0) {
                console.log(`Creating database: ${dbName}`);
                // Create the database
                yield pool.query(`CREATE DATABASE ${dbName}`);
                console.log(`Database ${dbName} created successfully.`);
            }
            else {
                console.log(`Database ${dbName} already exists.`);
            }
        }
        catch (error) {
            console.error(`Error working with database ${dbName}:`, error);
            throw error;
        }
        finally {
            yield pool.end();
        }
    });
}
function setupAllDatabases() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("=== CREATING DATABASES IF THEY DON'T EXIST ===");
            yield createDatabaseIfNotExists("auth_db");
            yield createDatabaseIfNotExists("lagom");
            yield createDatabaseIfNotExists("insight");
            console.log("\n=== MIGRATING ALL DATABASES ===");
            // Migrate auth database
            console.log("\nMigrating auth database...");
            process.env.DATABASE_URL = process.env.AUTH_DATABASE_URL;
            (0, child_process_1.execSync)("npx prisma migrate dev --name initial-auth-setup --schema=./prisma/schema.auth.prisma", {
                stdio: "inherit",
                env: Object.assign({}, process.env),
            });
            // Migrate lagom database
            console.log("\nMigrating lagom database...");
            process.env.DATABASE_URL = process.env.LAGOM_DATABASE_URL;
            (0, child_process_1.execSync)("npx prisma migrate dev --name initial-business-setup --schema=./prisma/schema.business.prisma", {
                stdio: "inherit",
                env: Object.assign({}, process.env),
            });
            // Migrate insight database
            console.log("\nMigrating insight database...");
            process.env.DATABASE_URL = process.env.INSIGHT_DATABASE_URL;
            (0, child_process_1.execSync)("npx prisma migrate dev --name initial-business-setup --schema=./prisma/schema.business.prisma", {
                stdio: "inherit",
                env: Object.assign({}, process.env),
            });
            console.log("\n=== ALL DATABASES SET UP SUCCESSFULLY ===");
        }
        catch (error) {
            console.error("Error during database setup:", error);
            process.exit(1);
        }
    });
}
// Run the setup
setupAllDatabases();
