"use client";

import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { CameraFeed, type CameraFeedRef } from "@/components/camera-feed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { summarizeEmergencyReport } from "@/ai/flows/summarize-emergency-flow";
import { analyzeImageForEmergency } from "@/ai/flows/analyze-emergency-flow";
import { playAlarm } from "@/lib/utils";
import type { EmergencyLog, EmergencyType } from "@/lib/types";
import { exportToExcel } from "@/lib/excel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Siren, Loader2, Download, Video } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const emergencyDetails: Record<EmergencyType, { treatment: string }> = {
  'Fall Detected': { treatment: "Check for consciousness and injuries. Call for medical assistance if needed. Do not move if a spinal injury is suspected." },
  'SOS Hand Sign': { treatment: "Assess the situation for immediate danger. Approach cautiously and offer help. Contact security or authorities." },
  'Chest Pain': { treatment: "Possible heart attack. Call ambulance immediately. Have the person sit down and rest. Loosen any tight clothing. If prescribed, assist with medication (e.g., nitroglycerin)." },
};

export default function EmergencyDetectionPage() {
  const cameraRef = useRef<CameraFeedRef>(null);
  const [alertInfo, setAlertInfo] = useState<{ type: EmergencyType; treatment: string } | null>(null);
  const [logs, setLogs] = useState<EmergencyLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handleEmergency = async (type: EmergencyType, imageDataUrl: string) => {
    if (isProcessing) return; // Prevent multiple triggers

    setIsProcessing(true);
    const { treatment } = emergencyDetails[type];
    setAlertInfo({ type, treatment });
    playAlarm();
    
    try {
      const { summary } = await summarizeEmergencyReport({
        emergencyType: type,
        suggestedTreatment: treatment,
        studentImage: imageDataUrl,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      });
      
      const newLog: EmergencyLog = {
        Date: new Date().toLocaleDateString(),
        Time: new Date().toLocaleTimeString(),
        'Type of Emergency': type,
        'Suggested Treatment': summary,
      };
      
      setLogs(prevLogs => [...prevLogs, newLog]);
      toast({ title: "Emergency Logged", description: "The event has been recorded." });

    } catch (error) {
      console.error("Error processing emergency:", error);
      toast({ variant: "destructive", title: "AI Error", description: "Could not generate an AI summary for the event." });
    } finally {
      setTimeout(() => {
        setAlertInfo(null);
        setIsProcessing(false);
      }, 8000); // Clear alert after 8 seconds
    }
  };

  const startDetection = () => {
    if (!cameraRef.current?.isCameraOn) {
      toast({ variant: "destructive", title: "Camera is off", description: "Please turn on the camera to start detection." });
      return;
    }
    setIsDetecting(true);
    toast({ title: "Detection Started", description: "Actively monitoring for emergencies." });

    detectionInterval.current = setInterval(async () => {
      if (isProcessing || !cameraRef.current) return;

      const imageDataUrl = cameraRef.current.capture();
      if (imageDataUrl) {
        try {
          const { emergencyType } = await analyzeImageForEmergency({ imageDataUri: imageDataUrl });
          if (emergencyType && emergencyDetails[emergencyType]) {
            handleEmergency(emergencyType, imageDataUrl);
          }
        } catch (error) {
          console.error("Error analyzing image:", error);
          // Don't show toast here to avoid spamming the user
        }
      }
    }, 5000); // Check every 5 seconds
  };

  const stopDetection = () => {
    setIsDetecting(false);
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
    toast({ title: "Detection Stopped" });
  };
  
  useEffect(() => {
    return () => {
        if (detectionInterval.current) {
            clearInterval(detectionInterval.current)
        }
    }
  }, [])

  return (
    <div className="container mx-auto py-4">
      <PageHeader
        title="Emergency Detection System"
        description="Automatically detects emergency gestures or health issues and suggests immediate actions."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CameraFeed ref={cameraRef}>
            {alertInfo && (
              <div className="absolute inset-0 bg-red-500/30 animate-pulse flex items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md bg-background/90">
                  <Siren className="h-5 w-5" />
                  <AlertTitle className="text-xl font-bold font-headline animate-pulse">EMERGENCY: {alertInfo.type}</AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="font-semibold">Suggested Action:</p>
                    <p>{alertInfo.treatment}</p>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CameraFeed>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Control</CardTitle>
              <CardDescription>Start or stop automatic emergency detection.</CardDescription>
            </CardHeader>
            <CardContent>
              {isDetecting ? (
                <Button onClick={stopDetection} variant="destructive" className="w-full">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Stop Detection
                </Button>
              ) : (
                <Button onClick={startDetection} className="w-full" disabled={isProcessing}>
                  <Video className="mr-2 h-4 w-4" />
                  Start Automatic Detection
                </Button>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Processing Status</CardTitle>
            </CardHeader>
            <CardContent>
                {isProcessing ? (
                    <div className="flex items-center text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Emergency detected! Logging event...</span>
                    </div>
                ) : isDetecting ? (
                     <div className="flex items-center text-green-600">
                        <Siren className="mr-2 h-4 w-4" />
                        <span>System is actively monitoring...</span>
                    </div>
                ) : (
                    <p className="text-muted-foreground">System is idle. Start detection to monitor.</p>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
       <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Emergency Logs</CardTitle>
            <Button variant="outline" size="sm" onClick={() => exportToExcel(logs, "Emergency Logs", "emergency_logs")} disabled={logs.length === 0}>
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
                        <TableHead>Type of Emergency</TableHead>
                        <TableHead>Suggested Treatment (AI Summary)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length > 0 ? (
                        logs.map((log, index) => (
                            <TableRow key={index}>
                                <TableCell>{log.Date}</TableCell>
                                <TableCell>{log.Time}</TableCell>
                                <TableCell>{log['Type of Emergency']}</TableCell>
                                <TableCell className="max-w-sm">{log['Suggested Treatment']}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">No emergencies logged yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
