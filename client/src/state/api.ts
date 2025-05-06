import { getToken } from "@/utils/auth";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "cookies-next";

// Interfaces that match the controller

// New interface for the ActifFournisseur model
export interface ActifFournisseur {
  actifFournisseurId: string;
  actifId: string;
  fournisseurId: string;
  quantity: number;
  assignedAt: string;
  fournisseur?: Fournisseur;
}

export interface Actif {
  actifId: string;
  serialNumber: string;
  actifType: string;
  //marque: string;
  //modele: string;
  dateAjout: string;
  statusId: string;
  etatId: string; // Add etatId property
  warrantyEnd: string | null;
  invoiceNumber: string | null;
  quantity: number;
  fournisseur: string;
  contactFournisseur: string;
  Contactsupport: string;
  category: Category;
  status: Status;
  etat: Etat; // Add etat property
  actifTypeId: string;
  actiftype: ActifType;
  specification?: Specification;
  marqueId?: string;
  modeleId?: string;
  fournisseurId?: string;
  marqueObj?: Marque;
  modeleObj?: Modele;
  fournisseurObj?: Fournisseur;
  attachments?: Attachment[];
  hashtags?: ActifHashtag[];

  employees: (Employee & { quantity: number; assignedAt: string })[];
  fournisseurs?: ActifFournisseur[];
  multipleSuppliers?: {
    fournisseurId: string;
    name: string;
    quantity: number;
    assignedAt: string;
  }[];
  useMultipleSuppliers?: boolean;
}

// New Etat interface for the Etat model
export interface Etat {
  etatId: string;
  name: string;
}

export interface ActifType {
  actifTypeId: string;
  nom: string;
  categoryId?: string;
  category?: Category;
  _count?: {
    actifs: number;
  };
}

export interface AssignmentToken {
  tokenId: string;
  token: string;
  employeeId: string;
  actifIds: string[];
  issuedAt: string;
  expiresAt: string;
  usedAt?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
}

export interface Specification {
  specificationId: string;
  actifId: string;
  ram?: string;
  cpu?: string;
  stockage?: string;
  graphique?: string;
}

export interface Attachment {
  attachmentId: string;
  actifId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
}

export interface Status {
  statusId: string;
  name: string;
}

export interface StatusUsageStats {
  statusId: string;
  name: string;
  totalActifs: number;
  totalLicenses: number;
  totalItems: number;
}

export interface EmployeeActif {
  employeeId: string;
  actifId: string;
  assignedAt: string;
  quantity: number;
  employee: Employee;
  actif: Actif;
}

export interface NewActif {
  serialNumber: string;
  actifType: string;
  marque: string;
  modele: string;
  statusId: string;
  etatId: string; // Add etatId property
  actifTypeId: string;
  fournisseur: string;
  contactFournisseur?: string;
  Contactsupport?: string;
  warrantyEnd?: string | null;
  invoiceNumber?: string | null;
  quantity?: number;
  employeeId?: string;
  createNewEmployee?: string;
  newEmployeeName?: string;
  newEmployeeEmail?: string;
  assignQuantity?: number;
  specification?: {
    ram?: string;
    cpu?: string;
    stockage?: string;
    graphique?: string;
  };
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileUrl: string;
  }>;
  // New fields for multiple suppliers
  useMultipleSuppliers?: boolean;
  supplierAllocations?: Array<{
    fournisseurId: string;
    quantity: number;
    id: string;
  }>;
}

export interface Subcategory {
  subCategoryId: string;
  nom: string;
  categoryId: string;
  category: Category;
}

export interface Category {
  categoryId: string;
  nom: string;
}

export interface UpdateCategory {
  categoryId: string;
  nom: string;
}

export interface NewCategory {
  nom: string;
}

export interface Hashtag {
  hashtagId: string;
  name: string;
  description?: string;
  createdAt: string;
}

// Interface ActifHashtag (relation)
export interface ActifHashtag {
  actifId: string;
  hashtagId: string;
  assignedAt: string;
  actif: Actif;
  hashtag: Hashtag;
}

// Interface LicenseHashtag (relation)
export interface LicenseHashtag {
  licenseId: string;
  hashtagId: string;
  assignedAt: string;
  license: License;
  hashtag: Hashtag;
}

export interface Employee {
  employeeId: string;
  nom: string;
  email: string;
  actifs?: EmployeeActif[];
  licenses?: EmployeeLicense[];
}

export interface NewEmployee {
  nom: string;
  email: string;
  actifIds?: string[];
}

export interface User {
  userId: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// License interfaces
export interface License {
  licenseId: string;
  softwareName: string;
  version: string;
  licenseType: string;
  licenseQuantity: number;
  startDate: Date;
  expiryDate: Date;
  assignedTo: string | null;
  licenseTypeId: string;
  statusId: string;
  etatId: string; // Add etatId property
  // New fields
  licenseKey: string;
  vendorName: string;
  vendorContact: string;
  supportContact: string;
  licensetype: LicenseType;
  status: Status;
  etat: Etat; // Add etat property
  attachments: LicenseAttachment[];
  employees: (Employee & { quantity: number; assignedAt: string })[];
  daysUntilExpiry?: number;
  daysExpired?: number;
  hashtags?: LicenseHashtag[];
}

export interface LicenseType {
  licenseTypeId: string;
  nom: string;
  categoryId: string;
  category?: Category;
  _count?: {
    licenses: number;
  };
}

export interface LicenseAttachment {
  attachmentId: string;
  licenseId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
}

export interface NewLicense {
  softwareName: string;
  version: string;
  licenseType: string;
  licenseQuantity: number;
  startDate: string;
  expiryDate: string;
  assignedTo?: string;
  licenseTypeId: string;
  statusId: string;
  etatId: string; // Add etatId property
  // New fields
  licenseKey?: string;
  vendorName?: string;
  vendorContact?: string;
  supportContact?: string;
  employeeId?: string;
  createNewEmployee?: string;
  newEmployeeName?: string;
  newEmployeeEmail?: string;
  assignQuantity?: number;
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileUrl: string;
  }>;
}

