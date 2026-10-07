'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Conversation, Message, ChatModel } from '@/types';
import {
  fetchConversations,
  fetchConversation,
  deleteConversation,
  fetchModels,
  streamChatMessage,
} from '@/lib/api';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { Composer } from '@/components/composer/Composer';
import { Menu, Plus } from 'lucide-react';

export default function ChatPage() {
  const { user, token, loading: authLoading, signIn, signOut } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // AI Models state
  const [models, setModels] = useState<ChatModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('nvidia/nemotron-3-ultra-550b-a55b:free');

  // Streaming cancellation ref
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch available AI models on mount
  useEffect(() => {
    let isMounted = true;
    async function loadModels() {
      try {
        const data = await fetchModels();
        if (isMounted) {
          if (data.models && data.models.length > 0) {
            setModels(data.models);
          }
          if (data.default) {
            setSelectedModel((prev) => prev || data.default);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch models list, using fallbacks:', err);
      }
    }
    loadModels();
    return () => {
      isMounted = false;
    };
  }, []);

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
      // If logging out, clear conversation id but keep current messages in memory
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
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
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

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleSendMessage = async (text: string) => {
    if (isStreaming) return;
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

    // Build context history for guest sessions (up to last 10 turns)
    const historyPayload = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    setMessages((prev) => [...prev, tempUserMsg, tempAssistantMsg]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedContent = '';

    await streamChatMessage({
      message: text,
      conversationId: currentChatId,
      token,
      model: selectedModel,
      history: !token ? historyPayload : undefined,
      signal: controller.signal,
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
        abortControllerRef.current = null;
        if (token) {
          if (!currentChatId && data.conversation_id) {
            setCurrentChatId(data.conversation_id);
          }
          loadConversations();
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
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
        onSignIn={signIn}
      />

      {/* Main Chat View */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-zinc-950">
        {/* Top Navigation Bar */}
        <header className="h-14 border-b border-zinc-800/80 px-4 flex items-center justify-between bg-zinc-950/80 backdrop-blur z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-900 md:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <span className="font-semibold text-sm text-zinc-200 md:hidden">
              Kushal Chat AI
            </span>
          </div>

          {/* Right actions: Guest mode sign-in CTA & New Chat */}
          <div className="flex items-center gap-2">
            {!user && (
              <button
                onClick={signIn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-medium text-zinc-200 hover:text-white transition-all shadow-sm"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign in</span>
              </button>
            )}
            <button
              onClick={handleNewChat}
              className="p-2 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-900"
              aria-label="New chat"
              title="New chat"
            >
              <Plus size={20} />
            </button>
          </div>
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
          onCancel={handleCancel}
          models={models}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />
      </main>
    </div>
  );
}
