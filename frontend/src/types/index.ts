export interface UserProfile {
  id: string;
  auth_id: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface ChatModel {
  id: string;
  name: string;
  tagline?: string;
  description: string;
}
