import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReceiptDetail from "@/components/receipts/ReceiptDetail";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { db } from "@/services/db";
import type { Receipt } from "@/types";
import styles from "./ReceiptDetailPage.module.css";

/**
 * Dedicated receipt page for proof and dispute handling.
 */
export default function ReceiptDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const cached = id ? await db.receipts.get(id) : undefined;
      if (!mounted) {
        return;
      }
      if (cached) {
        setReceipt(cached);
      } else {
        setReceipt({
          id: id ?? "unknown",
          code: `UDSM-${id ?? "UNKNOWN"}`,
          course: "Unknown Course",
          assessmentTitle: "Unknown Assessment",
          timestamp: new Date().toISOString(),
          status: "saved_offline",
          studentName: "Student"
        });
      }
      setLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading || !receipt) {
    return <SkeletonLoader type="card" />;
  }

  return (
    <div className={styles.page}>
      <ReceiptDetail receipt={receipt} onBack={() => navigate(-1)} />
    </div>
  );
}
