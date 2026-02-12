import Button from "@/components/ui/Button";
import styles from "./ConflictDialog.module.css";

interface ConflictDialogProps {
  open: boolean;
  onKeepMine: () => void;
  onUseServer: () => void;
}

/**
 * Offline conflict resolver with plain-language actions.
 */
export default function ConflictDialog({
  open,
  onKeepMine,
  onUseServer
}: ConflictDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={styles.overlay} data-testid="conflict-dialog">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label="Resolve Sync Conflict">
        <h3>We found a conflict</h3>
        <p>Your offline change is different from the latest server version.</p>
        <p>Choose what should be kept.</p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={onKeepMine}>
            Keep mine
          </Button>
          <Button variant="secondary" onClick={onUseServer}>
            Use server copy
          </Button>
        </div>
      </div>
    </div>
  );
}
