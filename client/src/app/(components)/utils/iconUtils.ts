// utils/iconUtils.ts
import {
  // Computer devices
  Laptop,
  Monitor,
  Computer,
  Server,
  Tablet,
  TabletSmartphone,

  // Accessories
  Mouse,
  Keyboard,
  Cable,
  Briefcase,
  BatteryCharging,
  BatteryFull,
  Fan,
  Disc,
  Camera,
  Cpu,
  HardDrive,
  Save,
  Microchip,
  Database,
  Lock,
  Usb,
  Wrench,
  Power,
  LampDesk,
  Maximize,
  Component,
  ShieldCheck,
  LayoutGrid,
  FolderArchive,
  Speaker,
  VideoIcon,
  Mic,
  GraduationCap,
  Backpack,
  Package,
  Pencil,
  SmartphoneCharging,
  CircuitBoard,
  Fingerprint,
  GalleryVerticalEnd,
} from "lucide-react";
import React from "react";

type IconComponent = React.FC<{
  size?: number | string;
  className?: string;
  color?: string;
}>;

// Map subcategory names to specific icons
const subcategoryToIconMap: Record<string, IconComponent> = {
  // Computers
  "Pc Portable": Laptop,
  "PC Gamer": Laptop,
  "PC Portable Pro": Laptop,
  Mac: Laptop,
  UltraBook: Laptop,
  "PC de Bureau": Computer,
  "Ordinateur Gamer": Computer,
  "PC Tout en un": Computer,
  "Serveur Rack": Server,
  "Serveur Tour": Server,
  "Station de Travail": Computer,

  // Displays
  Ecran: Monitor,
  iMac: Monitor,

  // Tablets
  "Tablettes Android": Tablet,
  "Tablette Graphique": TabletSmartphone,
  iPad: Tablet,
  "Accessoires Tablette": Tablet,

  // Accessories
  "Câble antivol PC": Lock,
  "Sacs & Sacoches": Briefcase,
  "Clavier & Souris & Tapis": Keyboard,
  "Power Bank PC Portable": BatteryFull,
  "Refroidisseurs PC Portable": Fan,
  "Hub USB": Usb,
  "Lampe de Bureau": LampDesk,
  "Filtre de confidentialité Ecran PC": ShieldCheck,
  "Support Ecran": Maximize,
  "Accessoires Divers": Wrench,
  "Station d'accueil": GalleryVerticalEnd,
  Webcam: Camera,

  // Components
  Processeur: Cpu,
  "Carte Graphique": Component,
  "Barrettes Mémoire": Microchip,
  "Carte Mère": CircuitBoard,
  Boîtier: Package,
  "Bloc d'alimentation": Power,
  "Chargeur PC Portable": BatteryCharging,
  "Batterie PC Portable": BatteryFull,
  "Afficheur PC Portable": Monitor,
  Ventilateur: Fan,
  "Graveurs et Lecteurs": Disc,
  "Clavier PC Portable": Keyboard,
  "Pâte thermique": Fingerprint,

  // Storage
  "Disque Dur": HardDrive,
  "Disque Dur Interne": HardDrive,
  "Disque Dur Externe": HardDrive,
  "Disque Dur SSD": HardDrive,
  "Disque Dur Vidéosurveillance": HardDrive,
  "Disque Dur Reconditionné": HardDrive,
  "Clé USB": Usb,
  "Carte Mémoire": Save,
  "Accessoires de Stockage": Database,
  "CD & DVD": Disc,
  "Lecteur de Cartes Mémoire": Save,

  // Software
  "Antivirus et Sécurité": ShieldCheck,
  "Système d'Exploitation": LayoutGrid,
  "Suite Bureautique": FolderArchive,

  // School supplies
  "Sac à Dos Scolaire": Backpack,
  "Sac à Goûter": Package,
  Trousse: Pencil,
  "Accessoires sac à dos": Backpack,

  // Conference equipment
  "Haut-Parleur de Conférence": Speaker,
  Visioconférence: VideoIcon,
  "Accessoires Visioconférence": VideoIcon,
  "Microphone Modulable": Mic,
};

// Default category to icon mappings (fallback)
const categoryToDefaultIconMap: Record<string, IconComponent> = {
  Ordinateurs: Computer,
  Tablettes: Tablet,
  Accessoires: Wrench,
  Composants: Component,
  Stockage: HardDrive,
  Logiciels: FolderArchive,
  "Fournitures Scolaires": GraduationCap,
  Conférence: VideoIcon,
  Périphériques: Keyboard,
  Serveurs: Server,
};

/**
 * Gets the appropriate Lucide icon component for a subcategory based on its name
 *
 * @param subcategoryName - The name of the subcategory
 * @param categoryName - Optional category name for fallback
 * @returns A Lucide React icon component
 */
export const getIconForSubcategory = (
  subcategoryName: string | undefined,
  categoryName?: string
): IconComponent => {
  // Handle undefined subcategory name
  if (!subcategoryName) {
    // Fallback to category or ultimate fallback
    return categoryName && categoryToDefaultIconMap[categoryName]
      ? categoryToDefaultIconMap[categoryName]
      : Computer;
  }

  // Direct lookup
  if (subcategoryToIconMap[subcategoryName]) {
    return subcategoryToIconMap[subcategoryName];
  }

  // Fuzzy match - check if subcategory name contains any of our known keys
  for (const [key, icon] of Object.entries(subcategoryToIconMap)) {
    if (
      subcategoryName.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(subcategoryName.toLowerCase())
    ) {
      return icon;
    }
  }

  // Category fallback
  if (categoryName && categoryToDefaultIconMap[categoryName]) {
    return categoryToDefaultIconMap[categoryName];
  }

  // Ultimate fallback
  return Computer;
};

/**
 * Gets the color to use for a subcategory icon based on its category
 *
 * @param categoryName - The category name
 * @returns A color string (hex, rgb, or named color)
 */
export const getIconColorForCategory = (categoryName?: string): string => {
  // You can define color schemes based on categories
  const categoryColorMap: Record<string, string> = {
    Ordinateurs: "#4285F4", // Google blue
    Tablettes: "#EA4335", // Google red
    Accessoires: "#FBBC05", // Google yellow
    Composants: "#34A853", // Google green
    Stockage: "#8E44AD", // Purple
    Logiciels: "#3498DB", // Light blue
    "Fournitures Scolaires": "#E67E22", // Orange
    Conférence: "#1ABC9C", // Turquoise
    Périphériques: "#7F8C8D", // Gray
    Serveurs: "#2C3E50", // Dark blue
  };

  return categoryName && categoryColorMap[categoryName]
    ? categoryColorMap[categoryName]
    : "#0F172A"; // Default - dark slate
};
