import { useEffect, useMemo, useRef, useState } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { IconVolume, IconPlayerStop, IconVolumeOff } from "@tabler/icons-react";

type Props = {
  word: string;
  audioUrl?: string; // MW mp3 URL for the specific POS (preferred)
  lang?: string; // fallback TTS lang, default en-US
};

export default function SpeakButton({ word, audioUrl, lang = "en-US" }: Props) {
  const ttsSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [playing, setPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load TTS voices (if available)
  useEffect(() => {
    if (!ttsSupported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () =>
      window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, [ttsSupported]);

  // Pick a reasonable voice for TTS fallback
  const voice = useMemo(() => {
    if (!voices.length) return undefined;
    return (
      voices.find(
        (v) => v.lang === lang && /Google|Siri|Microsoft/i.test(v.name)
      ) ||
      voices.find((v) => v.lang.startsWith(lang.split("-")[0])) ||
      voices[0]
    );
  }, [voices, lang]);

  // Stop everything
  function stopAll() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (ttsSupported) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    setPlaying(false);
  }

  // If the word/URL changes while playing, stop
  useEffect(() => {
    if (playing) stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, audioUrl]);

  async function play() {
    stopAll();

    // 1) Prefer MW hosted audio (correct stress per POS)
    if (audioUrl) {
      const a = new Audio(audioUrl);
      audioRef.current = a;
      a.onended = () => setPlaying(false);
      a.onerror = () => {
        setPlaying(false);
        // Fallback to TTS if available
        if (ttsSupported) speakTTS();
      };
      setPlaying(true);
      try {
        await a.play();
      } catch {
        setPlaying(false);
        if (ttsSupported) speakTTS();
      }
      return;
    }

    // 2) Fallback to TTS
    if (ttsSupported) speakTTS();
  }

  function speakTTS() {
    if (!ttsSupported || !word) return;
    const u = new SpeechSynthesisUtterance(word);
    utteranceRef.current = u;
    u.lang = lang;
    if (voice) u.voice = voice;
    u.rate = 0.95; // slightly slower for kids
    u.onstart = () => setPlaying(true);
    u.onend = u.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(u);
  }

  const canPlay = Boolean(audioUrl) || ttsSupported;
  const tooltip = playing
    ? "Stop"
    : audioUrl
    ? "Play pronunciation"
    : ttsSupported
    ? "Play (TTS)"
    : "Not supported";

  return (
    <Tooltip label={tooltip}>
      <ActionIcon
        variant="subtle"
        onClick={playing ? stopAll : play}
        aria-label={tooltip}
        aria-disabled={!canPlay}
        disabled={!canPlay}
      >
        {canPlay ? (
          playing ? (
            <IconPlayerStop size={18} />
          ) : (
            <IconVolume size={18} />
          )
        ) : (
          <IconVolumeOff size={18} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}
