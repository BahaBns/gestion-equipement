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
exports.sendLicenseAcceptanceConfirmation = exports.sendAcceptanceConfirmation = exports.sendLicenseAssignmentNotification = exports.sendAssignmentNotification = void 0;
// services/emailService.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const auto_tagMidlleware_1 = require("../middleware/auto-tagMidlleware");
dotenv_1.default.config();
// Create both clients at startup with middleware applied
const lagomPrisma = (0, auto_tagMidlleware_1.setupAutoTagMiddleware)(new client_1.PrismaClient({
    datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
}));
const insightPrisma = (0, auto_tagMidlleware_1.setupAutoTagMiddleware)(new client_1.PrismaClient({
    datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } },
}));
// Helper function to get the right client
function getPrismaClient(req) {
    var _a;
    return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.selectedDatabase) === "lagom"
        ? lagomPrisma
        : insightPrisma;
}
// Default to insight database when no request is available
function getDefaultPrismaClient(dbName) {
    return dbName === "lagom" ? lagomPrisma : insightPrisma;
}
// Configure email transporter
const transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST || "smtp.example.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER || "your-email@example.com",
        pass: process.env.EMAIL_PASSWORD || "your-password",
    },
});
/**
 * Send an equipment assignment notification email to an employee
 *
 * @param employee The employee to notify
 * @param actifs List of actifs being assigned
 * @param acceptanceToken The secure token for accepting the assignment
 * @param dbName The database to use ('lagom' or 'insight')
 * @returns Promise<boolean> Success status
 */
