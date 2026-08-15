import { useAuthStore } from '../store/auth.store';

export const assignUserTier = async (
  coreUserId: string,
  tierId: string,
): Promise<any> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(
    `${baseUrl}/loyalty-admin/users/${coreUserId}/tier`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-tenant-override': tenant,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tier_id: tierId }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to assign tier');
  }

  return response.json();
};
