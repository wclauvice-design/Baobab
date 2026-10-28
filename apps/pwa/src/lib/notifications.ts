// High-fidelity web and audio notification service for Westzone

let audioCtx: AudioContext | null = null;
let titleFlashTimer: ReturnType<typeof setInterval> | null = null;
let originalTitle = typeof document !== "undefined" ? document.title : "Westzone";

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Synthesizes a pleasant, modern two-tone notification chime (D5 -> A5)
 * Zero external asset downloads, 0ms latency, works completely offline.
 */
export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // First tone (D5 ~ 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second tone (A5 ~ 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.debug("Audio notification suppressed:", err);
  }
}

export function hasNotificationSupport(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!hasNotificationSupport()) return "denied";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!hasNotificationSupport()) return "denied";
  try {
    // Unlock AudioContext on user gesture
    getAudioContext();
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return "denied";
  }
}

export function showDesktopNotification(title: string, options?: NotificationOptions) {
  if (!hasNotificationSupport() || Notification.permission !== "granted") return;
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          icon: "/favicon.svg",
          badge: "/favicon.svg",
          ...options,
        } as any);
      });
    } else {
      new Notification(title, {
        icon: "/favicon.svg",
        ...options,
      });
    }
  } catch (err) {
    console.debug("Desktop notification error:", err);
  }
}

export function flashTabTitle(alertText: string) {
  if (typeof document === "undefined") return;
  if (!document.hidden) return; // Only flash if window is in background

  if (titleFlashTimer) clearInterval(titleFlashTimer);
  originalTitle = document.title.replace(/^🔔 \(\d+\) /, "");
  let show = true;

  titleFlashTimer = setInterval(() => {
    if (!document.hidden) {
      stopFlashingTitle();
      return;
    }
    document.title = show ? `🔔 (1) ${alertText}` : originalTitle;
    show = !show;
  }, 1100);

  const onFocus = () => stopFlashingTitle();
  window.addEventListener("focus", onFocus, { once: true });
}

export function stopFlashingTitle() {
  if (titleFlashTimer) {
    clearInterval(titleFlashTimer);
    titleFlashTimer = null;
  }
  if (typeof document !== "undefined") {
    document.title = originalTitle;
  }
}

/**
 * Unified notification dispatcher for new incoming messages
 */
export function notifyNewMessage(senderName: string, bodyText: string) {
  playNotificationSound();
  showDesktopNotification(senderName, {
    body: bodyText,
    tag: "westzone-chat-message",
  });
  flashTabTitle("Nouveau message");
}
