"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";

// ── Inline SVGs ────────────────────────────────────────────────────────────────
const IconMic = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);
const IconX = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);
const IconUsers = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconSettings = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconRadio = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/>
    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4"/>
    <circle cx="12" cy="12" r="2"/>
    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4"/>
    <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>
  </svg>
);
const IconAlertCircle = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
);

// ── Teams ──────────────────────────────────────────────────────────────────────
const TEAMS = [
  { name: "Organizers",   color: "bg-blue-500",    ring: "ring-blue-400",    hover: "hover:bg-blue-600"    },
  { name: "Registration", color: "bg-emerald-500", ring: "ring-emerald-400", hover: "hover:bg-emerald-600" },
  { name: "Coordinators", color: "bg-violet-500",  ring: "ring-violet-400",  hover: "hover:bg-violet-600"  },
  { name: "Tech Support", color: "bg-orange-500",  ring: "ring-orange-400",  hover: "hover:bg-orange-600"  },
  { name: "Interviewers", color: "bg-rose-500",    ring: "ring-rose-400",    hover: "hover:bg-rose-600"    },
];
const TEAM_MAP = Object.fromEntries(TEAMS.map((t) => [t.name, t]));

// ── Socket singleton ───────────────────────────────────────────────────────────
let chatSocket = null;
function getSocket() {
  if (!chatSocket) chatSocket = io();
  return chatSocket;
}

// ── Supported MIME type (detected once) ───────────────────────────────────────
let detectedMime = null;
function getSupportedMime() {
  if (detectedMime !== null) return detectedMime;
  if (typeof MediaRecorder === "undefined") return (detectedMime = "");
  detectedMime =
    ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"]
      .find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
  return detectedMime;
}

// ── Audio unlock for iOS/mobile (must be called inside a user gesture) ────────
let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked || typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      ctx.resume().then(() => ctx.close()).catch(() => {});
    }
    // Tap a silent buffer so future Audio.play() calls succeed without gesture
    const silent = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
    );
    silent.volume = 0;
    silent.play().then(() => silent.pause()).catch(() => {});
  } catch {}
  audioUnlocked = true;
}

// ── Per-speaker streaming session ─────────────────────────────────────────────
// Uses MediaSource API to start playback as chunks arrive (no end-of-transmission wait).
// Falls back to full-buffer playback when MediaSource is unavailable.
function createSession(mimeType) {
  const session = {
    mimeType,
    pendingChunks: [],  // chunks waiting to be appended to SourceBuffer
    sbReady: false,
    ms: null,
    sb: null,
    audio: null,
    useStreaming: false,
    fallbackChunks: [],
  };

  const canStream =
    mimeType &&
    typeof MediaSource !== "undefined" &&
    MediaSource.isTypeSupported(mimeType);

  if (canStream) {
    session.useStreaming = true;
    session.ms = new MediaSource();
    session.audio = new Audio();
    session.audio.src = URL.createObjectURL(session.ms);
    session.audio.autoplay = true;
    // Lower latency: reduce buffering
    if ("mozAutoplayEnabled" in document || "webkitAudioDecodedByteCount" in session.audio) {
      // Safari/Firefox hint — not always respected but harmless
    }

    session.ms.addEventListener("sourceopen", () => {
      try {
        session.sb = session.ms.addSourceBuffer(mimeType);
        session.sbReady = true;
        session.sb.addEventListener("updateend", () => _flushSession(session));
        _flushSession(session); // drain any early chunks
      } catch {
        // e.g. MIME rejected at sourceopen time → fall back
        session.useStreaming = false;
        session.sbReady = false;
      }
    }, { once: true });

    session.audio.play().catch(() => {}); // may silently fail until unlocked
  }

  return session;
}

function _flushSession(session) {
  if (
    session.sbReady &&
    session.sb &&
    !session.sb.updating &&
    session.pendingChunks.length > 0
  ) {
    try {
      session.sb.appendBuffer(session.pendingChunks.shift());
    } catch { /* quota or state error — drop chunk */ }
  }
}

function appendToSession(session, rawChunk) {
  const data = rawChunk instanceof Uint8Array ? rawChunk : new Uint8Array(rawChunk);
  if (session.useStreaming) {
    session.pendingChunks.push(data);
    _flushSession(session);
    // If audio was paused (e.g. iOS unlock happened after play() was called), retry
    if (session.audio && session.audio.paused && session.audio.readyState >= 2) {
      session.audio.play().catch(() => {});
    }
  } else {
    session.fallbackChunks.push(data);
  }
}

