import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Trophy, Settings, Plus, Save, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScoringRule {
  id: number;
  title: string;
  systemType: string;
  scoring: {
    win: number;
    loss: number;
    tie: number;
    shutout: number;
    goalScored: number;
    goalCap: number;
    redCard: number;
    yellowCard: number;
  };
  tiebreakers: {
    position1: string;
    position2: string;
    position3: string;
    position4: string;
    position5: string;
    position6: string;
    position7: string;
    position8: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface TiebreakerOption {
  value: string;
  label: string;
  description: string;
}

const ScoringRulesManager = ({ eventId }: { eventId: string }) => {
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [tiebreakerOptions, setTiebreakerOptions] = useState<TiebreakerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventName, setEventName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // New rule form state
  const [newRule, setNewRule] = useState({
    title: '',
    systemType: 'three_point',
    scoring: {
      win: 3,
      loss: 0,
      tie: 1,
      shutout: 0,
      goalScored: 0,
      goalCap: 3,
      redCard: 0,
      yellowCard: 0
    },
    tiebreakers: {
      position1: 'total_points',
      position2: 'head_to_head',
      position3: 'goal_differential',
      position4: 'goals_scored',
      position5: 'goals_allowed',
      position6: 'shutouts',
      position7: 'fair_play',
      position8: 'coin_toss'
    }
  });

  // Load scoring rules and tiebreaker options
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load tiebreaker options
        const tiebreakerResponse = await fetch(`/api/admin/scoring-rules/${eventId}/tiebreaker-options`);
        if (tiebreakerResponse.ok) {
          const tiebreakerData = await tiebreakerResponse.json();
          setTiebreakerOptions(tiebreakerData.options || []);
        }

        // Load existing rules for this event
        const rulesResponse = await fetch(`/api/admin/scoring-rules/${eventId}`);
        if (rulesResponse.ok) {
          const rulesData = await rulesResponse.json();
          setRules(rulesData.rules || []);
          setEventName(rulesData.event?.name || '');
        }
      } catch (error) {
        console.error('Error loading scoring rules:', error);
        toast({
          title: 'Error',
          description: 'Failed to load scoring rules configuration.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadData();
    }
  }, [eventId, toast]);

  const handleSaveRule = async () => {
    try {
      setSaving(true);

      const response = await fetch(`/api/admin/scoring-rules/${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newRule.title,
          systemType: newRule.systemType,
          scoring: newRule.scoring,
          tiebreakers: newRule.tiebreakers,
          isActive: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save scoring rule');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: 'Scoring rule saved successfully.'
      });

      // Reload rules
      const rulesResponse = await fetch(`/api/admin/scoring-rules/${eventId}`);
      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json();
        setRules(rulesData.rules || []);
      }

      // Reset form
      setNewRule({
        title: '',
        systemType: 'three_point',
        scoring: {
          win: 3,
          loss: 0,
          tie: 1,
          shutout: 0,
          goalScored: 0,
          goalCap: 3,
          redCard: 0,
          yellowCard: 0
        },
        tiebreakers: {
          position1: 'total_points',
          position2: 'head_to_head',
          position3: 'goal_differential',
          position4: 'goals_scored',
          position5: 'goals_allowed',
          position6: 'shutouts',
          position7: 'fair_play',
          position8: 'coin_toss'
        }
      });

      setActiveTab('overview');

    } catch (error) {
      console.error('Error saving scoring rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save scoring rule.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm('Are you sure you want to delete this scoring rule?')) return;

    try {
      const response = await fetch(`/api/admin/scoring-rules/${eventId}/${ruleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete scoring rule');
      }

      toast({
        title: 'Success',
        description: 'Scoring rule deleted successfully.'
      });

      // Reload rules
      const rulesResponse = await fetch(`/api/admin/scoring-rules/${eventId}`);
      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json();
        setRules(rulesData.rules || []);
      }

    } catch (error) {
      console.error('Error deleting scoring rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete scoring rule.',
        variant: 'destructive'
      });
    }
  };

  const getTiebreakerLabel = (value: string) => {
    const option = tiebreakerOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scoring Rules & Tiebreakers</h1>
          <p className="text-muted-foreground">
            Configure point systems and tiebreaker priorities for {eventName}
          </p>
        </div>
        <Button onClick={() => setActiveTab('create')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Scoring Rule
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Trophy className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Rule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {rules.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No scoring rules configured. Create your first scoring rule to define point systems and tiebreaker priorities.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule) => (
                <Card key={rule.id} className={rule.isActive ? 'border-green-500' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle>{rule.title}</CardTitle>
                        {rule.isActive && <Badge variant="default">Active</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{rule.systemType.replace('_', ' ')}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Created on {new Date(rule.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{rule.scoring.win}</div>
                        <div className="text-sm text-muted-foreground">Win Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{rule.scoring.tie}</div>
                        <div className="text-sm text-muted-foreground">Tie Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{rule.scoring.loss}</div>
                        <div className="text-sm text-muted-foreground">Loss Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{rule.scoring.shutout}</div>
                        <div className="text-sm text-muted-foreground">Shutout Bonus</div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-2">Tiebreaker Priority Order</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                        {Object.entries(rule.tiebreakers).map(([position, value], index) => (
                          <div key={position} className="flex items-center gap-2">
                            <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                              {index + 1}
                            </Badge>
                            <span className="text-sm">{getTiebreakerLabel(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Create New Scoring Rule
              </CardTitle>
              <CardDescription>
                Define the point system and tiebreaker priorities for standings calculation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Rule Title</Label>
                  <Input
                    id="title"
                    value={newRule.title}
                    onChange={(e) => setNewRule(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Standard 3-Point System"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="systemType">System Type</Label>
                  <Select
                    value={newRule.systemType}
                    onValueChange={(value) => setNewRule(prev => ({ ...prev, systemType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="three_point">Three Point</SelectItem>
                      <SelectItem value="ten_point">Ten Point</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Point Values</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="win">Win Points</Label>
                    <Input
                      id="win"
                      type="number"
                      value={newRule.scoring.win}
                      onChange={(e) => setNewRule(prev => ({
                        ...prev,
                        scoring: { ...prev.scoring, win: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tie">Tie Points</Label>
                    <Input
                      id="tie"
                      type="number"
                      value={newRule.scoring.tie}
                      onChange={(e) => setNewRule(prev => ({
                        ...prev,
                        scoring: { ...prev.scoring, tie: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loss">Loss Points</Label>
                    <Input
                      id="loss"
                      type="number"
                      value={newRule.scoring.loss}
                      onChange={(e) => setNewRule(prev => ({
                        ...prev,
                        scoring: { ...prev.scoring, loss: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shutout">Shutout Bonus</Label>
                    <Input
                      id="shutout"
                      type="number"
                      value={newRule.scoring.shutout}
                      onChange={(e) => setNewRule(prev => ({
                        ...prev,
                        scoring: { ...prev.scoring, shutout: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Tiebreaker Priority (Position 1 = First, Position 8 = Last)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(newRule.tiebreakers).map(([position, value]) => (
                    <div key={position} className="space-y-2">
                      <Label htmlFor={position}>
                        Position {position.replace('position', '')} Tiebreaker
                      </Label>
                      <Select
                        value={value}
                        onValueChange={(selectedValue) => setNewRule(prev => ({
                          ...prev,
                          tiebreakers: { ...prev.tiebreakers, [position]: selectedValue }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tiebreakerOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div>{option.label}</div>
                                <div className="text-xs text-muted-foreground">{option.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('overview')}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRule}
                  disabled={saving || !newRule.title}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Scoring Rule'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScoringRulesManager;