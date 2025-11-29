
"use client";

import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { RouteOption } from "@/lib/types";
import { Clock, Thermometer, TrafficCone, Mountain, Bot, Footprints, Bike, Car } from "lucide-react";

type RouteCardProps = {
  route: RouteOption;
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: () => void;
};

const getHealthScoreColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
};

const TravelModeIcon = ({ mode }: { mode: RouteOption['travelMode'] }) => {
    switch (mode) {
        case 'DRIVE': return <Car className="w-5 h-5 text-muted-foreground" />;
        case 'WALK': return <Footprints className="w-5 h-5 text-muted-foreground" />;
        case 'BICYCLE': return <Bike className="w-5 h-5 text-muted-foreground" />;
        default: return null;
    }
};

export default function RouteCard({
  route,
  isSelected,
  isRecommended,
  onSelect,
}: RouteCardProps) {
  const {
    healthScore,
    distance,
    duration,
    avgAqi,
    traffic,
    explanation,
    travelMode,
  } = route;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected
          ? "border-primary shadow-lg"
          : "border-border",
        isRecommended && "border-accent-foreground border-2"
      )}
      onClick={onSelect}
    >
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
                <TravelModeIcon mode={travelMode} />
                <CardTitle className="text-lg font-headline">
                Route {route.id}
                </CardTitle>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1.5" title="Distance">
                <Mountain className="w-4 h-4" />
                <span>{distance} km</span>
              </div>
              <div className="flex items-center gap-1.5" title="Duration">
                <Clock className="w-4 h-4" />
                <span>{duration} min</span>
              </div>
            </div>
          </div>
          {isRecommended && (
            <Badge variant="default" className="bg-accent text-accent-foreground">
              Safest
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Health Score</span>
              <span className="text-lg font-bold" style={{color: getHealthScoreColor(healthScore).replace('bg-', '').replace('-500', '')}}>{healthScore}</span>
            </div>
            <PatchedProgress
              value={healthScore}
              className="h-3"
              indicatorClassName={getHealthScoreColor(healthScore)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
              <Thermometer className="w-5 h-5 text-primary" />
              <div>
                <p className="text-muted-foreground">Avg. AQI</p>
                <p className="font-semibold">{avgAqi}</p>
              </div>
            </div>
            {travelMode === 'DRIVE' && traffic && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                <TrafficCone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-muted-foreground">Traffic</p>
                  <p className="font-semibold capitalize">{traffic}</p>
                </div>
              </div>
            )}
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b-0">
              <AccordionTrigger className="text-sm py-2 hover:no-underline justify-start gap-2">
                <Bot className="w-4 h-4 text-primary"/>
                AI Explanation
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                <p>{explanation}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}

// Small patch to Progress component to allow custom indicator color
const PatchedProgress = React.forwardRef<
  React.ElementRef<typeof Progress>,
  React.ComponentProps<typeof Progress> & { indicatorClassName?: string }
>(({ indicatorClassName, value, ...props }, ref) => (
  <Progress
    ref={ref}
    value={value}
    {...props}
    indicator={
      <div
        className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    }
  />
));
PatchedProgress.displayName = 'PatchedProgress';

// We export the patched component as Progress for this file
export { PatchedProgress as Progress };
