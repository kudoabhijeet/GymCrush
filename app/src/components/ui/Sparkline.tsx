import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useThemeColors } from '@/lib/theme';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** Line color; defaults to brand. */
  color?: string;
  /** Announces the chart to screen readers; without it the chart is decorative. */
  accessibilityLabel?: string;
}

/** Small trend line with a soft gradient fill under the curve. */
export function Sparkline({ data, width = 320, height = 72, color, accessibilityLabel }: SparklineProps) {
  const colors = useThemeColors();
  const stroke = color ?? colors.brand;
  // SVG ids are document-global — a hardcoded one collides as soon as two
  // sparklines render at once. (Colons stripped: invalid in url() references.)
  const gradientId = `sparkfill-${useId().replace(/:/g, '')}`;

  if (data.length < 2) return <View style={{ width, height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 6;

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + (1 - (v - min) / range) * (height - pad * 2),
  }));

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <View
      accessible={accessibilityLabel != null}
      accessibilityRole={accessibilityLabel != null ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={accessibilityLabel != null ? 'yes' : 'no-hide-descendants'}
    >
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={stroke} stopOpacity="0.25" />
            <Stop offset="1" stopColor={stroke} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={area} fill={`url(#${gradientId})`} />
        <Path d={line} stroke={stroke} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}
