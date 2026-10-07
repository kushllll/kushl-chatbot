import { Conversation, ConversationDetail, ChatModel } from '@/types';

/**
 * Normalizes backend API base URL.
 * Guarantees a clean, single '/api' suffix regardless of whether NEXT_PUBLIC_API_URL
 * has trailing slashes or already includes '/api'.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) {
    const clean = raw.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  // In production builds, default to the live Render backend API
  if (process.env.NODE_ENV === 'production') {
    return 'https://kushl-chatbot.onrender.com/api';
  }
  // Local development default
  return 'http://127.0.0.1:8000/api';
}

function getHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchModels(): Promise<{ models: ChatModel[]; default: string }> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/chat/models`);
  if (!res.ok) {
    throw new Error(`Failed to load models (${res.status})`);
  }
  return res.json();
}

export async function fetchConversations(token: string): Promise<Conversation[]> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/conversations`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`Failed to load conversations (${res.status})`);
  }
  return res.json();
}

export async function fetchConversation(
  id: string,
  token: string
): Promise<ConversationDetail> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/conversations/${id}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`Failed to load conversation (${res.status})`);
  }
  return res.json();
}

export async function createConversation(
  title: string,
  token: string
): Promise<Conversation> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/conversations`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create conversation (${res.status})`);
  }
  return res.json();
}

export async function deleteConversation(
  id: string,
  token: string
): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/conversations/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete conversation (${res.status})`);
  }
}

export async function streamChatMessage({
  message,
  conversationId,
  token,
  model,
  history,
  signal,
  onChunk,
  onDone,
  onError,
}: {
  message: string;
  conversationId?: string | null;
  token?: string | null;
  model?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  signal?: AbortSignal;
  onChunk: (chunk: string) => void;
  onDone: (data: { conversation_id?: string; message_id?: string; guest?: boolean }) => void;
  onError: (error: string) => void;
}): Promise<void> {
  try {
    const baseUrl = getApiBaseUrl();
    const isGuest = !token;
    const url = isGuest ? `${baseUrl}/chat/guest` : `${baseUrl}/chat`;

    const bodyPayload = isGuest
      ? {
          message,
          model: model || undefined,
          history: history && history.length > 0 ? history : undefined,
        }
      : {
          message,
          conversation_id: conversationId || undefined,
          model: model || undefined,
        };

    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(bodyPayload),
      signal,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errJson.detail || `Server error (${res.status})`);
    }

    if (!res.body) {
      throw new Error('Response body is null');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.chunk) {
              onChunk(data.chunk);
            }
            if (data.done) {
              onDone({
                conversation_id: data.conversation_id,
                message_id: data.message_id,
                guest: data.guest,
              });
            }
            if (data.error) {
              onError(data.error);
            }
          } catch {
            // Ignore partial JSON lines
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      // User deliberately aborted stream
      return;
    }
    onError(err.message || 'Network error communicating with AI server');
  }
}
