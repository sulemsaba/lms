import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAuthStore } from "@/stores/authStore";

/**
 * Login page placeholder for SSO + offline PIN bootstrap.
 */
export default function LoginPage() {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [password, setPassword] = useState("");
  const setTokens = useAuthStore((state) => state.setTokens);
  const registerDevice = useAuthStore((state) => state.registerDevice);
  const navigate = useNavigate();

  const onLogin = () => {
    if (!registrationNumber || !password) {
      return;
    }
    setTokens("mock-access-token", "mock-refresh-token");
    registerDevice(`device-${registrationNumber}`);
    navigate("/");
  };

  return (
    <Card>
      <h2>Student Login</h2>
      <p>Sign in with your institutional credentials.</p>
      <input
        value={registrationNumber}
        onChange={(event) => setRegistrationNumber(event.target.value)}
        placeholder="Registration number"
      />
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
      />
      <Button onClick={onLogin}>Sign In</Button>
    </Card>
  );
}
