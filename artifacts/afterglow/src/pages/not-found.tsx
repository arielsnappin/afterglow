import { Link } from 'wouter';
import { GlassCard } from '@workspace/afterglow-design-system/components/afterglow/glass-card';
import { Button } from '@workspace/afterglow-design-system/components/afterglow/button';

export default function NotFound() {
  return (
    <GlassCard className="max-w-lg" data-testid="state-not-found">
      <div className="type-label mb-2 text-pop-ink">404</div>
      <h1 className="type-title mb-2">Page not found</h1>
      <p>That address doesn't match anything in Afterglow.</p>
      <Button asChild className="mt-6"><Link href="/" data-testid="link-not-found-home">Back to Home</Link></Button>
    </GlassCard>
  );
}
