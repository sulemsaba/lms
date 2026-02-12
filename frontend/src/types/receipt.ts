export type ReceiptStatus = "synced" | "saved_offline" | "failed";

export interface Receipt {
  id: string;
  code: string;
  course: string;
  assessmentTitle: string;
  timestamp: string;
  status: ReceiptStatus;
  studentName: string;
  shareUrl?: string;
}