const sendAssignmentNotification = (employee_1, actifs_1, acceptanceToken_1, ...args_1) => __awaiter(void 0, [employee_1, actifs_1, acceptanceToken_1, ...args_1], void 0, function* (employee, actifs, acceptanceToken, dbName = "insight") {
    try {
        const prisma = getDefaultPrismaClient(dbName);
        // Generate the acceptance URL
        const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const acceptanceUrl = `${baseUrl}/accept-assignment/${acceptanceToken}`;
        // Fetch complete actif information with marque and modele names
        const actifsWithDetails = yield Promise.all(actifs.map((actif) => __awaiter(void 0, void 0, void 0, function* () {
            const marque = actif.marqueId
                ? yield prisma.marque.findUnique({
                    where: { marqueId: actif.marqueId },
                })
                : null;
            const modele = actif.modeleId
                ? yield prisma.modele.findUnique({
                    where: { modeleId: actif.modeleId },
                })
                : null;
            return Object.assign(Object.assign({}, actif), { marqueName: (marque === null || marque === void 0 ? void 0 : marque.name) || "Unknown", modeleName: (modele === null || modele === void 0 ? void 0 : modele.name) || "Unknown" });
        })));
        // Prepare email content
        const equipmentList = actifsWithDetails
            .map((actif) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${actif.actifType} </td>
        <td style="padding: 8px; border: 1px solid #ddd;">${actif.marqueName} ${actif.modeleName}</td>
      </tr>
    `)
            .join("");
        // Create the email content
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Équipement en attente d'approbation</h2>
        <p>Bonjour ${employee.nom},</p>
        <p>Des équipements ont été réservés pour vous et sont en attente de votre approbation.</p>
        
        <h3>Équipements réservés:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Équipement</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Numéro de série</th>
            </tr>
          </thead>
          <tbody>
            ${equipmentList}
          </tbody>
        </table>
        
        <p>Pour accepter ces équipements, veuillez cliquer sur le lien ci-dessous et suivre les instructions:</p>
        <p><a href="${acceptanceUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Accepter les équipements</a></p>
        
        <p>Ce lien est valable pendant 7 jours. Si vous ne validez pas l'assignation dans ce délai, les équipements seront remis en stock.</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Cette notification a été envoyée automatiquement. Merci de ne pas répondre à cet email.
        </p>
      </div>
    `;
        // Send the email
        const info = yield transporter.sendMail({
            from: `"Gestion des Équipements" <${process.env.EMAIL_FROM || "no-reply@example.com"}>`,
            to: employee.email,
            subject: "Équipements en attente de votre approbation",
            html: html,
        });
        console.log(`Assignment notification email sent to ${employee.email}: ${info.messageId}`);
        return true;
    }
    catch (error) {
        console.error("Failed to send assignment notification email:", error);
        return false;
    }
});
exports.sendAssignmentNotification = sendAssignmentNotification;
/**
 * Send a license assignment notification email to an employee
 *
 * @param employee The employee to notify
 * @param licenses List of licenses being assigned
 * @param acceptanceToken The secure token for accepting the assignment
 * @param dbName The database to use ('lagom' or 'insight')
 * @returns Promise<boolean> Success status
 */
const sendLicenseAssignmentNotification = (employee_1, licenses_1, acceptanceToken_1, ...args_1) => __awaiter(void 0, [employee_1, licenses_1, acceptanceToken_1, ...args_1], void 0, function* (employee, licenses, acceptanceToken, dbName = "insight") {
    try {
        // Generate the acceptance URL
        const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const acceptanceUrl = `${baseUrl}/accept-license/${acceptanceToken}`;
        // Prepare email content
        const licenseList = licenses
            .map((license) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${license.softwareName} ${license.version}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${license.licenseType}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${license.licenseKey}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(license.expiryDate)}</td>
      </tr>
    `)
            .join("");
        // Create the email content
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Licences en attente d'approbation</h2>
        <p>Bonjour ${employee.nom},</p>
        <p>Des licences logicielles ont été réservées pour vous et sont en attente de votre approbation.</p>
        
        <h3>Licences réservées:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Logiciel</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Type</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Clé</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Expiration</th>
            </tr>
          </thead>
          <tbody>
            ${licenseList}
          </tbody>
        </table>
        
        <p>Pour accepter ces licences, veuillez cliquer sur le lien ci-dessous et suivre les instructions:</p>
        <p><a href="${acceptanceUrl}" style="display: inline-block; padding: 10px 20px; background-color: #9c27b0; color: white; text-decoration: none; border-radius: 4px;">Accepter les licences</a></p>
        
        <p>Ce lien est valable pendant 7 jours. Si vous ne validez pas l'assignation dans ce délai, les licences seront remises à disposition.</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Cette notification a été envoyée automatiquement. Merci de ne pas répondre à cet email.
        </p>
      </div>
    `;
        // Send the email
        const info = yield transporter.sendMail({
            from: `"Gestion des Licences" <${process.env.EMAIL_FROM || "no-reply@example.com"}>`,
            to: employee.email,
            subject: "Licences logicielles en attente de votre approbation",
            html: html,
        });
        console.log(`License assignment notification email sent to ${employee.email}: ${info.messageId}`);
        return true;
    }
    catch (error) {
        console.error("Failed to send license assignment notification email:", error);
        return false;
    }
});
exports.sendLicenseAssignmentNotification = sendLicenseAssignmentNotification;
/**
 * Send a confirmation email after assignment acceptance
 *
 * @param employee The employee to notify
 * @param actifs List of actifs that were accepted
 * @param dbName The database to use ('lagom' or 'insight')
 * @returns Promise<boolean> Success status
 */
const sendAcceptanceConfirmation = (employee_1, actifs_1, ...args_1) => __awaiter(void 0, [employee_1, actifs_1, ...args_1], void 0, function* (employee, actifs, dbName = "insight") {
    try {
        const prisma = getDefaultPrismaClient(dbName);
        const actifsWithDetails = yield Promise.all(actifs.map((actif) => __awaiter(void 0, void 0, void 0, function* () {
            const marque = actif.marqueId
                ? yield prisma.marque.findUnique({
                    where: { marqueId: actif.marqueId },
                })
                : null;
            const modele = actif.modeleId
                ? yield prisma.modele.findUnique({
                    where: { modeleId: actif.modeleId },
                })
                : null;
            return Object.assign(Object.assign({}, actif), { marqueName: (marque === null || marque === void 0 ? void 0 : marque.name) || "Unknown", modeleName: (modele === null || modele === void 0 ? void 0 : modele.name) || "Unknown" });
        })));
        // Prepare equipment list
        const equipmentList = actifsWithDetails
            .map((actif) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${actif.actifType}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${actif.marqueName} ${actif.modeleName}</td>
      </tr>
    `)
            .join("");
        // Create the email content
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Confirmation d'assignation d'équipements</h2>
        <p>Bonjour ${employee.nom},</p>
        <p>Merci d'avoir accepté l'assignation des équipements suivants:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Équipement</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Numéro de série</th>
              
            </tr>
          </thead>
          <tbody>
            ${equipmentList}
          </tbody>
        </table>
        
        <p>Ces équipements sont maintenant officiellement assignés à votre compte.</p>
        <p>Pour toute question concernant ces équipements, veuillez contacter votre administrateur IT.</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Cette confirmation a été envoyée automatiquement. Merci de ne pas répondre à cet email.
        </p>
      </div>
    `;
        // Send the email
        const info = yield transporter.sendMail({
            from: `"Gestion des Équipements" <${process.env.EMAIL_FROM || "no-reply@example.com"}>`,
            to: employee.email,
            subject: "Confirmation d'assignation d'équipements",
            html: html,
        });
        console.log(`Acceptance confirmation email sent to ${employee.email}: ${info.messageId}`);
        return true;
    }
    catch (error) {
        console.error("Failed to send acceptance confirmation email:", error);
        return false;
    }
});
exports.sendAcceptanceConfirmation = sendAcceptanceConfirmation;
/**
 * Send a confirmation email after license acceptance
 *
 * @param employee The employee to notify
 * @param licenses List of licenses that were accepted
 * @param dbName The database to use ('lagom' or 'insight')
 * @returns Promise<boolean> Success status
 */
const sendLicenseAcceptanceConfirmation = (employee_1, licenses_1, ...args_1) => __awaiter(void 0, [employee_1, licenses_1, ...args_1], void 0, function* (employee, licenses, dbName = "insight") {
    try {
        // Prepare license list
        const licenseList = licenses
            .map((license) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${license.softwareName} ${license.version}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${license.licenseType}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${license.licenseKey}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(license.expiryDate)}</td>
      </tr>
    `)
            .join("");
        // Create the email content
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Confirmation d'assignation de licences</h2>
        <p>Bonjour ${employee.nom},</p>
        <p>Merci d'avoir accepté l'assignation des licences logicielles suivantes:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Logiciel</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Type</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Clé</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Expiration</th>
            </tr>
          </thead>
          <tbody>
            ${licenseList}
          </tbody>
        </table>
        
        <p>Ces licences sont maintenant officiellement assignées à votre compte.</p>
        <p>Pour toute question concernant ces licences, veuillez contacter votre administrateur IT.</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Cette confirmation a été envoyée automatiquement. Merci de ne pas répondre à cet email.
        </p>
      </div>
    `;
        // Send the email
        const info = yield transporter.sendMail({
            from: `"Gestion des Licences" <${process.env.EMAIL_FROM || "no-reply@example.com"}>`,
            to: employee.email,
            subject: "Confirmation d'assignation de licences",
            html: html,
        });
        console.log(`License acceptance confirmation email sent to ${employee.email}: ${info.messageId}`);
        return true;
    }
    catch (error) {
        console.error("Failed to send license acceptance confirmation email:", error);
        return false;
    }
});
exports.sendLicenseAcceptanceConfirmation = sendLicenseAcceptanceConfirmation;
// Helper function to format dates
function formatDate(date) {
    return new Date(date).toLocaleDateString();
}
