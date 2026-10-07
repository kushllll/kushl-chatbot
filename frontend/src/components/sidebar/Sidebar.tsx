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
              <Image src="/pp.png" alt="Kushal Chat AI" width={28} height={28} className="object-cover" />
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
              No conversations yet.
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

        {/* User Footer */}
        {user && (
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
        )}
      </aside>
    </>
  );
}
