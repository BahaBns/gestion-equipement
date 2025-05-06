import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuidv4 } from "uuid";

// Import the Fournisseur type
import { Fournisseur } from "@/state/api";

// Define the SupplierAllocation interface
export interface SupplierAllocation {
  id: string;
  fournisseurId: string;
  quantity: number;
}

// In MultiSupplierSelection.tsx file
interface MultiSupplierSelectionProps {
  suppliers: Fournisseur[]; // Make sure this is Fournisseur[], not any other type
  isLoading: boolean;
  totalQuantity: number;
  onSuppliersChange: (allocations: SupplierAllocation[]) => void;
}

const MultiSupplierSelection: React.FC<MultiSupplierSelectionProps> = ({
  suppliers,
  isLoading,
  totalQuantity,
  onSuppliersChange,
}) => {
  const [allocations, setAllocations] = useState<SupplierAllocation[]>([]);
  const [remainingQuantity, setRemainingQuantity] = useState<number>(totalQuantity);

  // Initialize with a single empty allocation if none exist
  useEffect(() => {
    if (allocations.length === 0 && suppliers.length > 0) {
      addAllocation();
    }
  }, [suppliers]);

  // Update when total quantity changes
  useEffect(() => {
    updateRemainingQuantity();
  }, [totalQuantity, allocations]);

  const updateRemainingQuantity = () => {
    const allocated = allocations.reduce((sum, item) => sum + item.quantity, 0);
    setRemainingQuantity(totalQuantity - allocated);
  };

  const addAllocation = () => {
    if (remainingQuantity <= 0) return;

    const newAllocation: SupplierAllocation = {
      id: uuidv4(),
      fournisseurId: "",
      quantity: remainingQuantity,
    };

    const newAllocations = [...allocations, newAllocation];
    setAllocations(newAllocations);
    onSuppliersChange(newAllocations);
  };

  const updateAllocation = (id: string, field: keyof SupplierAllocation, value: any) => {
    const updatedAllocations = allocations.map((allocation) =>
      allocation.id === id ? { ...allocation, [field]: value } : allocation
    );
    setAllocations(updatedAllocations);
    onSuppliersChange(updatedAllocations);
  };

  const removeAllocation = (id: string) => {
    const updatedAllocations = allocations.filter(
      (allocation) => allocation.id !== id
    );
    setAllocations(updatedAllocations);
    onSuppliersChange(updatedAllocations);
  };

  // Get list of suppliers that haven't been allocated yet
  const getAvailableSuppliers = (currentId: string) => {
    const usedIds = allocations
      .filter((a) => a.id !== currentId)
      .map((a) => a.fournisseurId);
    
    return suppliers.filter((s) => !usedIds.includes(s.fournisseurId));
  };

  return (
    <div>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fournisseur</TableCell>
              <TableCell>Quantité</TableCell>
              <TableCell width="50px"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allocations.map((allocation) => (
              <TableRow key={allocation.id}>
                <TableCell>
                  <FormControl fullWidth>
                    <Select
                      value={allocation.fournisseurId}
                      onChange={(e) =>
                        updateAllocation(
                          allocation.id,
                          "fournisseurId",
                          e.target.value
                        )
                      }
                      displayEmpty
                      disabled={isLoading}
                      startAdornment={
                        isLoading ? <CircularProgress size={20} /> : null
                      }
                    >
                      <MenuItem value="">
                        <em>Sélectionner un fournisseur</em>
                      </MenuItem>
                      {getAvailableSuppliers(allocation.id).map((supplier) => (
                        <MenuItem
                          key={supplier.fournisseurId}
                          value={supplier.fournisseurId}
                        >
                          {supplier.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={allocation.quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      if (value >= 0) {
                        updateAllocation(allocation.id, "quantity", value);
                      }
                    }}
                    inputProps={{ min: 1 }}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => removeAllocation(allocation.id)}
                    disabled={allocations.length <= 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
        }}
      >
        <Typography variant="body2">
          Quantité restante: {remainingQuantity}
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={addAllocation}
          disabled={remainingQuantity <= 0 || suppliers.length === 0}
          size="small"
        >
          Ajouter un fournisseur
        </Button>
      </Box>
    </div>
  );
};

export default MultiSupplierSelection;