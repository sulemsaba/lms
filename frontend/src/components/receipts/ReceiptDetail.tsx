import type { Receipt } from "@/types";
import { formatDateTime } from "@/utils/date";
import Button from "@/components/ui/Button";
import styles from "./ReceiptDetail.module.css";

interface ReceiptDetailProps {
  receipt: Receipt;
  onBack?: () => void;
}

/**
 * Full receipt details for proof and dispute workflows.
 */
export default function ReceiptDetail({ receipt, onBack }: ReceiptDetailProps) {
  return (
    <section className={styles.container} data-testid="receipt-detail">
      <h2>Submission Receipt</h2>
      <div className={styles.grid}>
        <div>
          <strong>Receipt Code</strong>
          <p>{receipt.code}</p>
        </div>
        <div>
          <strong>Student</strong>
          <p>{receipt.studentName}</p>
        </div>
        <div>
          <strong>Course</strong>
          <p>{receipt.course}</p>
        </div>
        <div>
          <strong>Assessment</strong>
          <p>{receipt.assessmentTitle}</p>
        </div>
        <div>
          <strong>Timestamp</strong>
          <p>{formatDateTime(receipt.timestamp)}</p>
        </div>
        <div>
          <strong>Status</strong>
          <p>{receipt.status}</p>
        </div>
      </div>
      <div className={styles.actions}>
        {onBack ? (
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        ) : null}
        <Button variant="primary" onClick={() => window.print()}>
          Export PDF
        </Button>
      </div>
    </section>
  );
}
