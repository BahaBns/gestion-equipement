// services/emailService.ts
import nodemailer from "nodemailer";
import { Employee, Actif, License } from "@prisma/client";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { setupAutoTagMiddleware } from "../middleware/auto-tagMidlleware";
import { Request, Response } from "express";

dotenv.config();

// Create both clients at startup with middleware applied
const lagomPrisma = setupAutoTagMiddleware(
  new PrismaClient({
    datasources: { db: { url: process.env.LAGOM_DATABASE_URL } },
  })
);

const insightPrisma = setupAutoTagMiddleware(
  new PrismaClient({
    datasources: { db: { url: process.env.INSIGHT_DATABASE_URL } },
  })
);

// Helper function to get the right client
function getPrismaClient(req: Request) {
  return (req as any).user?.selectedDatabase === "lagom"
    ? lagomPrisma
    : insightPrisma;
}

// Default to insight database when no request is available
function getDefaultPrismaClient(dbName?: "lagom" | "insight") {
  return dbName === "lagom" ? lagomPrisma : insightPrisma;
}

// Configure email transporter
const transporter = nodemailer.createTransport({
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
export const sendAssignmentNotification = async (
  employee: Employee,
  actifs: Actif[],
  acceptanceToken: string,
  dbName: "lagom" | "insight" = "insight"
): Promise<boolean> => {
  try {
    const prisma = getDefaultPrismaClient(dbName);

    // Generate the acceptance URL
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const acceptanceUrl = `${baseUrl}/accept-assignment/${acceptanceToken}`;

    // Fetch complete actif information with marque and modele names
    const actifsWithDetails = await Promise.all(
      actifs.map(async (actif) => {
        const marque = actif.marqueId
          ? await prisma.marque.findUnique({
              where: { marqueId: actif.marqueId },
            })
          : null;

        const modele = actif.modeleId
          ? await prisma.modele.findUnique({
              where: { modeleId: actif.modeleId },
            })
          : null;

        return {
          ...actif,
          marqueName: marque?.name || "Unknown",
          modeleName: modele?.name || "Unknown",
        };
      })
    );

    // Prepare email content
    const equipmentList = actifsWithDetails
      .map(
        (actif) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${actif.marqueName} ${actif.modeleName}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${actif.serialNumber}</td>
      </tr>
    `
      )
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
    const info = await transporter.sendMail({
      from: `"Gestion des Équipements" <${
        process.env.EMAIL_FROM || "no-reply@example.com"
      }>`,
      to: employee.email,
      subject: "Équipements en attente de votre approbation",
      html: html,
    });

    console.log(
      `Assignment notification email sent to ${employee.email}: ${info.messageId}`
    );
    return true;
  } catch (error) {
    console.error("Failed to send assignment notification email:", error);
    return false;
  }
};

/**
 * Send a license assignment notification email to an employee
 *
 * @param employee The employee to notify
 * @param licenses List of licenses being assigned
 * @param acceptanceToken The secure token for accepting the assignment
 * @param dbName The database to use ('lagom' or 'insight')
 * @returns Promise<boolean> Success status
 */
export const sendLicenseAssignmentNotification = async (
  employee: Employee,
  licenses: License[],
  acceptanceToken: string,
  dbName: "lagom" | "insight" = "insight"
): Promise<boolean> => {
  try {
    // Generate the acceptance URL
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const acceptanceUrl = `${baseUrl}/accept-license/${acceptanceToken}`;

    // Prepare email content
    const licenseList = licenses
      .map(
        (license) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${
          license.softwareName
        } ${license.version}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${
          license.licenseType
        }</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${
          license.licenseKey
        }</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(
          license.expiryDate
        )}</td>
      </tr>
    `
      )
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
    const info = await transporter.sendMail({
      from: `"Gestion des Licences" <${
        process.env.EMAIL_FROM || "no-reply@example.com"
      }>`,
      to: employee.email,
      subject: "Licences logicielles en attente de votre approbation",
      html: html,
    });

    console.log(
      `License assignment notification email sent to ${employee.email}: ${info.messageId}`
    );
    return true;
  } catch (error) {
    console.error(
      "Failed to send license assignment notification email:",
      error
    );
    return false;
  }
};

/**
 * Send a confirmation email after assignment acceptance
 *
 * @param employee The employee to notify
 * @param actifs List of actifs that were accepted
 * @param dbName The database to use ('lagom' or 'insight')
 * @returns Promise<boolean> Success status
 */
export const sendAcceptanceConfirmation = async (
  employee: Employee,
  actifs: Actif[],
  dbName: "lagom" | "insight" = "insight"
): Promise<boolean> => {
  try {
    const prisma = getDefaultPrismaClient(dbName);

    const actifsWithDetails = await Promise.all(
      actifs.map(async (actif) => {
        const marque = actif.marqueId
          ? await prisma.marque.findUnique({
              where: { marqueId: actif.marqueId },
            })
          : null;

        const modele = actif.modeleId
          ? await prisma.modele.findUnique({
              where: { modeleId: actif.modeleId },
            })
          : null;

        return {
          ...actif,
          marqueName: marque?.name || "Unknown",
          modeleName: modele?.name || "Unknown",
        };
      })
    );

    // Prepare equipment list
    const equipmentList = actifsWithDetails
      .map(
        (actif) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${actif.marqueName} ${actif.modeleName}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${actif.serialNumber}</td>
      </tr>
    `
      )
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
    const info = await transporter.sendMail({
      from: `"Gestion des Équipements" <${
        process.env.EMAIL_FROM || "no-reply@example.com"
      }>`,
      to: employee.email,
      subject: "Confirmation d'assignation d'équipements",
      html: html,
    });

    console.log(
      `Acceptance confirmation email sent to ${employee.email}: ${info.messageId}`
    );
    return true;
  } catch (error) {
    console.error("Failed to send acceptance confirmation email:", error);
    return false;
  }
};

/**
 * Send a confirmation email after license acceptance
 *
 * @param employee The employee to notify
 * @param licenses List of licenses that were accepted
 * @param dbName The database to use ('lagom' or 'insight')
 * @returns Promise<boolean> Success status
 */
export const sendLicenseAcceptanceConfirmation = async (
  employee: Employee,
  licenses: License[],
  dbName: "lagom" | "insight" = "insight"
): Promise<boolean> => {
  try {
    // Prepare license list
    const licenseList = licenses
      .map(
        (license) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${
          license.softwareName
        } ${license.version}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${
          license.licenseType
        }</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${
          license.licenseKey
        }</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(
          license.expiryDate
        )}</td>
      </tr>
    `
      )
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
    const info = await transporter.sendMail({
      from: `"Gestion des Licences" <${
        process.env.EMAIL_FROM || "no-reply@example.com"
      }>`,
      to: employee.email,
      subject: "Confirmation d'assignation de licences",
      html: html,
    });

    console.log(
      `License acceptance confirmation email sent to ${employee.email}: ${info.messageId}`
    );
    return true;
  } catch (error) {
    console.error(
      "Failed to send license acceptance confirmation email:",
      error
    );
    return false;
  }
};

// Helper function to format dates
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString();
}
