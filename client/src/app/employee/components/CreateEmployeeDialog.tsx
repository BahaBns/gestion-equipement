// components/CreateEmployeeDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";

type CreateEmployeeDialogProps = {
  open: boolean;
  onClose: () => void;
  newEmployee: { nom: string; email: string };
  setNewEmployee: (employee: { nom: string; email: string }) => void;
  handleCreate: () => Promise<void>;
};

const CreateEmployeeDialog = ({
  open,
  onClose,
  newEmployee,
  setNewEmployee,
  handleCreate,
}: CreateEmployeeDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Créer un nouvel employé</DialogTitle>
      <DialogContent>
        <TextField
          label="Nom"
          value={newEmployee.nom}
          onChange={(e) =>
            setNewEmployee({ ...newEmployee, nom: e.target.value })
          }
          fullWidth
          margin="normal"
        />
        <TextField
          label="Email"
          value={newEmployee.email}
          onChange={(e) =>
            setNewEmployee({ ...newEmployee, email: e.target.value })
          }
          fullWidth
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          onClick={handleCreate}
          color="primary"
          disabled={!newEmployee.nom || !newEmployee.email}
        >
          Valider
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateEmployeeDialog;
