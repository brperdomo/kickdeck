import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload, FileText, Calendar, Users, CheckCircle, Clock, AlertCircle,
  Edit, Mail, User, UserCheck, Plus, Download, CreditCard, RotateCcw,
  DollarSign, Receipt, FileCheck, ChevronDown, ChevronUp, Eye, EyeOff,
  ClipboardList, UserPlus, Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PaymentStatusBadge, TeamStatusBadge } from '@/components/ui/payment-status-badge';

interface Team {
  id: number;
  name: string;
  eventId: string;
  ageGroupId: number;
  addRosterLater: boolean;
  initialRosterComplete: boolean;
  rosterUploadedAt: string | null;
  rosterUploadMethod: string | null;
  submitterEmail: string;
  managerEmail: string;
  managerName?: string;
  managerPhone?: string;
  coach?: string;
  createdAt: string;
  playerCount: number;
  needsRoster: boolean;
  eventName?: string;
  ageGroupName?: string;
  ageGroup?: string;
}

interface TeamRegistration {
  id: number;
  teamName: string;
  eventName: string;
  eventId: string;
  ageGroup: string;
  registrationDate: string;
  registeredAt: string;
  status: string;
  amount: number;
  amountPaid: number;
  paymentId?: string;
  submitterEmail?: string;

  // Payment details
  paymentDate?: string;
  paymentStatus?: string;
  errorCode?: string;
  errorMessage?: string;
  payLater?: boolean;
  setupIntentId?: string;
  paymentMethodId?: string;
  stripeCustomerId?: string;

  // Refund details
  refundDate?: string;
  refundAmount?: number;
  refundReason?: string;

  // Terms acknowledgment
  termsAcknowledged?: boolean;
  termsAcknowledgedAt?: string;

  // Team contacts
  managerEmail?: string;
  managerName?: string;
  managerPhone?: string;
  coach?: string;
  headCoachName?: string;
  headCoachEmail?: string;
  headCoachPhone?: string;

  // Card details
  cardDetails?: {
    brand?: string;
    last4?: string;
  };

  // Submitter
  submitter?: {
    name: string;
    email: string;
  };
}

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  jerseyNumber?: number;
  dateOfBirth: string;
  medicalNotes?: string;
  emergencyContactFirstName: string;
  emergencyContactLastName: string;
  emergencyContactPhone: string;
}

// Helper to format currency from cents
function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Helper to format date
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

