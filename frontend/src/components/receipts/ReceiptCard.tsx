import { formatDateTime } from "@/utils/date";
import type { Receipt } from "@/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import styles from "./ReceiptCard.module.css";

interface ReceiptCardProps {
  receipt: Receipt;
}

/**
 * Compact receipt preview for assessment confirmations.
 */
export default function ReceiptCard({ receipt }: ReceiptCardProps) {
  const badgeColor =
    receipt.status === "synced" ? "success" : receipt.status === "saved_offline" ? "warning" : "error";
  const badgeText =
    receipt.status === "synced"
      ? "Synced"
      : receipt.status === "saved_offline"
        ? "Saved Offline"
        : "Sync Failed";

  const onCopy = async () => {
    await navigator.clipboard.writeText(receipt.code);
  };

  const onShare = async () => {
    const text = `Receipt ${receipt.code} for ${receipt.assessmentTitle}`;
    if (navigator.share) {
      await navigator.share({ title: "UDSM Receipt", text, url: receipt.shareUrl });
      return;
    }
    await navigator.clipboard.writeText(text);
  };

  return (
    <article className={styles.card} data-testid="receipt-card">
      <div className={styles.top}>
        <div>
          <div className={styles.code}>{receipt.code}</div>
          <div className={styles.meta}>{formatDateTime(receipt.timestamp)}</div>
        </div>
        <Badge color={badgeColor} text={badgeText} />
      </div>
      <p>
        <strong>{receipt.course}</strong> - {receipt.assessmentTitle}
      </p>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCopy}>
          Copy ID
        </Button>
        <Button variant="text" onClick={onShare}>
          Share
        </Button>
      </div>
    </article>
  );
}
