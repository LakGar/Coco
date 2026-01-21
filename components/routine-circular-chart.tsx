"use client"

import * as React from "react"

interface RoutineCircularChartProps {
  recurrenceDaysOfWeek: number[] // Array of day numbers (0=Sunday, 6=Saturday)
  instances?: Array<{
    entryDate: string
    answers?: Record<string, boolean>
  }> // Recent instances to show completion
  size?: number
  barWidth?: number
  barHeight?: number
}

export function RoutineCircularChart({ 
  recurrenceDaysOfWeek, 
  instances = [],
  size = 140,
  barWidth = 12
}: RoutineCircularChartProps) {
  const radius = size / 2 - barWidth / 2 - 5
  const daysPerWeek = recurrenceDaysOfWeek.length
  const sortedDays = [...recurrenceDaysOfWeek].sort()

  // Get completion status for each required day this week
  const getWeekCompletion = () => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0)

    const completion: boolean[] = []
    
    sortedDays.forEach((dayIndex) => {
      const dayDate = new Date(startOfWeek)
      dayDate.setDate(startOfWeek.getDate() + dayIndex)
      const dayStr = dayDate.toISOString().split("T")[0]
      
      // Check if there's an entry for this day
      const hasEntry = instances.some(instance => {
        const instanceDate = new Date(instance.entryDate).toISOString().split("T")[0]
        return instanceDate === dayStr
      })
      
      completion.push(hasEntry)
    })

    return completion
  }

  const completion = getWeekCompletion()
  const completedCount = completion.filter(Boolean).length

  const totalSegments = sortedDays.length
  const gapAngle = 3 // Gap between segments in degrees
  const totalGapAngle = gapAngle * totalSegments
  const availableAngle = 360 - totalGapAngle
  const anglePerSegment = availableAngle / totalSegments

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Draw arc segments around the circumference with gaps */}
        {sortedDays.map((dayIndex, index) => {
          // Calculate start angle accounting for gaps
          const startAngle = -90 + (index * (anglePerSegment + gapAngle))
          const endAngle = startAngle + anglePerSegment
          const isCompleted = completion[index]
          const startAngleRad = (startAngle * Math.PI) / 180
          const endAngleRad = (endAngle * Math.PI) / 180
          
          // Calculate arc path
          const innerRadius = radius - barWidth / 2
          const outerRadius = radius + barWidth / 2
          
          const startXInner = size / 2 + innerRadius * Math.cos(startAngleRad)
          const startYInner = size / 2 + innerRadius * Math.sin(startAngleRad)
          const endXInner = size / 2 + innerRadius * Math.cos(endAngleRad)
          const endYInner = size / 2 + innerRadius * Math.sin(endAngleRad)
          
          const startXOuter = size / 2 + outerRadius * Math.cos(startAngleRad)
          const startYOuter = size / 2 + outerRadius * Math.sin(startAngleRad)
          const endXOuter = size / 2 + outerRadius * Math.cos(endAngleRad)
          const endYOuter = size / 2 + outerRadius * Math.sin(endAngleRad)
          
          const largeArcFlag = anglePerSegment > 180 ? 1 : 0
          
          // Create arc segment path with rounded corners
          // Use small arcs at the corners for rounded effect
          const cornerRadius = 2
          
          // Calculate corner points with slight offset for rounding
          const startAngleOffset = (cornerRadius / innerRadius) * (180 / Math.PI)
          const endAngleOffset = (cornerRadius / innerRadius) * (180 / Math.PI)
          
          const startAngleRadRounded = ((startAngle + startAngleOffset) * Math.PI) / 180
          const endAngleRadRounded = ((endAngle - endAngleOffset) * Math.PI) / 180
          
          const startXInnerRounded = size / 2 + innerRadius * Math.cos(startAngleRadRounded)
          const startYInnerRounded = size / 2 + innerRadius * Math.sin(startAngleRadRounded)
          const endXInnerRounded = size / 2 + innerRadius * Math.cos(endAngleRadRounded)
          const endYInnerRounded = size / 2 + innerRadius * Math.sin(endAngleRadRounded)
          
          const startXOuterRounded = size / 2 + outerRadius * Math.cos(startAngleRadRounded)
          const startYOuterRounded = size / 2 + outerRadius * Math.sin(startAngleRadRounded)
          const endXOuterRounded = size / 2 + outerRadius * Math.cos(endAngleRadRounded)
          const endYOuterRounded = size / 2 + outerRadius * Math.sin(endAngleRadRounded)
          
          // Path with rounded corners using arcs
          const pathData = `
            M ${startXInner} ${startYInner}
            A ${cornerRadius} ${cornerRadius} 0 0 1 ${startXInnerRounded} ${startYInnerRounded}
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${endXInnerRounded} ${endYInnerRounded}
            A ${cornerRadius} ${cornerRadius} 0 0 1 ${endXInner} ${endYInner}
            L ${endXOuter} ${endYOuter}
            A ${cornerRadius} ${cornerRadius} 0 0 0 ${endXOuterRounded} ${endYOuterRounded}
            A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${startXOuterRounded} ${startYOuterRounded}
            A ${cornerRadius} ${cornerRadius} 0 0 0 ${startXOuter} ${startYOuter}
            Z
          `
          
          return (
            <path
              key={dayIndex}
              d={pathData}
              fill={isCompleted ? "#10b981" : "#e5e7eb"}
              stroke={isCompleted ? "#059669" : "#d1d5db"}
              strokeWidth={0.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
              style={{
                filter: isCompleted ? "drop-shadow(0 0 2px rgba(16, 185, 129, 0.5))" : "none"
              }}
            />
          )
        })}
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600">{completedCount}/{daysPerWeek}</div>
          <div className="text-xs text-muted-foreground">this week</div>
        </div>
      </div>
    </div>
  )
}

