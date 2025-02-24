export function YellowFillGradientDef({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop
        offset="0%"
        stopColor="hsl(var(--chart-yellow-fill-gradient))"
        stopOpacity={1}
      />
      <stop
        offset="50%"
        stopColor="hsl(var(--chart-yellow-fill-gradient))"
        stopOpacity={0.4}
      />
      <stop
        offset="100%"
        stopColor="hsl(var(--chart-yellow-fill-gradient))"
        stopOpacity={0}
      />
    </linearGradient>
  )
}

export function YellowStrokeGradientDef({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      <stop
        offset="0%"
        stopColor="hsl(var(--chart-yellow-stroke-gradient-1))"
      />
      <stop
        offset="100%"
        stopColor="hsl(var(--chart-yellow-stroke-gradient-2))"
      />
    </linearGradient>
  )
}
