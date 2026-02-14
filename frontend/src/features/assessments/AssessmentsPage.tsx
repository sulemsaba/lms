import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import ReceiptCard from "@/components/receipts/ReceiptCard";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { db } from "@/services/db";
import type { Receipt } from "@/types";
import { submitAssessment } from "@/services/api/assessmentsApi";
import styles from "./AssessmentsPage.module.css";

const initialReceipts: Receipt[] = [
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
 * Assessment flow with offline-safe submission and receipts.
 */
export default function AssessmentsPage() {
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [sourceLabel, setSourceLabel] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const cachedReceipts = await db.receipts.orderBy("timestamp").reverse().toArray();
      if (!mounted) {
        return;
      }
      if (cachedReceipts.length > 0) {
        setReceipts(cachedReceipts);
        setSourceLabel("Showing saved receipts from offline storage.");
      } else {
        await db.receipts.bulkPut(initialReceipts);
        setReceipts(initialReceipts);
        setSourceLabel("Local receipt cache initialized.");
      }
      setLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleMockSubmit = async () => {
    const response = await submitAssessment({
      assessmentId: "Quiz 2",
      courseId: "CS101",
      answerText: "Offline-first answer draft"
    });
    setReceipts((current) => [response.receipt, ...current]);
  };

  if (loading) {
    return <SkeletonLoader type="card" />;
  }

  return (
    <section className={styles.stack}>
      <div className={styles.actions}>
        <Button onClick={() => void handleMockSubmit()}>Submit mock assessment</Button>
      </div>
      {sourceLabel ? <p className={styles.hint}>{sourceLabel}</p> : null}
      {receipts.map((receipt) => (
        <div key={receipt.id}>
          <ReceiptCard receipt={receipt} />
          <p>
            <Link to={`/receipts/${receipt.id}`}>View full receipt</Link>
          </p>
        </div>
      ))}
    </section>
  );
}
