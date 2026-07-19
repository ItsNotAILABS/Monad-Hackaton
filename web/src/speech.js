/**
 * Native speech-to-text only (Web Speech API).
 * NO text-to-speech / robot voice — briefs stay text.
 * Use for notes and command execution (terminal / AI chat / builder).
 */

let _rec = null;
let _listening = false;

export function sttSupported() {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isListening() {
  return _listening;
}

/**
 * Start native STT. Calls onPartial / onFinal with transcript text.
 * @returns {{ stop: () => void } | null}
 */
export function startStt({
  lang = "en-US",
  continuous = false,
  interimResults = true,
  onPartial,
  onFinal,
  onError,
  onEnd,
} = {}) {
  if (!sttSupported()) {
    onError?.(new Error("SpeechRecognition not available in this browser"));
    return null;
  }
  stopStt();
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new Ctor();
  rec.lang = lang;
  rec.continuous = continuous;
  rec.interimResults = interimResults;
  rec.maxAlternatives = 1;

  rec.onresult = (ev) => {
    let interim = "";
    let final = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const t = ev.results[i][0]?.transcript || "";
      if (ev.results[i].isFinal) final += t;
      else interim += t;
    }
    if (interim && onPartial) onPartial(interim.trim());
    if (final && onFinal) onFinal(final.trim());
  };
  rec.onerror = (ev) => {
    _listening = false;
    onError?.(new Error(ev.error || "stt error"));
  };
  rec.onend = () => {
    _listening = false;
    onEnd?.();
  };

  try {
    rec.start();
    _rec = rec;
    _listening = true;
  } catch (e) {
    _listening = false;
    onError?.(e instanceof Error ? e : new Error(String(e)));
    return null;
  }

  return {
    stop: () => stopStt(),
  };
}

export function stopStt() {
  if (_rec) {
    try {
      _rec.stop();
    } catch {
      try {
        _rec.abort();
      } catch {
        /* ignore */
      }
    }
    _rec = null;
  }
  _listening = false;
}

/** Explicitly refuse TTS — product policy */
export function speakText() {
  // Never use speechSynthesis for briefs or product copy.
  return {
    ok: false,
    tts: false,
    reason: "MonadBuilder HQ uses text briefs only — no robot voice. Use STT for notes/exec.",
  };
}

export function sttCatalog() {
  return {
    schema: "monadbuilder.speech.v1",
    tts: false,
    stt: sttSupported(),
    uses: ["notes", "terminal_commands", "ai_chat", "builder_dictation"],
    note: "Native Web Speech API recognition only. Briefs are always text.",
  };
}
