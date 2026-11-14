import type * as React from 'react';

export type Tone = 'pop' | 'zap' | 'sun' | 'sky' | 'grape';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = pop pink with glow (one per view); secondary = glass; zap = lime; ghost = text only */
  variant?: 'primary' | 'secondary' | 'zap' | 'sun' | 'sky' | 'grape' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  /** Full-width */
  block?: boolean;
  /** Leading emoji or icon node */
  icon?: React.ReactNode;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface RsvpOption { id: string; emoji: string; label: string }
export interface RsvpPickerProps {
  /** Defaults to Going / Maybe / Can't go. ids 'going' | 'maybe' | 'cant' get their tone colors. */
  options?: RsvpOption[];
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (id: string) => void;
  /** Accessible group label, default "RSVP" */
  label?: string;
  className?: string;
}
export declare function RsvpPicker(props: RsvpPickerProps): React.ReactElement;

export interface GlassCardProps extends React.HTMLAttributes<HTMLElement> {
  compact?: boolean;
  /** Solid full-value color block instead of glass (text becomes on-bright) */
  tone?: Tone;
  /** With tone: radius-xl corners, for hero blocks */
  slab?: boolean;
  as?: keyof JSX.IntrinsicElements;
}
export declare function GlassCard(props: GlassCardProps): React.ReactElement;

export interface Person { name: string; tone?: Tone }
export interface AvatarStackProps {
  people: Person[];
  /** How many avatars before "+N"; default 4 */
  max?: number;
  /** Real total when people is a sample */
  total?: number;
  size?: 'sm' | 'md';
  caption?: React.ReactNode;
  className?: string;
}
export declare function AvatarStack(props: AvatarStackProps): React.ReactElement;

export interface StickerProps {
  tone?: Tone;
  /** Rotation in degrees; default -4 */
  tilt?: number;
  children?: React.ReactNode;
  className?: string;
}
export declare function Sticker(props: StickerProps): React.ReactElement;

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement & HTMLTextAreaElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Error text; replaces hint and turns the field danger */
  error?: React.ReactNode;
  multiline?: boolean;
}
export declare function TextField(props: TextFieldProps): React.ReactElement;

export interface EventCardProps {
  title: React.ReactNode;
  date?: string;
  time?: string;
  location?: string;
  host?: string;
  /** Poster fill; default pop */
  tone?: Tone;
  /** Big emoji on the poster */
  emoji?: string;
  sticker?: React.ReactNode;
  stickerTone?: Tone;
  going?: Person[];
  goingCount?: number;
  /** Actions row (e.g. Buttons) */
  children?: React.ReactNode;
  className?: string;
}
export declare function EventCard(props: EventCardProps): React.ReactElement;

declare global {
  interface Window {
    Afterglow: {
      Button: typeof Button; RsvpPicker: typeof RsvpPicker; GlassCard: typeof GlassCard;
      EventCard: typeof EventCard; AvatarStack: typeof AvatarStack; Sticker: typeof Sticker; TextField: typeof TextField;
    };
  }
}
