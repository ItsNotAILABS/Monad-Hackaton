import React, { useEffect, useState } from "react";
import { isListening, startStt, stopStt, sttSupported } from "./speech.js";

/**
 * Mic for speech-to-text only (notes / commands). Never speaks.
 */
export function MicButton({
  onText,
  onPartial,
  label = "Mic",
  className = "ghost",
  continuous = false,
  disabled = false,
}) {
  const [on, setOn] = useState(false);
  const [err, setErr] = useState("");
  const ok = sttSupported();

  useEffect(() => () => stopStt(), []);

  function toggle() {
    if (!ok || disabled) return;
    setErr("");
    if (on || isListening()) {
      stopStt();
      setOn(false);
      return;
    }
    const handle = startStt({
      continuous,
      interimResults: true,
      onPartial: (t) => onPartial?.(t),
      onFinal: (t) => {
        if (t) onText?.(t);
        if (!continuous) setOn(false);
      },
      onError: (e) => {
        setErr(String(e.message || e));
        setOn(false);
      },
      onEnd: () => setOn(false),
    });
    if (handle) setOn(true);
  }

  if (!ok) {
    return (
      <button type="button" className={className} disabled title="STT not supported in this browser">
        Mic N/A
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={disabled}
        onClick={toggle}
        title="Speech-to-text only — no robot voice playback"
        aria-pressed={on}
      >
        {on ? "● Listening…" : `🎤 ${label}`}
      </button>
      {err ? <span className="muted sm"> {err}</span> : null}
    </>
  );
}
