export const LLM_MODELS: Record<string, { label: string; value: string }[]> = {
  mock: [
    { label: "Mock (fast)", value: "mock" },
  ],
  openai: [
    { label: "GPT-4o Mini (fast, cheap)", value: "gpt-4o-mini" },
    { label: "GPT-4o", value: "gpt-4o" },
    { label: "GPT-4 Turbo", value: "gpt-4-turbo" },
    { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
  ],
  anthropic: [
    { label: "Claude 3.5 Haiku (fast)", value: "claude-3-5-haiku-20241022" },
    { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20241022" },
    { label: "Claude 3 Opus", value: "claude-3-opus-20240229" },
  ],
  ollama: [
    { label: "Llama 3 (8B, free)", value: "llama3" },
    { label: "Llama 3.1 (8B, free)", value: "llama3.1:8b" },
    { label: "Llama 3.2 (3B, free)", value: "llama3.2:3b" },
    { label: "Mistral (7B, free)", value: "mistral" },
    { label: "Gemma 2 (9B, free)", value: "gemma2:9b" },
    { label: "Qwen 2.5 (7B, free)", value: "qwen2.5:7b" },
  ],
  gemini: [
    { label: "Gemini 1.5 Flash (fast, free tier)", value: "gemini-1.5-flash" },
    { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
    { label: "Gemini 2.0 Flash (experimental)", value: "gemini-2.0-flash-exp" },
  ],
  groq: [
    { label: "Llama 3.1 8B (fast, free)", value: "llama-3.1-8b-instant" },
    { label: "Llama 3.1 70B (free)", value: "llama-3.1-70b-versatile" },
    { label: "Gemma2 9B (fast, free)", value: "gemma2-9b-it" },
    { label: "Mixtral 8x7B (free)", value: "mixtral-8x7b-32768" },
  ],
}

export const LLM_API_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com",
  ollama: "http://localhost:11434",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  groq: "https://api.groq.com/openai/v1",
}
