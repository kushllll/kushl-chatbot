import { Conversation, ConversationDetail } from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

function getHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchConversations(token: string): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE_URL}/conversations`, {
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
  const res = await fetch(`${API_BASE_URL}/conversations/${id}`, {
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
  const res = await fetch(`${API_BASE_URL}/conversations`, {
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
  const res = await fetch(`${API_BASE_URL}/conversations/${id}`, {
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
  onChunk,
  onDone,
  onError,
}: {
  message: string;
  conversationId?: string | null;
  token: string;
  onChunk: (chunk: string) => void;
  onDone: (data: { conversation_id: string; message_id: string }) => void;
  onError: (error: string) => void;
}): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({
        message,
        conversation_id: conversationId || undefined,
      }),
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
    onError(err.message || 'Network error communicating with AI server');
  }
}