export interface LicenseUsageStats {
  licenseId: string;
  softwareName: string;
  version: string;
  licenseType: string;
  licenseTypeName: string;
  // New fields
  licenseKey: string;
  vendorName: string;
  vendorContact: string;
  supportContact: string;
  statusId: string;
  statusName: string;
  etatId: string; // Add etatId property
  etatName: string; // Add etatName property
  totalLicenses: number;
  assignedLicenses: number;
  availableLicenses: number;
  usagePercentage: number;
  expiryDate: Date;
  daysUntilExpiry: number;
  isExpired: boolean;
}

export interface EmployeeLicense {
  employeeId: string;
  licenseId: string;
  assignedAt: string;
  quantity: number;
  employee: Employee;
  license: License;
}
export interface EtatUsageStats {
  etatId: string;
  name: string;
  totalActifs: number;
  totalLicenses: number;
  totalItems: number;
}

export interface DatabaseSelectionRequest {
  token: string;
  selectedDatabase: string;
}

export interface DatabaseSelectionResponse {
  success: boolean;
  message: string;
}

export interface Marque {
  marqueId: string;
  name: string;
  actifTypeId: string;
  actifType?: ActifType;
  modeles?: Modele[];
  _count?: {
    actifs: number;
  };
}

export interface Modele {
  modeleId: string;
  name: string;
  marqueId: string;
  marque?: Marque;
  _count?: {
    actifs: number;
  };
}

export interface Fournisseur {
  fournisseurId: string;
  name: string;
  email?: string; // New field
  phone?: string; // New field
}

