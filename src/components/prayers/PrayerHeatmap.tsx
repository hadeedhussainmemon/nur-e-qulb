import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface HeatmapProps {
  data: { date: string; completionPercentage: number }[]; // Array of last 365 days
}

export function PrayerHeatmap({ data }: HeatmapProps) {
  const dataMap = React.useMemo(() => {
    return new Map(data.map(item => [item.date, item.completionPercentage]));
  }, [data]);

  const avg = data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + curr.completionPercentage, 0) / data.length) : 0;

  const getDays = () => {
    const daysArr = [];
    for (let i = 363; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      daysArr.push(d.toISOString().split('T')[0]);
    }
    return daysArr;
  };

  const days = React.useMemo(getDays, []);

  const getColor = (percentage: number) => {
    if (percentage === 0) return 'bg-slate-100 dark:bg-slate-800';
    if (percentage <= 25) return 'bg-emerald-200 dark:bg-emerald-900';
    if (percentage <= 50) return 'bg-emerald-300 dark:bg-emerald-700';
    if (percentage <= 75) return 'bg-emerald-400 dark:bg-emerald-600';
    return 'bg-emerald-500 dark:bg-emerald-500'; // 100%
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Annual Prayer Activity</CardTitle>
        <Badge variant="outline" className="text-emerald-600 border-emerald-600">{avg}% Avg</Badge>
      </CardHeader>
      <CardContent>
        <div className="flex overflow-x-auto pb-4 pt-2">
          <div className="flex gap-1 min-w-max">
            {Array.from({ length: 52 }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const dayOffset = weekIndex * 7 + dayIndex;
                  const dateStr = days[dayOffset];
                  if (!dateStr) return null;
                  
                  const percentage = dataMap.has(dateStr) ? dataMap.get(dateStr)! : 0;
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm ${getColor(percentage)} transition-colors hover:ring-2 hover:ring-emerald-300`}
                      title={`${dateStr}: ${percentage}%`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Updates daily based on your logs</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800" />
              <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
              <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-700" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-500" />
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
