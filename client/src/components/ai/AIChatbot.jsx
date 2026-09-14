import {
  Bot,
  Check,
  Clipboard,
  Copy,
  Languages,
  Maximize2,
  Minimize2,
  Mic,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import aiService from "../../services/aiService";
import "./AIChatbot.css";

const ROLE_QUESTIONS = {
  CITIZEN: [
    "Societal Innovation AI kya hai?",
    "Problem kaise submit karu?",
    "Meri problem ko better kaise describe karu?",
    "AI meri problem mein kaise help karega?",
  ],

  UNIVERSITY: [
    "Assigned challenge kaise analyze karu?",
    "Is challenge ke liye research idea kya ho sakta hai?",
    "University ka role kya hai?",
  ],

  FACULTY: [
    "Assigned challenge ko research project mein kaise badlein?",
    "Research methodology kaise choose karein?",
    "Team ke liye relevant expertise kya hogi?",
  ],

  STUDENT: [
    "Assigned challenge ko simple words mein samjhao",
    "Is challenge ke liye prototype idea kya ho sakta hai?",
    "Research team mein main kya contribute kar sakta hoon?",
  ],

  INDUSTRY: [
    "Is challenge ke liye technology solution kya ho sakta hai?",
    "Is solution ko scalable kaise banaye?",
    "Industry ka role kya hai?",
  ],

  MENTOR: [
    "Is challenge ki feasibility kaise evaluate karein?",
    "Industry collaboration ka practical approach kya hoga?",
    "Solution roadmap kaise banayein?",
  ],

  GOVERNMENT: [
    "Under Review challenges kaise identify karein?",
    "Priority challenges kaise identify karein?",
    "University aur industry ko challenge ke saath kaise connect karein?",
  ],

  ADMIN: [
    "Platform ka current challenge summary do",
    "Kaun se challenges attention maangte hain?",
    "Platform analytics ko kaise samjhein?",
  ],
};

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const cleanMessage = (value) => String(value || "").trim();

const getChallengeId = (pathname) => {
  const match = String(pathname || "").match(/\/problems\/([^/]+)/);

  return match?.[1] || "";
};

const getPageName = (pathname) => {
  const value = String(pathname || "/")
    .replace(/^\//, "")
    .replaceAll("/", " / ");

  return value || "home";
};

const formatRole = (role) => {
  const map = {
    CITIZEN: "Citizen",
    UNIVERSITY: "University",
    FACULTY: "Faculty",
    STUDENT: "Student",
    INDUSTRY: "Industry / Startup",
    MENTOR: "Mentor",
    GOVERNMENT: "Government",
    ADMIN: "Administrator",
  };

  return map[String(role || "").toUpperCase()] || "User";
};


const cleanSpeechText = (value) => {
  return (
    String(value || "")
      // Markdown bold
      .replace(/\*\*(.*?)\*\*/gs, "$1")

      // Markdown italic
      .replace(/__(.*?)__/gs, "$1")

      // Inline code
      .replace(/`([^`]+)`/g, "$1")

      // Markdown headings
      .replace(/^#{1,6}\s+/gm, "")

      // Markdown links - text rakhenge
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")

      // Common decorative/list symbols
      .replace(/^\s*[-*•◦▪▫●○◆◇■□►▸▹➜➤➔→⇒⟶⟹✓✔☑✕✖✗❌]+\s*/gm, "")

      // Emoji / pictographic characters
      .replace(/\p{Extended_Pictographic}/gu, "")

      // Unicode symbol characters
      .replace(/\p{S}/gu, "")

      // Emoji variation selectors
      .replace(/[\uFE0E\uFE0F]/g, "")

      // Zero width characters
      .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")

      // Dingbat / miscellaneous symbols
      .replace(/[\u2600-\u27BF]/g, "")

      // Repeated decorative punctuation
      .replace(/[~^]{2,}/g, " ")

      // Vertical separators
      .replace(/\s*[|¦]+\s*/g, " ")

      // Repeated dashes
      .replace(/[-–—]{2,}/g, " ")

      // Extra spaces
      .replace(/[ \t]+/g, " ")

      // Extra blank lines
      .replace(/\n{2,}/g, "\n")

      .trim()
  );
};

/* =========================================================
   FIND FEMALE VOICE
   ========================================================= */

const getBestFemaleVoice = (voices, isHindi) => {
  const languagePrefix = isHindi ? "hi" : "en";

  const languageVoices = voices.filter((voice) =>
    voice.lang?.toLowerCase().startsWith(languagePrefix),
  );

  if (!languageVoices.length) {
    return null;
  }

  /*
   * Common female voice names.
   *
   * Browser/OS ke according names
   * different ho sakte hain.
   */

  const femaleVoicePattern =
    /female|woman|girl|zira|samantha|susan|hazel|aria|jenny|sonia|sara|ava|emma|olivia|google.*female|microsoft.*female/i;

  /*
   * Indian voice preference.
   */

  const indianVoicePattern = /india|indian|en-in|hi-in/i;

  /*
   * 1. Female Indian voice
   */

  let voice = languageVoices.find(
    (item) =>
      femaleVoicePattern.test(item.name || "") &&
      indianVoicePattern.test(`${item.name} ${item.lang}`),
  );

  /*
   * 2. Any female voice
   */

  if (!voice) {
    voice = languageVoices.find((item) =>
      femaleVoicePattern.test(item.name || ""),
    );
  }

  /*
   * 3. Indian language voice
   */

  if (!voice) {
    voice = languageVoices.find((item) =>
      indianVoicePattern.test(`${item.name} ${item.lang}`),
    );
  }

  /*
   * 4. First available voice
   */

  if (!voice) {
    voice = languageVoices[0];
  }

  return voice;
};

function renderInlineMarkdown(text) {
  const parts = String(text || "").split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (/^`[^`]+`$/.test(part)) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }

    return <span key={index}>{part}</span>;
  });
}

