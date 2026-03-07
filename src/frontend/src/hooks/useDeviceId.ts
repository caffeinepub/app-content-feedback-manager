import { useEffect, useState } from "react";

const DEVICE_ID_KEY = "deviceId";

export function useDeviceId(): string {
  const [deviceId] = useState<string>(() => {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  });

  return deviceId;
}
