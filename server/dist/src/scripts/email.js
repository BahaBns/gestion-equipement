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
// Using pg package to run a direct query
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv")); // Make sure to install dotenv if not already installed
// Load environment variables from .env file
dotenv.config();
function updateUserEmail() {
    return __awaiter(this, void 0, void 0, function* () {
        // Create a connection pool with explicit parameters
        // This approach gives you more control over individual connection parameters
        const pool = new pg_1.Pool({
            // You can either use the connection string approach:
            connectionString: process.env.AUTH_DATABASE_URL,
            // Or alternatively, use explicit parameters (uncommenting the following):
            /*
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            */
        });
        try {
            // Log connection attempt (for debugging)
            console.log('Attempting to connect to database...');
            const result = yield pool.query(`
      UPDATE "User"
      SET email = 'akram.bensassi@insight-times.com'
      WHERE email = 'admin@insight-times.com'
      RETURNING id, email, name;
    `);
            if (result.rowCount != null && result.rowCount > 0) {
                console.log('Email updated successfully:', result.rows[0]);
            }
            else {
                console.log('No user found with email admin@insight-times.com');
            }
        }
        catch (error) {
            console.error('Error updating email:', error);
            // Print more detailed error info
            if (error instanceof Error) {
                console.error('Error details:', error.message);
                console.error('Stack trace:', error.stack);
            }
        }
        finally {
            yield pool.end();
        }
    });
}
// Execute the function
updateUserEmail();
