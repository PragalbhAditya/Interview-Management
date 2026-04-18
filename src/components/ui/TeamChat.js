"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconMic = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);
const IconMicOff = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <line x1="2" x2="22" y1="2" y2="22"/>
    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/>
    <path d="M5 10v2a7 7 0 0 0 12 5"/>
    <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
);
const IconPhoneOff = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07"/>
    <path d="M14.69 9.31a16 16 0 0 0-2.6-3.41L10.82 7.17a2 2 0 0 1-2.11.45A12.84 12.84 0 0 0 5.9 6.92a2 2 0 0 1-1.72-2V2a2 2 0 0 1 2.18-2 19.79 19.79 0 0 1 8.63 3.07"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
  </svg>
);
const IconPhone = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
       className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
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
  { name: "Organizers",   color: "bg-blue-500",    hex: "#3b82f6", hover: "hover:bg-blue-600"    },
  { name: "Registration", color: "bg-emerald-500", hex: "#10b981", hover: "hover:bg-emerald-600" },
  { name: "Coordinators", color: "bg-violet-500",  hex: "#8b5cf6", hover: "hover:bg-violet-600"  },
  { name: "Tech Support", color: "bg-orange-500",  hex: "#f97316", hover: "hover:bg-orange-600"  },
  { name: "Interviewers", color: "bg-rose-500",    hex: "#f43f5e", hover: "hover:bg-rose-600"    },
];
const TEAM_MAP = Object.fromEntries(TEAMS.map((t) => [t.name, t]));

// ── Socket singleton ───────────────────────────────────────────────────────────
let chatSocket = null;
function getSocket() {
  if (!chatSocket) chatSocket = io();
  return chatSocket;
}

// ── Supported MIME type ────────────────────────────────────────────────────────
let detectedMime = null;
function getSupportedMime() {
  if (detectedMime !== null) return detectedMime;
  if (typeof MediaRecorder === "undefined") return (detectedMime = "");
  detectedMime =
    ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"]
      .find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
  return detectedMime;
}

// ── Shared AudioContext ────────────────────────────────────────────────────────
let sharedAudioCtx = null;
let silentOscillator = null;

function getAudioContext() {
  if (sharedAudioCtx) return sharedAudioCtx;
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  sharedAudioCtx = new Ctx();
  return sharedAudioCtx;
}

function ensureAudioContextRunning() {
  const ctx = getAudioContext();
  if (!ctx) return ctx;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  if (!silentOscillator) {
    try {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(ctx.destination);
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.start();
      silentOscillator = osc;
    } catch {}
  }
  return ctx;
}

// ── Background keep-alive ──────────────────────────────────────────────────────
let silentAudio = null;
let wakeLock = null;

function startKeepAlive(teamName, userName) {
  if (typeof window === "undefined") return;
  ensureAudioContextRunning();
  if (!silentAudio) {
    silentAudio = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
    );
    silentAudio.loop = true;
    silentAudio.volume = 0.001;
  }
  silentAudio.play().catch(() => {});
  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Team Voice — " + (teamName || ""),
        artist: userName || "",
      });
    } catch {}
    navigator.mediaSession.playbackState = "playing";
  }
}

function stopKeepAlive() {
  silentAudio?.pause();
  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none";
}

async function acquireWakeLock() {
  if (!("wakeLock" in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => { wakeLock = null; });
  } catch {}
}

function releaseWakeLock() {
  wakeLock?.release().catch(() => {});
  wakeLock = null;
}

// ── Audio unlock (iOS requires gesture before play()) ─────────────────────────
let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked || typeof window === "undefined") return;
  audioUnlocked = true;
  ensureAudioContextRunning();
  const tap = new Audio(
    "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
  );
  tap.volume = 0;
  tap.play().then(() => tap.pause()).catch(() => {});
}

