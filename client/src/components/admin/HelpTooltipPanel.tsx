import { HelpCircle, BookOpen, Lightbulb, ArrowRight, Zap, PlayCircle, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { HELP_CONTENT, type HelpTip } from '@/config/help-content';
import type { View } from '@/config/admin-navigation';

interface HelpTooltipPanelProps {
  currentView: string;
  onOpenChatbot?: () => void;
  aiEnabled?: boolean;
}

const categoryIcon: Record<string, React.ReactNode> = {
  'getting-started': <PlayCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />,
  'key-actions': <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />,
  'workflow': <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />,
  'tips': <Lightbulb className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />,
};

const categoryLabel: Record<string, string> = {
  'getting-started': 'Getting Started',
  'key-actions': 'Key Action',
  'workflow': 'Workflow',
  'tips': 'Tip',
};

function TipCard({ tip }: { tip: HelpTip }) {
  const icon = tip.category ? categoryIcon[tip.category] : <Info className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />;
  const label = tip.category ? categoryLabel[tip.category] : '';

  return (
    <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-500/10 hover:border-purple-500/25 transition-colors">
      <div className="flex items-start gap-2.5">
        {icon}
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-white leading-tight">{tip.title}</h4>
          <p className="text-xs text-purple-200/60 mt-1 leading-relaxed">{tip.description}</p>
          {label && (
            <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wider text-purple-400/60 font-medium">
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function HelpTooltipPanel({ currentView, onOpenChatbot, aiEnabled }: HelpTooltipPanelProps) {
  const helpContent = HELP_CONTENT[currentView as View];

  if (!helpContent) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full relative group"
          style={{
            color: 'rgba(167, 139, 250, 0.7)',
          }}
          title="Page Help"
        >
          <HelpCircle className="h-5 w-5 transition-colors group-hover:text-purple-300" />
          {/* Subtle pulse ring */}
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: 'rgba(124, 58, 237, 0.3)' }}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[380px] p-0 border-0"
        style={{
          background: 'rgba(10, 8, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(124, 58, 237, 0.25)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(124, 58, 237, 0.1)',
          borderRadius: '12px',
        }}
        side="bottom"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div
          className="p-4"
          style={{ borderBottom: '1px solid rgba(124, 58, 237, 0.15)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(109,40,217,0.2) 100%)',
                border: '1px solid rgba(124,58,237,0.25)',
              }}
            >
              <BookOpen className="h-4 w-4 text-purple-300" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{helpContent.pageTitle}</h3>
              <p className="text-xs text-purple-200/50 mt-0.5 leading-relaxed">
                {helpContent.pageSummary}
              </p>
            </div>
          </div>
        </div>

        {/* Tips list */}
        <div className="max-h-[320px] overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-purple-600/40 scrollbar-track-transparent">
          {helpContent.tips.map((tip) => (
            <TipCard key={tip.id} tip={tip} />
          ))}
        </div>

        {/* Footer — link to AI chatbot (hidden when AI is not configured) */}
        {onOpenChatbot && aiEnabled !== false && (
          <div
            className="p-3"
            style={{ borderTop: '1px solid rgba(124, 58, 237, 0.15)' }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenChatbot}
              className="w-full justify-between text-purple-300 hover:text-white hover:bg-purple-800/20 text-xs h-9"
            >
              <span>Need more help? Ask the AI Assistant</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
