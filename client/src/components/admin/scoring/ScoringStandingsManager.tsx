import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trophy, Settings, Plus, Edit, Trash2, Calculator, Table } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const scoringRuleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  systemType: z.enum(["three_point", "ten_point", "custom"]),
  win: z.number().min(0, "Win points must be positive"),
  loss: z.number().min(0, "Loss points must be positive"),
  tie: z.number().min(0, "Tie points must be positive"),
  shutout: z.number().min(0, "Shutout points must be positive"),
  goalScored: z.number().min(0, "Goal scored points must be positive"),
  goalCap: z.number().min(1, "Goal cap must be at least 1"),
  redCard: z.number().max(0, "Red card penalty must be negative or zero"),
  yellowCard: z.number().max(0, "Yellow card penalty must be negative or zero"),
  tiebreaker1: z.string(),
  tiebreaker2: z.string(),
  tiebreaker3: z.string(),
  tiebreaker4: z.string(),
  tiebreaker5: z.string(),
  tiebreaker6: z.string(),
  tiebreaker7: z.string(),
  tiebreaker8: z.string(),
  isActive: z.boolean(),
});

type ScoringRuleFormData = z.infer<typeof scoringRuleSchema>;

interface ScoringRule {
  id: number;
  eventId: string;
  title: string;
  systemType: string;
  win: number;
  loss: number;
  tie: number;
  shutout: number;
  goalScored: number;
  goalCap: number;
  redCard: number;
  yellowCard: number;
  tiebreaker1: string;
  tiebreaker2: string;
  tiebreaker3: string;
  tiebreaker4: string;
  tiebreaker5: string;
  tiebreaker6: string;
  tiebreaker7: string;
  tiebreaker8: string;
  isActive: boolean;
  createdAt: string;
}

interface TeamStanding {
  id: number;
  teamId: number;
  teamName: string;
  position: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  goalsScored: number;
  goalsAllowed: number;
  goalDifferential: number;
  shutouts: number;
  yellowCards: number;
  redCards: number;
  totalPoints: number;
  fairPlayPoints: number;
}

interface ScoringStandingsManagerProps {
  eventId: string;
}

const tiebreakerOptions = [
  { value: "total_points", label: "Total Points" },
  { value: "head_to_head", label: "Head-to-Head Result" },
  { value: "goal_differential", label: "Goal Differential" },
  { value: "goals_scored", label: "Most Goals Scored" },
  { value: "goals_allowed", label: "Fewest Goals Allowed" },
  { value: "shutouts", label: "Total Shutouts" },
  { value: "fair_play", label: "Fair Play Points" },
  { value: "coin_toss", label: "Coin Toss/Penalty Kicks" },
];

const presetSystems = {
  three_point: {
    title: "Three-Point System (Standard)",
    win: 3,
    loss: 0,
    tie: 1,
    shutout: 0,
    goalScored: 0,
    goalCap: 3,
    redCard: 0,
    yellowCard: 0,
  },
  ten_point: {
    title: "Ten-Point System (Performance-Based)",
    win: 6,
    loss: 0,
    tie: 3,
    shutout: 1,
    goalScored: 1,
    goalCap: 3,
    redCard: -1,
    yellowCard: 0,
  },
};