// create a base query function
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  prepareHeaders: (headers, { getState }) => {
    // Log the API base URL for debugging
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      console.log("API Base URL:", process.env.NEXT_PUBLIC_API_BASE_URL || "/api");
    }
    
    // Get token from auth util
    const token = getToken();
    
    if (token) {
      // Set Authorization header with Bearer token
      headers.set("Authorization", `Bearer ${token}`);
      
      // For debugging in non-production environments
      if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
        console.log("Setting Authorization header with token:", !!token);
      }
    } else if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      console.warn("No token available for API request!");
    }
    
    return headers;
  },
  credentials: "include", // Important for including cookies in cross-origin requests
  
  // Add a custom fetch implementation that ensures cookies are sent
  fetchFn: async (...args) => {
    // For client-side requests, check if we need to sync the token before fetching
    if (typeof window !== "undefined") {
      const localToken = localStorage.getItem("token");
      const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('token='));
      
      // If there's a token in localStorage but not in cookies, set it
      if (localToken && !hasCookie) {
        console.log("Syncing token from localStorage to cookie before API request");
        const expires = new Date();
        expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
        document.cookie = `token=${localToken}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      }
    }
    
    // Proceed with the actual fetch
    return fetch(...args);
  }
});

// define the API
export const api = createApi({
  baseQuery,
  reducerPath: "api",
  tagTypes: [
    "Actifs",
    "Users",
    "Expenses",
    "Categories",
    "Employees",
    "Subcategories",
    "Assignments",
    "ExpiringActifs",
    "Specifications",
    "Attachments",
    "Status",
    "Etats", // Add Etats tagType
    "ActifTypes",
    "Licenses",
    "LicenseTypes",
    "LicenseAttachments",
    "LicenseAssignments",
    "ExpiringLicenses",
    "Hashtags",
    "Marques",
    "Modeles",
    "Fournisseurs",
  ],
  endpoints: (build) => ({
    // Authentication Endpoints
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    // Actif Endpoints
    getActifs: build.query<Actif[], string | void>({
      query: (search) => ({
        url: "/actifs",
        params: search ? { search } : {},
      }),
      providesTags: ["Actifs"],
    }),

    getActifById: build.query<Actif, string>({
      query: (actifId) => `/actifs/${actifId}`,
      providesTags: (result) =>
        result
          ? [{ type: "Actifs", id: result.actifId }, "Actifs"]
          : ["Actifs"],
    }),

    getActifBySerialNumber: build.query<Actif, string>({
      query: (serialNumber) => `/actifs/serial/${serialNumber}`,
      providesTags: (result) =>
        result
          ? [{ type: "Actifs", id: result.actifId }, "Actifs"]
          : ["Actifs"],
    }),

    // Keeping the existing expiring actifs endpoint
    getExpiringActifs: build.query<Actif[], number | void>({
      query: (days) => ({
        url: "/actifs/expiring",
        params: days ? { days } : {},
      }),
      providesTags: ["ExpiringActifs", "Actifs"],
    }),

    createActif: build.mutation<Actif, FormData>({
      query: (formData) => ({
        url: "/actifs",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Actifs", "Assignments", "ExpiringActifs"],
    }),

    updateActif: build.mutation<Actif, FormData>({
      query: (formData) => {
        const actifId = formData.get("actifId");
        return {
          url: `/actifs/${actifId}`,
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: [
        "Actifs",
        "Assignments",
        "ExpiringActifs",
        "Specifications",
        "Attachments",
      ],
    }),

    deleteActif: build.mutation<void, string>({
      query: (actifId) => ({
        url: `/actifs/${actifId}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        "Actifs",
        "Assignments",
        "ExpiringActifs",
        "Specifications",
        "Attachments",
      ],
    }),

    // Keeping the existing quantity update endpoint
    updateActifQuantity: build.mutation<
      Actif,
      { actifId: string; quantity: number }
    >({
      query: ({ actifId, quantity }) => ({
        url: `/actifs/${actifId}/quantity`,
        method: "PATCH",
        body: { quantity },
      }),
      invalidatesTags: ["Actifs", "ExpiringActifs"],
    }),

    // *** ETAT ENDPOINTS (New) ***
    getEtats: build.query<Etat[], void>({
      query: () => "/etats",
      providesTags: ["Etats"],
    }),

    getEtatById: build.query<Etat, string>({
      query: (etatId) => `/etats/${etatId}`,
      providesTags: (result) =>
        result ? [{ type: "Etats", id: result.etatId }, "Etats"] : ["Etats"],
    }),

    getActifsByEtat: build.query<Actif[], string>({
      query: (etatId) => `/actifs/etat/${etatId}`,
      providesTags: ["Actifs", "Etats"],
    }),

    getLicensesByEtat: build.query<License[], string>({
      query: (etatId) => `/licenses/etat/${etatId}`,
      providesTags: ["Licenses", "Etats"],
    }),

    updateActifEtat: build.mutation<Actif, { actifId: string; etatId: string }>(
      {
        query: ({ actifId, etatId }) => ({
          url: `/actifs/${actifId}/etat`,
          method: "PUT",
          body: { etatId },
        }),
        invalidatesTags: ["Actifs", "ExpiringActifs", "Etats"],
      }
    ),

    updateLicenseEtat: build.mutation<
      License,
      { licenseId: string; etatId: string }
    >({
      query: ({ licenseId, etatId }) => ({
        url: `/licenses/${licenseId}/etat`,
        method: "PATCH", // Using PATCH since this is what's in our license controller
        body: { etatId },
      }),
      invalidatesTags: ["Licenses", "ExpiringLicenses", "Etats"],
    }),

    createEtat: build.mutation<Etat, { name: string }>({
      query: (data) => ({
        url: "/etats",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Etats"],
    }),

    updateEtat: build.mutation<Etat, { etatId: string; name: string }>({
      query: ({ etatId, name }) => ({
        url: `/etats/${etatId}`,
        method: "PUT",
        body: { name },
      }),
      invalidatesTags: ["Etats"],
    }),

    deleteEtat: build.mutation<void, string>({
      query: (etatId) => ({
        url: `/etats/${etatId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Etats", "Actifs", "Licenses"],
    }),

    // *** STATUS ENDPOINTS (Updated to match the new status controller) ***
    getStatuses: build.query<Status[], void>({
      query: () => "/status",
      providesTags: ["Status"],
    }),

    getActifsByStatus: build.query<Actif[], string>({
      query: (statusId) => `/status/${statusId}/actifs`,
      providesTags: ["Actifs", "Status"],
    }),

    getLicensesByStatus: build.query<License[], string>({
      query: (statusId) => `/status/${statusId}/licenses`,
      providesTags: ["Licenses", "Status"],
    }),

    updateActifStatus: build.mutation<
      Actif,
      { actifId: string; statusId: string }
    >({
      query: ({ actifId, statusId }) => ({
        url: `/status/actif/${actifId}`,
        method: "PUT",
        body: { statusId },
      }),
      invalidatesTags: ["Actifs", "ExpiringActifs", "Status"],
    }),

    updateLicenseStatus: build.mutation<
      License,
      { licenseId: string; statusId: string }
    >({
      query: ({ licenseId, statusId }) => ({
        url: `/status/license/${licenseId}`,
        method: "PUT",
        body: { statusId },
      }),
      invalidatesTags: ["Licenses", "ExpiringLicenses", "Status"],
    }),

    createStatus: build.mutation<Status, { name: string }>({
      query: (data) => ({
        url: "/status",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Status"],
    }),

    deleteStatus: build.mutation<void, string>({
      query: (statusId) => ({
        url: `/status/${statusId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Status"],
    }),

    getStatusUsageStats: build.query<StatusUsageStats[], void>({
      query: () => "/status/stats",
      providesTags: ["Status"],
    }),

    // *** ATTACHMENT ENDPOINTS (Updated to handle file uploads) ***
    getActifAttachments: build.query<Attachment[], string>({
      query: (actifId) => `/attachments/actif/${actifId}`,
      providesTags: ["Attachments", "Actifs"],
    }),

    // Updated to use FormData for file upload
    uploadAttachment: build.mutation<
      Attachment,
      { actifId: string; file: File }
    >({
      query: ({ actifId, file }) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: `/attachments/actif/${actifId}`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Actifs", "Attachments"],
    }),

    // New endpoint for multiple file uploads
    uploadMultipleAttachments: build.mutation<
      { message: string; attachments: Attachment[] },
      { actifId: string; files: File[] }
    >({
      query: ({ actifId, files }) => {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("files", file);
        });

        return {
          url: `/attachments/actif/${actifId}/multiple`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Actifs", "Attachments"],
    }),

    deleteAttachment: build.mutation<void, string>({
      query: (attachmentId) => ({
        url: `/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Actifs", "Attachments"],
    }),

    // New endpoint for downloading attachments
    downloadAttachment: build.query<Blob, string>({
      query: (attachmentId) => ({
        url: `/attachments/${attachmentId}/download`,
        responseHandler: async (response) => await response.blob(),
      }),
    }),

    // *** SPECIFICATION ENDPOINTS (Updated to use new specification controller) ***
    getAllSpecifications: build.query<Specification[], void>({
      query: () => "/specifications",
      providesTags: ["Specifications"],
    }),

    getSpecificationByActifId: build.query<Specification, string>({
      query: (actifId) => `/specifications/actif/${actifId}`,
      providesTags: ["Specifications"],
    }),

    updateSpecification: build.mutation<
      Specification,
      {
        actifId: string;
        ram?: string;
        cpu?: string;
        stockage?: string;
        graphique?: string;
      }
    >({
      query: ({ actifId, ...body }) => ({
        url: `/specifications/actif/${actifId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Actifs", "Specifications"],
    }),

    // *** ACTIF TYPE ENDPOINTS ***
    getActifTypes: build.query<ActifType[], string>({
      query: (categoryId) => `/categories/${categoryId}/actiftypes`,
      providesTags: ["ActifTypes"],
    }),
    getAllActifTypes: build.query<ActifType[], string | void>({
      query: (search) => ({
        url: "/actiftypes",
        params: search ? { search } : {},
      }),
      providesTags: ["ActifTypes"],
    }),

    getActifTypeById: build.query<
      ActifType,
      { categoryId: string; actifTypeId: string }
    >({
      query: ({ categoryId, actifTypeId }) =>
        `/categories/${categoryId}/actiftypes/${actifTypeId}`,
      providesTags: (result) =>
        result
          ? [{ type: "ActifTypes", id: result.actifTypeId }, "ActifTypes"]
          : ["ActifTypes"],
    }),

    createActifType: build.mutation<
      ActifType,
      { categoryId: string; nom: string }
    >({
      query: ({ categoryId, nom }) => ({
        url: `/categories/${categoryId}/actiftypes`,
        method: "POST",
        body: { nom },
      }),
      invalidatesTags: ["ActifTypes"],
    }),

    updateActifType: build.mutation<
      ActifType,
      { categoryId: string; actifTypeId: string; nom: string }
    >({
      query: ({ categoryId, actifTypeId, nom }) => ({
        url: `/categories/${categoryId}/actiftypes/${actifTypeId}`,
        method: "PUT",
        body: { nom },
      }),
      invalidatesTags: ["ActifTypes"],
    }),

    deleteActifType: build.mutation<
      void,
      { categoryId: string; actifTypeId: string }
    >({
      query: ({ categoryId, actifTypeId }) => ({
        url: `/categories/${categoryId}/actiftypes/${actifTypeId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ActifTypes", "Actifs"],
    }),

    getActifsByActifType: build.query<Actif[], string>({
      query: (actifTypeId) => `/actifs/type/${actifTypeId}`,
      providesTags: ["Actifs", "ActifTypes"],
    }),

    // *** ACTIF-SPECIFIC ENDPOINTS (Remaining in actif controller) ***
    // Endpoint for updating actif warranty and invoice
    updateActifWarranty: build.mutation<
      Actif,
      { actifId: string; warrantyEnd: string | null; invoiceNumber?: string }
    >({
      query: ({ actifId, ...body }) => ({
        url: `/actifs/${actifId}/warranty`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Actifs", "ExpiringActifs"],
    }),

    // Assignments endpoints
    getActifAssignments: build.query<EmployeeActif[], void>({
      query: () => "/actifs/assignments",
      providesTags: ["Assignments"],
    }),

    assignActifsToEmployee: build.mutation<
      any,
      {
        employeeId: string;
        actifIds: string[];
        quantities?: Record<string, number>;
      }
    >({
      query: ({ employeeId, actifIds, quantities }) => ({
        url: `/actifs/assign/${employeeId}`,
        method: "POST",
        body: { actifIds, quantities },
      }),
      invalidatesTags: ["Actifs", "Employees", "Assignments", "ExpiringActifs"],
    }),

    removeActifsFromEmployee: build.mutation<
      any,
      {
        employeeId: string;
        actifIds: string[];
        quantities?: Record<string, number>;
        reason?: string;
      }
    >({
      query: ({ employeeId, actifIds, quantities, reason }) => ({
        url: `/actifs/remove/${employeeId}`,
        method: "POST",
        body: { actifIds, quantities, reason },
      }),
      invalidatesTags: ["Actifs", "Employees", "Assignments", "ExpiringActifs"],
    }),

    updateSupplierInfo: build.mutation<
      Actif,
      {
        actifId: string;
        fournisseur?: string;
        contactFournisseur?: string;
        Contactsupport?: string;
      }
    >({
      query: ({ actifId, ...body }) => ({
        url: `/actifs/${actifId}/supplier`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Actifs"],
    }),

    // Categories endpoints
    getCategories: build.query<Category[], void>({
      query: () => "/categories",
      providesTags: ["Categories"],
    }),

    createCategory: build.mutation<Category, NewCategory>({
      query: (newCategory) => ({
        url: "/categories",
        method: "POST",
        body: newCategory,
      }),
      invalidatesTags: ["Categories"],
    }),

    deleteCategory: build.mutation<void, string>({
      query: (categoryId) => ({
        url: `/categories/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Categories", "Actifs"],
    }),

    updateCategory: build.mutation<Category, UpdateCategory>({
      query: ({ categoryId, nom }) => ({
        url: `/categories/${categoryId}`,
        method: "PUT",
        body: { nom },
      }),
      invalidatesTags: ["Categories"],
    }),

    // Employee endpoints
    getEmployees: build.query<Employee[], void>({
      query: () => "/employee",
      providesTags: ["Employees"],
    }),

    createEmployee: build.mutation<Employee, NewEmployee>({
      query: (newEmployee) => ({
        url: "/employee",
        method: "POST",
        body: newEmployee,
      }),
      invalidatesTags: ["Employees"],
    }),

    deleteEmployee: build.mutation<void, string>({
      query: (employeeId) => ({
        url: `/employee/${employeeId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employees", "Actifs", "Assignments", "ExpiringActifs"],
    }),

    // Legacy assign actifs to an employee (keep for backward compatibility)
    assignActifs: build.mutation({
      query: ({ employeeId, actifIds }) => ({
        url: `/employee/${employeeId}/assign-actifs`,
        method: "POST",
        body: { actifIds },
      }),
      invalidatesTags: ["Employees", "Actifs", "Assignments", "ExpiringActifs"],
    }),

    // Legacy remove actifs from an employee (keep for backward compatibility)
    removeActifs: build.mutation({
      query: ({ employeeId, actifIds }) => ({
        url: `/employee/${employeeId}/remove-actifs`,
        method: "POST",
        body: { actifIds },
      }),
      invalidatesTags: ["Employees", "Actifs", "Assignments", "ExpiringActifs"],
    }),

    // Subcategory Endpoints
    getSubCategories: build.query<Subcategory[], string>({
      query: (categoryId) => ({
        url: `/categories/${categoryId}/subcategories`,
      }),
      providesTags: ["Subcategories"],
    }),

    createSubCategory: build.mutation<
      Subcategory,
      { categoryId: string; nom: string }
    >({
      query: ({ categoryId, nom }) => ({
        url: `/categories/${categoryId}/subcategories`,
        method: "POST",
        body: { nom },
      }),
      invalidatesTags: ["Subcategories"],
    }),

    // *** LICENSE ENDPOINTS ***
    getLicenses: build.query<License[], string | void>({
      query: (search) => ({
        url: "/licenses",
        params: search ? { search } : {},
      }),
      providesTags: ["Licenses"],
    }),

    getLicenseById: build.query<License, string>({
      query: (licenseId) => `/licenses/${licenseId}`,
      providesTags: (result) =>
        result
          ? [{ type: "Licenses", id: result.licenseId }, "Licenses"]
          : ["Licenses"],
    }),

    createLicense: build.mutation<License, FormData>({
      query: (formData) => ({
        url: "/licenses",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Licenses", "LicenseAssignments", "ExpiringLicenses"],
    }),

    updateLicense: build.mutation<License, FormData>({
      query: (formData) => {
        const licenseId = formData.get("licenseId");
        return {
          url: `/licenses/${licenseId}`,
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: [
        "Licenses",
        "LicenseAssignments",
        "ExpiringLicenses",
        "LicenseAttachments",
      ],
    }),

    deleteLicense: build.mutation<void, string>({
      query: (licenseId) => ({
        url: `/licenses/${licenseId}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        "Licenses",
        "LicenseAssignments",
        "ExpiringLicenses",
        "LicenseAttachments",
      ],
    }),

    // License expiry endpoint
    updateLicenseExpiry: build.mutation<
      License,
      { licenseId: string; expiryDate: string }
    >({
      query: ({ licenseId, expiryDate }) => ({
        url: `/licenses/${licenseId}/expiry`,
        method: "PATCH",
        body: { expiryDate },
      }),
      invalidatesTags: ["Licenses", "ExpiringLicenses"],
    }),

    // Endpoints for expiring and expired licenses
    getExpiringLicenses: build.query<License[], number | void>({
      query: (days) => ({
        url: "/licenses/expiring",
        params: days ? { days } : {},
      }),
      providesTags: ["ExpiringLicenses", "Licenses"],
    }),

    getExpiredLicenses: build.query<License[], void>({
      query: () => "/licenses/expired",
      providesTags: ["Licenses", "ExpiringLicenses"],
    }),

    // Updated: License renewal endpoint now uses FormData for file uploads
    renewLicense: build.mutation<License, FormData>({
      query: (formData) => {
        const licenseId = formData.get("licenseId");
        return {
          url: `/licenses/${licenseId}/renew`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [
        "Licenses",
        "ExpiringLicenses",
        "LicenseAttachments",
        "Status",
        "Etats",
      ],
    }),

    // License usage statistics
    getLicenseUsageStats: build.query<LicenseUsageStats[], void>({
      query: () => "/licenses/stats",
      providesTags: ["Licenses"],
    }),

    // Get licenses by software name
    getLicensesBySoftware: build.query<License[], string>({
      query: (softwareName) => `/licenses/software/${softwareName}`,
      providesTags: ["Licenses"],
    }),

    // Get licenses by type
    getLicensesByType: build.query<License[], string>({
      query: (licenseTypeId) => `/licenses/type/${licenseTypeId}`,
      providesTags: ["Licenses", "LicenseTypes"],
    }),

    // *** LICENSE ATTACHMENTS ENDPOINTS - UPDATED FOR FILE UPLOAD ***
    getLicenseAttachments: build.query<LicenseAttachment[], string>({
      query: (licenseId) => `/license-attachments/license/${licenseId}`,
      providesTags: ["LicenseAttachments", "Licenses"],
    }),

    // Updated: Now uses FormData for file upload
    uploadLicenseAttachment: build.mutation<
      LicenseAttachment,
      { licenseId: string; file: File }
    >({
      query: ({ licenseId, file }) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: `/license-attachments/license/${licenseId}`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Licenses", "LicenseAttachments"],
    }),

    // New: Upload multiple license attachments
    uploadMultipleLicenseAttachments: build.mutation<
      { message: string; attachments: LicenseAttachment[] },
      { licenseId: string; files: File[] }
    >({
      query: ({ licenseId, files }) => {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("files", file);
        });

        return {
          url: `/license-attachments/license/${licenseId}/multiple`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Licenses", "LicenseAttachments"],
    }),

    // New: Get a specific license attachment by ID
    getLicenseAttachmentById: build.query<LicenseAttachment, string>({
      query: (attachmentId) => `/license-attachments/${attachmentId}`,
      providesTags: ["LicenseAttachments"],
    }),

    deleteLicenseAttachment: build.mutation<void, string>({
      query: (attachmentId) => ({
        url: `/license-attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Licenses", "LicenseAttachments"],
    }),

    // New: Download license attachment
    downloadLicenseAttachment: build.query<Blob, string>({
      query: (attachmentId) => ({
        url: `/license-attachments/${attachmentId}/download`,
        responseHandler: async (response) => await response.blob(),
      }),
    }),

    // *** LICENSE ASSIGNMENTS ENDPOINTS ***
    getLicenseAssignments: build.query<EmployeeLicense[], void>({
      query: () => "/licenses/assignments",
      providesTags: ["LicenseAssignments"],
    }),

    assignLicensesToEmployee: build.mutation<
      {
        message: string;
        assignedLicenses: string[];
        employee: Employee;
        emailSent: boolean;
      },
      {
        employeeId: string;
        licenseIds: string[];
        quantities?: Record<string, number>;
      }
    >({
      query: ({ employeeId, licenseIds, quantities }) => ({
        url: `/licenses/assign/${employeeId}`,
        method: "POST",
        body: { licenseIds, quantities },
      }),
      invalidatesTags: [
        "Licenses",
        "Employees",
        "LicenseAssignments",
        "Status",
      ],
    }),

    // Similarly update removeLicensesFromEmployee
    removeLicensesFromEmployee: build.mutation<
      any,
      {
        employeeId: string;
        licenseIds: string[];
        quantities?: Record<string, number>;
        reason?: string;
      }
    >({
      query: ({ employeeId, licenseIds, quantities, reason }) => ({
        url: `/licenses/remove/${employeeId}`,
        method: "POST",
        body: { licenseIds, quantities, reason },
      }),
      invalidatesTags: [
        "Licenses",
        "Employees",
        "LicenseAssignments",
        "Status",
      ],
    }),

    // *** LICENSE TYPE ENDPOINTS ***
    getLicenseTypes: build.query<
      LicenseType[],
      { categoryId: string; search?: string }
    >({
      query: ({ categoryId, search }) => ({
        url: `/categories/${categoryId}/licensetypes`,
        params: search ? { search } : {},
      }),
      providesTags: ["LicenseTypes"],
    }),

    getAllLicenseTypes: build.query<LicenseType[], string | void>({
      query: (search) => ({
        url: "/licensetypes",
        params: search ? { search } : {},
      }),
      providesTags: ["LicenseTypes"],
    }),

    getLicenseTypeById: build.query<LicenseType, { licenseTypeId: string }>({
      query: ({ licenseTypeId }) => `/licensetypes/${licenseTypeId}`,
      providesTags: (result) =>
        result
          ? [{ type: "LicenseTypes", id: result.licenseTypeId }, "LicenseTypes"]
          : ["LicenseTypes"],
    }),

    createLicenseType: build.mutation<
      LicenseType,
      { categoryId: string; nom: string }
    >({
      query: ({ categoryId, nom }) => ({
        url: `/categories/${categoryId}/licensetypes`,
        method: "POST",
        body: { nom },
      }),
      invalidatesTags: ["LicenseTypes"],
    }),

    updateLicenseType: build.mutation<
      LicenseType,
      { licenseTypeId: string; nom: string }
    >({
      query: ({ licenseTypeId, nom }) => ({
        url: `/licensetypes/${licenseTypeId}`,
        method: "PUT",
        body: { nom },
      }),
      invalidatesTags: ["LicenseTypes"],
    }),

    deleteLicenseType: build.mutation<void, { licenseTypeId: string }>({
      query: ({ licenseTypeId }) => ({
        url: `/licensetypes/${licenseTypeId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LicenseTypes", "Licenses"],
    }),
    // *** HASHTAG ENDPOINTS ***
    getHashtags: build.query<Hashtag[], string | void>({
      query: (search) => ({
        url: "/hashtags",
        params: search ? { search } : {},
      }),
      providesTags: ["Hashtags"],
    }),

    getHashtagById: build.query<Hashtag, string>({
      query: (hashtagId) => `/hashtags/${hashtagId}`,
      providesTags: (result) =>
        result
          ? [{ type: "Hashtags", id: result.hashtagId }, "Hashtags"]
          : ["Hashtags"],
    }),

    createHashtag: build.mutation<
      Hashtag,
      { name: string; description?: string }
    >({
      query: (data) => ({
        url: "/hashtags",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Hashtags"],
    }),

    updateHashtag: build.mutation<
      Hashtag,
      { hashtagId: string; name: string; description?: string }
    >({
      query: ({ hashtagId, ...data }) => ({
        url: `/hashtags/${hashtagId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Hashtags"],
    }),

    deleteHashtag: build.mutation<void, string>({
      query: (hashtagId) => ({
        url: `/hashtags/${hashtagId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Hashtags", "Actifs", "Licenses"],
    }),

    searchHashtags: build.query<Hashtag[], string>({
      query: (term) => `/hashtags/search/${term}`,
      providesTags: ["Hashtags"],
    }),

    // Associations avec les actifs
    getActifHashtags: build.query<ActifHashtag[], string>({
      query: (actifId) => `/hashtags/actif/${actifId}`,
      providesTags: ["Hashtags", "Actifs"],
    }),

    associateHashtagToActif: build.mutation<
      ActifHashtag,
      { actifId: string; hashtagId: string }
    >({
      query: (data) => ({
        url: "/hashtags/actif",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Hashtags", "Actifs"],
    }),

    dissociateHashtagFromActif: build.mutation<
      void,
      { actifId: string; hashtagId: string }
    >({
      query: (data) => ({
        url: "/hashtags/actif",
        method: "DELETE",
        body: data,
      }),
      invalidatesTags: ["Hashtags", "Actifs"],
    }),

    // Associations avec les licences
    getLicenseHashtags: build.query<LicenseHashtag[], string>({
      query: (licenseId) => `/hashtags/license/${licenseId}`,
      providesTags: ["Hashtags", "Licenses"],
    }),

    associateHashtagToLicense: build.mutation<
      LicenseHashtag,
      { licenseId: string; hashtagId: string }
    >({
      query: (data) => ({
        url: "/hashtags/license",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Hashtags", "Licenses"],
    }),

    dissociateHashtagFromLicense: build.mutation<
      void,
      { licenseId: string; hashtagId: string }
    >({
      query: (data) => ({
        url: "/hashtags/license",
        method: "DELETE",
        body: data,
      }),
      invalidatesTags: ["Hashtags", "Licenses"],
    }),

    // Recherches par hashtag
    getActifsByHashtag: build.query<Actif[], string>({
      query: (hashtagId) => `/hashtags/actifs/${hashtagId}`,
      providesTags: ["Actifs", "Hashtags"],
    }),

    getLicensesByHashtag: build.query<License[], string>({
      query: (hashtagId) => `/hashtags/licenses/${hashtagId}`,
      providesTags: ["Licenses", "Hashtags"],
    }),

    // etat
    UpdateActifEtat: build.mutation<Actif, { actifId: string; etatId: string }>(
      {
        query: ({ actifId, etatId }) => ({
          url: `/etats/actif/${actifId}`,
          method: "PUT",
          body: { etatId },
        }),
        invalidatesTags: ["Actifs", "ExpiringActifs", "Etats"],
      }
    ),

    // Update license etat - Adjust to match your etatController path
    UpdateLicenseEtat: build.mutation<
      License,
      { licenseId: string; etatId: string }
    >({
      query: ({ licenseId, etatId }) => ({
        url: `/etats/license/${licenseId}`,
        method: "PUT",
        body: { etatId },
      }),
      invalidatesTags: ["Licenses", "ExpiringLicenses", "Etats"],
    }),
    GetEtatUsageStats: build.query<EtatUsageStats[], void>({
      query: () => "/etats/stats",
      providesTags: ["Etats"],
    }),

    getActifsByMultipleHashtags: build.mutation<Actif[], string[]>({
      query: (hashtagIds) => ({
        url: "/hashtags/actifs",
        method: "POST",
        body: { hashtagIds },
      }),
      invalidatesTags: ["Actifs", "Hashtags"],
    }),

    getLicensesByMultipleHashtags: build.mutation<License[], string[]>({
      query: (hashtagIds) => ({
        url: "/hashtags/licenses",
        method: "POST",
        body: { hashtagIds },
      }),
      invalidatesTags: ["Licenses", "Hashtags"],
    }),
    // Assignment acceptance endpoints
    validateAssignmentToken: build.query<
      {
        message: string;
        valid: boolean;
        employee?: Employee;
        actifs?: Actif[];
      },
      string
    >({
      query: (token) => `/acceptance/validate/${token}`,
    }),

    acceptAssignment: build.mutation<
      { success: boolean; message: string },
      { token: string; acceptTerms: boolean }
    >({
      query: ({ token, acceptTerms }) => ({
        url: `/acceptance/accept/${token}`,
        method: "POST",
        body: { acceptTerms },
      }),
      invalidatesTags: ["Actifs", "Employees", "Status", "Assignments"],
    }),

    rejectAssignment: build.mutation<
      { success: boolean; message: string },
      { token: string; reason?: string }
    >({
      query: ({ token, reason }) => ({
        url: `/acceptance/reject/${token}`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Actifs", "Employees", "Status", "Assignments"],
    }),
    //new
    resendAssignmentInvitation: build.mutation<
      { success: boolean; message: string; emailSent: boolean },
      { employeeId: string; actifId: string }
    >({
      query: ({ employeeId, actifId }) => ({
        url: `/acceptance/resend`,
        method: "POST",
        body: { employeeId, actifId },
      }),
    }),
    // License acceptance endpoints
    validateLicenseToken: build.query<
      {
        message: string; valid: boolean; employee?: Employee; licenses?: License[] 
},
      string
    >({
      query: (token) => `/license-acceptance/validate/${token}`,
    }),

    acceptLicenseAssignment: build.mutation<
      { success: boolean; message: string },
      { token: string; acceptTerms: boolean }
    >({
      query: ({ token, acceptTerms }) => ({
        url: `/license-acceptance/accept/${token}`,
        method: "POST",
        body: { acceptTerms },
      }),
      invalidatesTags: [
        "Licenses",
        "Employees",
        "Status",
        "LicenseAssignments",
      ],
    }),

    rejectLicenseAssignment: build.mutation<
      { success: boolean; message: string },
      { token: string; reason?: string }
    >({
      query: ({ token, reason }) => ({
        url: `/license-acceptance/reject/${token}`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: [
        "Licenses",
        "Employees",
        "Status",
        "LicenseAssignments",
      ],
    }),

    resendLicenseInvitation: build.mutation<
      { success: boolean; message: string; emailSent: boolean },
      { employeeId: string; licenseId: string }
    >({
      query: ({ employeeId, licenseId }) => ({
        url: `/license-acceptance/resend`,
        method: "POST",
        body: { employeeId, licenseId },
      }),
    }),

    selectDatabase: build.mutation<
      DatabaseSelectionResponse,
      DatabaseSelectionRequest
    >({
      query: (data) => ({
        url: "auth/select-database",
        method: "POST",
        body: data,
      }),
    }),
    getMarques: build.query<Marque[], string | void>({
      query: (search) => ({
        url: "/marques",
        params: search ? { search } : {},
      }),
      providesTags: ["Marques"],
    }),

    getMarquesByActifType: build.query<Marque[], string>({
      query: (actifTypeId) => `/marques/by-actiftype/${actifTypeId}`,
      providesTags: ["Marques"],
    }),

    createMarque: build.mutation<Marque, { name: string; actifTypeId: string }>(
      {
        query: (data) => ({
          url: "/marques",
          method: "POST",
          body: data,
        }),
        invalidatesTags: ["Marques"],
      }
    ),

    updateMarque: build.mutation<
      Marque,
      { marqueId: string; name: string; actifTypeId?: string }
    >({
      query: ({ marqueId, ...data }) => ({
        url: `/marques/${marqueId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Marques"],
    }),

    deleteMarque: build.mutation<void, string>({
      query: (marqueId) => ({
        url: `/marques/${marqueId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Marques", "Actifs"],
    }),

    // Modele endpoints
    getModeles: build.query<Modele[], string | void>({
      query: (search) => ({
        url: "/modeles",
        params: search ? { search } : {},
      }),
      providesTags: ["Modeles"],
    }),

    getModelesByMarque: build.query<Modele[], string>({
      query: (marqueId) => `/modeles/by-marque/${marqueId}`,
      providesTags: ["Modeles"],
    }),

    createModele: build.mutation<Modele, { marqueId: string; name: string }>({
      query: ({ marqueId, name }) => ({
        url: `/modeles/marque/${marqueId}`,
        method: "POST",
        body: { name },
      }),
      invalidatesTags: ["Modeles"],
    }),

    updateModele: build.mutation<
      Modele,
      { modeleId: string; name: string; marqueId?: string }
    >({
      query: ({ modeleId, ...data }) => ({
        url: `/modeles/${modeleId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Modeles"],
    }),

    deleteModele: build.mutation<void, string>({
      query: (modeleId) => ({
        url: `/modeles/${modeleId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Modeles", "Actifs"],
    }),

    // Fournisseur endpoints
    getFournisseurs: build.query<Fournisseur[], string | void>({
      query: (search) => ({
        url: "/fournisseurs",
        params: search ? { search } : {},
      }),
      providesTags: ["Fournisseurs"],
    }),

    getFournisseurById: build.query<Fournisseur, string>({
      query: (fournisseurId) => `/fournisseurs/${fournisseurId}`,
      providesTags: (result) =>
        result
          ? [{ type: "Fournisseurs", id: result.fournisseurId }, "Fournisseurs"]
          : ["Fournisseurs"],
    }),

    createFournisseur: build.mutation<
      Fournisseur,
      {
        name: string;
        email?: string; // New field
        phone?: string; // New field
      }
    >({
      query: (data) => ({
        url: "/fournisseurs",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Fournisseurs"],
    }),

    updateFournisseur: build.mutation<
      Fournisseur,
      {
        fournisseurId: string;
        name: string;
        email?: string; // New field
        phone?: string; // New field
      }
    >({
      query: ({ fournisseurId, ...data }) => ({
        url: `/fournisseurs/${fournisseurId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Fournisseurs"],
    }),

    deleteFournisseur: build.mutation<void, string>({
      query: (fournisseurId) => ({
        url: `/fournisseurs/${fournisseurId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Fournisseurs", "Actifs"],
    }),
  }),
});

export const {
  // Marque hooks
  useGetMarquesQuery,
  useGetMarquesByActifTypeQuery,
  useCreateMarqueMutation,
  useUpdateMarqueMutation,
  useDeleteMarqueMutation,

  // Modele hooks
  useGetModelesQuery,
  useGetModelesByMarqueQuery,
  useCreateModeleMutation,
  useUpdateModeleMutation,
  useDeleteModeleMutation,

  // Fournisseur hooks
  useGetFournisseursQuery,
  useGetFournisseurByIdQuery,
  useCreateFournisseurMutation,
  useUpdateFournisseurMutation,
  useDeleteFournisseurMutation,

  // Export the hook at the bottom of the file with other exports
  useSelectDatabaseMutation,

  useLoginMutation,

  // New license acceptance exports
  useValidateLicenseTokenQuery,
  useAcceptLicenseAssignmentMutation,
  useRejectLicenseAssignmentMutation,
  useResendLicenseInvitationMutation,

  // Assignement acceptance
  useValidateAssignmentTokenQuery,
  useAcceptAssignmentMutation,
  useRejectAssignmentMutation,
  useResendAssignmentInvitationMutation,

  // Actifs
  useGetActifsQuery,
  useGetActifByIdQuery,
  useGetActifBySerialNumberQuery,
  useCreateActifMutation,
  useUpdateActifMutation,
  useDeleteActifMutation,
  useUpdateActifQuantityMutation,
  useUpdateActifWarrantyMutation,
  useGetExpiringActifsQuery,
  useGetActifsByActifTypeQuery,
  useUpdateSupplierInfoMutation,

  // Etats (New)
  useGetEtatsQuery,
  useGetEtatByIdQuery,
  useGetActifsByEtatQuery,
  useGetLicensesByEtatQuery,
  useUpdateActifEtatMutation,
  useUpdateLicenseEtatMutation,
  useCreateEtatMutation,
  useUpdateEtatMutation,
  useDeleteEtatMutation,
  useGetEtatUsageStatsQuery,

  // Status
  useGetStatusesQuery,
  useGetActifsByStatusQuery,
  useGetLicensesByStatusQuery,
  useUpdateActifStatusMutation,
  useUpdateLicenseStatusMutation,
  useCreateStatusMutation,
  useDeleteStatusMutation,
  useGetStatusUsageStatsQuery,

  // Attachments
  useGetActifAttachmentsQuery,
  useUploadAttachmentMutation,
  useDeleteAttachmentMutation,
  useUploadMultipleAttachmentsMutation,
  useDownloadAttachmentQuery,

  // Specifications
  useGetAllSpecificationsQuery,
  useGetSpecificationByActifIdQuery,
  useUpdateSpecificationMutation,

  // ActifTypes
  useGetAllActifTypesQuery,
  useGetActifTypesQuery,
  useGetActifTypeByIdQuery,
  useCreateActifTypeMutation,
  useUpdateActifTypeMutation,
  useDeleteActifTypeMutation,

  // Assignments
  useGetActifAssignmentsQuery,
  useAssignActifsToEmployeeMutation,
  useRemoveActifsFromEmployeeMutation,

  // Categories
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,

  // Subcategories
  useGetSubCategoriesQuery,
  useCreateSubCategoryMutation,

  // Employees
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useDeleteEmployeeMutation,
  useAssignActifsMutation,
  useRemoveActifsMutation,

  // Licenses
  useGetLicensesQuery,
  useGetLicenseByIdQuery,
  useCreateLicenseMutation,
  useUpdateLicenseMutation,
  useDeleteLicenseMutation,
  useUpdateLicenseExpiryMutation,
  useGetExpiringLicensesQuery,
  useGetExpiredLicensesQuery,
  useRenewLicenseMutation,
  useGetLicenseUsageStatsQuery,
  useGetLicensesBySoftwareQuery,
  useGetLicensesByTypeQuery,

  // License Attachments
  useGetLicenseAttachmentsQuery,
  useGetLicenseAttachmentByIdQuery,
  useUploadLicenseAttachmentMutation,
  useUploadMultipleLicenseAttachmentsMutation,
  useDeleteLicenseAttachmentMutation,
  useDownloadLicenseAttachmentQuery,

  // License Assignments
  useGetLicenseAssignmentsQuery,
  useAssignLicensesToEmployeeMutation,
  useRemoveLicensesFromEmployeeMutation,

  // License Types
  useGetAllLicenseTypesQuery,
  useGetLicenseTypesQuery,
  useGetLicenseTypeByIdQuery,
  useCreateLicenseTypeMutation,
  useUpdateLicenseTypeMutation,
  useDeleteLicenseTypeMutation,

  // Hashtags
  useGetHashtagsQuery,
  useGetHashtagByIdQuery,
  useCreateHashtagMutation,
  useUpdateHashtagMutation,
  useDeleteHashtagMutation,
  useSearchHashtagsQuery,
  useGetActifsByMultipleHashtagsMutation,
  useGetLicensesByMultipleHashtagsMutation,

  // Actif Hashtags
  useGetActifHashtagsQuery,
  useAssociateHashtagToActifMutation,
  useDissociateHashtagFromActifMutation,

  // License Hashtags
  useGetLicenseHashtagsQuery,
  useAssociateHashtagToLicenseMutation,
  useDissociateHashtagFromLicenseMutation,

  useGetActifsByHashtagQuery,
  useGetLicensesByHashtagQuery,
} = api;
