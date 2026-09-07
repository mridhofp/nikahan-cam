"use client";

import { GUEST_ID_KEY, GUEST_NAME_KEY } from "@/lib/constants";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function getOrCreateGuestId(): string {
  const existing = window.localStorage.getItem(GUEST_ID_KEY);
  if (existing) return existing;

  const id = `guest_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  window.localStorage.setItem(GUEST_ID_KEY, id);
  return id;
}

export function getGuestName(): string | null {
  return window.localStorage.getItem(GUEST_NAME_KEY);
}

export function setGuestName(name: string) {
  window.localStorage.setItem(GUEST_NAME_KEY, name.trim());
}

export function useGuestId() {
  return useSyncExternalStore(emptySubscribe, getOrCreateGuestId, () => "");
}

export function useGuestName() {
  return useSyncExternalStore(
    emptySubscribe,
    () => getGuestName() ?? "",
    () => "",
  );
}
