import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Globe,
  FileText,
  Users,
  MapPin,
  Settings,
  Palette,
  CreditCard,
  Pencil,
  CheckCircle,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WizardStep, ReviewFormData, USA_TIMEZONES } from "./event-form-types";

interface EventReviewStepProps {
  formData: ReviewFormData;
  onEditStep: (step: WizardStep) => void;
}

// Stagger animation for review cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "Not set";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getTimezoneLabel(value: string): string {
  const tz = USA_TIMEZONES.find((t) => t.value === value);
  return tz ? tz.label : value;
}

function ReviewCard({
  title,
  icon: Icon,
  step,
  onEdit,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  step: WizardStep;
  onEdit: (step: WizardStep) => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="rounded-xl p-5 sm:p-6"
      style={{
        background: "rgba(15, 15, 35, 0.6)",
        border: "1px solid rgba(124, 58, 237, 0.12)",
        boxShadow: "0 0 20px rgba(124,58,237,0.05)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))",
              border: "1px solid rgba(124,58,237,0.2)",
            }}
          >
            <Icon className="h-4 w-4 text-violet-300" />
          </div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-violet-300 hover:text-violet-200 hover:bg-violet-500/10"
          onClick={() => onEdit(step)}
        >
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
      </div>
      <div
        className="h-px mb-4"
        style={{
          background: "linear-gradient(to right, rgba(124,58,237,0.2), transparent)",
        }}
      />
      {children}
    </motion.div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <Icon className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <span className="text-xs text-gray-500 block">{label}</span>
        <span className="text-sm text-gray-200">{value}</span>
      </div>
    </div>
  );
}

export function EventReviewStep({ formData, onEditStep }: EventReviewStepProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Success prompt */}
      <motion.div
        variants={cardVariants}
        className="flex items-center gap-3 p-4 rounded-lg"
        style={{
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.15)",
        }}
      >
        <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-emerald-300">
            Ready to create your event
          </p>
          <p className="text-xs text-emerald-400/70 mt-0.5">
            Review the details below, then click "Create Event" to finalize.
          </p>
        </div>
      </motion.div>

      {/* Event Information */}
      <ReviewCard
        title="Event Information"
        icon={FileText}
        step="event-information"
        onEdit={onEditStep}
      >
        <div className="space-y-1">
          <h4 className="text-lg font-semibold text-white mb-3">
            {formData.name || "Untitled Event"}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            <InfoRow
              icon={Calendar}
              label="Event Dates"
              value={`${formatDate(formData.startDate)} - ${formatDate(formData.endDate)}`}
            />
            <InfoRow
              icon={Globe}
              label="Timezone"
              value={getTimezoneLabel(formData.timezone)}
            />
            <InfoRow
              icon={Clock}
              label="Registration Deadline"
              value={formatDate(formData.applicationDeadline)}
            />
          </div>
          {(formData.hasDetails || formData.hasAgreement || formData.hasRefundPolicy) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.hasDetails && (
                <Badge variant="outline" className="border-violet-500/20 text-violet-300 text-xs">
                  Event Details
                </Badge>
              )}
              {formData.hasAgreement && (
                <Badge variant="outline" className="border-violet-500/20 text-violet-300 text-xs">
                  Agreement
                </Badge>
              )}
              {formData.hasRefundPolicy && (
                <Badge variant="outline" className="border-violet-500/20 text-violet-300 text-xs">
                  Refund Policy
                </Badge>
              )}
            </div>
          )}
        </div>
      </ReviewCard>

      {/* Age Groups */}
      <ReviewCard
        title="Age Groups"
        icon={Users}
        step="age-groups"
        onEdit={onEditStep}
      >
        <div className="flex items-center gap-3">
          {formData.seasonalScopeName && (
            <div>
              <span className="text-xs text-gray-500 block">Seasonal Scope</span>
              <span className="text-sm text-gray-200">{formData.seasonalScopeName}</span>
            </div>
          )}
          <Badge
            className="ml-auto text-xs"
            style={{
              background: "rgba(124,58,237,0.15)",
              color: "#c4b5fd",
              border: "1px solid rgba(124,58,237,0.2)",
            }}
          >
            {formData.ageGroupCount} age group{formData.ageGroupCount !== 1 ? "s" : ""}
          </Badge>
        </div>
      </ReviewCard>

      {/* Venues & Fields */}
      <ReviewCard
        title="Venues & Fields"
        icon={MapPin}
        step="venues-fields"
        onEdit={onEditStep}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Selected Venues</span>
            <Badge
              className="text-xs"
              style={{
                background: "rgba(124,58,237,0.15)",
                color: "#c4b5fd",
                border: "1px solid rgba(124,58,237,0.2)",
              }}
            >
              {formData.selectedComplexCount} venue{formData.selectedComplexCount !== 1 ? "s" : ""}
            </Badge>
          </div>
          {formData.complexNames.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.complexNames.map((name, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="border-gray-600/50 text-gray-300 text-xs"
                >
                  {name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </ReviewCard>

      {/* Settings & Branding */}
      <ReviewCard
        title="Settings & Branding"
        icon={Settings}
        step="settings-branding"
        onEdit={onEditStep}
      >
        <div className="space-y-3">
          {/* Payment */}
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500">Pay Later</span>
            <Badge
              className="text-xs ml-1"
              style={{
                background: formData.allowPayLater
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(239,68,68,0.1)",
                color: formData.allowPayLater ? "#6ee7b7" : "#fca5a5",
                border: `1px solid ${formData.allowPayLater ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.15)"}`,
              }}
            >
              {formData.allowPayLater ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-3">
            <Palette className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500">Colors</span>
            <div className="flex items-center gap-2 ml-1">
              <div
                className="w-5 h-5 rounded-full border border-white/10"
                style={{ backgroundColor: formData.primaryColor }}
                title={`Primary: ${formData.primaryColor}`}
              />
              <div
                className="w-5 h-5 rounded-full border border-white/10"
                style={{ backgroundColor: formData.secondaryColor }}
                title={`Secondary: ${formData.secondaryColor}`}
              />
            </div>
          </div>

          {/* Logo */}
          {formData.logoPreviewUrl && (
            <div className="flex items-center gap-3">
              <Image className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">Logo</span>
              <img
                src={formData.logoPreviewUrl}
                alt="Event logo"
                className="h-8 max-w-[80px] object-contain rounded"
              />
            </div>
          )}

          {formData.settingsCount > 0 && (
            <div className="text-xs text-gray-400">
              + {formData.settingsCount} custom setting{formData.settingsCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </ReviewCard>
    </motion.div>
  );
}
