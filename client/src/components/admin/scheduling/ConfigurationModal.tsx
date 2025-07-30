import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Trophy, 
  Users, 
  MapPin, 
  Clock, 
  ExternalLink,
  ArrowRight 
} from 'lucide-react';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string | number;
  missingConfigurations: string[];
}

export default function ConfigurationModal({ 
  isOpen, 
  onClose, 
  eventId, 
  missingConfigurations 
}: ConfigurationModalProps) {
  const [activeTab, setActiveTab] = useState('game-formats');

  const configurationSteps = [
    {
      id: 'game-formats',
      title: 'Game Formats & Rules',
      description: 'Configure game duration, field sizes, and format rules for each age group',
      icon: Trophy,
      route: `/admin/events/${eventId}/game-metadata`,
      priority: 'high',
      requiredFor: ['Team metadata', 'Division rules']
    },
    {
      id: 'flights-brackets',
      title: 'Flights & Brackets',
      description: 'Create flights and bracket structures for tournament organization',
      icon: Users,
      route: `/admin/events/${eventId}/flexible-age-groups`,
      priority: 'high',
      requiredFor: ['Bracket logic', 'Team organization']
    },
    {
      id: 'schedule-constraints',
      title: 'Schedule Constraints',
      description: 'Set operating hours, rest periods, and scheduling constraints',
      icon: Clock,
      route: `/admin/events/${eventId}/game-metadata`,
      priority: 'medium',
      requiredFor: ['Game slots', 'Team spacing']
    },
    {
      id: 'tournament-params',
      title: 'Tournament Parameters',
      description: 'Configure overall tournament settings and parameters',
      icon: Settings,
      route: `/admin/events/${eventId}/tournament-parameters`,
      priority: 'medium',
      requiredFor: ['Tournament setup', 'General configuration']
    },
    {
      id: 'field-management',
      title: 'Field Management',
      description: 'Manage fields, complexes, and venue information',
      icon: MapPin,
      route: `/admin/complexes`,
      priority: 'low',
      requiredFor: ['Field inventory']
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleNavigateToConfiguration = (route: string) => {
    window.open(route, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5" />
            Tournament Configuration Setup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-blue-800">
                Complete these configuration steps to ensure your tournament has all the foundational 
                building blocks needed for successful automated scheduling.
              </p>
            </CardContent>
          </Card>

          {/* Configuration Steps */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="high-priority">High Priority</TabsTrigger>
              <TabsTrigger value="medium-priority">Medium Priority</TabsTrigger>
              <TabsTrigger value="all-steps">All Steps</TabsTrigger>
            </TabsList>

            <TabsContent value="high-priority" className="space-y-4">
              {configurationSteps
                .filter(step => step.priority === 'high')
                .map((step) => {
                  const IconComponent = step.icon;
                  return (
                    <Card key={step.id} className="border-2 hover:border-blue-300 transition-colors">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                            <div>
                              <CardTitle className="text-lg">{step.title}</CardTitle>
                              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                            </div>
                          </div>
                          <Badge className={getPriorityColor(step.priority)}>
                            {step.priority.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Required for:</span> {step.requiredFor.join(', ')}
                          </div>
                          <Button 
                            onClick={() => handleNavigateToConfiguration(step.route)}
                            className="flex items-center gap-2"
                          >
                            Configure
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </TabsContent>

            <TabsContent value="medium-priority" className="space-y-4">
              {configurationSteps
                .filter(step => step.priority === 'medium')
                .map((step) => {
                  const IconComponent = step.icon;
                  return (
                    <Card key={step.id} className="border-2 hover:border-yellow-300 transition-colors">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-5 w-5 text-yellow-600" />
                            <div>
                              <CardTitle className="text-lg">{step.title}</CardTitle>
                              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                            </div>
                          </div>
                          <Badge className={getPriorityColor(step.priority)}>
                            {step.priority.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Required for:</span> {step.requiredFor.join(', ')}
                          </div>
                          <Button 
                            onClick={() => handleNavigateToConfiguration(step.route)}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            Configure
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </TabsContent>

            <TabsContent value="all-steps" className="space-y-4">
              {configurationSteps.map((step) => {
                const IconComponent = step.icon;
                return (
                  <Card key={step.id} className="border-2 hover:border-blue-300 transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">{step.title}</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                          </div>
                        </div>
                        <Badge className={getPriorityColor(step.priority)}>
                          {step.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Required for:</span> {step.requiredFor.join(', ')}
                        </div>
                        <Button 
                          onClick={() => handleNavigateToConfiguration(step.route)}
                          variant={step.priority === 'high' ? 'default' : 'outline'}
                          className="flex items-center gap-2"
                        >
                          Configure
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleNavigateToConfiguration(`/admin/events/${eventId}/game-metadata`)}
                  className="flex items-center gap-2 justify-start"
                >
                  <Settings className="h-4 w-4" />
                  Game Metadata
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleNavigateToConfiguration(`/admin/events/${eventId}/flexible-age-groups`)}
                  className="flex items-center gap-2 justify-start"
                >
                  <Users className="h-4 w-4" />
                  Age Groups
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleNavigateToConfiguration('/admin/complexes')}
                  className="flex items-center gap-2 justify-start"
                >
                  <MapPin className="h-4 w-4" />
                  Fields & Venues
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleNavigateToConfiguration(`/admin/events/${eventId}/tournament-parameters`)}
                  className="flex items-center gap-2 justify-start"
                >
                  <Trophy className="h-4 w-4" />
                  Tournament Settings
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}