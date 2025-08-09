"use client";

import { useState, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { CameraFeed, type CameraFeedRef } from "@/components/camera-feed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { summarizeEmergencyReport } from "@/ai/flows/summarize-emergency-flow";
import { playAlarm } from "@/lib/utils";
import type { EmergencyLog, EmergencyType } from "@/lib/types";
import { exportToExcel } from "@/lib/excel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Siren, Loader2, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const emergencyDetails: Record<EmergencyType, { treatment: string }> = {
  'Fall Detected': { treatment: "Check for consciousness and injuries. Call for medical assistance if needed. Do not move if a spinal injury is suspected." },
  'SOS Hand Sign': { treatment: "Assess the situation for immediate danger. Approach cautiously and offer help. Contact security or authorities." },
  'Chest Pain': { treatment: "Possible heart attack. Call ambulance immediately. Have the person sit down and rest. Loosen any tight clothing. If prescribed, assist with medication (e.g., nitroglycerin)." },
};

export default function EmergencyDetectionPage() {
  const cameraRef = useRef<CameraFeedRef>(null);
  const [alert, setAlert] = useState<{ type: EmergencyType; treatment: string } | null>(null);
  const [logs, setLogs] = useState<EmergencyLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSimulateEmergency = async (type: EmergencyType) => {
    if (!cameraRef.current?.isCameraOn) {
      toast({ variant: "destructive", title: "Camera is off", description: "Please turn on the camera to simulate an emergency." });
      return;
    }
    
    const imageDataUrl = cameraRef.current.capture();
    if (!imageDataUrl) {
      toast({ variant: "destructive", title: "Capture Failed", description: "Could not capture an image from the camera." });
      return;
    }

    const { treatment } = emergencyDetails[type];
    setAlert({ type, treatment });
    playAlarm();
    setIsProcessing(true);
    
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
      setIsProcessing(false);
      setTimeout(() => setAlert(null), 8000);
    }
  };

  return (
    <div className="container mx-auto py-4">
      <PageHeader
        title="Emergency Detection System"
        description="Detects emergency gestures or health issues and suggests immediate actions."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CameraFeed ref={cameraRef}>
            {alert && (
              <div className="absolute inset-0 bg-red-500/30 animate-pulse flex items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md bg-background/90">
                  <Siren className="h-5 w-5" />
                  <AlertTitle className="text-xl font-bold font-headline animate-pulse">EMERGENCY: {alert.type}</AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="font-semibold">Suggested Action:</p>
                    <p>{alert.treatment}</p>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CameraFeed>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Simulate Emergency</CardTitle>
              <CardDescription>Trigger a simulated emergency to test the system.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {(Object.keys(emergencyDetails) as EmergencyType[]).map((type) => (
                <Button key={type} onClick={() => handleSimulateEmergency(type)} disabled={isProcessing} className="w-full">
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simulate {type}
                </Button>
              ))}
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
                        <span>Generating AI summary and logging event...</span>
                    </div>
                ) : (
                    <p className="text-muted-foreground">System is idle. Ready to detect emergencies.</p>
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