function MessageContent({ content }) {
  const lines = String(content || "").split("\n");

  return (
    <div className="ai-message-content">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div className="ai-spacer" key={index} aria-hidden="true" />;
        }

        if (/^###\s+/.test(trimmed)) {
          return (
            <h4 key={index}>
              {renderInlineMarkdown(trimmed.replace(/^###\s+/, ""))}
            </h4>
          );
        }

        if (/^[-*]\s+/.test(trimmed)) {
          return (
            <div className="ai-list-item" key={index}>
              <span aria-hidden="true">•</span>{" "}
              <span>
                {renderInlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}
              </span>
            </div>
          );
        }

        if (/^\d+[.)]\s+/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)[.)]\s+(.*)$/);

          return (
            <div className="ai-list-item" key={index}>
              <b>{match[1]}.</b>

              <span>{renderInlineMarkdown(match[2])}</span>
            </div>
          );
        }

        return <p key={index}>{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

export default function AIChatbot() {
  const { user, role } = useAuth();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  const [fullscreen, setFullscreen] = useState(false);

  const [input, setInput] = useState("");

  const [messages, setMessages] = useState(() => [
    {
      id: makeId(),
      role: "assistant",
      content: `Hi${
        user?.name ? ` ${user.name.split(" ")[0]}` : ""
      }! 👋 Main Societal Innovation AI Assistant hoon. Main aapko platform use karne, societal challenges samajhne aur problems ko better format mein prepare karne mein help kar sakta hoon. Aap kya jaana chahenge?`,
    },
  ]);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");

  const [copiedId, setCopiedId] = useState("");

  const [speakingId, setSpeakingId] = useState("");

  const speakingIdRef = useRef("");
  const voicesRef = useRef([]);

  const lastAutoSpokenRef = useRef("");
  const speechRunRef = useRef(0);

  const [translationOpen, setTranslationOpen] = useState("");

  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const [voiceLanguage, setVoiceLanguage] = useState("auto");

  const [listening, setListening] = useState(false);

  const recognitionRef = useRef(null);

  const messagesEndRef = useRef(null);

  const requestLock = useRef(false);

  const roleQuestions = useMemo(
    () =>
      ROLE_QUESTIONS[String(role || "").toUpperCase()] ||
      ROLE_QUESTIONS.CITIZEN,
    [role],
  );

  const challengeId = getChallengeId(location.pathname);

  const pageName = getPageName(location.pathname);

  const suggestedQuestions = useMemo(() => {
    if (challengeId) {
      return [
        "Is challenge ko simple words mein samjhao",
        "Is problem ke possible causes kya ho sakte hain?",
        "Kaunsi technology ya expertise useful ho sakti hai?",
        "Practical next step kya hona chahiye?",
      ];
    }

    return roleQuestions;
  }, [challengeId, roleQuestions]);

  /* =========================================================
     LOAD BROWSER VOICES
     ========================================================= */

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      return undefined;
    }

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices() || [];
    };

    loadVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", loadVoices);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, busy, fullscreen]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape" && fullscreen) {
        setFullscreen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, fullscreen]);

  useEffect(
    () => () => {
      recognitionRef.current?.stop?.();
      speechRunRef.current += 1;
      window.speechSynthesis?.cancel?.();
    },
    [],
  );

  const sendMessage = useCallback(
    async (text = input) => {
      const message = cleanMessage(text);

      if (!message || busy || requestLock.current) {
        return;
      }

      requestLock.current = true;

      setBusy(true);
      setError("");
      setInput("");

      const history = messages.slice(-12).map((item) => ({
        role: item.role,
        content: item.content,
      }));

      const userMessage = {
        id: makeId(),
        role: "user",
        content: message,
      };

      setMessages((current) => [...current, userMessage]);

      try {
        const result = await aiService.chat({
          message,
          history,
          context: {
            currentPage: pageName,
            challengeId,
          },
        });

        const response = cleanMessage(result?.message);

        if (!response) {
          throw new Error("Empty AI response");
        }

        setMessages((current) => [
          ...current,
          {
            id: makeId(),
            role: "assistant",
            content: response,
          },
        ]);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Sorry, abhi AI response generate nahi ho pa raha. Please try again.",
        );
      } finally {
        requestLock.current = false;

        setBusy(false);
      }
    },
    [busy, challengeId, input, messages, pageName],
  );

  const retryLast = () => {
    const lastUser = [...messages]
      .reverse()
      .find((item) => item.role === "user");

    if (lastUser) {
      sendMessage(lastUser.content);
    }
  };

  const clearChat = () => {
    window.speechSynthesis?.cancel?.();

    speakingIdRef.current = "";

    setSpeakingId("");

    setTranslationOpen("");

    setError("");

    setMessages([
      {
        id: makeId(),
        role: "assistant",
        content: `Chat clear kar diya. 👋 Main ${formatRole(
          role,
        )} ke context ke saath ready hoon. Aap kya explore karna chahenge?`,
      },
    ]);
  };

  const copyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message.content);

      setCopiedId(message.id);

      window.setTimeout(() => setCopiedId(""), 1400);
    } catch {
      setError("Copy failed. Please select and copy the text manually.");
    }
  };

  /* =========================================================
     TEXT TO SPEECH
     ========================================================= */

  const speak = useCallback(
    (message) => {
      if (
        !("speechSynthesis" in window) ||
        typeof window.speechSynthesis.speak !== "function" ||
        typeof SpeechSynthesisUtterance === "undefined"
      ) {
        setError("Text-to-speech is not supported by this browser.");
        return;
      }

      if (speakingIdRef.current === message.id) {
        speechRunRef.current += 1;
        window.speechSynthesis.cancel();
        speakingIdRef.current = "";
        setSpeakingId("");
        return;
      }

      // Invalidate any previous speech run before starting this one.
      const runId = speechRunRef.current + 1;
      speechRunRef.current = runId;
      window.speechSynthesis.cancel();

      const speechText = cleanSpeechText(message.content);
      if (!speechText) {
        setError("There is no readable text in this message.");
        return;
      }

      const isHindi =
        voiceLanguage === "hi" ||
        (voiceLanguage === "auto" && /[\u0900-\u097F]/.test(message.content));

      // Chrome can silently fail on very long utterances. Break the response
      // into small, sentence-aware chunks and speak them sequentially.
      const chunks = [];
      let remaining = speechText;
      const maxLength = 220;

      while (remaining.length > maxLength) {
        const windowText = remaining.slice(0, maxLength);
        const boundary = Math.max(
          windowText.lastIndexOf(". "),
          windowText.lastIndexOf("। "),
          windowText.lastIndexOf("? "),
          windowText.lastIndexOf("! "),
          windowText.lastIndexOf(", "),
          windowText.lastIndexOf(" "),
        );
        const cut = boundary > 60 ? boundary + 1 : maxLength;
        chunks.push(remaining.slice(0, cut).trim());
        remaining = remaining.slice(cut).trim();
      }
      if (remaining) chunks.push(remaining);

      const speakChunks = () => {
        if (speechRunRef.current !== runId || !chunks.length) return;

        const voices =
          voicesRef.current.length
            ? voicesRef.current
            : window.speechSynthesis.getVoices() || [];
        voicesRef.current = voices;

        const selectedVoice = getBestFemaleVoice(voices, isHindi);
        let chunkIndex = 0;

        const finish = () => {
          if (speechRunRef.current !== runId) return;
          speakingIdRef.current = "";
          setSpeakingId("");
        };

        const speakNext = () => {
          if (speechRunRef.current !== runId) return;

          if (chunkIndex >= chunks.length) {
            finish();
            return;
          }

          const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang || (isHindi ? "hi-IN" : "en-IN");
          } else {
            utterance.lang = isHindi ? "hi-IN" : "en-IN";
          }

          utterance.rate = isHindi ? 0.95 : 0.9;
          utterance.pitch = 1.05;
          utterance.volume = 1;

          utterance.onstart = () => {
            if (speechRunRef.current === runId) {
              speakingIdRef.current = message.id;
              setSpeakingId(message.id);
            }
          };

          utterance.onend = () => {
            if (speechRunRef.current !== runId) return;
            chunkIndex += 1;
            // A tiny gap avoids a Chrome speech queue race between utterances.
            window.setTimeout(speakNext, 30);
          };

          utterance.onerror = (event) => {
            if (speechRunRef.current !== runId) return;

            speakingIdRef.current = "";
            setSpeakingId("");

            if (
              event?.error !== "canceled" &&
              event?.error !== "interrupted"
            ) {
              setError(
                "Text-to-speech could not play this response. Please try the Listen button again.",
              );
            }
          };

          try {
            // Chrome occasionally leaves the speech engine paused after a
            // previous utterance. Resume it before queueing the new one.
            window.speechSynthesis.resume?.();
            window.speechSynthesis.speak(utterance);
          } catch {
            speakingIdRef.current = "";
            setSpeakingId("");
            setError(
              "Text-to-speech could not start. Please try the Listen button again.",
            );
          }
        };

        speakNext();
      };

      // Voices are asynchronous in Chrome/Windows. Wait once, then fall back
      // to the browser's language without an unbounded retry loop.
      if (!voicesRef.current.length) {
        let settled = false;
        let timer;

        const finishVoiceLoad = () => {
          if (settled) return;
          settled = true;
          window.speechSynthesis.removeEventListener?.(
            "voiceschanged",
            finishVoiceLoad,
          );
          window.clearTimeout(timer);
          speakChunks();
        };

        timer = window.setTimeout(finishVoiceLoad, 800);
        window.speechSynthesis.addEventListener?.(
          "voiceschanged",
          finishVoiceLoad,
        );
        window.speechSynthesis.getVoices();
      } else {
        speakChunks();
      }
    },
    [voiceLanguage],
  );

  /* =========================================================
     VOICE INPUT
     ========================================================= */

  const startVoiceInput = () => {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      setError(
        "Voice input is not supported by this browser. You can still type your message.",
      );

      return;
    }

    if (listening) {
      recognitionRef.current?.stop?.();

      return;
    }

    const recognition = new Recognition();

    recognition.lang = voiceLanguage === "hi" ? "hi-IN" : "en-IN";

    recognition.interimResults = true;

    recognition.continuous = false;

    recognition.onstart = () => {
      setError("");
      setListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        transcript += event.results[index][0].transcript;
      }

      setInput(transcript);
    };

    recognition.onerror = (event) => {
      setListening(false);

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setError(
          "Microphone permission was denied. Please allow microphone access in your browser settings.",
        );
      } else {
        setError("Voice input could not be started. Please try again.");
      }
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;

    recognition.start();
  };

  const toggleAutoVoice = () => setVoiceEnabled((value) => !value);

  /* =========================================================
     AUTO VOICE
     ========================================================= */

  useEffect(() => {
    if (!voiceEnabled || busy) {
      return undefined;
    }

    const last = messages[messages.length - 1];

    if (last?.role === "assistant" && last.id !== lastAutoSpokenRef.current) {
      lastAutoSpokenRef.current = last.id;

      speak(last);
    }

    return undefined;
  }, [messages, voiceEnabled, busy, speak]);

  /* =========================================================
     TRANSLATION
     ========================================================= */

  const translate = async (message, language) => {
    try {
      setError("");

      const translated = await aiService.translate(message.content, language);

      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? {
                ...item,
                translation: translated,
                translationLanguage: language,
              }
            : item,
        ),
      );

      setTranslationOpen(message.id);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Translation is temporarily unavailable.",
      );
    }
  };

  const onInputKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      sendMessage();
    }
  };

  if (!user) {
    return null;
  }

  /* =========================================================
     CLOSED CHAT
     ========================================================= */

  if (!open) {
    return (
      <button
        type="button"
        className="ai-fab"
        onClick={() => setOpen(true)}
        aria-label="Open Societal Innovation AI"
      >
        <span className="ai-fab-pulse" aria-hidden="true" />

        <Bot size={22} aria-hidden="true" />

        <span className="ai-fab-label">Societal AI</span>
      </button>
    );
  }

  /* =========================================================
     OPEN CHAT
     ========================================================= */

  return (
    <div className={`ai-shell ${fullscreen ? "ai-shell-fullscreen" : ""}`}>
      <div
        className="ai-backdrop"
        onClick={() => !fullscreen && setOpen(false)}
        aria-hidden="true"
      />

      <section
        className="ai-panel"
        aria-label="Societal Innovation AI Assistant"
      >
        {/* ===================================================
            HEADER
            =================================================== */}

        <header className="ai-header">
          <div className="ai-brand">
            <div className="ai-avatar" aria-hidden="true">
              <Sparkles size={18} />
            </div>

            <div>
              <strong>Societal Innovation AI</strong>

              <span>
                {formatRole(role)} assistant ·{" "}
                {fullscreen ? "Fullscreen" : "Ready to help"}
              </span>
            </div>
          </div>

          <div className="ai-header-actions">
            <button
              type="button"
              onClick={clearChat}
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setFullscreen((value) => !value)}
              title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {fullscreen ? (
                <Minimize2 size={17} aria-hidden="true" />
              ) : (
                <Maximize2 size={17} aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              title="Minimize"
              aria-label="Minimize"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* ===================================================
            TOOLBAR
            =================================================== */}

        <div className="ai-toolbar">
          <button
            type="button"
            className={`ai-tool ${voiceEnabled ? "active" : ""}`}
            onClick={toggleAutoVoice}
            title="Toggle automatic voice output"
          >
            {voiceEnabled ? (
              <Volume2 size={15} aria-hidden="true" />
            ) : (
              <VolumeX size={15} aria-hidden="true" />
            )}{" "}
            Voice {voiceEnabled ? "On" : "Off"}
          </button>

          <label className="ai-language-select">
            <Languages size={15} aria-hidden="true" />

            <select
              value={voiceLanguage}
              onChange={(event) => setVoiceLanguage(event.target.value)}
              aria-label="Voice language"
            >
              <option value="auto">Auto</option>

              <option value="en">English</option>

              <option value="hi">Hindi</option>
            </select>
          </label>

          <span className="ai-page-context">
            <Clipboard size={13} aria-hidden="true" />{" "}
            {challengeId ? "Current challenge" : pageName}
          </span>
        </div>

        {/* ===================================================
            MESSAGES
            =================================================== */}

        <div className="ai-messages" role="log" aria-live="polite">
          {messages.map((message) => (
            <div
              className={`ai-message-row ${
                message.role === "user" ? "user" : "assistant"
              }`}
              key={message.id}
            >
              {message.role === "assistant" && (
                <div className="ai-mini-avatar" aria-hidden="true">
                  <Bot size={14} />
                </div>
              )}

              <div className="ai-message-wrap">
                <article className="ai-message-bubble">
                  {message.role === "assistant" ? (
                    <MessageContent content={message.content} />
                  ) : (
                    <p>{message.content}</p>
                  )}

                  {message.translation && translationOpen === message.id && (
                    <div className="ai-translation">
                      <span>
                        {message.translationLanguage === "hi"
                          ? "Hindi"
                          : "English"}
                      </span>

                      <MessageContent content={message.translation} />
                    </div>
                  )}
                </article>

                {message.role === "assistant" && (
                  <div className="ai-message-actions">
                    {/* COPY */}

                    <button
                      type="button"
                      onClick={() => copyMessage(message)}
                      title="Copy response"
                    >
                      {copiedId === message.id ? (
                        <Check size={13} aria-hidden="true" />
                      ) : (
                        <Copy size={13} aria-hidden="true" />
                      )}{" "}
                      {copiedId === message.id ? "Copied" : "Copy"}
                    </button>

                    {/* LISTEN */}

                    <button
                      type="button"
                      onClick={() => speak(message)}
                      title="Listen"
                    >
                      {speakingId === message.id ? (
                        <Square size={12} aria-hidden="true" />
                      ) : (
                        <Volume2 size={13} aria-hidden="true" />
                      )}{" "}
                      {speakingId === message.id ? "Stop" : "Listen"}
                    </button>

                    {/* TRANSLATE */}

                    <div className="ai-translate-menu">
                      <button
                        type="button"
                        onClick={() =>
                          setTranslationOpen((value) =>
                            value === message.id ? "" : message.id,
                          )
                        }
                        title="Translate"
                      >
                        <Languages size={13} aria-hidden="true" /> Translate
                      </button>

                      {translationOpen === message.id && (
                        <div className="ai-translate-popover">
                          <button
                            type="button"
                            onClick={() => translate(message, "en")}
                          >
                            English
                          </button>

                          <button
                            type="button"
                            onClick={() => translate(message, "hi")}
                          >
                            Hindi
                          </button>
                        </div>
                      )}
                    </div>

                    {/* REGENERATE */}

                    {message.id ===
                      [...messages]
                        .reverse()
                        .find((item) => item.role === "assistant")?.id && (
                      <button
                        type="button"
                        onClick={retryLast}
                        title="Regenerate response"
                      >
                        <RefreshCw size={13} aria-hidden="true" /> Regenerate
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* =================================================
              THINKING
              ================================================= */}

          {busy && (
            <div className="ai-message-row assistant">
              <div className="ai-mini-avatar" aria-hidden="true">
                <Bot size={14} />
              </div>

              <div className="ai-thinking">
                <span />
                <span />
                <span />

                <em>AI is thinking…</em>
              </div>
            </div>
          )}

          {/* =================================================
              ERROR
              ================================================= */}

          {error && (
            <div className="ai-error">
              <span>{error}</span>

              <button type="button" onClick={retryLast} disabled={busy}>
                <RefreshCw size={14} aria-hidden="true" /> Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ===================================================
            SUGGESTIONS
            =================================================== */}

        {messages.length <= 2 && !busy && (
          <div className="ai-suggestions">
            <div className="ai-suggestions-title">
              <Sparkles size={14} aria-hidden="true" /> Suggested questions
            </div>

            <div className="ai-suggestion-list">
              {suggestedQuestions.slice(0, 4).map((question) => (
                <button
                  type="button"
                  key={question}
                  onClick={() => sendMessage(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================
            COMPOSER
            =================================================== */}

        <footer className="ai-composer">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Ask Societal Innovation AI…"
            rows={1}
            disabled={busy}
            aria-label="Ask Societal Innovation AI"
          />

          <div className="ai-composer-actions">
            <button
              type="button"
              className={`ai-icon-tool ${listening ? "recording" : ""}`}
              onClick={startVoiceInput}
              title="Voice input"
              aria-label="Voice input"
            >
              <Mic size={18} aria-hidden="true" />
            </button>

            <button
              type="button"
              className="ai-send"
              onClick={() => sendMessage()}
              disabled={!cleanMessage(input) || busy}
              title="Send"
              aria-label="Send"
            >
              <Send size={18} aria-hidden="true" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
