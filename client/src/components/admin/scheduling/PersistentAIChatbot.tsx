import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bot, MessageCircle, X, Minimize2, Maximize2, Send, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface PersistentAIChatbotProps {
  eventId: string;
}

export default function PersistentAIChatbot({ eventId }: PersistentAIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState<Array<{role: string, content: string}>>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch flight configuration to get centralized parameters
  const { data: flightConfig } = useQuery({
    queryKey: ['flight-config', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/flight-configurations`);
      if (!response.ok) throw new Error('Failed to fetch flight configuration');
      return response.json();
    },
    enabled: isOpen
  });

  const sendMessage = async (message?: string) => {
    const messageToSend = message || userInput.trim();
    if (!messageToSend) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send to the AI assistant.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setUserInput('');
    
    // Add user message to conversation
    setConversation(prev => [...prev, { role: 'user', content: messageToSend }]);
    
    try {
      console.log('🤖 Sending message to AI Scheduler...');
      
      const response = await fetch(`/api/admin/events/${eventId}/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageToSend,
          sessionId: sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `AI chat failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ AI Response:', data);
      
      // Store session ID if this is first message
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId);
      }
      
      // Add AI response to conversation
      setConversation(prev => [...prev, { role: 'assistant', content: data.response }]);

      // Invalidate queries to refresh any affected data
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });

    } catch (error: any) {
      console.error('🚨 AI Chat Error:', error);
      toast({
        title: "AI Chat Error",
        description: error.message || "Failed to send message to AI assistant",
        variant: "destructive"
      });
      
      // Remove the user message on error
      setConversation(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const openChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (conversation.length === 0) {
      // Generate a new session ID for this chat
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      
      setConversation([{
        role: 'assistant',
        content: 'Hello! I\'m your tournament scheduling assistant powered by AI. I have access to your current flight parameters and can help you with:\n\n• Moving games to different times or fields\n• Checking for scheduling conflicts\n• Finding optimal time slots\n• Swapping teams in games\n• Reviewing upcoming schedules\n\nJust tell me what you need in plain English!'
      }]);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const maximizeChat = () => {
    setIsMinimized(false);
  };

  const clearChat = async () => {
    if (sessionId) {
      try {
        await fetch(`/api/admin/events/${eventId}/ai-chat/clear`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
      } catch (error) {
        console.warn('Failed to clear chat history on server:', error);
      }
    }
    
    setConversation([]);
    setSessionId('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={openChat}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-600/25 rounded-full h-14 w-14 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Card className="bg-black/80 backdrop-blur-xl border-purple-500/30 shadow-2xl shadow-purple-600/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-sm text-white">AI Assistant</CardTitle>
                <Badge variant="outline" className="text-xs bg-purple-900/30 text-purple-300 border-purple-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={maximizeChat}
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

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96">
      <Card className="bg-black/90 backdrop-blur-xl border-purple-500/30 shadow-2xl shadow-purple-600/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-400" />
              <CardTitle className="text-sm text-white">AI Scheduling Assistant</CardTitle>
              <Badge variant="outline" className="text-xs bg-purple-900/30 text-purple-300 border-purple-500/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={minimizeChat}
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
          
          {/* Current Flight Parameters */}
          {flightConfig && flightConfig.length > 0 && (
            <div className="mt-2 p-2 bg-purple-900/20 rounded-lg border border-purple-500/20">
              <div className="text-xs text-purple-300 mb-1">Current Flight Parameters:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-purple-200">
                  Game Length: <span className="text-white font-medium">{flightConfig[0]?.gameLength || 90}min</span>
                </div>
                <div className="text-purple-200">
                  Rest Period: <span className="text-white font-medium">{flightConfig[0]?.restPeriod || flightConfig[0]?.bufferTime || 90}min</span>
                </div>
                <div className="text-purple-200">
                  Field Size: <span className="text-white font-medium">{flightConfig[0]?.fieldSize || '7v7'}</span>
                </div>
                <div className="text-purple-200">
                  Buffer: <span className="text-white font-medium">{flightConfig[0]?.bufferTime || 15}min</span>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Conversation Area */}
          <div className="h-64 overflow-y-auto space-y-3 mb-4 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent">
            {conversation.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' 
                    : 'bg-purple-900/30 text-purple-100 border border-purple-500/20'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-purple-900/30 text-purple-100 border border-purple-500/20 p-3 rounded-lg flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about scheduling..."
              disabled={isLoading}
              className="bg-purple-900/20 border-purple-500/30 text-white placeholder-purple-300 focus:border-purple-400"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={isLoading || !userInput.trim()}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-1 mt-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendMessage("Show me today's conflicts")}
              disabled={isLoading}
              className="text-xs bg-purple-900/20 border-purple-500/30 text-purple-200 hover:bg-purple-800/30"
            >
              Check Conflicts
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendMessage("What games are scheduled for tomorrow?")}
              disabled={isLoading}
              className="text-xs bg-purple-900/20 border-purple-500/30 text-purple-200 hover:bg-purple-800/30"
            >
              Tomorrow's Games
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              disabled={isLoading}
              className="text-xs bg-red-900/20 border-red-500/30 text-red-200 hover:bg-red-800/30"
            >
              Clear Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}