import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReceiptDetail from "@/components/receipts/ReceiptDetail";
import type { Receipt } from "@/types";
import styles from "./ReceiptDetailPage.module.css";

const mockReceipts: Receipt[] = [
  {
    id: "r1",
    code: "UDSM-20260213-001",
    course: "CS101",
    assessmentTitle: "Quiz 1",
    timestamp: new Date().toISOString(),
    status: "synced",
    studentName: "John Doe"
  }
];

/**
 * Dedicated receipt page for proof and dispute handling.
 */
export default function ReceiptDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const fallbackReceipt: Receipt = {
    id: id ?? "unknown",
    code: `UDSM-${id ?? "UNKNOWN"}`,
    course: "Unknown Course",
    assessmentTitle: "Unknown Assessment",
    timestamp: new Date().toISOString(),
    status: "saved_offline",
    studentName: "Student"
  };

  const receipt = useMemo(
    () => mockReceipts.find((item) => item.id === id) ?? fallbackReceipt,
    [fallbackReceipt, id]
  );

  return (
    <div className={styles.page}>
      <ReceiptDetail receipt={receipt} onBack={() => navigate(-1)} />
    </div>
  );
}