function finishSession(session) {
  if (session.useStreaming) {
    // Drain remaining queued chunks, then signal end of stream
    const tryEnd = () => {
      if (session.pendingChunks.length > 0 || session.sb?.updating) {
        setTimeout(tryEnd, 60);
      } else {
        try {
          if (session.ms?.readyState === "open") session.ms.endOfStream();
        } catch {}
        if (session.audio) {
          session.audio.addEventListener("ended", () => {
            try { URL.revokeObjectURL(session.audio.src); } catch {}
          }, { once: true });
        }
      }
    };
    setTimeout(tryEnd, 60);
  } else {
    // Fallback: play entire accumulated buffer at once
    if (session.fallbackChunks.length > 0) {
      const blob = new Blob(session.fallbackChunks, { type: session.mimeType || "audio/webm" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play().catch(() => {});
      audio.onended = () => URL.revokeObjectURL(url);
    }
  }
}

// ── Sound wave bars (CSS-only) ─────────────────────────────────────────────────
function SoundWave() {
  return (
    <span className="flex items-end gap-[2px] h-4">
      {[1, 2, 3, 2, 1].map((h, i) => (
        <span
          key={i}
          className="w-[3px] bg-current rounded-full"
          style={{
            height: `${h * 25}%`,
            animation: `soundBar 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function TeamChat() {
  const [isOpen,        setIsOpen]        = useState(false);
  const [isSetup,       setIsSetup]       = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const [name,          setName]          = useState("");
  const [team,          setTeam]          = useState("");
  const [tempName,      setTempName]      = useState("");
  const [tempTeam,      setTempTeam]      = useState(TEAMS[0].name);
  const [isTalking,     setIsTalking]     = useState(false);
  const [speakers,      setSpeakers]      = useState([]);
  const [lastSpeaker,   setLastSpeaker]   = useState(null);
  const [micAllowed,    setMicAllowed]    = useState(null);
  const [hasActivity,   setHasActivity]   = useState(false);

  const mediaRecorderRef    = useRef(null);
  const streamRef           = useRef(null);
  const sessionsRef         = useRef(new Map()); // Map<name, session>
  const activeSpeakersRef   = useRef(new Set()); // set by userSpeaking, cleared by userStoppedSpeaking
  const isOpenRef           = useRef(false);
  const isTalkingRef        = useRef(false);     // kept in sync directly — NOT via useEffect

  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  // ── Register socket listeners once ─────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();

    const onUserSpeaking = ({ name: n }) => {
      activeSpeakersRef.current.add(n);
      setSpeakers((prev) => [...new Set([...prev, n])]);
      if (!isOpenRef.current) setHasActivity(true);
    };

    const onVoiceChunk = ({ name: n, chunk, mimeType }) => {
      // Drop chunks that arrive after userStoppedSpeaking (orphan chunks from
      // the previous transmission's async ondataavailable flush). Without this
      // guard they create a broken SourceBuffer session that poisons the next
      // transmission for the same speaker.
      if (!activeSpeakersRef.current.has(n)) return;

      const sessions = sessionsRef.current;
      if (!sessions.has(n)) {
        const session = createSession(mimeType || getSupportedMime());
        sessions.set(n, session);
        if (session.audio) session.audio.play().catch(() => {});
      }
      appendToSession(sessions.get(n), chunk);
    };

    const onUserStoppedSpeaking = ({ name: n }) => {
      activeSpeakersRef.current.delete(n);
      setSpeakers((prev) => prev.filter((s) => s !== n));
      setLastSpeaker(n);
      if (!isOpenRef.current) setHasActivity(true);

      const sessions = sessionsRef.current;
      const session = sessions.get(n);
      if (session) {
        finishSession(session);
        sessions.delete(n);
      }
    };

    // Re-join team on reconnect
    const onConnect = () => {
      const n = localStorage.getItem("chatName");
      const t = localStorage.getItem("chatTeam");
      if (n && t) socket.emit("joinTeam", { team: t, name: n });
      sessionsRef.current.clear();
      activeSpeakersRef.current.clear();
      setSpeakers([]);
    };

    socket.on("userSpeaking",        onUserSpeaking);
    socket.on("voiceChunk",          onVoiceChunk);
    socket.on("userStoppedSpeaking", onUserStoppedSpeaking);
    socket.on("connect",             onConnect);

    return () => {
      socket.off("userSpeaking",        onUserSpeaking);
      socket.off("voiceChunk",          onVoiceChunk);
      socket.off("userStoppedSpeaking", onUserStoppedSpeaking);
      socket.off("connect",             onConnect);
    };
  }, []);

  // ── Restore session from localStorage ──────────────────────────────────────
  useEffect(() => {
    const n = localStorage.getItem("chatName");
    const t = localStorage.getItem("chatTeam");
    if (n && t) {
      setName(n); setTeam(t); setIsSetup(true);
      const socket = getSocket();
      if (socket.connected) socket.emit("joinTeam", { team: t, name: n });
    }
  }, []);

  // ── Stop transmission when tab hides / closes ──────────────────────────────
  useEffect(() => {
    const stop = () => { if (isTalkingRef.current) stopTalking(); };
    window.addEventListener("beforeunload", stop);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
    });
    return () => window.removeEventListener("beforeunload", stop);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear activity badge when panel opens
  useEffect(() => {
    if (isOpen) setHasActivity(false);
  }, [isOpen]);

  // ── Join handler ────────────────────────────────────────────────────────────
  const handleJoin = () => {
    const n = tempName.trim();
    if (!n || !tempTeam) return;
    unlockAudio(); // unlock on user gesture
    localStorage.setItem("chatName", n);
    localStorage.setItem("chatTeam", tempTeam);
    setName(n); setTeam(tempTeam);
    setIsSetup(true); setShowSettings(false);
    getSocket().emit("joinTeam", { team: tempTeam, name: n });
  };

  // ── Push-to-talk ────────────────────────────────────────────────────────────
  const startTalking = useCallback(async () => {
    if (isTalkingRef.current || !isSetup) return;
    isTalkingRef.current = true; // set synchronously — don't wait for a useEffect
    unlockAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 16000 },
          channelCount: 1,
        },
        video: false,
      });
      streamRef.current = stream;
      setMicAllowed(true);

      const mime = getSupportedMime();
      const recorderOptions = mime ? { mimeType: mime } : {};
      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;

      // Send each chunk synchronously (no await) so userStoppedSpeaking is
      // always emitted AFTER every voiceChunk, not before.
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          e.data.arrayBuffer().then((buf) => {
            getSocket().emit("voiceChunk", {
              team,
              name,
              chunk: buf,
              mimeType: mime || recorder.mimeType,
            });
          });
        }
      };

      // Emit userStoppedSpeaking only after the recorder fully stops and has
      // fired all ondataavailable events — guarantees ordering on the receiver.
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        getSocket().emit("userStoppedSpeaking", { team, name });
      };

      recorder.start(60);
      setIsTalking(true);
      getSocket().emit("userSpeaking", { team, name });
    } catch {
      isTalkingRef.current = false; // reset on failure
      setMicAllowed(false);
    }
  }, [isSetup, team, name]);

  const stopTalking = useCallback(() => {
    if (!isTalkingRef.current) return;
    isTalkingRef.current = false; // set synchronously
    setIsTalking(false);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try { recorder.stop(); } catch {
        // onstop won't fire if stop() throws — clean up manually
        streamRef.current?.getTracks().forEach((t) => t.stop());
        getSocket().emit("userStoppedSpeaking", { team, name });
      }
    } else {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      getSocket().emit("userStoppedSpeaking", { team, name });
    }
  }, [team, name]);

  const preventCtx = (e) => e.preventDefault();

  const teamInfo     = TEAM_MAP[team]     || TEAMS[0];
  const tempTeamInfo = TEAM_MAP[tempTeam] || TEAMS[0];
  const showSetupScreen = !isSetup || showSettings;

  return (
    <>
      <style>{`
        @keyframes soundBar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
        @keyframes talkPulse {
          0%   { box-shadow: 0 0 0 0   rgba(239,68,68,0.6); }
          70%  { box-shadow: 0 0 0 16px rgba(239,68,68,0);  }
          100% { box-shadow: 0 0 0 0   rgba(239,68,68,0);  }
        }
        .talk-pulse { animation: talkPulse 1s ease-out infinite; }
      `}</style>

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 select-none">

        {/* ── Voice Panel ───────────────────────────────────────────────── */}
        {isOpen && (
          <div
            className="w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
            style={{ height: 420 }}
            // Any touch inside the panel unlocks audio on iOS
            onTouchStart={unlockAudio}
            onClick={unlockAudio}
          >
            {/* Header */}
            <div className={`px-4 py-3 flex items-center justify-between ${teamInfo.color} text-white flex-shrink-0`}>
              <div className="flex items-center gap-2 min-w-0">
                <IconUsers className="h-4 w-4 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-none truncate">
                    {isSetup ? team : "Voice Chat"}
                  </p>
                  {isSetup && <p className="text-xs opacity-75 mt-0.5 truncate">{name}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isSetup && !showSettings && (
                  <button
                    onClick={() => { setTempName(name); setTempTeam(team); setShowSettings(true); }}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="Change name / team"
                  >
                    <IconSettings className="h-3.5 w-3.5" />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <IconX className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ── Setup / Settings ──────────────────────────────────────── */}
            {showSetupScreen ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 bg-slate-50">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <IconRadio className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {showSettings ? "Update your details" : "Join Team Radio"}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {showSettings ? "Change name or switch teams" : "Enter your name and pick your team"}
                  </p>
                </div>

                <div className="w-full space-y-3">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <select
                    value={tempTeam}
                    onChange={(e) => setTempTeam(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {TEAMS.map((t) => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleJoin}
                    disabled={!tempName.trim()}
                    className={`w-full py-2.5 ${tempTeamInfo.color} ${tempTeamInfo.hover} disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all`}
                  >
                    {showSettings ? "Save changes" : "Join Radio"}
                  </button>

                  {showSettings && (
                    <button onClick={() => setShowSettings(false)}
                            className="w-full py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </div>

            ) : (
              /* ── Voice controls ───────────────────────────────────────── */
              <div className="flex-1 flex flex-col items-center justify-between p-5 bg-slate-50">

                {/* Active speakers */}
                <div className="w-full min-h-[80px]">
                  {speakers.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                        Transmitting
                      </p>
                      {speakers.map((s) => (
                        <div key={s} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-800 flex-1 truncate">{s}</span>
                          <span className="text-red-400"><SoundWave /></span>
                        </div>
                      ))}
                    </div>
                  ) : lastSpeaker ? (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                        Last transmission
                      </p>
                      <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100 opacity-60">
                        <span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
                        <span className="text-sm text-gray-600 truncate">{lastSpeaker}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full pt-2 opacity-40">
                      <IconRadio className="h-6 w-6 text-slate-400 mb-1" />
                      <p className="text-xs text-slate-400">Channel clear</p>
                    </div>
                  )}
                </div>

                {/* Push-to-talk button */}
                <div className="flex flex-col items-center gap-3">
                  <button
                    onMouseDown={startTalking}
                    onMouseUp={stopTalking}
                    onMouseLeave={stopTalking}
                    onTouchStart={(e) => { e.preventDefault(); startTalking(); }}
                    onTouchEnd={(e) => { e.preventDefault(); stopTalking(); }}
                    onTouchCancel={(e) => { e.preventDefault(); stopTalking(); }}
                    onContextMenu={preventCtx}
                    className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1.5 text-white font-semibold text-xs transition-all duration-150 cursor-pointer
                      ${isTalking
                        ? "bg-red-500 scale-110 talk-pulse"
                        : `${teamInfo.color} ${teamInfo.hover} active:scale-95`
                      }`}
                    style={{ touchAction: "none", WebkitUserSelect: "none" }}
                  >
                    <IconMic className={`h-8 w-8 ${isTalking ? "animate-pulse" : ""}`} />
                    <span className="leading-none">{isTalking ? "LIVE" : "TALK"}</span>
                  </button>

                  <p className="text-[11px] text-slate-400">
                    {isTalking ? "Release to send" : "Hold to transmit"}
                  </p>
                </div>

                {/* Mic denied warning */}
                {micAllowed === false && (
                  <div className="w-full flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    <IconAlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 leading-snug">
                      Microphone access denied. Allow it in browser settings and try again.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Floating Bubble ───────────────────────────────────────────── */}
        <button
          onClick={() => setIsOpen((v) => !v)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 text-white relative
            ${isTalking ? "bg-red-500 talk-pulse" : teamInfo.color}`}
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.18)", touchAction: "none" }}
          title="Team Radio"
        >
          {isOpen
            ? <IconX className="h-6 w-6" />
            : <IconRadio className="h-6 w-6" />
          }

          {/* Activity dot */}
          {!isOpen && (hasActivity || speakers.length > 0) && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      </div>
    </>
  );
}
