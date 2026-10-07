import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice = ToolChoicePrimitive | ToolChoiceByName | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (value: MessageContent | MessageContent[]): MessageContent[] =>
  Array.isArray(value) ? value : [value];

const normalizeContentPart = (part: MessageContent): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map((part) => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined,
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error("tool_choice 'required' was provided but no tools were configured");
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly",
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.7-flash";

// Fallback chain: if the primary model is overloaded/unavailable, try the next.
// Kept short on purpose — Cloudflare's free tunnel aborts at 100s, and a vision
// request already takes ~20s, so we cannot afford a long retry ladder.
const GEMINI_FALLBACK_MODELS = [
  GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-flash-latest",
];

const resolveApiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${ENV.geminiApiKey}`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Optimize prompt for Ollama inference: reduce verbosity while keeping key info
 */
function optimizePromptForOllama(prompt: string): string {
  // For diagnosis prompts, keep it concise
  if (prompt.includes("Cannabis-Pflanzengesundheit")) {
    return `You are a cannabis plant health expert. Analyze the image and identify issues (diseases, pests, deficiencies).

Determine plant gender (male/female/hermaphrodite/unknown) based on visible flowers, pollen sacs, or stigmas.

Return JSON:
{
  "problem": "Description of identified problem",
  "recommendations": ["Action 1", "Action 2", "Action 3"],
  "careTips": ["Tip 1", "Tip 2", "Tip 3"],
  "severity": "low"|"medium"|"high",
  "plantGender": "male"|"female"|"hermaphrodite"|"unknown",
  "genderConfidence": 0-100,
  "voiceResponse": "1-2 sentence spoken summary"
}

Gender:
- male: pollen sacs visible
- female: white stigmas visible
- hermaphrodite: both
- unknown: not visible

${prompt.includes("Zusätzliche Notizen") ? prompt.match(/Zusätzliche Notizen.*?:/)?.[0] || "" : ""}`;
  }
  
  // For other prompts, just trim excessive whitespace
  return prompt.trim().replace(/\n\n+/g, "\n\n");
}

/**
 * POST the payload to Gemini, walking a short fallback chain on transient
 * errors (429/5xx). One attempt per model keeps the worst case well under the
 * 100s upstream timeout; client errors (400/403/404) return immediately.
 * 
 * If all Gemini models fail with 503, falls back to local Ollama.
 */
async function fetchWithRetry(payload: Record<string, unknown>): Promise<Response> {
  let lastResponse: Response | null = null;

  for (const model of GEMINI_FALLBACK_MODELS) {
    const response = await fetch(resolveApiUrl(model), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) return response;

    // Retry only transient errors; bail out on client errors (400/403/404)
    if (![429, 500, 502, 503, 504].includes(response.status)) {
      return response;
    }

    lastResponse = response;
    await sleep(500);
  }

  // If all Gemini models failed with 429/503, try local Ollama as final fallback
  if (lastResponse && [429, 503].includes(lastResponse.status)) {
    try {
      console.log(`[Gemini ${lastResponse.status}] Falling back to local Ollama...`);
      const ollamaResponse = await fetchOllama(payload);
      if (ollamaResponse.ok) return ollamaResponse;
    } catch (e) {
      console.error("[Ollama fallback failed]", e);
    }
  }

  return lastResponse as Response;
}

/**
 * Fallback to local Ollama when Gemini is overloaded.
 * Converts Gemini payload to Ollama format with optimized prompt.
 */
async function fetchOllama(geminiPayload: Record<string, unknown>): Promise<Response> {
  const contents = geminiPayload.contents as Array<{ parts: Array<{ text?: string; inlineData?: { data: string } }> }>;
  const systemInstruction = geminiPayload.systemInstruction as { parts: Array<{ text: string }> } | undefined;

  // Extract text prompt and images
  let prompt = systemInstruction?.parts?.map(p => p.text).join("\n") || "";
  const images: string[] = [];

  for (const content of contents) {
    for (const part of content.parts) {
      if (part.text) prompt += "\n" + part.text;
      if (part.inlineData?.data) images.push(part.inlineData.data);
    }
  }

  // Optimize prompt for faster inference: reduce verbosity
  const optimizedPrompt = optimizePromptForOllama(prompt);

  const ollamaModel = process.env.OLLAMA_MODEL || "llava-phi3";
  const ollamaPayload = {
    model: ollamaModel,
    prompt: optimizedPrompt,
    images,
    stream: false,
    // Use default Ollama settings - custom num_ctx/num_predict can slow it down
  };

  const response = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(ollamaPayload),
  });

  if (!response.ok) return response;

  // Convert Ollama response to Gemini format
  const ollamaData = await response.json() as { response: string };
  const geminiFormat = {
    candidates: [{
      content: {
        parts: [{ text: ollamaData.response }],
        role: "model",
      },
      finishReason: "STOP",
    }],
    usageMetadata: {
      promptTokenCount: 0,
      candidatesTokenCount: 0,
      totalTokenCount: 0,
    },
  };

  // Return a synthetic Response with Gemini-compatible JSON
  return new Response(JSON.stringify(geminiFormat), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

const assertApiKey = () => {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error("responseFormat json_schema requires a defined schema object");
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

const geminiRole = (role: Role): string => {
  if (role === "system") return "user";
  if (role === "tool" || role === "function") return "function";
  return role;
};

const contentToParts = (content: MessageContent | MessageContent[]): Array<Record<string, unknown>> => {
  const parts: Array<Record<string, unknown>> = [];
  const items = Array.isArray(content) ? content : [content];

  for (const item of items) {
    if (typeof item === "string") {
      parts.push({ text: item });
    } else if (item.type === "text") {
      parts.push({ text: item.text });
    } else if (item.type === "image_url") {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: item.image_url.url.split(",")[1] || item.image_url.url,
        },
      });
    }
  }

  return parts;
};

const toolsToGemini = (tools: Tool[]): Array<Record<string, unknown>> => {
  return tools.map((tool) => ({
    functionDeclarations: [{
      name: tool.function.name,
      description: tool.function.description || "",
      parameters: tool.function.parameters || { type: "object", properties: {} },
    }],
  }));
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: geminiRole(m.role),
      parts: contentToParts(m.content),
    }));

  const systemMessage = messages.find((m) => m.role === "system");
  const systemInstruction = systemMessage
    ? { parts: contentToParts(systemMessage.content) }
    : undefined;

  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: 32768,
    temperature: 0.7,
  };

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    if (normalizedResponseFormat.type === "json_schema") {
      generationConfig.responseMimeType = "application/json";
      generationConfig.responseSchema = normalizedResponseFormat.json_schema.schema;
    } else if (normalizedResponseFormat.type === "json_object") {
      generationConfig.responseMimeType = "application/json";
    }
  }

  const payload: Record<string, unknown> = {
    contents,
    generationConfig,
  };

  if (systemInstruction) {
    payload.systemInstruction = systemInstruction;
  }

  if (tools && tools.length > 0) {
    payload.tools = toolsToGemini(tools);
  }

  const normalizedToolChoice = normalizeToolChoice(toolChoice || tool_choice, tools);
  if (normalizedToolChoice && normalizedToolChoice !== "none") {
    payload.toolConfig = {
      functionCallingConfig: {
        mode: normalizedToolChoice === "auto" ? "AUTO" : "ANY",
      },
    };
  }

  const response = await fetchWithRetry(payload);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
  }

  const data = await response.json() as Record<string, unknown>;
  const candidates = data.candidates as Array<Record<string, unknown>> | undefined;
  const firstCandidate = candidates?.[0];
  const content = firstCandidate?.content as Record<string, unknown> | undefined;
  const parts = content?.parts as Array<Record<string, unknown>> | undefined;

  const textParts = parts
    ?.filter((p) => typeof p.text === "string")
    .map((p) => p.text as string) || [];

  const toolCalls = parts
    ?.filter((p) => p.functionCall)
    .map((p, i) => ({
      id: `call_${i}`,
      type: "function" as const,
      function: {
        name: String((p.functionCall as Record<string, unknown>).name ?? ""),
        arguments: JSON.stringify((p.functionCall as Record<string, unknown>).args || {}),
      },
    }));

  return {
    id: `gemini-${Date.now()}`,
    created: Math.floor(Date.now() / 1000),
    model: GEMINI_MODEL,
    choices: [{
      index: 0,
      message: {
        role: "assistant" as const,
        content: textParts.join(""),
        tool_calls: toolCalls?.length ? toolCalls : undefined,
      },
      finish_reason: String(firstCandidate?.finishReason ?? "stop"),
    }],
    usage: data.usageMetadata as InvokeResult["usage"],
  };
}
