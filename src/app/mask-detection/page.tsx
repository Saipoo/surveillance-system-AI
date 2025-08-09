"use client";

import { useState, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { CameraFeed, type CameraFeedRef } from "@/components/camera-feed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/excel";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";

type LogEntry = {
  Date: string;
  Time: string;
  'Mask Status': 'Worn' | 'Not Worn';
};

export default function MaskDetectionPage() {
  const cameraRef = useRef<CameraFeedRef>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [maskStatus, setMaskStatus] = useState<'Worn' | 'Not Worn' | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handleToggleDetection = () => {
    if (isDetecting) {
      setIsDetecting(false);
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      setMaskStatus(null);
    } else {
      if (!cameraRef.current?.isCameraOn) {
        toast({ variant: "destructive", title: "Camera is off", description: "Please turn on the camera to start detection." });
        return;
      }
      setIsDetecting(true);
      detectionInterval.current = setInterval(() => {
        const isWorn = Math.random() > 0.4;
        const status = isWorn ? 'Worn' : 'Not Worn';
        setMaskStatus(status);
        logEvent(status);
      }, 2500);
    }
  };
  
  const logEvent = (status: 'Worn' | 'Not Worn') => {
    const now = new Date();
    const newLog: LogEntry = {
      Date: now.toLocaleDateString(),
      Time: now.toLocaleTimeString(),
      'Mask Status': status,
    };
    setLogs(prevLogs => [...prevLogs, newLog]);
  };

  const getStatusMessage = () => {
    if (!maskStatus) return null;
    if (maskStatus === 'Worn') return "Good, stay safe!";
    return "Face mask is necessary for safety from pollution.";
  };

  return (
    <div className="container mx-auto py-4">
      <PageHeader
        title="Face Mask Detection System"
        description="Detects if a person is wearing a face mask and provides a safety message."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <CameraFeed ref={cameraRef}>
                {maskStatus && (
                    <div className={cn("absolute inset-0 flex items-center justify-center p-4", {
                        "bg-green-500/20": maskStatus === "Worn",
                        "bg-red-500/20": maskStatus === "Not Worn"
                    })}>
                        <Badge variant={maskStatus === 'Worn' ? 'default' : 'destructive'} className={cn("text-lg p-3", {
                            "bg-green-600": maskStatus === "Worn",
                            "bg-red-600": maskStatus === "Not Worn"
                        })}>
                            {getStatusMessage()}
                        </Badge>
                    </div>
                )}
            </CameraFeed>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleToggleDetection} className="w-full" variant={isDetecting ? "destructive" : "default"}>
                {isDetecting ? 'Stop Detection' : 'Start Detection'}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
                {maskStatus ? (
                    <div className="text-center">
                        <p className={cn("text-2xl font-bold", {
                            "text-green-600": maskStatus === "Worn",
                            "text-red-600": maskStatus === "Not Worn"
                        })}>
                            Mask {maskStatus}
                        </p>
                        <p className="text-muted-foreground mt-1">{getStatusMessage()}</p>
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center">
                        {isDetecting ? "Detecting..." : "Detection is off."}
                    </p>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Card className="mt-6">
        <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>Mask Detection Logs</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportToExcel(logs, "Mask Detection Logs", "mask_detection_logs")} disabled={logs.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Logs
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Mask Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length > 0 ? (
                        logs.map((log, index) => (
                            <TableRow key={index}>
                                <TableCell>{log.Date}</TableCell>
                                <TableCell>{log.Time}</TableCell>
                                <TableCell>
                                    <Badge variant={log['Mask Status'] === 'Worn' ? 'default' : 'destructive'}>
                                        {log['Mask Status']}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center">No logs yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
