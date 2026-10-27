import { useMemo } from "react";
import Svg, { Path, Rect } from "react-native-svg";
import { qrMatrix, qrSvgPath } from "@/lib/plant-qr";

const QUIET = 2;

/** Black-on-white QR (white quiet zone) so it scans reliably in dark mode too. */
export function PlantQrCode({
  value,
  size = 220,
}: {
  value: string;
  size?: number;
}) {
  const { d, full } = useMemo(() => {
    const m = qrMatrix(value);
    return { d: qrSvgPath(m), full: m.length + QUIET * 2 };
  }, [value]);

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`${-QUIET} ${-QUIET} ${full} ${full}`}
    >
      <Rect x={-QUIET} y={-QUIET} width={full} height={full} fill="#fff" />
      <Path d={d} fill="#000" />
    </Svg>
  );
}
