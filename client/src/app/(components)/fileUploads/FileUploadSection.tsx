"use client";

import { useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Paper,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import {
  PaperclipIcon,
  FileIcon,
  Trash2Icon,
  UploadCloudIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  ImageIcon,
  FileTypeIcon,
} from "lucide-react";

interface FileUploadSectionProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string;
}

const getFileTypeIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "pdf":
      return <FileTextIcon size={24} color="#E53935" />;
    case "doc":
    case "docx":
      return <FileTextIcon size={24} color="#2196F3" />;
    case "xls":
    case "xlsx":
      return <FileSpreadsheetIcon size={24} color="#4CAF50" />;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return <ImageIcon size={24} color="#FF9800" />;
    default:
      return <FileIcon size={24} color="#9E9E9E" />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const FileUploadSection = ({
  files,
  onChange,
  maxFiles = 10,
  acceptedFileTypes = "*",
}: FileUploadSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleFileChange = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    if (files.length + newFiles.length > maxFiles) {
      alert(`Vous pouvez télécharger un maximum de ${maxFiles} fichiers.`);
      return;
    }

    // Add new files to existing files array
    onChange([...files, ...newFiles]);

    // Log files for debugging
    console.log(
      "Files selected:",
      newFiles.map((f) => f.name)
    );
  };

  const handleRemoveFile = (indexToRemove: number) => {
    onChange(files.filter((_, index) => index !== indexToRemove));
  };

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      console.log("File dropped");

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        console.log(`Dropped ${e.dataTransfer.files.length} files`);
        handleFileChange(e.dataTransfer.files);
      }
    },
    [handleFileChange]
  );

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box className="file-upload-section">
      <Paper
        className={`p-6 mb-4 border-2 border-dashed ${
          dragActive ? "border-primary-500 bg-primary-50" : "border-gray-300"
        } rounded-lg text-center`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <UploadCloudIcon className="text-gray-400 mb-2" size={48} />
        <Typography variant="h6" gutterBottom>
          Glissez-déposez les fichiers de cet équipement (ex: facture, garantie)
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          ou
        </Typography>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileChange(e.target.files)}
          style={{ display: "none" }}
          multiple
          accept={acceptedFileTypes}
        />
        <Button
          variant="outlined"
          startIcon={<PaperclipIcon size={16} />}
          onClick={handleButtonClick}
        >
          Parcourir les fichiers
        </Button>
        <Typography
          variant="caption"
          display="block"
          className="mt-2 text-gray-500"
        >
          Formats supportés: images, PDF, Word, Excel, etc. Taille max: 10MB par
          fichier
        </Typography>
        <Typography
          variant="caption"
          display="block"
          className="mt-1 text-primary-600"
        >
          Documents recommandés: facture d'achat, bon de garantie, manuel
          d'utilisation, photos de l'équipement
        </Typography>
        {maxFiles && (
          <Typography
            variant="caption"
            display="block"
            className="text-gray-500"
          >
            {files.length}/{maxFiles} fichiers
          </Typography>
        )}
      </Paper>

      {files.length > 0 && (
        <Box className="mb-4">
          <Typography variant="subtitle1" gutterBottom>
            Fichiers sélectionnés ({files.length})
          </Typography>
          <List>
            {files.map((file, index) => (
              <ListItem
                key={`${file.name}-${index}`}
                className="border rounded mb-2 bg-gray-50"
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <Trash2Icon color="red" size={20} />
                  </IconButton>
                }
              >
                <ListItemIcon>{getFileTypeIcon(file.name)}</ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={formatFileSize(file.size)}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default FileUploadSection;
