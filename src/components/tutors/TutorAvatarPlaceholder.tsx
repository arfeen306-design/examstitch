import { User } from 'lucide-react';

interface TutorAvatarPlaceholderProps {
  /** Optional name — wires the placeholder's accessible label. */
  name?: string;
  /** Classes applied to the outer wrapper (controls background, ring, etc.). */
  className?: string;
  /** Classes applied to the inner `<User>` icon (controls colour + size). */
  iconClassName?: string;
}

/**
 * Generic human-figure avatar shown when a tutor has no `thumbnail_url`
 * (or its image 404s). Uses Lucide's `User` silhouette on a subtle
 * dark gradient so it sits naturally in the existing slate / amber
 * scholar palette.
 *
 * The component renders pure visual chrome — no image logic. Callers
 * that already render `<Image>` for the populated case should fall
 * through to this component when the URL is null / errored.
 */
export default function TutorAvatarPlaceholder({
  name,
  className,
  iconClassName = 'h-1/2 w-1/2',
}: TutorAvatarPlaceholderProps) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700/80 to-slate-900 ${className ?? ''}`}
      role="img"
      aria-label={name ? `Photo placeholder for ${name}` : 'Default tutor avatar'}
    >
      <User
        className={`text-slate-400 ${iconClassName}`}
        strokeWidth={1.5}
        aria-hidden
      />
    </div>
  );
}
