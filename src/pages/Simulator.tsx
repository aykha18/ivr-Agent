import { useState, useEffect, useRef } from "react";
import { useSessionStore, type ChatMessage } from "@/stores/index";
import { LANGUAGES } from "@/lib/languages";
import type { LanguageCode } from "../../shared/types";

export default function Simulator() {
  const [inputValue, setInputValue] = useState("");
  const [channel, setChannel] = useState("yeastar");
  const [recovering, setRecovering] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    sessionId,
    language,
    languageLocked,
    started,
    ended,
    messages,
    loading,
    startSession,
    selectLanguage,
    sendMessage,
    sendWhatsApp,
    requestCallback,
    endSession,
    reset,
  } = useSessionStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedSessionId = params.get("session");
    if (sharedSessionId && !started) {
      setRecovering(true);
      fetch(`/api/sessions/${sharedSessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.session) {
            const recoveredMessages: ChatMessage[] = data.turns?.map((turn: any) => ({
              type: turn.user_text ? "user" : "assistant",
              text: turn.user_text || turn.assistant_text,
              timestamp: turn.created_at,
            })) || [];
            useSessionStore.setState({
              sessionId: data.session.session_id,
              language: data.session.language as LanguageCode | null,
              languageLocked: !!data.session.language,
              started: true,
              ended: !!data.session.ended_at,
              messages: recoveredMessages,
            });
          }
        })
        .catch(() => {})
        .finally(() => setRecovering(false));
    }
  }, [started]);

  const handleStart = async () => {
    await startSession(channel);
    const { sessionId: newSessionId } = useSessionStore.getState();
    if (newSessionId) {
      const url = new URL(window.location.href);
      url.searchParams.set("session", newSessionId);
      window.history.replaceState({}, "", url);
    }
  };

  const handleLanguageSelect = (lang: LanguageCode) => {
    selectLanguage(lang);
  };

  const handleSend = () => {
    if (inputValue.trim() && languageLocked) {
      sendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  const handleSuggestedAction = (action: { type: string; label: string }) => {
    if (action.type === "continue_on_whatsapp") {
      sendWhatsApp();
    } else if (action.type === "request_callback") {
      requestCallback("Escalation requested from assistant");
    }
  };

  const getLastAssistantActions = (): Array<{ type: string; label: string }> => {
    const lastAssistant = [...messages].reverse().find((m) => m.type === "assistant");
    return lastAssistant?.suggested_actions ?? [];
  };

  const renderLanguageSelector = () => (
    <div className="flex flex-col gap-3">
      <p className="text-lg">Please select your language:</p>
      <div className="flex gap-3 flex-wrap">
        {Object.entries(LANGUAGES).map(([code, info]) => (
          <button
            key={code}
            onClick={() => handleLanguageSelect(code as LanguageCode)}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-lg font-medium transition-colors flex items-center gap-2"
          >
            <span className="text-2xl">{info.flag}</span>
            <span>{info.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderChatMessage = (msg: ChatMessage, idx: number) => (
    <div
      key={idx}
      className={`mb-4 ${msg.type === "user" ? "ml-auto" : "mr-auto"} max-w-[80%]`}
    >
      <div
        className={`p-3 rounded-lg ${
          msg.type === "user"
            ? "bg-blue-600 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        }`}
      >
        <p className="whitespace-pre-wrap">{msg.text}</p>
        {msg.events && msg.events.length > 0 && (
          <div className="mt-2 space-y-1">
            {msg.events.map((e, i) => (
              <div key={i} className="text-xs opacity-70">
                • {e.type}: {e.detail}
              </div>
            ))}
          </div>
        )}
        {msg.suggested_actions && msg.suggested_actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {msg.suggested_actions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSuggestedAction(action)}
                className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderInputArea = () => {
    if (ended) return null;
    if (!languageLocked) return null;
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={loading ? "Processing..." : "Type your message..."}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    );
  };

  let content;
  if (!started) {
    content = (
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">IVR AI - Call Simulator</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Multilingual conversational AI voice agent demo
        </p>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Telephony Channel
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="simulator">Simulator</option>
            <option value="twilio">Twilio</option>
            <option value="asterisk">Asterisk</option>
            <option value="yeastar">Yeastar</option>
          </select>
        </div>
        <button
          onClick={handleStart}
          disabled={loading}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xl font-semibold transition-colors"
        >
          {loading ? "Starting..." : "Start New Call"}
        </button>
      </div>
    );
  } else if (!languageLocked) {
    content = (
      <div>
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
          <h2 className="text-xl font-semibold">Active Session</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Session ID: {sessionId}</p>
        </div>
        {renderLanguageSelector()}
      </div>
    );
  } else if (ended) {
    content = (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Call Ended</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Session {sessionId} has been completed.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          Start New Call
        </button>
      </div>
    );
  } else {
    content = (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
          <h2 className="text-xl font-semibold">Active Session</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Session ID: {sessionId} | Language: {language && LANGUAGES[language]?.label}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((msg, idx) => renderChatMessage(msg, idx))}
          {loading && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
              <span className="text-sm">Assistant is typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {renderInputArea()}
      </div>
    );
  }

  const actions = getLastAssistantActions();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 min-h-[500px]">
        {content}

        {actions.length > 0 && !ended && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Quick actions:</p>
            <div className="flex gap-2">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedAction(action)}
                  className="px-4 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {started && languageLocked && !ended && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={endSession}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              End Call
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
