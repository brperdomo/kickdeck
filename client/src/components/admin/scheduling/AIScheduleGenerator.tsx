import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Settings, Clock, Trophy, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface AIScheduleGeneratorProps {
  eventId: string;
}

export default function AIScheduleGenerator({ eventId }: AIScheduleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [scheduleResults, setScheduleResults] = useState<any>(null);
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

  const generateWithAI = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please provide instructions for the AI scheduler.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('🤖 Starting OpenAI Realtime API schedule generation...');
      
      const response = await fetch(`/api/admin/events/${eventId}/ai-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          useRealtimeAPI: true // Flag to use Realtime API instead of GPT-4o
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `AI scheduling failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ AI Schedule generation response:', data);
      
      setScheduleResults(data);
      
      // Refresh schedule data
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedule', eventId] });
      
      toast({
        title: "AI Schedule Generated",
        description: `Successfully generated ${data.gamesCreated || 0} games using OpenAI Realtime API.`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('❌ AI schedule generation error:', error);
      toast({
        title: "AI Scheduling Failed",
        description: error.message || "An error occurred during AI schedule generation.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Flight Configuration Overview */}
      <Card className="bg-black/30 border-purple-400/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-400" />
            Current Flight Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {flightConfig && flightConfig.length > 0 ? (
              flightConfig.map((config: any, index: number) => (
                <div key={index} className="space-y-2">
                  <Badge variant="outline" className="text-purple-300 border-purple-400/30">
                    {config.flightName || `Flight ${index + 1}`}
                  </Badge>
                  <div className="text-sm text-purple-200">
                    <div>Game: {config.gameLength || 90}min</div>
                    <div>Rest: {config.restPeriod || 90}min</div>
                    <div>Break: {config.bufferTime || 15}min</div>
                    <div>Field: {config.fieldSize || '7v7'}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 text-purple-300 text-sm">
                No flight configuration found. Using system defaults.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Prompt Interface */}
      <Card className="bg-black/30 border-blue-400/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            AI Schedule Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-400/30 bg-blue-900/20">
            <AlertTriangle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-100">
              <strong>OpenAI Realtime API:</strong> Provide natural language instructions for tournament scheduling. 
              The AI will use your flight configuration parameters and create an optimized schedule.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="ai-prompt" className="text-white">
              Scheduling Instructions
            </Label>
            <Textarea
              id="ai-prompt"
              placeholder="Example: Create a tournament schedule that prioritizes fairness, minimizes travel between fields, ensures adequate rest periods, and spreads games evenly across all days. Focus on maintaining competitive balance and avoiding back-to-back games for teams."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] bg-black/20 border-purple-400/30 text-white placeholder:text-purple-300/70"
              disabled={isGenerating}
            />
          </div>

          <Button
            onClick={generateWithAI}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating with AI...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate Schedule with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Display */}
      {scheduleResults && (
        <Card className="bg-black/30 border-green-400/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-400" />
              AI Generation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {scheduleResults.gamesCreated || 0}
                </div>
                <div className="text-sm text-green-300">Games Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {scheduleResults.qualityScore || 0}%
                </div>
                <div className="text-sm text-blue-300">Quality Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {scheduleResults.fieldsUsed || 0}
                </div>
                <div className="text-sm text-purple-300">Fields Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {scheduleResults.conflicts?.length || 0}
                </div>
                <div className="text-sm text-yellow-300">Conflicts</div>
              </div>
            </div>

            {scheduleResults.summary && (
              <div className="mt-4 p-4 bg-black/20 rounded-lg">
                <h4 className="text-white font-medium mb-2">AI Summary:</h4>
                <p className="text-purple-200 text-sm">{scheduleResults.summary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}