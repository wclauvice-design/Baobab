// High-fidelity web and audio notification service for Baobab Admin

let audioCtx: AudioContext | null = null;
let titleFlashTimer: ReturnType<typeof setInterval> | null = null;
let originalTitle = typeof document !== "undefined" ? document.title : "Baobab Admin";

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
 * Synthesizes a pleasant two-tone notification chime for incoming customer orders/messages
 */
export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // First tone (E5 ~ 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second tone (B5 ~ 987.77 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
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
    new Notification(title, {
      icon: "/favicon.svg",
      ...options,
    });
  } catch (err) {
    console.debug("Desktop notification error:", err);
  }
}

export function flashTabTitle(alertText: string) {
  if (typeof document === "undefined") return;
  if (!document.hidden) return;

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

export function notifyNewClientMessage(clientName: string, bodyText: string) {
  playNotificationSound();
  showDesktopNotification(`Message de ${clientName}`, {
    body: bodyText,
    tag: "baobab-admin-client-msg",
  });
  flashTabTitle("Message client reçu !");
}
