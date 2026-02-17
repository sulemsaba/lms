import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { queueQrCodeCheckIn } from "@/services/attendance/checkIn";
import { createLocalAlert } from "@/services/notifications/pushAlerts";
import styles from "./AttendanceScannerPage.module.css";

interface DetectedBarcode {
  rawValue?: string;
}

interface BarcodeDetectorInstance {
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
}

interface WindowWithBarcodeDetector extends Window {
  BarcodeDetector?: BarcodeDetectorConstructor;
}

const getBarcodeDetectorConstructor = (): BarcodeDetectorConstructor | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const detected = (window as WindowWithBarcodeDetector).BarcodeDetector;
  return detected ?? null;
};

/**
 * Camera + manual QR attendance scanner with offline queue fallback.
 */
export default function AttendanceScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const scanBusyRef = useRef(false);

  const [manualCode, setManualCode] = useState("");
  const [scannerRunning, setScannerRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const supportsCamera = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      "mediaDevices" in navigator &&
      typeof navigator.mediaDevices.getUserMedia === "function",
    []
  );
  const supportsBarcodeDetector = useMemo(() => getBarcodeDetectorConstructor() !== null, []);

  const stopScanner = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    detectorRef.current = null;
    setScannerRunning(false);
  };

  useEffect(
    () => () => {
      stopScanner();
    },
    []
  );

  const handleDecodedCode = async (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      return;
    }

    setBusy(true);
    setErrorMessage("");
    try {
      const result = await queueQrCodeCheckIn(trimmed);
      const checkInLabel =
        result.mode === "attendance" ? "attendance" : result.mode === "event" ? "event entry" : "session entry";
      const targetLabel = result.eventId ? ` (${result.eventId})` : "";
      setStatusMessage(`Queued ${checkInLabel}${targetLabel}. It will sync automatically.`);
      await createLocalAlert("QR check-in queued", `Saved ${checkInLabel}${targetLabel} for sync.`, "success");
      setManualCode("");
    } catch {
      setErrorMessage("QR code could not be processed. Try again or paste the code manually.");
    } finally {
      setBusy(false);
    }
  };

  const startScanner = async () => {
    if (!supportsCamera) {
      setErrorMessage("Camera access is not available in this browser.");
      return;
    }
    if (!supportsBarcodeDetector) {
      setErrorMessage("BarcodeDetector is not supported. Use manual code entry below.");
      return;
    }

    setErrorMessage("");
    setStatusMessage("");

    const Detector = getBarcodeDetectorConstructor();
    if (!Detector) {
      setErrorMessage("QR scanning is not supported on this device.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });

      streamRef.current = stream;
      if (!videoRef.current) {
        throw new Error("Camera preview is unavailable.");
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      detectorRef.current = new Detector({ formats: ["qr_code"] });
      setScannerRunning(true);

      intervalRef.current = window.setInterval(() => {
        if (scanBusyRef.current || !detectorRef.current || !videoRef.current) {
          return;
        }
        if (videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          return;
        }

        scanBusyRef.current = true;
        void detectorRef.current
          .detect(videoRef.current as unknown as ImageBitmapSource)
          .then((detections) => {
            const firstDetected = detections.find((item) => typeof item.rawValue === "string" && item.rawValue.trim());
            if (!firstDetected?.rawValue) {
              return;
            }
            stopScanner();
            void handleDecodedCode(firstDetected.rawValue);
          })
          .catch(() => undefined)
          .finally(() => {
            scanBusyRef.current = false;
          });
      }, 700);
    } catch {
      stopScanner();
      setErrorMessage("Unable to start camera. Allow permissions and try again.");
    }
  };

  const onManualSubmit = async () => {
    if (!manualCode.trim()) {
      setErrorMessage("Paste a QR payload before submitting.");
      return;
    }
    await handleDecodedCode(manualCode);
  };

  return (
    <section className={styles.stack}>
      <Card>
        <h2>QR Attendance Scanner</h2>
        <p>Scan attendance/event QR codes. If camera scanning is unavailable, paste the QR payload manually.</p>
        <div className={styles.actions}>
          {!scannerRunning ? (
            <Button onClick={() => void startScanner()} disabled={!supportsCamera || !supportsBarcodeDetector || busy}>
              Start Camera Scan
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => stopScanner()} disabled={busy}>
              Stop Camera
            </Button>
          )}
        </div>

        <div className={styles.preview}>
          <video ref={videoRef} className={styles.video} muted playsInline />
        </div>

        <div className={styles.manual}>
          <label htmlFor="manual-qr-input">Manual QR payload</label>
          <textarea
            id="manual-qr-input"
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            rows={3}
            placeholder='Example: ATTENDANCE:CS101-2026-02-17 or {"type":"attendance","eventId":"CS101"}'
          />
          <Button variant="secondary" onClick={() => void onManualSubmit()} disabled={busy}>
            Submit Manual Code
          </Button>
        </div>

        {statusMessage ? <p className={styles.success}>{statusMessage}</p> : null}
        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
      </Card>
    </section>
  );
}
