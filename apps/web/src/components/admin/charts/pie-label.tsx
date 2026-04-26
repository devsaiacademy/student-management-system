const RADIAN = Math.PI / 180;
const LEADER_LINE_COLOR = "#9ca3af";
const LABEL_TEXT_COLOR = "#111827";
const LEADER_OUTER_OFFSET = 16;
const LEADER_TAIL_LENGTH = 14;
const TEXT_OFFSET = 4;
const PERCENT_DECIMALS = 1;

type PieLabelProps = {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  fill?: string;
  name?: string | number;
  value?: number;
  percent?: number;
};

type ValueFormatter = (value: number) => string | number;

export function makePieLabel(formatValue?: ValueFormatter) {
  return function PieLabel({
    cx,
    cy,
    midAngle,
    outerRadius,
    fill,
    name,
    value,
    percent,
  }: PieLabelProps) {
    if (
      cx === undefined ||
      cy === undefined ||
      midAngle === undefined ||
      outerRadius === undefined ||
      !percent
    ) {
      return null;
    }

    const cos = Math.cos(-midAngle * RADIAN);
    const sin = Math.sin(-midAngle * RADIAN);
    const sx = cx + outerRadius * cos;
    const sy = cy + outerRadius * sin;
    const mx = cx + (outerRadius + LEADER_OUTER_OFFSET) * cos;
    const my = cy + (outerRadius + LEADER_OUTER_OFFSET) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * LEADER_TAIL_LENGTH;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";
    const textOffset = cos >= 0 ? TEXT_OFFSET : -TEXT_OFFSET;
    const displayValue =
      formatValue && value !== undefined ? formatValue(value) : value;

    return (
      <g>
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          fill="none"
          stroke={LEADER_LINE_COLOR}
        />
        <circle cx={ex} cy={ey} fill={LEADER_LINE_COLOR} r={2} stroke="none" />
        <text
          dominantBaseline="middle"
          fontSize={14}
          textAnchor={textAnchor}
          x={ex + textOffset}
          y={ey}
        >
          <tspan fill={fill ?? LABEL_TEXT_COLOR} fontWeight={500}>
            {String(name)}:{" "}
          </tspan>
          <tspan fill={LABEL_TEXT_COLOR}>
            {displayValue} ({(percent * 100).toFixed(PERCENT_DECIMALS)}%)
          </tspan>
        </text>
      </g>
    );
  };
}

export const renderPieLabel = makePieLabel();
