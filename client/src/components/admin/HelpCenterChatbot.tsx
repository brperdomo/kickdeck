import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  HelpCircle,
  X,
  Minimize2,
  Maximize2,
  Send,
  Sparkles,
  RotateCcw,
  BookOpen,
  Users,
  Calendar,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HelpCenterChatbotProps {
  currentPage?: string;
  isOpenExternal?: boolean;
  onOpenChange?: (open: boolean) => void;
  aiEnabled?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_ACTIONS = [
  {
    label: 'Getting Started',
    message: 'What are the steps to set up a new tournament from scratch?',
    icon: BookOpen,
  },
  {
    label: 'Schedule Help',
    message: 'How does the scheduling workflow work? What steps do I follow?',
    icon: Calendar,
  },
  {
    label: 'Team Management',
    message: 'How do I manage team registrations, approvals, and rosters?',
    icon: Users,
  },
];

const WELCOME_MESSAGE = `Hi! I'm your **KickDeck Help Assistant**. I can help you understand how to use the platform.

Here are some things I can help with:

• Setting up new tournament events
• Managing team registrations & approvals
• Building tournament schedules
• Configuring venues & fields
• Understanding fees & payments
• Setting up staff roles & permissions

What would you like help with?`;

export function HelpCenterChatbot({
  currentPage,
  isOpenExternal,
  onOpenChange,
  aiEnabled,
}: HelpCenterChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Respond to external open requests (from HelpTooltipPanel "Ask AI" link)
  useEffect(() => {
    if (isOpenExternal) {
      openChat();
      onOpenChange?.(false);
    }
  }, [isOpenExternal]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isLoading]);

  const sendMessage = async (message?: string) => {
    const messageToSend = message || userInput.trim();
    if (!messageToSend) return;

    setIsLoading(true);
    setUserInput('');

    // Add user message to conversation
    setConversation((prev) => [...prev, { role: 'user', content: messageToSend }]);

    try {
      const response = await fetch('/api/admin/help-center/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: messageToSend,
          sessionId: sessionId,
          currentPage: currentPage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const data = await response.json();

      // Store session ID from first response
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId);
      }

      // Add AI response
      setConversation((prev) => [
        ...prev,
        { role: 'assistant', content: data.response },
      ]);
    } catch (error: any) {
      console.error('[HelpCenterChatbot] Error:', error);
      toast({
        title: 'Help Assistant Error',
        description: error.message || 'Failed to get a response. Please try again.',
        variant: 'destructive',
      });
      // Remove the user message on error
      setConversation((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const openChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (conversation.length === 0) {
      const newSessionId = `help-${crypto.randomUUID()}`;
      setSessionId(newSessionId);
      setConversation([{ role: 'assistant', content: WELCOME_MESSAGE }]);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const clearChat = async () => {
    if (sessionId) {
      try {
        await fetch('/api/admin/help-center/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sessionId }),
        });
      } catch (error) {
        console.warn('Failed to clear help center history:', error);
      }
    }
    setConversation([]);
    setSessionId('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Simple inline markdown renderer for bold, bullets, and numbered lists.
   * Keeps it lightweight — no heavy markdown library needed.
   */
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Bold: **text**
      const parts = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={j} className="text-white font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      // Bullet points
      if (line.trimStart().startsWith('• ') || line.trimStart().startsWith('- ')) {
        const content = line.replace(/^\s*[•-]\s*/, '');
        const bulletParts = content.split(/(\*\*.*?\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        return (
          <div key={i} className="flex items-start gap-1.5 ml-1">
            <span className="text-purple-400 mt-0.5 shrink-0">•</span>
            <span>{bulletParts}</span>
          </div>
        );
      }

      // Numbered list items
      const numberedMatch = line.match(/^(\d+)[.)]\s/);
      if (numberedMatch) {
        const content = line.replace(/^\d+[.)]\s/, '');
        const numParts = content.split(/(\*\*.*?\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        return (
          <div key={i} className="flex items-start gap-1.5 ml-1">
            <span className="text-cyan-400 font-medium shrink-0">{numberedMatch[1]}.</span>
            <span>{numParts}</span>
          </div>
        );
      }

      // Empty lines become spacers
      if (line.trim() === '') {
        return <div key={i} className="h-1.5" />;
      }

      return <div key={i}>{parts}</div>;
    });
  };

  // ─── Closed state: floating button ───
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={openChat}
          className="rounded-full h-14 w-14 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 50%, #a855f7 100%)',
            boxShadow: '0 8px 25px rgba(6, 182, 212, 0.3), 0 4px 15px rgba(124, 58, 237, 0.2)',
          }}
        >
          <HelpCircle className="h-6 w-6 text-white" />
        </Button>
      </div>
    );
  }

  // ─── Minimized state: small header card ───
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Card
          className="border-0"
          style={{
            background: 'rgba(10, 8, 30, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(6, 182, 212, 0.1)',
          }}
        >
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-cyan-400" />
                <CardTitle className="text-sm text-white">Help Assistant</CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 px-1.5 border-cyan-500/30 text-cyan-300 bg-cyan-900/20"
                >
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                  AI
                </Badge>
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(false)}
                  className="h-6 w-6 p-0 text-purple-300 hover:text-white hover:bg-purple-700/30"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeChat}
                  className="h-6 w-6 p-0 text-purple-300 hover:text-white hover:bg-red-700/30"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ─── Open state: full chat panel ───
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px]">
      <Card
        className="border-0 flex flex-col"
        style={{
          background: 'rgba(10, 8, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          boxShadow:
            '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(6, 182, 212, 0.08), 0 0 15px rgba(124, 58, 237, 0.06)',
          borderRadius: '16px',
          maxHeight: 'calc(100vh - 100px)',
        }}
      >
        {/* Header */}
        <CardHeader
          className="pb-2 pt-3 px-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(124, 58, 237, 0.12)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 flex items-center justify-center rounded-lg"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(6,182,212,0.3) 0%, rgba(124,58,237,0.2) 100%)',
                  border: '1px solid rgba(6,182,212,0.25)',
                }}
              >
                <HelpCircle className="h-4 w-4 text-cyan-300" />
              </div>
              <CardTitle className="text-sm text-white">Help Assistant</CardTitle>
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1.5 border-cyan-500/30 text-cyan-300 bg-cyan-900/20"
              >
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                AI-Powered
              </Badge>
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 p-0 text-purple-300 hover:text-white hover:bg-purple-700/30"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeChat}
                className="h-6 w-6 p-0 text-purple-300 hover:text-white hover:bg-red-700/30"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 px-4 pb-3 flex flex-col flex-1 min-h-0">
          {/* Conversation Area */}
          <div className="h-72 overflow-y-auto space-y-3 my-3 pr-1 scrollbar-thin scrollbar-thumb-purple-600/40 scrollbar-track-transparent">
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-white'
                      : 'text-purple-100/90'
                  }`}
                  style={
                    msg.role === 'user'
                      ? {
                          background:
                            'linear-gradient(135deg, rgba(124,58,237,0.7) 0%, rgba(109,40,217,0.6) 100%)',
                          border: '1px solid rgba(124,58,237,0.3)',
                        }
                      : {
                          background: 'rgba(124, 58, 237, 0.08)',
                          border: '1px solid rgba(124, 58, 237, 0.12)',
                        }
                  }
                >
                  <div className="space-y-0.5">{renderContent(msg.content)}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="p-3 rounded-xl flex items-center gap-2 text-sm"
                  style={{
                    background: 'rgba(124, 58, 237, 0.08)',
                    border: '1px solid rgba(124, 58, 237, 0.12)',
                  }}
                >
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                  <span className="text-purple-200/70">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions — only show at start of conversation */}
          {conversation.length <= 1 && !isLoading && (
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(action.message)}
                    disabled={isLoading}
                    className="text-xs border-0 h-7 px-2.5 gap-1"
                    style={{
                      background: 'rgba(6, 182, 212, 0.08)',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      color: 'rgba(6, 182, 212, 0.8)',
                    }}
                  >
                    <Icon className="h-3 w-3" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2 items-end">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about KickDeck..."
              disabled={isLoading}
              className="flex h-10 w-full rounded-lg px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                color: 'white',
              }}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={isLoading || !userInput.trim()}
              className="h-10 w-10 p-0 shrink-0 rounded-lg"
              style={{
                background:
                  isLoading || !userInput.trim()
                    ? 'rgba(124, 58, 237, 0.15)'
                    : 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)',
              }}
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </div>

          {/* Footer: New Chat button */}
          {conversation.length > 1 && (
            <div className="flex justify-center mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                disabled={isLoading}
                className="text-[11px] text-purple-400/60 hover:text-purple-300 h-6 gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                New Chat
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
