import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Settings, ArrowRight, MessageCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface AIScheduleChatInterfaceProps {
  eventId: string;
}

export default function AIScheduleChatInterface({ eventId }: AIScheduleChatInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState<Array<{role: string, content: string}>>([]);
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch flight configuration to show current parameters
  const { data: flightConfig } = useQuery({
    queryKey: ['flight-config', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/flight-configurations`);
      if (!response.ok) throw new Error('Failed to fetch flight configuration');
      return response.json();
    }
  });

  const sendMessage = async () => {
    if (!userInput.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send to the AI assistant.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const message = userInput.trim();
    setUserInput('');
    
    // Add user message to conversation
    setConversation(prev => [...prev, { role: 'user', content: message }]);
    
    try {
      console.log('🤖 Sending message to OpenAI Responses API...');
      
      const response = await fetch(`/api/admin/events/${eventId}/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `AI chat failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ AI Response:', data);
      
      // Add AI response to conversation
      setConversation(prev => [...prev, { role: 'assistant', content: data.response }]);
      
      // Refresh schedule data if changes were made
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedule', eventId] });
      
      toast({
        title: "Message Sent",
        description: "AI assistant has responded to your request.",
        variant: "default"
      });
      
    } catch (error: any) {
      console.error('🚨 AI Chat Error:', error);
      
      // Add error message to conversation
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ Error: ${error.message || "Failed to process your request."}` 
      }]);
      
      toast({
        title: "Message Failed",
        description: error.message || "Failed to send message to AI assistant.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startChat = () => {
    setShowChat(true);
    if (conversation.length === 0) {
      setConversation([{
        role: 'assistant',
        content: 'Hello! I\'m your tournament scheduling assistant. What would you like to do today?\n\nI can help you with:\n• Moving games to different times or fields\n• Checking for scheduling conflicts\n• Swapping teams in games\n• Finding optimal time slots\n• Reviewing tomorrow\'s schedule\n\nJust tell me what you need in plain English! For example:\n"Move the Lions vs Tigers game to Field 2 at 3 PM"\n"Are there any conflicts with today\'s schedule?"\n"Show me all games on Field 1"'
      }]);
    }
  };

  const clearChat = () => {
    setConversation([]);
    setShowChat(false);
  };

  return (
    <div className="space-y-6">
      {/* Flight Configuration Overview */}
      {flightConfig && (
        <Card className="bg-black/30 border-purple-400/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Settings className="h-4 w-4 text-purple-400" />
              Current Flight Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {flightConfig.map((config: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-purple-300 text-sm">Game Length</div>
                  <div className="text-white font-semibold">{config.gameLength || 90} min</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Chat Interface */}
      {!showChat ? (
        <Card className="bg-black/30 border-blue-400/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="h-4 w-4 text-blue-400" />
              Schedule with AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-400/30 bg-blue-900/20 backdrop-blur-sm">
              <MessageCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-100">
                <strong>What would you like to do today?</strong> Get help with tournament scheduling, 
                moving games, checking conflicts, and optimizing your schedule with natural language commands.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={startChat}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-medium py-3"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Conversation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-black/30 border-blue-400/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="h-4 w-4 text-blue-400" />
              AI Tournament Assistant
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearChat}
                className="border-red-400/30 text-red-300 hover:bg-red-900/30"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowChat(false)}
                className="border-blue-400/30 text-blue-300 hover:bg-blue-900/30"
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Conversation Display */}
            <div className="h-64 overflow-y-auto space-y-3 p-4 bg-black/50 border border-blue-400/20 rounded-lg">
              {conversation.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-purple-900/50 text-purple-100 border border-purple-400/30'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-purple-900/50 text-purple-100 border border-purple-400/30 p-3 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your message..."
                className="bg-black/50 border-blue-400/30 text-white placeholder-blue-300"
                disabled={isLoading}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
              />
              <Button 
                onClick={sendMessage}
                disabled={isLoading || !userInput.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="outline" 
                className="border-blue-400/30 text-blue-300 hover:bg-blue-900/30 cursor-pointer"
                onClick={() => setUserInput("Show me all games scheduled for tomorrow")}
              >
                Tomorrow's games
              </Badge>
              <Badge 
                variant="outline" 
                className="border-blue-400/30 text-blue-300 hover:bg-blue-900/30 cursor-pointer"
                onClick={() => setUserInput("Are there any scheduling conflicts in today's schedule?")}
              >
                Check conflicts
              </Badge>
              <Badge 
                variant="outline" 
                className="border-blue-400/30 text-blue-300 hover:bg-blue-900/30 cursor-pointer"
                onClick={() => setUserInput("What games are on Field 1 today?")}
              >
                Field 1 schedule
              </Badge>
              <Badge 
                variant="outline" 
                className="border-blue-400/30 text-blue-300 hover:bg-blue-900/30 cursor-pointer"
                onClick={() => setUserInput("Find me an open time slot on Field 2")}
              >
                Find open slots
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}