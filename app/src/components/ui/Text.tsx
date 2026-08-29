import { Text, type TextProps } from 'react-native';

export type TextVariant =
  | 'display' // hero numbers, splash headlines
  | 'title' // screen titles
  | 'heading' // section headings
  | 'subheading' // card titles, emphasized rows
  | 'stat' // big numeric readouts (StatTile values, tile metrics)
  | 'body' // default copy
  | 'caption' // secondary copy
  | 'label'; // tiny uppercase section labels

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  /**
   * Text-color utility (e.g. `text-brand-fg`). Replaces the variant's default
   * color so only one `text-*` color class is emitted — avoids NativeWind
   * cascade conflicts where a theme-scoped default (text-content) would
   * otherwise win over a static override in dark mode.
   */
  color?: string;
}

/**
 * RN has no font inheritance, so every piece of text goes through this wrapper
 * to get Figtree + a consistent type scale. Structural classes and the default
 * color are kept separate so `color` can cleanly replace the default.
 */
const variantClasses: Record<TextVariant, string> = {
  display: 'font-black text-4xl leading-[40px] tracking-tight',
  title: 'font-extrabold text-[28px] leading-9 tracking-tight',
  heading: 'font-bold text-xl leading-7',
  subheading: 'font-semibold text-base leading-6',
  stat: 'font-extrabold text-[22px] leading-7 tracking-tight',
  body: 'font-body text-[15px] leading-[22px]',
  caption: 'font-medium text-[13px] leading-[18px]',
  label: 'font-semibold text-[11px] leading-4 uppercase tracking-widest',
};

const variantColors: Record<TextVariant, string> = {
  display: 'text-content',
  title: 'text-content',
  heading: 'text-content',
  subheading: 'text-content',
  stat: 'text-content',
  body: 'text-content',
  caption: 'text-content-muted',
  label: 'text-content-faint',
};

/**
 * Text-color utilities the app uses as overrides. Listing the color names
 * explicitly avoids false positives on size utilities like `text-[15px]` /
 * `text-xl`. If any appears in `className`, the variant's default color is
 * dropped so only one color class lands on the element — otherwise a
 * theme-scoped default (text-content) can override a static color
 * (text-brand-fg) in dark mode and make it unreadable.
 */
const OVERRIDE_COLOR_RE =
  /(^|\s)text-(brand|brand-fg|brand-text|accent|danger|warning|success|content|content-muted|content-faint|black|white)(\/\d+)?(\s|$)/;

export function AppText({ variant = 'body', color, className = '', ...rest }: AppTextProps) {
  const overridden = color != null || OVERRIDE_COLOR_RE.test(className);
  const defaultColor = overridden ? '' : variantColors[variant];
  return (
    <Text
      className={`${variantClasses[variant]} ${defaultColor} ${color ?? ''} ${className}`
        .replace(/\s+/g, ' ')
        .trim()}
      {...rest}
    />
  );
}