// Sub-component: inline player list for a team
function RosterPlayerList({ teamId }: { teamId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['roster-players', teamId],
    queryFn: async () => {
      const res = await fetch(`/api/member-roster/teams/${teamId}/players`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const players: Player[] = data?.players || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary/20 border-t-primary mr-2" />
        <span className="text-sm text-muted-foreground">Loading players...</span>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted mx-auto mb-2">
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">No players on this roster yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 px-4 py-2.5 border-b">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {players.length} Player{players.length !== 1 ? 's' : ''} on Roster
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-white/60">
            <th className="text-left px-4 py-2.5 font-semibold text-xs text-muted-foreground uppercase tracking-wider">#</th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs text-muted-foreground uppercase tracking-wider">Name</th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs text-muted-foreground uppercase tracking-wider">DOB</th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs text-muted-foreground uppercase tracking-wider hidden md:table-cell">Emergency Contact</th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Medical</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, idx) => (
            <tr key={p.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-blue-50/40 transition-colors`}>
              <td className="px-4 py-2.5">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {p.jerseyNumber ?? '-'}
                </span>
              </td>
              <td className="px-4 py-2.5 font-medium">{p.firstName} {p.lastName}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{p.dateOfBirth ? formatDate(p.dateOfBirth) : '-'}</td>
              <td className="px-4 py-2.5 hidden md:table-cell">
                <span className="font-medium">{p.emergencyContactFirstName} {p.emergencyContactLastName}</span>
                {p.emergencyContactPhone && <span className="text-muted-foreground text-xs ml-1">({p.emergencyContactPhone})</span>}
              </td>
              <td className="px-4 py-2.5 hidden lg:table-cell text-muted-foreground text-xs">
                {p.medicalNotes || 'None'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MemberDashboard() {
  const [selectedFiles, setSelectedFiles] = useState<Record<number, File>>({});
  const [uploadingTeamId, setUploadingTeamId] = useState<number | null>(null);
  const [editingTeam, setEditingTeam] = useState<TeamRegistration | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [detailsRegistration, setDetailsRegistration] = useState<TeamRegistration | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [expandedRosterTeams, setExpandedRosterTeams] = useState<Set<number>>(new Set());
  const [addPlayerTeamId, setAddPlayerTeamId] = useState<number | null>(null);
  const [newPlayerForm, setNewPlayerForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', jerseyNumber: '',
    medicalNotes: '', emergencyContactFirstName: '', emergencyContactLastName: '', emergencyContactPhone: ''
  });
  const [managerForm, setManagerForm] = useState({
    managerName: '',
    managerEmail: '',
    managerPhone: '',
    coachName: '',
    coachEmail: '',
    coachPhone: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Toggle card expand/collapse
  const toggleCard = (id: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle roster team expand/collapse
  const toggleRosterTeam = (id: number) => {
    setExpandedRosterTeams(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Function to generate and download CSV template
  const downloadCSVTemplate = () => {
    const csvHeaders = [
      'firstName', 'lastName', 'jerseyNumber', 'dateOfBirth',
      'medicalNotes', 'emergencyContactFirstName', 'emergencyContactLastName',
      'emergencyContactPhone'
    ];
    const csvContent = csvHeaders.join(',') + '\n' +
      'John,Doe,10,2010-05-15,None,Jane,Doe,(555) 123-4567\n' +
      'Jane,Smith,7,2011-08-22,Asthma inhaler,Bob,Smith,(555) 987-6543';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'roster_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Template downloaded', description: 'CSV template has been downloaded.' });
  };

  // Request email receipt via Stripe
  const requestEmailReceipt = async (paymentIntentId: string) => {
    try {
      const response = await fetch('/api/payments/resend-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      });
      if (!response.ok) throw new Error('Failed to send receipt');
      toast({ title: 'Receipt Sent', description: 'Payment receipt has been sent to your email address.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to send receipt. Please try again.', variant: 'destructive' });
    }
  };

  // Download terms acknowledgment PDF
  const downloadTermsAcknowledgment = async (teamId: number, teamName: string) => {
    try {
      // Use the member-facing endpoint that generates-if-needed + downloads
      const response = await fetch(`/api/member/teams/${teamId}/terms-acknowledgment`);
      if (!response.ok) throw new Error('Document not available');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `terms-acknowledgment-${teamName.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: 'Downloaded', description: 'Terms acknowledgment document has been downloaded.' });
    } catch {
      toast({ title: 'Error', description: 'Could not download terms document. Please contact support.', variant: 'destructive' });
    }
  };

  // Fetch teams that need roster uploads
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/member-roster/my-teams'],
    queryFn: async () => {
      const response = await fetch('/api/member-roster/my-teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      return data.teams as Team[];
    },
  });

  // Fetch all team registrations for this user
  const { data: registrations, isLoading: registrationsLoading } = useQuery({
    queryKey: ['/api/admin/members/me/registrations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/members/me/registrations');
      if (!response.ok) throw new Error('Failed to fetch registrations');
      const data = await response.json();
      return data.registrations as TeamRegistration[];
    },
  });

  // Upload roster mutation
  const uploadRosterMutation = useMutation({
    mutationFn: async ({ teamId, file }: { teamId: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`/api/member-roster/teams/${teamId}/roster`, { method: 'POST', body: formData });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({ title: 'Roster uploaded successfully', description: `${data.count} players added to the team.` });
      queryClient.invalidateQueries({ queryKey: ['/api/member-roster/my-teams'] });
      queryClient.invalidateQueries({ queryKey: ['roster-players', variables.teamId] });
      setSelectedFiles(prev => { const next = { ...prev }; delete next[variables.teamId]; return next; });
      setUploadingTeamId(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setUploadingTeamId(null);
    },
  });

  // Add individual player mutation
  const addPlayerMutation = useMutation({
    mutationFn: async ({ teamId, player }: { teamId: number; player: typeof newPlayerForm }) => {
      const response = await fetch(`/api/member-roster/teams/${teamId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to add player');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      toast({ title: 'Player added', description: 'Player has been added to the roster.' });
      queryClient.invalidateQueries({ queryKey: ['/api/member-roster/my-teams'] });
      queryClient.invalidateQueries({ queryKey: ['roster-players', variables.teamId] });
      setAddPlayerTeamId(null);
      setNewPlayerForm({
        firstName: '', lastName: '', dateOfBirth: '', jerseyNumber: '',
        medicalNotes: '', emergencyContactFirstName: '', emergencyContactLastName: '', emergencyContactPhone: ''
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add player', description: error.message, variant: 'destructive' });
    },
  });

  const handleFileSelectForTeam = (event: React.ChangeEvent<HTMLInputElement>, teamId: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({ title: 'Invalid file type', description: 'Please select a CSV file.', variant: 'destructive' });
        return;
      }
      setSelectedFiles(prev => ({ ...prev, [teamId]: file }));
    }
  };

  const handleUpload = (teamId: number) => {
    const file = selectedFiles[teamId];
    if (!file) {
      toast({ title: 'No file selected', description: 'Please select a CSV file to upload.', variant: 'destructive' });
      return;
    }
    setUploadingTeamId(teamId);
    uploadRosterMutation.mutate({ teamId, file });
  };

  // Update team contacts mutation
  const updateTeamContactsMutation = useMutation({
    mutationFn: async ({ teamId, contacts }: { teamId: number; contacts: typeof managerForm }) => {
      const response = await fetch(`/api/member-teams/${teamId}/contacts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contacts),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update team contacts');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Team contacts updated', description: data.message || 'Contacts updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/members/me/registrations'] });
      setIsEditDialogOpen(false);
      setEditingTeam(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    },
  });

  const handleEditTeamContacts = (team: TeamRegistration) => {
    setEditingTeam(team);
    let coachData = { name: team.headCoachName || '', email: team.headCoachEmail || '', phone: team.headCoachPhone || '' };
    if (!coachData.name && !coachData.email && !coachData.phone && team.coach) {
      try {
        const parsed = JSON.parse(team.coach);
        coachData = {
          name: parsed.headCoachName || parsed.name || '',
          email: parsed.headCoachEmail || parsed.email || '',
          phone: parsed.headCoachPhone || parsed.phone || ''
        };
      } catch {}
    }
    setManagerForm({
      managerName: team.managerName || '', managerEmail: team.managerEmail || '', managerPhone: team.managerPhone || '',
      coachName: coachData.name, coachEmail: coachData.email, coachPhone: coachData.phone
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveContacts = () => {
    if (!editingTeam) return;
    updateTeamContactsMutation.mutate({ teamId: editingTeam.id, contacts: managerForm });
  };

  if (teamsLoading || registrationsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="container mx-auto py-16">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
            </div>
            <p className="text-muted-foreground font-medium animate-pulse">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ──── Hero Header ──── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0zMHY2aDZ2LTZoLTZ6bTMwIDB2Nmg2di02aC02em0wIDMwdjZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Member Dashboard</h1>
            <p className="mt-1 text-white/80 text-sm sm:text-base">
              Manage your team registrations, payment details, and player rosters.
            </p>
          </div>
          {/* Stats pills */}
          <div className="relative mt-5 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-sm font-medium">
              <Users className="h-4 w-4" />
              {registrations?.length || 0} Registration{(registrations?.length || 0) !== 1 ? 's' : ''}
            </div>
            {teams && teams.length > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-sm font-medium">
                <ClipboardList className="h-4 w-4" />
                {teams.filter(t => t.needsRoster).length} Roster{teams.filter(t => t.needsRoster).length !== 1 ? 's' : ''} Pending
              </div>
            )}
          </div>
        </div>

        {/* ──── Tabs ──── */}
        <Tabs defaultValue="registrations" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="registrations" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold transition-all">
              <User className="h-4 w-4" />
              My Registrations
            </TabsTrigger>
            <TabsTrigger value="roster-uploads" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold transition-all">
              <Upload className="h-4 w-4" />
              Roster Uploads
            </TabsTrigger>
          </TabsList>

          {/* ──── REGISTRATIONS TAB ──── */}
          <TabsContent value="registrations" className="mt-6 space-y-4">
            {!registrations || registrations.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-muted mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No team registrations found</h3>
                  <p className="text-muted-foreground text-center max-w-sm">
                    You haven't registered any teams yet. Register for an event to see your teams here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              registrations.map((reg) => {
                const isExpanded = expandedCards.has(reg.id);
                const hasRefund = reg.paymentStatus === 'refunded' || reg.paymentStatus === 'partially_refunded';
                const isPaid = reg.paymentStatus === 'paid' || hasRefund;
                const hasCard = reg.cardDetails?.last4;

                return (
                  <Card key={reg.id} className="group border-0 shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                    {/* Accent top bar */}
                    <div className={`h-1 ${
                      reg.status === 'approved' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                      reg.status === 'rejected' ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                      hasRefund ? 'bg-gradient-to-r from-purple-400 to-violet-500' :
                      'bg-gradient-to-r from-blue-400 to-indigo-500'
                    }`} />

                    {/* ── Card Header ── */}
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <CardTitle className="text-lg font-bold flex flex-wrap items-center gap-2">
                            {reg.teamName}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {reg.eventName} &bull; {reg.ageGroup}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <TeamStatusBadge
                            status={reg.status}
                            payLater={reg.payLater}
                            setupIntentId={reg.setupIntentId}
                          />
                          <PaymentStatusBadge
                            status={reg.paymentStatus}
                            hasPaymentInfo={!!reg.setupIntentId}
                          />
                        </div>
                      </div>
                    </CardHeader>

                    {/* ── Summary ── */}
                    <CardContent className="pt-0 pb-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
                          <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
                          <div>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Registered</p>
                            <p className="font-medium text-sm leading-tight">{formatDate(reg.registrationDate)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
                          <DollarSign className="h-4 w-4 text-green-500 shrink-0" />
                          <div>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Amount</p>
                            <p className="font-semibold text-sm leading-tight">{formatCurrency(reg.amount || 0)}</p>
                          </div>
                        </div>
                        {hasCard && (
                          <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
                            <CreditCard className="h-4 w-4 text-blue-500 shrink-0" />
                            <div>
                              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Card</p>
                              <p className="font-medium text-sm leading-tight">
                                {reg.cardDetails?.brand
                                  ? `${reg.cardDetails.brand.charAt(0).toUpperCase() + reg.cardDetails.brand.slice(1)} ····${reg.cardDetails.last4}`
                                  : `····${reg.cardDetails?.last4}`
                                }
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Refund banner */}
                      {hasRefund && (
                        <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900">
                              <RotateCcw className="h-3.5 w-3.5 text-purple-600" />
                            </div>
                            <span className="font-semibold text-purple-700 dark:text-purple-300">
                              {reg.paymentStatus === 'refunded' ? 'Full Refund' : 'Partial Refund'} Issued
                            </span>
                            {reg.refundAmount && (
                              <span className="text-purple-600 dark:text-purple-400 font-bold ml-auto">
                                {formatCurrency(reg.refundAmount)}
                              </span>
                            )}
                          </div>
                          {reg.refundDate && (
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1.5 ml-9">
                              Processed on {formatDate(reg.refundDate)}
                              {reg.refundReason && ` — ${reg.refundReason}`}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Payment error banner */}
                      {reg.paymentStatus === 'failed' && reg.errorMessage && (
                        <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800 text-sm">
                          <p className="font-semibold text-red-700 dark:text-red-300">Payment Error</p>
                          <p className="text-red-600 dark:text-red-400 text-xs mt-0.5">{reg.errorMessage}</p>
                        </div>
                      )}

                      {/* Expand/collapse toggle */}
                      <button
                        className="mt-3 w-full flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground py-2 rounded-lg hover:bg-muted/60 transition-colors"
                        onClick={() => toggleCard(reg.id)}
                      >
                        {isExpanded ? (
                          <><ChevronUp className="h-4 w-4" /> Hide Details</>
                        ) : (
                          <><ChevronDown className="h-4 w-4" /> Show Details</>
                        )}
                      </button>

                      {/* ── Expanded details ── */}
                      {isExpanded && (
                        <div className="mt-2 space-y-4 animate-in slide-in-from-top-2 duration-200">
                          <Separator />

                          {/* Payment Information */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                              Payment Information
                            </h4>
                            <div className="bg-muted/30 rounded-xl p-4 space-y-2.5 text-sm border">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Charged:</span>
                                <span className="font-bold">{formatCurrency(reg.amount || 0)}</span>
                              </div>
                              {reg.paymentStatus && (
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Payment Status:</span>
                                  <PaymentStatusBadge status={reg.paymentStatus} />
                                </div>
                              )}
                              {reg.paymentDate && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Payment Date:</span>
                                  <span>{formatDate(reg.paymentDate)}</span>
                                </div>
                              )}
                              {hasCard && (
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Payment Method:</span>
                                  <div className="flex items-center gap-1">
                                    <CreditCard className="h-4 w-4" />
                                    <span>
                                      {reg.cardDetails?.brand
                                        ? `${reg.cardDetails.brand.charAt(0).toUpperCase() + reg.cardDetails.brand.slice(1)} ending in ${reg.cardDetails.last4}`
                                        : `Card ending in ${reg.cardDetails?.last4}`
                                      }
                                    </span>
                                  </div>
                                </div>
                              )}
                              {hasRefund && reg.refundAmount && (
                                <>
                                  <Separator className="my-2" />
                                  <div className="flex justify-between text-purple-700 dark:text-purple-300">
                                    <span>Refund Amount:</span>
                                    <span className="font-bold">{formatCurrency(reg.refundAmount)}</span>
                                  </div>
                                  {reg.refundDate && (
                                    <div className="flex justify-between text-purple-600 dark:text-purple-400">
                                      <span>Refund Date:</span>
                                      <span>{formatDate(reg.refundDate)}</span>
                                    </div>
                                  )}
                                  {reg.refundReason && (
                                    <div className="flex justify-between text-purple-600 dark:text-purple-400">
                                      <span>Reason:</span>
                                      <span>{reg.refundReason}</span>
                                    </div>
                                  )}
                                </>
                              )}
                              {reg.setupIntentId && !isPaid && (
                                <div className="mt-2 p-3 border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/30 rounded-lg text-sm">
                                  <p className="font-semibold text-blue-700 dark:text-blue-300">Payment Method Saved</p>
                                  <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">
                                    Your card will be charged after your registration is approved by the event organizer.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Team Contacts */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Team Contacts
                              </h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditTeamContacts(reg)}
                                className="flex items-center gap-1 h-7 text-xs rounded-full px-3"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-muted/30 rounded-xl p-4 space-y-1 text-sm border">
                                <p className="font-bold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider">Team Manager</p>
                                <p className="font-semibold">{reg.managerName || 'Not provided'}</p>
                                {reg.managerEmail && <p className="text-muted-foreground text-xs">{reg.managerEmail}</p>}
                                {reg.managerPhone && <p className="text-muted-foreground text-xs">{reg.managerPhone}</p>}
                              </div>
                              <div className="bg-muted/30 rounded-xl p-4 space-y-1 text-sm border">
                                <p className="font-bold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider">Head Coach</p>
                                {reg.headCoachName || reg.headCoachEmail ? (
                                  <>
                                    <p className="font-semibold">{reg.headCoachName || 'Not provided'}</p>
                                    {reg.headCoachEmail && <p className="text-muted-foreground text-xs">{reg.headCoachEmail}</p>}
                                    {reg.headCoachPhone && <p className="text-muted-foreground text-xs">{reg.headCoachPhone}</p>}
                                  </>
                                ) : (
                                  <p className="text-muted-foreground text-xs">No coach information provided</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Registration Metadata */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                              Registration Details
                            </h4>
                            <div className="bg-muted/30 rounded-xl p-4 space-y-2.5 text-sm border">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Registration Date:</span>
                                <span>{formatDate(reg.registrationDate)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Team Status:</span>
                                <TeamStatusBadge
                                  status={reg.status}
                                  payLater={reg.payLater}
                                  setupIntentId={reg.setupIntentId}
                                />
                              </div>
                              {reg.submitter && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Submitted by:</span>
                                  <span>{reg.submitter.name} ({reg.submitter.email})</span>
                                </div>
                              )}
                              {reg.termsAcknowledged && (
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Terms Accepted:</span>
                                  <span className="flex items-center gap-1 text-green-600 font-medium">
                                    <CheckCircle className="h-3 w-3" />
                                    {formatDate(reg.termsAcknowledgedAt)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>

                    {/* ── Card Footer ── */}
                    <CardFooter className="pt-0 pb-4 px-6 flex flex-wrap gap-2">
                      {isPaid && reg.paymentId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => requestEmailReceipt(reg.paymentId!)}
                          className="flex items-center gap-1 rounded-full text-xs"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          Email Receipt
                        </Button>
                      )}
                      {reg.termsAcknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadTermsAcknowledgment(reg.id, reg.teamName)}
                          className="flex items-center gap-1 rounded-full text-xs"
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                          Terms &amp; Refund Policy
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* ──── ROSTER UPLOADS TAB ──── */}
          <TabsContent value="roster-uploads" className="mt-6 space-y-6">
            {(() => {
              const teamsNeedingRoster = (teams || []).filter(t => t.needsRoster);
              const teamsWithRoster = (teams || []).filter(t => !t.needsRoster);

              if (!teams || teams.length === 0) {
                return (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-muted mb-4">
                        <ClipboardList className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">No roster teams found</h3>
                      <p className="text-muted-foreground text-center max-w-sm text-sm">
                        You don't have any teams registered with the "Add Roster Later" option.
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <>
                  {/* CSV template download bar */}
                  <div className="flex items-center justify-between rounded-2xl border-0 bg-white shadow-md p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-200/50">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">CSV Roster Template</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Columns: First Name, Last Name, DOB, Jersey #, Medical Notes, Emergency Contact
                        </p>
                      </div>
                    </div>
                    <Button onClick={downloadCSVTemplate} size="sm" className="flex items-center gap-2 shrink-0 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-md shadow-indigo-200/50">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>

                  {/* ── Teams NEEDING Rosters ── */}
                  {teamsNeedingRoster.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-100">
                          <AlertCircle className="h-4.5 w-4.5 text-orange-600" />
                        </div>
                        <h2 className="text-lg font-bold">
                          Roster Required
                          <span className="ml-2 text-sm font-normal text-muted-foreground">({teamsNeedingRoster.length})</span>
                        </h2>
                      </div>

                      <div className="grid gap-4">
                        {teamsNeedingRoster.map(team => {
                          const isExpanded = expandedRosterTeams.has(team.id);
                          const hasFile = !!selectedFiles[team.id];
                          const isUploading = uploadingTeamId === team.id;
                          const isAddingPlayer = addPlayerTeamId === team.id;

                          return (
                            <Card key={team.id} className="border-0 shadow-md overflow-hidden group">
                              {/* Orange accent bar */}
                              <div className="h-1 bg-gradient-to-r from-orange-400 to-amber-400" />

                              <CardHeader className="pb-2">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                  <div className="space-y-1.5 min-w-0 flex-1">
                                    <CardTitle className="text-lg font-bold flex flex-wrap items-center gap-2">
                                      {team.name}
                                      <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-semibold shadow-sm">
                                        <Clock className="h-3 w-3 mr-1" /> Roster Needed
                                      </Badge>
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                      {team.eventName || `Event ${team.eventId}`} &bull; {team.ageGroupName || team.ageGroup || `Age Group ${team.ageGroupId}`}
                                    </CardDescription>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
                                      <Users className="h-3.5 w-3.5" />
                                      {team.playerCount} player{team.playerCount !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="pt-0 space-y-4">
                                {/* Info row */}
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Registered {formatDate(team.createdAt)}
                                  </div>
                                </div>

                                {/* Upload zone */}
                                <div className="rounded-xl border-2 border-dashed border-orange-200/80 bg-gradient-to-br from-orange-50/50 to-amber-50/30 p-5 transition-all hover:border-orange-300 hover:shadow-sm">
                                  <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <label className="flex-1 w-full cursor-pointer">
                                      <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => handleFileSelectForTeam(e, team.id)}
                                        className="sr-only"
                                        disabled={isUploading}
                                      />
                                      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-white hover:bg-slate-50 transition-colors shadow-sm">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-orange-100">
                                          <Upload className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          {hasFile ? (
                                            <>
                                              <p className="text-sm font-semibold truncate text-foreground">{selectedFiles[team.id].name}</p>
                                              <p className="text-xs text-muted-foreground">{(selectedFiles[team.id].size / 1024).toFixed(1)} KB &bull; Ready to upload</p>
                                            </>
                                          ) : (
                                            <>
                                              <p className="text-sm font-semibold text-foreground">Choose CSV file</p>
                                              <p className="text-xs text-muted-foreground">Click to browse your files</p>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </label>
                                    <Button
                                      onClick={() => handleUpload(team.id)}
                                      disabled={!hasFile || isUploading}
                                      className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-200/50"
                                    >
                                      {isUploading ? (
                                        <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" /> Uploading...</>
                                      ) : (
                                        <><Upload className="h-4 w-4 mr-2" /> Upload Roster</>
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                {/* Action buttons row */}
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (isAddingPlayer) { setAddPlayerTeamId(null); }
                                      else { setAddPlayerTeamId(team.id); }
                                    }}
                                    className="flex items-center gap-1.5 rounded-full text-xs"
                                  >
                                    {isAddingPlayer ? <EyeOff className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                                    {isAddingPlayer ? 'Cancel' : 'Add Player Manually'}
                                  </Button>
                                  {team.playerCount > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleRosterTeam(team.id)}
                                      className="flex items-center gap-1.5 rounded-full text-xs"
                                    >
                                      {isExpanded ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                      {isExpanded ? 'Hide Players' : `View Players (${team.playerCount})`}
                                    </Button>
                                  )}
                                </div>

                                {/* Inline add player form */}
                                {isAddingPlayer && (
                                  <div className="rounded-xl border bg-white p-5 space-y-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
                                    <h4 className="text-sm font-bold flex items-center gap-2">
                                      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-indigo-100">
                                        <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
                                      </div>
                                      Add Player
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                      <div className="space-y-1">
                                        <Label className="text-xs">First Name *</Label>
                                        <Input value={newPlayerForm.firstName} onChange={e => setNewPlayerForm(p => ({ ...p, firstName: e.target.value }))} className="h-9" />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Last Name *</Label>
                                        <Input value={newPlayerForm.lastName} onChange={e => setNewPlayerForm(p => ({ ...p, lastName: e.target.value }))} className="h-9" />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Date of Birth *</Label>
                                        <Input type="date" value={newPlayerForm.dateOfBirth} onChange={e => setNewPlayerForm(p => ({ ...p, dateOfBirth: e.target.value }))} className="h-9" />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Jersey #</Label>
                                        <Input value={newPlayerForm.jerseyNumber} onChange={e => setNewPlayerForm(p => ({ ...p, jerseyNumber: e.target.value }))} className="h-9" />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <div className="space-y-1">
                                        <Label className="text-xs">Emergency First Name *</Label>
                                        <Input value={newPlayerForm.emergencyContactFirstName} onChange={e => setNewPlayerForm(p => ({ ...p, emergencyContactFirstName: e.target.value }))} className="h-9" />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Emergency Last Name *</Label>
                                        <Input value={newPlayerForm.emergencyContactLastName} onChange={e => setNewPlayerForm(p => ({ ...p, emergencyContactLastName: e.target.value }))} className="h-9" />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Emergency Phone *</Label>
                                        <Input value={newPlayerForm.emergencyContactPhone} onChange={e => setNewPlayerForm(p => ({ ...p, emergencyContactPhone: e.target.value }))} className="h-9" />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Medical Notes (optional)</Label>
                                      <Input value={newPlayerForm.medicalNotes} onChange={e => setNewPlayerForm(p => ({ ...p, medicalNotes: e.target.value }))} className="h-9" />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                      <Button variant="outline" size="sm" onClick={() => setAddPlayerTeamId(null)} className="rounded-full">Cancel</Button>
                                      <Button
                                        size="sm"
                                        className="rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white"
                                        disabled={!newPlayerForm.firstName || !newPlayerForm.lastName || !newPlayerForm.dateOfBirth || !newPlayerForm.emergencyContactFirstName || !newPlayerForm.emergencyContactLastName || !newPlayerForm.emergencyContactPhone || addPlayerMutation.isPending}
                                        onClick={() => addPlayerMutation.mutate({ teamId: team.id, player: newPlayerForm })}
                                      >
                                        {addPlayerMutation.isPending ? (
                                          <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" /> Adding...</>
                                        ) : (
                                          <><Plus className="h-4 w-4 mr-1" /> Add Player</>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {/* Player list */}
                                {isExpanded && (
                                  <div className="rounded-xl border overflow-hidden shadow-sm animate-in slide-in-from-top-2 duration-200">
                                    <RosterPlayerList teamId={team.id} />
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Teams WITH Complete Rosters ── */}
                  {teamsWithRoster.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                          <CheckCircle className="h-4.5 w-4.5 text-green-600" />
                        </div>
                        <h2 className="text-lg font-bold">
                          Rosters Complete
                          <span className="ml-2 text-sm font-normal text-muted-foreground">({teamsWithRoster.length})</span>
                        </h2>
                      </div>

                      <div className="grid gap-4">
                        {teamsWithRoster.map(team => {
                          const isExpanded = expandedRosterTeams.has(team.id);

                          return (
                            <Card key={team.id} className="border-0 shadow-md overflow-hidden">
                              <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-400" />
                              <CardHeader className="pb-2">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                  <div className="space-y-1.5 min-w-0 flex-1">
                                    <CardTitle className="text-lg font-bold flex flex-wrap items-center gap-2">
                                      {team.name}
                                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[11px] font-semibold shadow-sm">
                                        <CheckCircle className="h-3 w-3 mr-1" /> Complete
                                      </Badge>
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                      {team.eventName || `Event ${team.eventId}`} &bull; {team.ageGroupName || team.ageGroup || `Age Group ${team.ageGroupId}`}
                                    </CardDescription>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
                                      <Users className="h-3.5 w-3.5" />
                                      {team.playerCount} player{team.playerCount !== 1 ? 's' : ''}
                                    </div>
                                    {team.rosterUploadedAt && (
                                      <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                                        <Upload className="h-3.5 w-3.5" />
                                        Uploaded {formatDate(team.rosterUploadedAt)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="pt-0 pb-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRosterTeam(team.id)}
                                  className="flex items-center gap-1.5 rounded-full text-xs"
                                >
                                  {isExpanded ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                  {isExpanded ? 'Hide Players' : `View Players (${team.playerCount})`}
                                </Button>

                                {isExpanded && (
                                  <div className="mt-3 rounded-xl border overflow-hidden shadow-sm animate-in slide-in-from-top-2 duration-200">
                                    <RosterPlayerList teamId={team.id} />
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </TabsContent>
        </Tabs>

      {/* ──── Edit Team Contacts Dialog ──── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Team Contacts</DialogTitle>
            <DialogDescription>
              Update the manager and coach information for {editingTeam?.teamName}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2"><User className="h-4 w-4" /> Team Manager</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="managerName">Manager Name</Label>
                  <Input id="managerName" value={managerForm.managerName} onChange={(e) => setManagerForm({ ...managerForm, managerName: e.target.value })} placeholder="Enter manager name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerPhone">Manager Phone</Label>
                  <Input id="managerPhone" value={managerForm.managerPhone} onChange={(e) => setManagerForm({ ...managerForm, managerPhone: e.target.value })} placeholder="(555) 123-4567" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerEmail">Manager Email *</Label>
                <Input id="managerEmail" type="email" value={managerForm.managerEmail} onChange={(e) => setManagerForm({ ...managerForm, managerEmail: e.target.value })} placeholder="manager@example.com" required />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2"><UserCheck className="h-4 w-4" /> Head Coach</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coachName">Coach Name</Label>
                  <Input id="coachName" value={managerForm.coachName} onChange={(e) => setManagerForm({ ...managerForm, coachName: e.target.value })} placeholder="Enter coach name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coachPhone">Coach Phone</Label>
                  <Input id="coachPhone" value={managerForm.coachPhone} onChange={(e) => setManagerForm({ ...managerForm, coachPhone: e.target.value })} placeholder="(555) 123-4567" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coachEmail">Coach Email</Label>
                <Input id="coachEmail" type="email" value={managerForm.coachEmail} onChange={(e) => setManagerForm({ ...managerForm, coachEmail: e.target.value })} placeholder="coach@example.com" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveContacts} disabled={updateTeamContactsMutation.isPending || !managerForm.managerEmail}>
              {updateTeamContactsMutation.isPending ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Updating...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" /> Update Contacts</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