// ── Voice Activity Detection ───────────────────────────────────────────────────
// Uses an AnalyserNode on the mic stream to detect when the user is speaking.
// onStart fires when energy crosses the threshold; onStop fires after SILENCE_MS
// of quiet. Each callback is called at most once per state transition.
function createVAD(stream, onStart, onStop, threshold = 18, silenceMs = 700) {
  const ctx = ensureAudioContextRunning();
  if (!ctx) return null;

  let source, analyser;
  try {
    source = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);
  } catch { return null; }

  const buf = new Uint8Array(analyser.frequencyBinCount);
  let speaking = false;
  let silenceTimer = null;
  let rafId = null;
  let destroyed = false;

  function tick() {
    if (destroyed) return;
    analyser.getByteFrequencyData(buf);
    // Only look at lower half of spectrum (voice frequencies)
    const half = Math.floor(buf.length / 2);
    let sum = 0;
    for (let i = 0; i < half; i++) sum += buf[i];
    const avg = sum / half;

    if (avg > threshold) {
      if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
      if (!speaking) { speaking = true; onStart(); }
    } else if (speaking && !silenceTimer) {
      silenceTimer = setTimeout(() => {
        silenceTimer = null;
        if (speaking) { speaking = false; onStop(); }
      }, silenceMs);
    }
    rafId = requestAnimationFrame(tick);
  }
  tick();

  return {
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(silenceTimer);
      if (speaking) { speaking = false; onStop(); }
      try { source.disconnect(); } catch {}
    },
  };
}

// ── Playback session (per remote speaker, per speech segment) ─────────────────
function createSession(mimeType) {
  const session = {
    mimeType, pendingChunks: [], sbReady: false,
    ms: null, sb: null, audio: null,
    useStreaming: false, fallbackChunks: [],
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

    session.ms.addEventListener("sourceopen", () => {
      try {
        session.sb = session.ms.addSourceBuffer(mimeType);
        session.sbReady = true;
        session.sb.addEventListener("updateend", () => _flush(session));
        _flush(session);
      } catch {
        session.useStreaming = false;
        session.sbReady = false;
      }
    }, { once: true });

    session.audio.play().catch(() => {});
  }
  return session;
}

function _flush(session) {
  if (session.sbReady && session.sb && !session.sb.updating && session.pendingChunks.length > 0) {
    try { session.sb.appendBuffer(session.pendingChunks.shift()); } catch {}
  }
}

function appendToSession(session, rawChunk) {
  const data = rawChunk instanceof Uint8Array ? rawChunk : new Uint8Array(rawChunk);
  if (session.useStreaming) {
    session.pendingChunks.push(data);
    _flush(session);
    if (session.audio?.paused && session.audio.readyState >= 2)
      session.audio.play().catch(() => {});
  } else {
    session.fallbackChunks.push(data);
  }
}

