import { Text, type TextProps } from 'react-native';

export type TextVariant =
  | 'display' // hero numbers, splash headlines
  | 'title' // screen titles
  | 'heading' // section headings
  | 'subheading' // card titles, emphasized rows
  | 'body' // default copy
  | 'caption' // secondary copy
  | 'label'; // tiny uppercase section labels

interface AppTextProps extends TextProps {
  variant?: TextVariant;
}

/**
 * RN has no font inheritance, so every piece of text goes through this wrapper
 * to get Figtree + a consistent type scale. Color defaults to text-content;
 * override via className (last class wins in NativeWind).
 */
const variantClasses: Record<TextVariant, string> = {
  display: 'font-black text-4xl leading-[40px] tracking-tight text-content',
  title: 'font-extrabold text-[28px] leading-9 tracking-tight text-content',
  heading: 'font-bold text-xl leading-7 text-content',
  subheading: 'font-semibold text-base leading-6 text-content',
  body: 'font-body text-[15px] leading-[22px] text-content',
  caption: 'font-medium text-[13px] leading-[18px] text-content-muted',
  label: 'font-semibold text-[11px] leading-4 uppercase tracking-widest text-content-faint',
};

export function AppText({ variant = 'body', className = '', ...rest }: AppTextProps) {
  return <Text className={`${variantClasses[variant]} ${className}`} {...rest} />;
}
