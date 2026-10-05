import Svg, { Path } from 'react-native-svg';

type Props = {
  d: string;
  size?: number;
  color: string;
  strokeWidth?: number;
  /** Filled glyph (play, pause, spark) instead of a stroke icon. */
  filled?: boolean;
  /** Filled shape with an outline, e.g. a liked heart. */
  fill?: string;
};

export function Icon({ d, size = 20, color, strokeWidth = 1.8, filled, fill }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={d}
        fill={filled ? color : (fill ?? 'none')}
        stroke={filled ? 'none' : color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