export default function ScoringStandingsManager({ eventId }: ScoringStandingsManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ScoringRule | null>(null);
  const [activeTab, setActiveTab] = useState("rules");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch scoring rules
  const { data: scoringRules, isLoading: rulesLoading } = useQuery({
    queryKey: ["scoring-rules", eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/scoring-rules`);
      if (!response.ok) throw new Error("Failed to fetch scoring rules");
      return response.json() as Promise<ScoringRule[]>;
    },
  });

  // Fetch team standings
  const { data: standings, isLoading: standingsLoading } = useQuery({
    queryKey: ["team-standings", eventId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/standings`);
      if (!response.ok) throw new Error("Failed to fetch standings");
      return response.json() as Promise<TeamStanding[]>;
    },
  });

  const form = useForm<ScoringRuleFormData>({
    resolver: zodResolver(scoringRuleSchema),
    defaultValues: {
      title: "",
      systemType: "three_point",
      win: 3,
      loss: 0,
      tie: 1,
      shutout: 0,
      goalScored: 0,
      goalCap: 3,
      redCard: 0,
      yellowCard: 0,
      tiebreaker1: "total_points",
      tiebreaker2: "head_to_head",
      tiebreaker3: "goal_differential",
      tiebreaker4: "goals_scored",
      tiebreaker5: "goals_allowed",
      tiebreaker6: "shutouts",
      tiebreaker7: "fair_play",
      tiebreaker8: "coin_toss",
      isActive: false,
    },
  });

  // Create/Update scoring rule mutation
  const saveScoringRule = useMutation({
    mutationFn: async (data: ScoringRuleFormData & { id?: number }) => {
      const url = data.id 
        ? `/api/admin/events/${eventId}/scoring-rules/${data.id}`
        : `/api/admin/events/${eventId}/scoring-rules`;
      
      const response = await fetch(url, {
        method: data.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error("Failed to save scoring rule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoring-rules", eventId] });
      setIsCreateDialogOpen(false);
      setEditingRule(null);
      form.reset();
      toast({
        title: "Success",
        description: "Scoring rule saved successfully",
      });
    },
  });

  // Delete scoring rule mutation
  const deleteScoringRule = useMutation({
    mutationFn: async (ruleId: number) => {
      const response = await fetch(`/api/admin/events/${eventId}/scoring-rules/${ruleId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete scoring rule");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoring-rules", eventId] });
      toast({
        title: "Success",
        description: "Scoring rule deleted successfully",
      });
    },
  });

  // Recalculate standings mutation
  const recalculateStandings = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/events/${eventId}/standings/recalculate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to recalculate standings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-standings", eventId] });
      toast({
        title: "Success",
        description: "Standings recalculated successfully",
      });
    },
  });

  const handleSystemTypeChange = (systemType: "three_point" | "ten_point" | "custom") => {
    if (systemType === "three_point" || systemType === "ten_point") {
      const preset = presetSystems[systemType];
      Object.entries(preset).forEach(([key, value]) => {
        form.setValue(key as keyof ScoringRuleFormData, value as any);
      });
    }
  };

  const handleEdit = (rule: ScoringRule) => {
    setEditingRule(rule);
    form.reset({
      title: rule.title,
      systemType: rule.systemType as "three_point" | "ten_point" | "custom",
      win: rule.win,
      loss: rule.loss,
      tie: rule.tie,
      shutout: rule.shutout,
      goalScored: rule.goalScored,
      goalCap: rule.goalCap,
      redCard: rule.redCard,
      yellowCard: rule.yellowCard,
      tiebreaker1: rule.tiebreaker1,
      tiebreaker2: rule.tiebreaker2,
      tiebreaker3: rule.tiebreaker3,
      tiebreaker4: rule.tiebreaker4,
      tiebreaker5: rule.tiebreaker5,
      tiebreaker6: rule.tiebreaker6,
      tiebreaker7: rule.tiebreaker7,
      tiebreaker8: rule.tiebreaker8,
      isActive: rule.isActive,
    });
    setIsCreateDialogOpen(true);
  };

  const onSubmit = (data: ScoringRuleFormData) => {
    const submitData = editingRule 
      ? { ...data, id: editingRule.id }
      : data;
    saveScoringRule.mutate(submitData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Scoring & Standings
          </h2>
          <p className="text-muted-foreground">
            Configure scoring systems and view tournament standings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => recalculateStandings.mutate()}
            disabled={recalculateStandings.isPending}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Recalculate Standings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">Scoring Rules</TabsTrigger>
          <TabsTrigger value="standings">Team Standings</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Scoring Rules Configuration</h3>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Scoring Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? "Edit Scoring Rule" : "Create Scoring Rule"}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rule Title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Three-Point System" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="systemType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>System Type</FormLabel>
                            <Select 
                              value={field.value} 
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleSystemTypeChange(value as "three_point" | "ten_point" | "custom");
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="three_point">Three-Point System</SelectItem>
                                <SelectItem value="ten_point">Ten-Point System</SelectItem>
                                <SelectItem value="custom">Custom System</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Point Values</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="win"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Win</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="tie"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tie/Draw</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="loss"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Loss</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="shutout"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shutout Bonus</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Performance-Based Scoring</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="goalScored"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Points per Goal</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="goalCap"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Goal Cap</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="redCard"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Red Card Penalty</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="yellowCard"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Yellow Card Penalty</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tiebreaker Order</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                          <FormField
                            key={num}
                            control={form.control}
                            name={`tiebreaker${num}` as keyof ScoringRuleFormData}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tiebreaker {num}</FormLabel>
                                <Select value={field.value as string} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {tiebreakerOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </CardContent>
                    </Card>

                    <div className="flex items-center justify-between">
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Active Rule</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsCreateDialogOpen(false);
                            setEditingRule(null);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={saveScoringRule.isPending}>
                          {editingRule ? "Update Rule" : "Create Rule"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {rulesLoading ? (
            <div className="text-center py-8">Loading scoring rules...</div>
          ) : (
            <div className="grid gap-4">
              {scoringRules?.map((rule) => (
                <Card key={rule.id} className={rule.isActive ? "border-green-500" : ""}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{rule.title}</h4>
                          {rule.isActive && <Badge variant="default">Active</Badge>}
                          <Badge variant="secondary">{rule.systemType.replace('_', ' ')}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-4">
                          <span>Win: {rule.win}pts</span>
                          <span>Tie: {rule.tie}pts</span>
                          <span>Loss: {rule.loss}pts</span>
                          <span>Shutout: +{rule.shutout}pts</span>
                          {rule.goalScored > 0 && <span>Goal: +{rule.goalScored}pts (cap: {rule.goalCap})</span>}
                          {rule.redCard < 0 && <span>Red Card: {rule.redCard}pts</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteScoringRule.mutate(rule.id)}
                          disabled={rule.isActive}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="standings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Team Standings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {standingsLoading ? (
                <div className="text-center py-8">Loading standings...</div>
              ) : standings && standings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Pos</th>
                        <th className="text-left p-2">Team</th>
                        <th className="text-center p-2">GP</th>
                        <th className="text-center p-2">W</th>
                        <th className="text-center p-2">L</th>
                        <th className="text-center p-2">T</th>
                        <th className="text-center p-2">GF</th>
                        <th className="text-center p-2">GA</th>
                        <th className="text-center p-2">GD</th>
                        <th className="text-center p-2">SHO</th>
                        <th className="text-center p-2">YC</th>
                        <th className="text-center p-2">RC</th>
                        <th className="text-center p-2 font-semibold">PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((standing, index) => (
                        <tr key={standing.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-semibold">{standing.position || index + 1}</td>
                          <td className="p-2">{standing.teamName}</td>
                          <td className="text-center p-2">{standing.gamesPlayed}</td>
                          <td className="text-center p-2">{standing.wins}</td>
                          <td className="text-center p-2">{standing.losses}</td>
                          <td className="text-center p-2">{standing.ties}</td>
                          <td className="text-center p-2">{standing.goalsScored}</td>
                          <td className="text-center p-2">{standing.goalsAllowed}</td>
                          <td className="text-center p-2">{standing.goalDifferential}</td>
                          <td className="text-center p-2">{standing.shutouts}</td>
                          <td className="text-center p-2">{standing.yellowCards}</td>
                          <td className="text-center p-2">{standing.redCards}</td>
                          <td className="text-center p-2 font-bold">{standing.totalPoints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No standings data available. Games need to be completed to generate standings.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}