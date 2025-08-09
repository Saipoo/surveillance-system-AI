"use client";

import { useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { CameraFeed, type CameraFeedRef } from "@/components/camera-feed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/excel";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

type LogEntry = {
  Date: string;
  Time: string;
  'Uniform Status': 'Granted' | 'Denied';
  'Student Image': string;
};

export default function UniformDetectionPage() {
  const cameraRef = useRef<CameraFeedRef>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<'Granted' | 'Denied' | null>(null);
  const [registeredUniform, setRegisteredUniform] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handleRegisterUniform = () => {
    if (!cameraRef.current?.isCameraOn) {
      toast({
        variant: "destructive",
        title: "Camera is off",
        description: "Please turn on the camera to register a uniform.",
      });
      return;
    }
    const imageDataUrl = cameraRef.current?.capture();
    if (imageDataUrl) {
      setRegisteredUniform(imageDataUrl);
      toast({
        title: "Uniform Registered",
        description: "The uniform has been successfully registered.",
      });
    }
  };

  const handleToggleDetection = () => {
    if (isDetecting) {
      setIsDetecting(false);
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      setDetectionStatus(null);
    } else {
      if (!registeredUniform) {
        toast({
          variant: "destructive",
          title: "No Uniform Registered",
          description: "Please register a uniform before starting detection.",
        });
        return;
      }
      setIsDetecting(true);
      detectionInterval.current = setInterval(() => {
        const isMatch = Math.random() > 0.3; // Simulate detection
        const status = isMatch ? 'Granted' : 'Denied';
        setDetectionStatus(status);
        logEvent(status);
      }, 3000);
    }
  };
  
  const logEvent = (status: 'Granted' | 'Denied') => {
    const now = new Date();
    const newLog: LogEntry = {
      Date: now.toLocaleDateString(),
      Time: now.toLocaleTimeString(),
      'Uniform Status': status,
      'Student Image': `image_${now.getTime()}.jpg`, // Placeholder for image data
    };
    setLogs(prevLogs => [...prevLogs, newLog]);
    // Auto-export on each log
    exportToExcel([...logs, newLog], "Uniform Logs", "uniform_detection_logs");
  };

  return (
    <div className="container mx-auto py-4">
      <PageHeader
        title="Uniform Detection System"
        description="Detect if a student is wearing the registered uniform and grant or deny permission."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Live Camera Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <CameraFeed ref={cameraRef} />
                {detectionStatus && (
                   <div className="absolute top-4 left-4">
                    <Badge variant={detectionStatus === 'Granted' ? 'default' : 'destructive'} className={`text-lg p-2 ${detectionStatus === 'Granted' ? 'bg-green-500' : 'bg-red-500'}`}>
                      Permission {detectionStatus}
                    </Badge>
                   </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleRegisterUniform} className="w-full" disabled={isDetecting}>
                Register Uniform
              </Button>
              <Button onClick={handleToggleDetection} className="w-full" variant={isDetecting ? "destructive" : "default"}>
                {isDetecting ? 'Stop Detection' : 'Start Detection'}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Registered Uniform</CardTitle>
            </CardHeader>
            <CardContent>
              {registeredUniform ? (
                <Image src={registeredUniform} alt="Registered Uniform" width={200} height={200} className="rounded-md mx-auto" />
              ) : (
                <p className="text-muted-foreground text-center">No uniform registered yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
