import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAuthStore } from "@/stores/authStore";

/**
 * Offline PIN setup page for local read-only unlock.
 */
export default function OfflinePinPage() {
  const [pin, setPin] = useState("");
  const [feedback, setFeedback] = useState("");
  const setOfflinePin = useAuthStore((state) => state.setOfflinePin);

  const onSave = () => {
    if (pin.length < 4) {
      setFeedback("PIN must be at least 4 digits.");
      return;
    }
    setOfflinePin(pin);
    setFeedback("Offline PIN saved.");
  };

  return (
    <Card>
      <h2>Offline PIN</h2>
      <p>Create a PIN for cached read-only access when internet is unavailable.</p>
      <input
        type="password"
        value={pin}
        onChange={(event) => setPin(event.target.value)}
        placeholder="Enter 4+ digit PIN"
      />
      <Button onClick={onSave}>Save PIN</Button>
      <p>{feedback}</p>
    </Card>
  );
}
