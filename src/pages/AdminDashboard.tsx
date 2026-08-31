import { useEffect, useState } from "react";
import { useAdminStore } from "@/stores/index";
import { LLM_MODELS, LLM_API_URLS } from "@/lib/llm-models";
import type { LlmConfig, TelephonyConfig, TelephonyProvider } from "../../shared/types";

function generatePeerConfig({
  name,
  host,
  port,
  transport,
  codecs,
  dtmf,
  qualify,
  context,
  insecure,
}: {
  name: string;
  host: string;
  port: number;
  transport: string;
  codecs: string;
  dtmf: string;
  qualify: string;
  context: string;
  insecure: string;
}) {
  const codecsList = codecs.split(',').map(c => c.trim()).filter(Boolean).join(',');
  return `; pjsip.conf - add to [transport-${transport}] or create new transport
[${name}]
type=endpoint
transport=transport-${transport}
context=${context}
disallow=all
allow=${codecsList}
aors=${name}
outbound_auth=${name}-auth
dtmf_mode=${dtmf}
qualify=${qualify}
insecure=${insecure}
direct_media=no

[${name}-auth]
type=auth
auth_type=userpass
username=${name}
password=<set-password>

[${name}]
type=aor
contact=${host}:${port}

; extensions.conf - add to [${context}]
exten => _X.,1,NoOp(Incoming from ${name})
 same => n,Answer()
 same => n,Stasis(ivr-ai,\${CHANNEL(uniqueid)})
 same => n,Hangup()`;
}

