"use client";

import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { CameraFeed } from "@/components/ui/camera-feed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/excel";
import { Timer, Play, StopCircle } from "lucide-react";
import { formatDistanceStrict } from "date-fns";

type LogEntry = {
  'Date': string;
  'Time In': string;
  'Time Out': string;
  'Duration': string;
  'Student Name/USN': string;
  'Image': string;
};

export default function MovementTrackingPage() {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("0 seconds");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isTracking && startTime) {
      timerInterval.current = setInterval(() => {
        setElapsedTime(formatDistanceStrict(new Date(), startTime));
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isTracking, startTime]);

  const handleStartTracking = () => {
    setIsTracking(true);
    setStartTime(new Date());
    setElapsedTime("0 seconds");
    toast({ title: "Tracking Started", description: "Timer initiated for student presence." });
  };

  const handleStopTracking = () => {
    if (!startTime) return;

    const endTime = new Date();
    const duration = formatDistanceStrict(endTime, startTime);
    
    const newLog: LogEntry = {
      'Date': endTime.toLocaleDateString(),
      'Time In': startTime.toLocaleTimeString(),
      'Time Out': endTime.toLocaleTimeString(),
      'Duration': duration,
      'Student Name/USN': `Student_${Date.now()}`, // Simulated student ID
      'Image': `presence_${Date.now()}.jpg`,
    };
    
    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    exportToExcel(updatedLogs, "Movement Logs", "movement_tracking_logs");

    toast({ title: "Tracking Stopped", description: `Duration: ${duration}. Log has been saved.` });

    setIsTracking(false);
    setStartTime(null);
  };

  return (
    <div className="container mx-auto py-4">
      <PageHeader
        title="Student Movement Tracking"
        description="Track how long a student is present in the camera view and log the duration."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <CameraFeed>
                {isTracking && (
                    <div className="absolute top-4 left-4 bg-background/80 p-2 rounded-lg backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                            <Timer className="animate-pulse" />
                            <span>{elapsedTime}</span>
                        </div>
                    </div>
                )}
            </CameraFeed>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tracking Controls</CardTitle>
              <CardDescription>Simulate a student entering and leaving the view.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Button onClick={handleStartTracking} disabled={isTracking}>
                    <Play className="mr-2"/>
                    Simulate Student Enters
                </Button>
                <Button onClick={handleStopTracking} disabled={!isTracking} variant="destructive">
                    <StopCircle className="mr-2"/>
                    Simulate Student Leaves
                </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                {isTracking ? (
                    <div>
                        <p className="text-2xl font-bold font-headline text-primary">{elapsedTime}</p>
                        <p className="text-muted-foreground">Tracking in progress...</p>
                    </div>
                ) : (
                    <p className="text-muted-foreground">System is idle. Waiting for a student to enter.</p>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
