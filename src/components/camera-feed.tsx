"use client";

import { useState, useRef, useEffect, type ReactNode, forwardRef, useImperativeHandle } from "react";
import { Button } from "./ui/button";
import { Video, VideoOff, Maximize, Minimize } from "lucide-react";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";

interface CameraFeedProps {
  children?: ReactNode;
}

export interface CameraFeedRef {
  capture: () => string | null;
  isCameraOn: boolean;
}

export const CameraFeed = forwardRef<CameraFeedRef, CameraFeedProps>(({ children }, ref) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleCamera = async () => {
    setError(null);
    if (isCameraOn) {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
      setIsCameraOn(false);
      if (videoRef.current) videoRef.current.srcObject = null;
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check browser permissions and ensure a camera is connected.");
      }
    }
  };
  
  useImperativeHandle(ref, () => ({
    capture: () => {
      if (videoRef.current && canvasRef.current && isCameraOn) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        if(context){
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL("image/jpeg");
        }
      }
      return null;
    },
    isCameraOn,
  }));

  const toggleFullscreen = () => {
    const elem = containerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch((err) => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    
    // Cleanup camera on unmount
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  }, []);

  return (
    <Card ref={containerRef} className={cn("relative w-full aspect-video bg-card overflow-hidden flex flex-col items-center justify-center transition-all duration-300 p-0", isFullscreen ? "bg-black" : "")}>
      <video ref={videoRef} autoPlay playsInline className={cn("w-full h-full object-contain", isCameraOn ? "block" : "hidden", isFullscreen ? "object-contain" : "object-cover")} />
      <canvas ref={canvasRef} className="hidden" />

      {!isCameraOn && (
        <div className="text-center text-card-foreground/60 p-4">
          <VideoOff className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-lg font-medium font-headline">Camera is Off</h3>
          {error ? (
             <p className="text-sm text-destructive max-w-sm mx-auto mt-2">{error}</p>
          ) : (
            <p className="text-sm">Click the button below to start the feed.</p>
          )}
        </div>
      )}
      
      {children && <div className="absolute inset-0 pointer-events-none">{children}</div>}

      <div className="absolute top-4 right-4 flex gap-2">
        <Button size="icon" variant="secondary" onClick={toggleFullscreen} className="bg-background/50 hover:bg-background/80 backdrop-blur-sm">
          {isFullscreen ? <Minimize /> : <Maximize />}
          <span className="sr-only">Toggle Fullscreen</span>
        </Button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <Button onClick={toggleCamera} size="lg" variant="secondary" className="bg-background/50 hover:bg-background/80 backdrop-blur-sm">
          {isCameraOn ? <VideoOff className="mr-2" /> : <Video className="mr-2" />}
          {isCameraOn ? "Stop Camera" : "Start Camera"}
        </Button>
      </div>
    </Card>
  );
});

CameraFeed.displayName = "CameraFeed";