function finishSession(session) {
  if (session.useStreaming) {
    const tryEnd = () => {
      if (session.pendingChunks.length > 0 || session.sb?.updating) return setTimeout(tryEnd, 60);
      try { if (session.ms?.readyState === "open") session.ms.endOfStream(); } catch {}
      session.audio?.addEventListener("ended", () => {
        try { URL.revokeObjectURL(session.audio.src); } catch {}
      }, { once: true });
    };
    setTimeout(tryEnd, 60);
  } else if (session.fallbackChunks.length > 0) {
    const blob = new Blob(session.fallbackChunks, { type: session.mimeType || "audio/webm" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play().catch(() => {});
    audio.onended = () => URL.revokeObjectURL(url);
  }
}

// ── Sound wave animation ───────────────────────────────────────────────────────
function SoundWave({ color = "bg-green-400" }) {
  return (
    <span className="flex items-end gap-[2px] h-3.5">
      {[0.4, 0.7, 1, 0.7, 0.4].map((h, i) => (
        <span key={i} className={`w-[2.5px] ${color} rounded-full`}
          style={{ height: `${h * 100}%`, animation: `vadBar 0.6s ease-in-out ${i * 0.1}s infinite alternate` }} />
      ))}
    </span>
  );
}

// ── Avatar initial circle ──────────────────────────────────────────────────────
function Avatar({ name, color = "bg-slate-400", speaking = false, muted = false, size = "md" }) {
  const initial = name?.[0]?.toUpperCase() ?? "?";
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} ${color} rounded-full flex items-center justify-center font-bold text-white
        transition-all duration-150 ${speaking ? "ring-2 ring-green-400 ring-offset-1 scale-105" : ""}`}>
        {initial}
      </div>
      {muted && (
        <span className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-0.5">
          <IconMicOff className="h-2.5 w-2.5 text-white" />
        </span>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function TeamChat() {
  const [isOpen,       setIsOpen]       = useState(false);
  const [isSetup,      setIsSetup]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [name,         setName]         = useState("");
  const [team,         setTeam]         = useState("");
  const [tempName,     setTempName]     = useState("");
  const [tempTeam,     setTempTeam]     = useState(TEAMS[0].name);

  const [inChannel,   setInChannel]   = useState(false);
  const [isSpeaking,  setIsSpeaking]  = useState(false); // tap-to-talk active
  const [speakers,    setSpeakers]    = useState([]);     // remote speakers
  const [lastSpeaker, setLastSpeaker] = useState(null);
  const [micAllowed,  setMicAllowed]  = useState(null);
  const [hasActivity, setHasActivity] = useState(false);

  // Refs for values accessed in stable callbacks
  const nameRef      = useRef("");
  const teamRef      = useRef("");
  const inChannelRef = useRef(false);
  const isOpenRef    = useRef(false);

  const streamRef    = useRef(null);
  const recorderRef  = useRef(null);
  const sessionsRef  = useRef(new Map());
  const activeSpeakersRef = useRef(new Set());

  useEffect(() => { nameRef.current      = name;      }, [name]);
  useEffect(() => { teamRef.current      = team;      }, [team]);
  useEffect(() => { inChannelRef.current = inChannel; }, [inChannel]);
  useEffect(() => { isOpenRef.current    = isOpen;    }, [isOpen]);

  // ── Socket listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();

    const onUserSpeaking = ({ name: n }) => {
      activeSpeakersRef.current.add(n);
      setSpeakers((p) => [...new Set([...p, n])]);
      if (!isOpenRef.current) setHasActivity(true);
    };

    const onVoiceChunk = ({ name: n, chunk, mimeType }) => {
      if (!activeSpeakersRef.current.has(n)) return;
      if (!sessionsRef.current.has(n)) {
        const s = createSession(mimeType || getSupportedMime());
        sessionsRef.current.set(n, s);
        s.audio?.play().catch(() => {});
      }
      appendToSession(sessionsRef.current.get(n), chunk);
    };

    const onUserStoppedSpeaking = ({ name: n }) => {
      activeSpeakersRef.current.delete(n);
      setSpeakers((p) => p.filter((s) => s !== n));
      setLastSpeaker(n);
      if (!isOpenRef.current) setHasActivity(true);
      const s = sessionsRef.current.get(n);
      if (s) { finishSession(s); sessionsRef.current.delete(n); }
    };

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

  // ── Restore identity from localStorage ─────────────────────────────────────
  useEffect(() => {
    const n = localStorage.getItem("chatName");
    const t = localStorage.getItem("chatTeam");
    if (n && t) {
      setName(n); setTeam(t); setIsSetup(true);
      nameRef.current = n; teamRef.current = t;
      const socket = getSocket();
      if (socket.connected) socket.emit("joinTeam", { team: t, name: n });
    }
  }, []);

  // ── Page lifecycle ──────────────────────────────────────────────────────────
  useEffect(() => {
    const leaveOnUnload = () => { if (inChannelRef.current) doLeave(); };
    window.addEventListener("beforeunload", leaveOnUnload);

    const onVisibility = () => {
      if (!document.hidden) {
        silentAudio?.play().catch(() => {});
        ensureAudioContextRunning();
        if (inChannelRef.current) acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("beforeunload", leaveOnUnload);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (isOpen) setHasActivity(false); }, [isOpen]);

  // ── Start transmitting ─────────────────────────────────────────────────────
  // Creates a fresh MediaRecorder each time so every transmission gets its own
  // WebM header and is independently decodable on the receiver.
  const startBurst = useCallback(() => {
    if (!streamRef.current) return;
    if (recorderRef.current?.state !== "inactive" && recorderRef.current) return;

    const mime = getSupportedMime();
    let recorder;
    try {
      recorder = new MediaRecorder(streamRef.current, mime ? { mimeType: mime } : {});
    } catch { return; }
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        e.data.arrayBuffer().then((buf) => {
          getSocket().emit("voiceChunk", {
            team: teamRef.current,
            name: nameRef.current,
            chunk: buf,
            mimeType: mime || recorder.mimeType,
          });
        });
      }
    };

    recorder.onstop = () => {
      getSocket().emit("userStoppedSpeaking", { team: teamRef.current, name: nameRef.current });
    };

    recorder.start(60);
    setIsSpeaking(true);
    getSocket().emit("userSpeaking", { team: teamRef.current, name: nameRef.current });
  }, []);

  // ── End one speech burst (called by VAD onStop) ────────────────────────────
  const stopBurst = useCallback(() => {
    setIsSpeaking(false);
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    try {
      recorder.stop();
    } catch {
      getSocket().emit("userStoppedSpeaking", { team: teamRef.current, name: nameRef.current });
    }
    recorderRef.current = null;
  }, []);

  // ── Join voice channel ──────────────────────────────────────────────────────
  const doJoin = useCallback(async () => {
    if (inChannelRef.current) return;
    unlockAudio();
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
        video: false,
      });
    } catch {
      setMicAllowed(false);
      return;
    }
    streamRef.current = stream;
    setMicAllowed(true);
    setInChannel(true);
    inChannelRef.current = true;
    startKeepAlive(teamRef.current, nameRef.current);
  }, []);

  // ── Leave voice channel ─────────────────────────────────────────────────────
  const doLeave = useCallback(() => {
    stopBurst();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setInChannel(false);
    inChannelRef.current = false;
    setIsSpeaking(false);
    releaseWakeLock();
    stopKeepAlive();
  }, [stopBurst]);

  // ── Tap-to-talk toggle ──────────────────────────────────────────────────────
  const toggleTalk = useCallback(() => {
    if (isSpeaking) {
      stopBurst();
    } else {
      startBurst();
    }
  }, [isSpeaking, startBurst, stopBurst]);

  // ── Identity setup ──────────────────────────────────────────────────────────
  const handleJoin = () => {
    const n = tempName.trim();
    if (!n || !tempTeam) return;
    unlockAudio();
    localStorage.setItem("chatName", n);
    localStorage.setItem("chatTeam", tempTeam);
    nameRef.current = n; teamRef.current = tempTeam;
    setName(n); setTeam(tempTeam);
    setIsSetup(true); setShowSettings(false);
    getSocket().emit("joinTeam", { team: tempTeam, name: n });
  };

  const teamInfo     = TEAM_MAP[team]     || TEAMS[0];
  const tempTeamInfo = TEAM_MAP[tempTeam] || TEAMS[0];
  const showSetup    = !isSetup || showSettings;

  return (
    <>
      <style>{`
        @keyframes vadBar {
          from { transform: scaleY(0.25); }
          to   { transform: scaleY(1);    }
        }
        @keyframes speakPulse {
          0%   { box-shadow: 0 0 0 0   rgba(74,222,128,0.7); }
          70%  { box-shadow: 0 0 0 10px rgba(74,222,128,0);  }
          100% { box-shadow: 0 0 0 0   rgba(74,222,128,0);  }
        }
        .speak-pulse { animation: speakPulse 1s ease-out infinite; }
        @keyframes fabPulse {
          0%   { box-shadow: 0 0 0 0   rgba(74,222,128,0.6); }
          70%  { box-shadow: 0 0 0 14px rgba(74,222,128,0);  }
          100% { box-shadow: 0 0 0 0   rgba(74,222,128,0);  }
        }
        .fab-speak { animation: fabPulse 1s ease-out infinite; }
      `}</style>

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 select-none">

        {/* ── Panel ─────────────────────────────────────────────────────── */}
        {isOpen && (
          <div
            className="w-72 bg-[#1e1f22] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 480 }}
            onTouchStart={unlockAudio}
            onClick={unlockAudio}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between bg-[#2b2d31] border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <IconUsers className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-none text-white truncate">
                    {isSetup ? team : "Voice Chat"}
                  </p>
                  {inChannel && (
                    <p className="text-[11px] text-green-400 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                      Connected
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isSetup && !showSettings && (
                  <button
                    onClick={() => { setTempName(name); setTempTeam(team); setShowSettings(true); }}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                  >
                    <IconSettings className="h-3.5 w-3.5" />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                  <IconX className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ── Setup screen ───────────────────────────────────────────── */}
            {showSetup ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 bg-[#1e1f22]">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                    <IconRadio className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-white text-sm">
                    {showSettings ? "Update your details" : "Join Voice Chat"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {showSettings ? "Change name or switch teams" : "Enter your name and pick a team"}
                  </p>
                </div>
                <div className="w-full space-y-3">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    className="w-full px-3 py-2.5 bg-[#2b2d31] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <select
                    value={tempTeam}
                    onChange={(e) => setTempTeam(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#2b2d31] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    {showSettings ? "Save changes" : "Set identity"}
                  </button>
                  {showSettings && (
                    <button onClick={() => setShowSettings(false)}
                            className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </div>

            ) : (
              /* ── Voice channel view ──────────────────────────────────── */
              <div className="flex-1 flex flex-col overflow-hidden">

                {/* Speaker list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
                  {/* You */}
                  {inChannel && (
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                      ${isSpeaking ? "bg-white/5" : "hover:bg-white/5"}`}>
                      <Avatar name={name} color={teamInfo.color} speaking={isSpeaking} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{name}
                          <span className="text-xs text-slate-500 font-normal ml-1">(you)</span>
                        </p>
                        <p className="text-xs text-slate-500 truncate">{team}</p>
                      </div>
                      {isSpeaking && (
                        <span className="text-green-400"><SoundWave color="bg-green-400" /></span>
                      )}
                    </div>
                  )}

                  {/* Remote speakers */}
                  {speakers.map((s) => (
                    <div key={s}
                         className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5">
                      <Avatar name={s} color="bg-slate-500" speaking />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s}</p>
                        <p className="text-xs text-green-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                          speaking
                        </p>
                      </div>
                      <span className="text-green-400"><SoundWave color="bg-green-400" /></span>
                    </div>
                  ))}

                  {/* Last speaker (faded) */}
                  {!inChannel && speakers.length === 0 && lastSpeaker && (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-40">
                      <Avatar name={lastSpeaker} color="bg-slate-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-400 truncate">{lastSpeaker}</p>
                        <p className="text-xs text-slate-500">last spoke</p>
                      </div>
                    </div>
                  )}

                  {!inChannel && speakers.length === 0 && !lastSpeaker && (
                    <div className="flex flex-col items-center justify-center py-8 opacity-40">
                      <IconRadio className="h-7 w-7 text-slate-500 mb-2" />
                      <p className="text-xs text-slate-500">Channel is quiet</p>
                    </div>
                  )}
                </div>

                {/* Mic denied */}
                {micAllowed === false && (
                  <div className="mx-3 mb-2 flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                    <IconAlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400 leading-snug">
                      Microphone access denied. Allow it in browser settings.
                    </p>
                  </div>
                )}

                {/* Controls bar */}
                <div className="px-3 pb-3 pt-2 border-t border-white/5 bg-[#2b2d31] flex-shrink-0">
                  {inChannel ? (
                    <div className="flex flex-col gap-2">
                      {/* Tap-to-talk button */}
                      <button
                        onClick={toggleTalk}
                        className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 active:scale-95
                          ${isSpeaking
                            ? "bg-green-500 text-white speak-pulse"
                            : "bg-white/10 text-slate-300 hover:bg-white/15"
                          }`}
                      >
                        {isSpeaking
                          ? <><IconMic className="h-4 w-4 animate-pulse" /> Tap to stop</>
                          : <><IconMic className="h-4 w-4" /> Tap to talk</>
                        }
                      </button>

                      {/* Leave */}
                      <button
                        onClick={doLeave}
                        className="w-full py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-1.5"
                      >
                        <IconPhoneOff className="h-3.5 w-3.5" />
                        Leave channel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={doJoin}
                      className={`w-full py-2.5 flex items-center justify-center gap-2 ${teamInfo.color} ${teamInfo.hover} text-white rounded-xl text-sm font-medium transition-all`}
                    >
                      <IconPhone className="h-4 w-4" />
                      Join Voice
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Floating button ───────────────────────────────────────────── */}
        <button
          onClick={() => { unlockAudio(); setIsOpen((v) => !v); }}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200
            hover:scale-110 active:scale-95 text-white relative
            ${inChannel
              ? isSpeaking ? "bg-green-500 fab-speak" : "bg-green-600"
              : teamInfo.color}`}
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
          title="Team Voice"
        >
          {isOpen
            ? <IconX className="h-6 w-6" />
            : inChannel
              ? <IconMic className="h-6 w-6" />
              : <IconRadio className="h-6 w-6" />
          }

          {/* Activity dot */}
          {!isOpen && (hasActivity || speakers.length > 0) && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      </div>
    </>
  );
}
