import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { Employee } from "@/state/api";

interface UpdateEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  employee: { employeeId: string; nom: string; email: string };
  setEmployee: React.Dispatch<
    React.SetStateAction<{ employeeId: string; nom: string; email: string }>
  >;
  handleUpdate: () => Promise<void>;
}

const UpdateEmployeeDialog: React.FC<UpdateEmployeeDialogProps> = ({
  open,
  onClose,
  employee,
  setEmployee,
  handleUpdate,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Modifier un employé</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Nom"
          type="text"
          fullWidth
          variant="outlined"
          value={employee.nom}
          onChange={(e) =>
            setEmployee((prev) => ({ ...prev, nom: e.target.value }))
          }
          required
        />
        <TextField
          margin="dense"
          label="Email"
          type="email"
          fullWidth
          variant="outlined"
          value={employee.email}
          onChange={(e) =>
            setEmployee((prev) => ({ ...prev, email: e.target.value }))
          }
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Annuler
        </Button>
        <Button onClick={handleUpdate} color="primary" variant="contained">
          Mettre à jour
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateEmployeeDialog;
