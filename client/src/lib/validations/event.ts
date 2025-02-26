import { z } from "zod";

export const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  timezone: z.string().min(1, "Timezone is required"),
  applicationDeadline: z.string().min(1, "Application deadline is required"),
  details: z.string().optional().nullable(),
  agreement: z.string().optional().nullable(),
  refundPolicy: z.string().optional().nullable(),
});

export const ageGroupSchema = z.object({
  gender: z.enum(["Male", "Female", "Mixed"]),
  projectedTeams: z.number().min(0),
  ageGroup: z.string().min(1, "Age group is required"),
  fieldSize: z.enum(["3v3", "4v4", "5v5", "6v6", "7v7", "8v8", "9v9", "10v10", "11v11", "N/A"]),
  amountDue: z.number().min(0),
});

export const scoringRuleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  win: z.number(),
  loss: z.number(),
  tie: z.number(),
  goalCapped: z.number(),
  shutout: z.number(),
  redCard: z.number(),
  tieBreaker: z.enum(["head_to_head", "goal_difference", "goals_scored"]),
});

export type EventInformationValues = z.infer<typeof createEventSchema>;
export type ScoringRuleValues = z.infer<typeof scoringRuleSchema>;
export type AgeGroupValues = z.infer<typeof ageGroupSchema>;
