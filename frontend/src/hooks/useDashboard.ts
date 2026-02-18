import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/services/dashboardService";
import { useAuthStore, selectEffectiveRoleCodes, selectEffectivePermissions } from "@/stores/authStore";

export function useDashboard() {
    const roleCodes = useAuthStore(selectEffectiveRoleCodes);
    const permissions = useAuthStore(selectEffectivePermissions);

    return useQuery({
        queryKey: ["dashboard", roleCodes, permissions],
        queryFn: () => getDashboardData(roleCodes, permissions),
    });
}
