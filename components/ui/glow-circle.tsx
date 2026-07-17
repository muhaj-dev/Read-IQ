import { useId } from 'react';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

type Props = {
  color: string;
  /** Diameter in px. */
  size: number;
  /** Peak opacity at the centre; fades to 0 at the edge. */
  opacity?: number;
};

/** Soft radial glow — RN can't render the mocks' CSS blur natively. */
export function GlowCircle({ color, size, opacity = 0.3 }: Props) {
  // useId can contain ':' which is invalid inside an SVG url() reference.
  const id = `glow-${useId().replace(/:/g, '')}`;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="60%" stopColor={color} stopOpacity={opacity * 0.6} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}
