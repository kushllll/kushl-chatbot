'use client';

import React from 'react';
import { Conversation } from '@/types';
import { Plus, Trash2, MessageSquare, LogOut, X, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface SidebarProps {
  conversations: Conversation[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSignOut: () => void;
  onSignIn?: () => void;
}

export function Sidebar({
  conversations,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isOpen,
  onClose,
  user,
  onSignOut,
  onSignIn,
}: SidebarProps) {
  // Date grouping algorithm
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const sevenDaysStart = todayStart - 7 * 86400000;

  const groups: { label: string; items: Conversation[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Previous 7 Days', items: [] },
    { label: 'Older', items: [] },
  ];

  conversations.forEach((conv) => {
    const time = new Date(conv.updated_at).getTime();
    if (time >= todayStart) {
      groups[0].items.push(conv);
    } else if (time >= yesterdayStart) {
      groups[1].items.push(conv);
    } else if (time >= sevenDaysStart) {
      groups[2].items.push(conv);
    } else {
      groups[3].items.push(conv);
    }
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-3 border-b border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-zinc-700 relative">
              <Image src="/Neon%20Orbital%20Sphere%20Emblem.png" alt="Kushal Chat AI" width={28} height={28} className="object-cover" />
            </div>
            <span className="font-semibold text-zinc-100 text-sm tracking-tight flex items-center gap-1.5">
              Kushal Chat AI
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-200 rounded-md"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 hover:bg-zinc-800/90 text-zinc-200 hover:text-white rounded-lg border border-zinc-800 text-sm font-medium transition-colors shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Plus size={16} />
              New chat
            </span>
            <Sparkles size={14} className="text-zinc-500" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 text-xs">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 px-4">
              <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
              {user ? (
                'No conversations yet.'
              ) : (
                <div>
                  <p className="text-xs text-zinc-400 font-medium">Guest Mode</p>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                    Chat freely below. Sign in to save chats permanently and access them anywhere.
                  </p>
                </div>
              )}
            </div>
          ) : (
            groups
              .filter((g) => g.items.length > 0)
              .map((group) => (
                <div key={group.label} className="space-y-1">
                  <div className="px-2 py-1 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                    {group.label}
                  </div>
                  {group.items.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        onSelectChat(chat.id);
                        onClose();
                      }}
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                        chat.id === currentChatId
                          ? 'bg-zinc-800 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      }`}
                    >
                      <div className="truncate flex-1 pr-2 text-sm">
                        {chat.title}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this conversation?')) {
                            onDeleteChat(chat.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-zinc-500 rounded transition-opacity"
                        title="Delete chat"
                        aria-label="Delete conversation"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ))
          )}
        </div>

        {/* Footer: User profile or Guest sign-in CTA */}
        {user ? (
          <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-300 overflow-hidden flex-shrink-0 border border-zinc-700">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                  (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()
                )}
              </div>
              <div className="truncate text-xs">
                <div className="text-zinc-200 font-medium truncate">
                  {user.displayName || 'User'}
                </div>
                <div className="text-zinc-500 truncate text-[11px]">
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-md transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 flex flex-col gap-2">
            <div className="text-[11px] text-zinc-400 leading-tight">
              Sign in to save chat history & sync devices.
            </div>
            {onSignIn && (
              <button
                onClick={onSignIn}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg text-xs font-semibold transition-all shadow-sm"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
