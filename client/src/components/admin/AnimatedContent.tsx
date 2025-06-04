import { AnimatedContent as BaseAnimatedContent } from "../../components/ui/animation";

/**
 * @deprecated Use AnimatedContent from "../../components/ui/animation" instead.
 * This is kept for backwards compatibility but will be removed in a future update.
 */
export function AnimatedContent(props: React.ComponentProps<typeof BaseAnimatedContent>) {
  return <BaseAnimatedContent {...props} />;
}