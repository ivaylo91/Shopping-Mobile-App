/**
 * useProducts — TanStack Query integration for Firestore real-time products.
 *
 * Pattern: onSnapshot pushes data into TanStack Query cache via setQueryData.
 * useQuery subscribes to that cache key and re-renders on every update.
 *
 * Benefits over the old plain-useState approach:
 *  - Cache persists across navigation: returning to HomeScreen is instant.
 *  - Multiple screens call useProducts() but share a single cache entry.
 *  - Foundation for future optimistic mutations (add/edit/delete products).
 */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export const PRODUCTS_KEY = ['products'];

export function useProducts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Real-time listener → writes directly into TanStack Query cache
    const unsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        queryClient.setQueryData(
          PRODUCTS_KEY,
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      },
      (err) => console.error('useProducts snapshot error:', err)
    );
    return unsubscribe;
  }, [queryClient]);

  const { data } = useQuery({
    queryKey: PRODUCTS_KEY,
    // queryFn is a stub — real data arrives via setQueryData above.
    // staleTime: Infinity means TanStack never refetches on its own.
    queryFn: () => queryClient.getQueryData(PRODUCTS_KEY) ?? [],
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const cachedData = queryClient.getQueryData(PRODUCTS_KEY);

  return {
    products: cachedData ?? data ?? [],
    loading: !cachedData && !data,
    error: null,
  };
}
