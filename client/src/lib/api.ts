import { queryOptions } from "@tanstack/react-query";
import { useStore } from "./store";

function getMerchantHeaders(): Record<string, string> {
  const token = useStore.getState().merchantToken;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["x-merchant-token"] = token;
  return headers;
}

async function fetchJson<T>(url: string): Promise<T> {
  const token = useStore.getState().merchantToken;
  const headers: Record<string, string> = {};
  if (token) headers["x-merchant-token"] = token;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: getMerchantHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPatch<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: getMerchantHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDelete(url: string): Promise<void> {
  const token = useStore.getState().merchantToken;
  const headers: Record<string, string> = {};
  if (token) headers["x-merchant-token"] = token;
  const res = await fetch(url, { method: "DELETE", headers });
  if (!res.ok) throw new Error(await res.text());
}

export const menuQueryOptions = queryOptions({
  queryKey: ["menu"],
  queryFn: () => fetchJson<any[]>("/api/menu"),
});

export const ordersQueryOptions = queryOptions({
  queryKey: ["orders"],
  queryFn: () => fetchJson<any[]>("/api/orders"),
  retry: false,
});

export const customerOrdersQueryOptions = (phone: string) =>
  queryOptions({
    queryKey: ["orders", phone],
    queryFn: () => fetchJson<any[]>(`/api/orders/${phone}`),
    enabled: !!phone,
  });

export const settingsQueryOptions = queryOptions({
  queryKey: ["settings"],
  queryFn: () => fetchJson<any>("/api/settings"),
});

export const bannersQueryOptions = queryOptions({
  queryKey: ["banners"],
  queryFn: () => fetchJson<any[]>("/api/banners"),
});

export const categoriesQueryOptions = queryOptions({
  queryKey: ["categories"],
  queryFn: () => fetchJson<any[]>("/api/categories"),
});

export const customersQueryOptions = queryOptions({
  queryKey: ["customers"],
  queryFn: () => fetchJson<any[]>("/api/customers"),
  retry: false,
});

export const customerByPhoneQueryOptions = (phone: string) =>
  queryOptions({
    queryKey: ["customer", phone],
    queryFn: () => fetchJson<any>(`/api/customers/${phone}`),
    enabled: !!phone,
    retry: false,
  });

export const reviewsQueryOptions = queryOptions({
  queryKey: ["reviews"],
  queryFn: () => fetchJson<any[]>("/api/reviews"),
  retry: false,
});

export const reviewsByItemQueryOptions = (menuItemId: number) =>
  queryOptions({
    queryKey: ["reviews", "item", menuItemId],
    queryFn: () => fetchJson<any[]>(`/api/reviews/item/${menuItemId}`),
    enabled: menuItemId > 0,
  });

export const reviewsByOrderQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: ["reviews", "order", orderId],
    queryFn: () => fetchJson<any[]>(`/api/reviews/order/${orderId}`),
    enabled: !!orderId,
  });
