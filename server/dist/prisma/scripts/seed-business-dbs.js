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
// scripts/seed-business-dbs.ts
const seedUtils_1 = require("../../src/utils/seedUtils");
const dotenv = __importStar(require("dotenv"));
// Import your seed files
const seed = __importStar(require("../seedData/seed"));
const seed1 = __importStar(require("../seedData/seed1"));
const seedEtat = __importStar(require("../seedData/seedEtat"));
const seedStatus = __importStar(require("../seedData/seedStatus"));
// Load environment variables
dotenv.config();
function seedBusinessDatabases() {
    return __awaiter(this, void 0, void 0, function* () {
        const databases = [
            {
                name: "lagom",
                url: process.env.LAGOM_DATABASE_URL,
            },
            {
                name: "insight",
                url: process.env.INSIGHT_DATABASE_URL,
            },
        ];
        for (const db of databases) {
            if (!db.url) {
                console.error(`Missing database URL for ${db.name}`);
                continue;
            }
            console.log(`\n=== Starting seeding process for ${db.name} database ===\n`);
            try {
                // Run each seed file against this database
                yield (0, seedUtils_1.withDatabaseUrl)(db.url, (prisma) => __awaiter(this, void 0, void 0, function* () {
                    console.log(`Running seedStatus for ${db.name}...`);
                    yield seedStatus.main(prisma);
                    console.log(`Status seeding complete for ${db.name}.`);
                    console.log(`Running seedEtat for ${db.name}...`);
                    yield seedEtat.main(prisma);
                    console.log(`Etat seeding complete for ${db.name}.`);
                    console.log(`Running seed for ${db.name}...`);
                    yield seed.main(prisma);
                    console.log(`Main seed complete for ${db.name}.`);
                    console.log(`Running seed1 for ${db.name}...`);
                    yield seed1.main(prisma);
                    console.log(`Additional seed1 complete for ${db.name}.`);
                }));
                console.log(`\n=== Seeding completed successfully for ${db.name} database ===\n`);
            }
            catch (error) {
                console.error(`Error seeding ${db.name} database:`, error);
            }
        }
        console.log("All database seeding operations completed.");
    });
}
// Run the seeding function
seedBusinessDatabases();
