import { apiClient } from "@/services/api/client";
import { db } from "@/services/db";
import type { Receipt } from "@/types";
import { createIdempotencyKey, generateUuid } from "@/utils/id";
import { isOffline } from "@/utils/network";

export interface SubmissionPayload {
  assessmentId: string;
  courseId: string;
  answerText: string;
}

export interface SubmissionResponse {
  receipt: Receipt;
  queued: boolean;
}

interface ApiSubmissionResponse {
  receipt: Receipt;
}

function createOfflineReceipt(payload: SubmissionPayload): Receipt {
  return {
    id: generateUuid(),
    code: `UDSM-${Date.now()}`,
    course: payload.courseId,
    assessmentTitle: payload.assessmentId,
    timestamp: new Date().toISOString(),
    status: "saved_offline",
    studentName: "Student"
  };
}

export async function submitAssessment(payload: SubmissionPayload): Promise<SubmissionResponse> {
  const idempotencyKey = createIdempotencyKey("assessment-submit");

  if (isOffline()) {
    const receipt = createOfflineReceipt(payload);
    await db.offlineActions.put({
      id: receipt.id,
      entity: "assessment",
      action: "submit",
      payload,
      idempotencyKey,
      createdAt: new Date(),
      retryCount: 0,
      syncStatus: "pending"
    });
    await db.receipts.put(receipt);
    return { receipt, queued: true };
  }

  try {
    const response = await apiClient.post<ApiSubmissionResponse>("/assessments/submit", payload, {
      headers: { "x-idempotency-key": idempotencyKey }
    });
    await db.receipts.put(response.data.receipt);
    return { receipt: response.data.receipt, queued: false };
  } catch {
    const fallback = createOfflineReceipt(payload);
    await db.offlineActions.put({
      id: fallback.id,
      entity: "assessment",
      action: "submit",
      payload,
      idempotencyKey,
      createdAt: new Date(),
      retryCount: 0,
      syncStatus: "pending"
    });
    await db.receipts.put(fallback);
    return { receipt: fallback, queued: true };
  }
}
