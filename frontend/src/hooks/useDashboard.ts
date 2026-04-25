import { useState, useEffect } from "react";
import { getDashboardData } from "@/services/dashboardService";
import { useAuthStore, selectEffectiveRoleCodes, selectEffectivePermissions } from "@/stores/authStore";

export function useDashboard() {
    const roleCodes = useAuthStore(selectEffectiveRoleCodes);
    const permissions = useAuthStore(selectEffectivePermissions);
    const [data, setData] = useState<Awaited<ReturnType<typeof getDashboardData>> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);

        getDashboardData(roleCodes, permissions)
            .then((result) => {
                if (!cancelled) {
                    setData(result);
                    setError(null);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err instanceof Error ? err : new Error(String(err)));
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [roleCodes, permissions]);

    return { data, isLoading, error };
}