export default function AdminDashboard() {
  const { metrics, loading, llmConfig, telephonyConfig, auditLogs, telStatus, fetchMetrics, fetchLlmConfig, updateLlmConfig, fetchTelephonyConfig, updateTelephonyConfig, fetchAuditLogs, fetchTelStatus } = useAdminStore();
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(256);
  const [enabled, setEnabled] = useState(true);

  const [telProvider, setTelProvider] = useState<TelephonyProvider>("simulator");
  const [telApiUrl, setTelApiUrl] = useState("");
  const [telApiKey, setTelApiKey] = useState("");
  const [telWebhookSecret, setTelWebhookSecret] = useState("");
  const [telAriApp, setTelAriApp] = useState("");
  const [telAriUser, setTelAriUser] = useState("");
  const [telAriPass, setTelAriPass] = useState("");
  const [telSipHost, setTelSipHost] = useState("");
  const [telSipPort, setTelSipPort] = useState(5060);
  const [telSipUser, setTelSipUser] = useState("");
  const [telSipPass, setTelSipPass] = useState("");
  const [telCallerId, setTelCallerId] = useState("");
  const [telEnabled, setTelEnabled] = useState(true);
  const [peerEnabled, setPeerEnabled] = useState(false);
  const [peerName, setPeerName] = useState("");
  const [peerHost, setPeerHost] = useState("");
  const [peerPort, setPeerPort] = useState(5060);
  const [peerTransport, setPeerTransport] = useState("udp");
  const [peerCodecs, setPeerCodecs] = useState("ulaw,alaw,g729");
  const [peerDtmf, setPeerDtmf] = useState("rfc4733");
  const [peerQualify, setPeerQualify] = useState("yes");
  const [peerContext, setPeerContext] = useState("ivr-ai");
  const [peerInsecure, setPeerInsecure] = useState("invite,port");
  const [telValidationStatus, setTelValidationStatus] = useState<{ valid: boolean; message: string } | null>(null);
  const [validatingTelephony, setValidatingTelephony] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetchMetrics();
    fetchLlmConfig();
    fetchTelephonyConfig();
    fetchAuditLogs();
    fetchTelStatus();
    const interval = setInterval(() => {
      fetchMetrics();
      fetchTelStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchMetrics, fetchLlmConfig, fetchTelephonyConfig, fetchAuditLogs, fetchTelStatus]);

  useEffect(() => {
    if (llmConfig) {
      setProvider(llmConfig.provider);
      const models = LLM_MODELS[llmConfig.provider] || [];
      const matched = models.find((m) => m.value === llmConfig.model);
      if (matched) {
        setModel(llmConfig.model);
        setCustomModel("");
        setUseCustomModel(false);
      } else {
        setModel(models[0]?.value || "");
        setCustomModel(llmConfig.model);
        setUseCustomModel(true);
      }
      setApiUrl(llmConfig.api_url || LLM_API_URLS[llmConfig.provider] || "");
      setApiKey(llmConfig.api_key || "");
      setTemperature(llmConfig.temperature);
      setMaxTokens(llmConfig.maxTokens);
      setEnabled(llmConfig.enabled);
    }
  }, [llmConfig]);

  useEffect(() => {
    if (!apiUrl && LLM_API_URLS[provider]) {
      setApiUrl(LLM_API_URLS[provider]);
    }
  }, [provider, apiUrl]);

  useEffect(() => {
    if (telephonyConfig) {
      setTelProvider(telephonyConfig.provider);
      setTelApiUrl(telephonyConfig.api_url || "");
      setTelApiKey(telephonyConfig.api_key || "");
      setTelWebhookSecret(telephonyConfig.webhook_secret || "");
      setTelAriApp(telephonyConfig.ari_app || "");
      setTelAriUser(telephonyConfig.ari_user || "");
      setTelAriPass(telephonyConfig.ari_password || "");
      setTelSipHost(telephonyConfig.sip_trunk_host || "");
      setTelSipPort(telephonyConfig.sip_trunk_port);
      setTelSipUser(telephonyConfig.sip_username || "");
      setTelSipPass(telephonyConfig.sip_password || "");
      setTelCallerId(telephonyConfig.outbound_caller_id || "");
      setTelEnabled(telephonyConfig.enabled);
      setPeerEnabled(telephonyConfig.peer_enabled);
      setPeerName(telephonyConfig.peer_name || "");
      setPeerHost(telephonyConfig.peer_host || "");
      setPeerPort(telephonyConfig.peer_port);
      setPeerTransport(telephonyConfig.peer_transport || "udp");
      setPeerCodecs(telephonyConfig.peer_codecs || "ulaw,alaw,g729");
      setPeerDtmf(telephonyConfig.peer_dtmf || "rfc4733");
      setPeerQualify(telephonyConfig.peer_qualify || "yes");
      setPeerContext(telephonyConfig.peer_context || "ivr-ai");
      setPeerInsecure(telephonyConfig.peer_insecure || "invite,port");
    }
  }, [telephonyConfig]);

  const handleSaveLlm = async () => {
    await updateLlmConfig({
      provider: provider as LlmConfig["provider"],
      model: useCustomModel ? customModel : model,
      api_url: apiUrl || undefined,
      api_key: apiKey || undefined,
      temperature,
      maxTokens,
      enabled,
    });
    alert("LLM configuration saved");
  };

  const handleSaveTelephony = async () => {
    await updateTelephonyConfig({
      provider: telProvider,
      api_url: telApiUrl || undefined,
      api_key: telApiKey || undefined,
      webhook_secret: telWebhookSecret || undefined,
      sip_trunk_host: telSipHost || undefined,
      sip_trunk_port: telSipPort,
      sip_username: telSipUser || undefined,
      sip_password: telSipPass || undefined,
      outbound_caller_id: telCallerId || undefined,
      ari_app: telAriApp || undefined,
      ari_user: telAriUser || undefined,
      ari_password: telAriPass || undefined,
      peer_enabled: peerEnabled,
      peer_name: peerName || undefined,
      peer_host: peerHost || undefined,
      peer_port: peerPort,
      peer_transport: peerTransport,
      peer_codecs: peerCodecs || undefined,
      peer_dtmf: peerDtmf,
      peer_qualify: peerQualify || undefined,
      peer_context: peerContext,
      peer_insecure: peerInsecure || undefined,
      enabled: telEnabled,
    });
    setTelValidationStatus(null);
    alert("Telephony configuration saved");
  };

  const handleValidateTelephony = async () => {
    setValidatingTelephony(true);
    setTelValidationStatus(null);
    try {
      const res = await fetch("/api/admin/telephony/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: telProvider,
          api_url: telApiUrl || undefined,
          api_key: telApiKey || undefined,
          webhook_secret: telWebhookSecret || undefined,
          ari_app: telAriApp || undefined,
          ari_user: telAriUser || undefined,
          ari_password: telAriPass || undefined,
        }),
      });
      const data = await res.json();
      setTelValidationStatus({ valid: data.valid, message: data.message });
    } catch {
      setTelValidationStatus({ valid: false, message: "Validation request failed" });
    } finally {
      setValidatingTelephony(false);
    }
  };

  const handleStatusRefresh = async () => {
    setStatusLoading(true);
    await fetchTelStatus();
    setStatusLoading(false);
  };

  if (!metrics) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Loading metrics...</p>
      </div>
    );
  }

  const metricCards = [
    { label: "Total Sessions", value: metrics.total_sessions, icon: "📊" },
    { label: "Contained", value: metrics.containment_count, icon: "✅" },
    { label: "Escalations", value: metrics.escalation_count, icon: "⚠️" },
    { label: "Callbacks", value: metrics.callback_count, icon: "📞" },
    { label: "Tickets Created", value: metrics.tickets_created, icon: "🎫" },
    { label: "WhatsApp Sent", value: metrics.whatsapp_sent, icon: "💬" },
  ];

  const languageData = Object.entries(metrics.language_split).map(([lang, count]) => ({
    lang,
    count,
    percentage: metrics.total_sessions > 0 ? Math.round((count / metrics.total_sessions) * 100) : 0,
  }));

  const channelData = Object.entries(metrics.channel_split).map(([channel, count]) => ({
    channel,
    count,
    percentage: metrics.total_sessions > 0 ? Math.round((count / metrics.total_sessions) * 100) : 0,
  }));

  const intentData = Object.entries(metrics.top_intents).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {metricCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 text-center">
            <div className="text-2xl mb-1">{card.icon}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{card.value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Language Split</h2>
          {languageData.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No language data yet.</p>
          ) : (
            <div className="space-y-3">
              {languageData.map(({ lang, count, percentage }) => (
                <div key={lang}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{lang.toUpperCase()}</span>
                    <span>{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Channel / Telephony Provider</h2>
          {channelData.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No channel data yet.</p>
          ) : (
            <div className="space-y-3">
              {channelData.map(({ channel, count, percentage }) => (
                <div key={channel}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{channel}</span>
                    <span>{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Top Intents</h2>
          {intentData.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No intent data yet.</p>
          ) : (
            <div className="space-y-3">
              {intentData.map(([intent, count]) => (
                <div key={intent} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{intent.replace("_", " ")}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(metrics.containment_count > 0 || metrics.escalation_count > 0) && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Outcomes</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.containment_count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Self-Service Completed</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics.escalation_count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Requires Agent</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">LLM Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="mock">Mock</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="ollama">Ollama (Self-Hosted)</option>
              <option value="gemini">Google Gemini</option>
              <option value="groq">Groq</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
            <select
              value={useCustomModel ? "__custom__" : model}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "__custom__") {
                  setUseCustomModel(true);
                } else {
                  setUseCustomModel(false);
                  setModel(val);
                  setCustomModel("");
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {(LLM_MODELS[provider] || []).map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
              <option value="__custom__">Custom model...</option>
            </select>
            {useCustomModel && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Enter custom model name"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API URL</label>
            <input type="text" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="https://api.openai.com/v1 or http://localhost:11434" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="sk-... or leave empty for local models" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temperature: {temperature}</label>
            <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Tokens: {maxTokens}</label>
            <input type="range" min="64" max="2048" step="64" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} className="w-full" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable LLM</span>
          </label>
          <button onClick={handleSaveLlm} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            Save LLM Config
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Telephony Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
            <select value={telProvider} onChange={(e) => setTelProvider(e.target.value as TelephonyProvider)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="simulator">Simulator</option>
              <option value="twilio">Twilio</option>
              <option value="asterisk">Asterisk (SIP Bridge)</option>
              <option value="yeastar">Yeastar</option>
            </select>
          </div>

          {telProvider === 'asterisk' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ARI Base URL</label>
                <input type="text" value={telApiUrl} onChange={(e) => setTelApiUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="http://localhost:8088/ari" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ARI App Name</label>
                <input type="text" value={telAriApp} onChange={(e) => setTelAriApp(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="ivr-ai" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ARI User</label>
                <input type="text" value={telAriUser} onChange={(e) => setTelAriUser(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="ari" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ARI Password</label>
                <input type="password" value={telAriPass} onChange={(e) => setTelAriPass(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="ari" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook Secret</label>
                <input type="password" value={telWebhookSecret} onChange={(e) => setTelWebhookSecret(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="Shared secret for webhook validation" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SIP Trunk Host (Yeastar Cloud)</label>
                <input type="text" value={telSipHost} onChange={(e) => setTelSipHost(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="thenodeitdxb.ras.yeastar.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SIP Trunk Port</label>
                <input type="number" value={telSipPort} onChange={(e) => setTelSipPort(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="5061" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SIP Username</label>
                <input type="text" value={telSipUser} onChange={(e) => setTelSipUser(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="6703" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SIP Password</label>
                <input type="password" value={telSipPass} onChange={(e) => setTelSipPass(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="password" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Outbound Caller ID</label>
                <input type="text" value={telCallerId} onChange={(e) => setTelCallerId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="+1234567890" />
              </div>
            </>
          )}

          {telProvider === 'yeastar' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API URL</label>
                <input type="text" value={telApiUrl} onChange={(e) => setTelApiUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="https://api.example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                <input type="password" value={telApiKey} onChange={(e) => setTelApiKey(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="API key" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook Secret</label>
                <input type="password" value={telWebhookSecret} onChange={(e) => setTelWebhookSecret(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="Shared secret for webhook validation" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SIP Trunk Host</label>
                <input type="text" value={telSipHost} onChange={(e) => setTelSipHost(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="sip.provider.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SIP Trunk Port</label>
                <input type="number" value={telSipPort} onChange={(e) => setTelSipPort(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="5060" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SIP Username</label>
                <input type="text" value={telSipUser} onChange={(e) => setTelSipUser(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="username" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SIP Password</label>
                <input type="password" value={telSipPass} onChange={(e) => setTelSipPass(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="password" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Outbound Caller ID</label>
                <input type="text" value={telCallerId} onChange={(e) => setTelCallerId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="+1234567890" />
              </div>
            </>
          )}

          {telProvider === 'twilio' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account SID</label>
                <input type="text" value={telApiKey} onChange={(e) => setTelApiKey(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="AC..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auth Token</label>
                <input type="password" value={telWebhookSecret} onChange={(e) => setTelWebhookSecret(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="Auth token" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input type="text" value={telSipHost} onChange={(e) => setTelSipHost(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="+1234567890" />
              </div>
            </>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={telEnabled} onChange={(e) => setTelEnabled(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable Telephony</span>
          </label>
          <div className="flex items-center gap-2">
            <button onClick={handleValidateTelephony} disabled={validatingTelephony} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors">
              {validatingTelephony ? 'Validating...' : 'Validate'}
            </button>
            <button onClick={handleSaveTelephony} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              Save Telephony Config
            </button>
          </div>
        </div>
        {telValidationStatus && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${telValidationStatus.valid ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
            {telValidationStatus.message}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Connection Status</h2>
          <button onClick={handleStatusRefresh} disabled={statusLoading} className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors">
            {statusLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {telStatus ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${telStatus.connected ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                {telStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{telStatus.provider}</span>
            </div>
            {telStatus.error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300">
                {telStatus.error}
              </div>
            )}
            {telStatus.provider === 'asterisk' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">ARI App</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{telStatus.ari_app}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{telStatus.ari_app_status || 'unknown'}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Active Channels</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{telStatus.active_channels ?? 0}</div>
                </div>
              </div>
            )}
            {telStatus.provider === 'asterisk' && telStatus.channels && telStatus.channels.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active Channels</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 px-2">Channel ID</th>
                        <th className="text-left py-2 px-2">State</th>
                        <th className="text-left py-2 px-2">Caller</th>
                      </tr>
                    </thead>
                    <tbody>
                      {telStatus.channels.map((ch: any) => (
                        <tr key={ch.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2 px-2 text-xs text-gray-500 dark:text-gray-400 font-mono">{ch.id}</td>
                          <td className="py-2 px-2 text-xs text-gray-500 dark:text-gray-400 capitalize">{ch.state}</td>
                          <td className="py-2 px-2 text-xs text-gray-500 dark:text-gray-400">{ch.caller || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {telStatus.provider === 'yeastar' && telStatus.details && (
              <div className="space-y-1">
                {telStatus.details.map((detail, idx) => (
                  <div key={idx} className={`text-sm ${detail.toLowerCase().includes('unreachable') || detail.toLowerCase().includes('failed') ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {detail}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading status...</p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Audit Log</h2>
          <button onClick={fetchAuditLogs} className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
            Refresh
          </button>
        </div>
        {auditLogs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No audit logs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-2">Time</th>
                  <th className="text-left py-2 px-2">Action</th>
                  <th className="text-left py-2 px-2">Resource</th>
                  <th className="text-left py-2 px-2">IP</th>
                  <th className="text-left py-2 px-2">User Agent</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 50).map((log) => (
                  <tr key={log.log_id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-2 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 capitalize">{log.action}</td>
                    <td className="py-2 px-2">
                      <span className="font-medium">{log.resource_type}</span>
                      {log.resource_id && <span className="text-gray-500 dark:text-gray-400 ml-1">({log.resource_id})</span>}
                    </td>
                    <td className="py-2 px-2 text-xs text-gray-500 dark:text-gray-400">{log.ip_address || '-'}</td>
                    <td className="py-2 px-2 text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{log.user_agent || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">Refreshing...</div>
        </div>
      )}

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Peer Trunk (Direct IP-to-IP)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={peerEnabled} onChange={(e) => setPeerEnabled(e.target.checked)} className="rounded" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Peer Trunk</span>
              </label>
            </div>
            {peerEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peer Name</label>
                  <input type="text" value={peerName} onChange={(e) => setPeerName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="my-peer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Host / IP</label>
                  <input type="text" value={peerHost} onChange={(e) => setPeerHost(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="192.168.1.100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
                  <input type="number" value={peerPort} onChange={(e) => setPeerPort(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="5060" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transport</label>
                  <select value={peerTransport} onChange={(e) => setPeerTransport(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    <option value="udp">UDP</option>
                    <option value="tcp">TCP</option>
                    <option value="tls">TLS</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Codecs</label>
                  <input type="text" value={peerCodecs} onChange={(e) => setPeerCodecs(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="ulaw,alaw,g729" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DTMF Mode</label>
                  <select value={peerDtmf} onChange={(e) => setPeerDtmf(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    <option value="rfc4733">RFC 4733</option>
                    <option value="inband">Inband</option>
                    <option value="sipinfo">SIP INFO</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qualify</label>
                  <select value={peerQualify} onChange={(e) => setPeerQualify(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="2000">2000ms</option>
                    <option value="5000">5000ms</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Context</label>
                  <input type="text" value={peerContext} onChange={(e) => setPeerContext(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="ivr-ai" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Insecure</label>
                  <input type="text" value={peerInsecure} onChange={(e) => setPeerInsecure(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="invite,port" />
                </div>
              </>
            )}
          </div>
          {peerEnabled && peerHost && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Generated Asterisk Config</label>
              <pre className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs overflow-x-auto text-gray-800 dark:text-gray-200">
{generatePeerConfig({
  name: peerName || 'peer',
  host: peerHost,
  port: peerPort,
  transport: peerTransport,
  codecs: peerCodecs,
  dtmf: peerDtmf,
  qualify: peerQualify,
  context: peerContext,
  insecure: peerInsecure,
})}
              </pre>
            </div>
          )}
        </div>
      </div>
  );
}
