'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Conversation, Message } from '@/types';
import {
  fetchConversations,
  fetchConversation,
  deleteConversation,
  streamChatMessage,
} from '@/lib/api';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { Composer } from '@/components/composer/Composer';
import { AuthPrompt } from '@/components/auth/AuthPrompt';
import { Menu, Plus } from 'lucide-react';

export default function ChatPage() {
  const { user, token, loading: authLoading, signIn, signOut } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Load conversations when authenticated
  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchConversations(token);
      setConversations(data);
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadConversations();
    } else {
      setConversations([]);
      setMessages([]);
      setCurrentChatId(null);
    }
  }, [token, loadConversations]);

  // Load active conversation messages
  const selectChat = async (id: string) => {
    if (!token || isStreaming) return;
    setCurrentChatId(id);
    setErrorBanner(null);
    try {
      const detail = await fetchConversation(id, token);
      setMessages(detail.messages);
    } catch (err: any) {
      setErrorBanner('Failed to load conversation history');
    }
  };

  const handleNewChat = () => {
    if (isStreaming) return;
    setCurrentChatId(null);
    setMessages([]);
    setErrorBanner(null);
  };

  const handleDeleteChat = async (id: string) => {
    if (!token) return;
    try {
      await deleteConversation(id, token);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentChatId === id) {
        handleNewChat();
      }
    } catch (err: any) {
      setErrorBanner('Failed to delete conversation');
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!token || isStreaming) return;
    setErrorBanner(null);

    // 1. Append user message optimistically
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    // 2. Prepare empty assistant message placeholder for streaming
    const tempAssistantMsg: Message = {
      id: `temp-assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);
    setIsStreaming(true);

    let accumulatedContent = '';

    await streamChatMessage({
      message: text,
      conversationId: currentChatId,
      token,
      onChunk: (chunk) => {
        accumulatedContent += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: accumulatedContent,
            };
          }
          return updated;
        });
      },
      onDone: (data) => {
        setIsStreaming(false);
        if (!currentChatId && data.conversation_id) {
          setCurrentChatId(data.conversation_id);
        }
        loadConversations();
      },
      onError: (err) => {
        setIsStreaming(false);
        setErrorBanner(err);
      },
    });
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
          Loading Kushal Chat AI...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center">
        <AuthPrompt onSignIn={signIn} isLoading={authLoading} />
      </main>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentChatId={currentChatId}
        onSelectChat={selectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onSignOut={signOut}
      />

      {/* Main Chat View */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-zinc-950">
        {/* Mobile / Compact Top Bar */}
        <header className="h-14 border-b border-zinc-800/80 px-4 flex items-center justify-between md:hidden bg-zinc-950/80 backdrop-blur z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-900"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm text-zinc-200">
            Kushal Chat AI
          </span>
          <button
            onClick={handleNewChat}
            className="p-2 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-900"
            aria-label="New chat"
          >
            <Plus size={20} />
          </button>
        </header>

        {/* Global Error Alert Banner */}
        {errorBanner && (
          <div className="bg-red-950/70 border-b border-red-800/60 px-4 py-2 text-xs text-red-200 flex items-center justify-between">
            <span>{errorBanner}</span>
            <button
              onClick={() => setErrorBanner(null)}
              className="text-red-400 hover:text-red-100 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Messages Scroll Area */}
        <ChatArea
          messages={messages}
          isStreaming={isStreaming}
          onSelectSuggestion={handleSendMessage}
        />

        {/* Message Input Composer */}
        <Composer
          onSendMessage={handleSendMessage}
          isLoading={isStreaming}
        />
      </main>
    </div>
  );
}
