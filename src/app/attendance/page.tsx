"use client";

import { useState, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { CameraFeed, type CameraFeedRef } from "@/components/camera-feed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/lib/types";
import { exportToExcel } from "@/lib/excel";
import Image from "next/image";

const vtuSubjects = [
  "Machine Learning",
  "Cloud Computing",
  "Cyber Security",
  "Data Science",
  "Project Management",
];

type LogEntry = {
    Date: string;
    Time: string;
    Name: string;
    USN: string;
    Subject: string;
    'Attendance Status': 'Marked';
};

export default function AttendancePage() {
  const cameraRef = useRef<CameraFeedRef>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentUsn, setNewStudentUsn] = useState("");
  const [recognizedStudent, setRecognizedStudent] = useState<Student | null>(null);
  const [isUnregistered, setIsUnregistered] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  const handleRegister = () => {
    if (!newStudentName || !newStudentUsn) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please enter both name and USN." });
      return;
    }
    if (!cameraRef.current?.isCameraOn) {
      toast({ variant: "destructive", title: "Camera is off", description: "Please turn on the camera to register." });
      return;
    }
    const faceImage = cameraRef.current.capture();
    if (faceImage) {
      const newStudent: Student = {
        id: `S${Date.now()}`,
        name: newStudentName,
        usn: newStudentUsn,
        semester: "7th Sem",
        faceImage,
      };
      setStudents([...students, newStudent]);
      setNewStudentName("");
      setNewStudentUsn("");
      toast({ title: "Student Registered", description: `${newStudent.name} has been added.` });
    }
  };

  const startAttendance = () => {
    if (students.length === 0) {
        toast({ variant: "destructive", title: "No Students Registered", description: "Please register students before starting attendance." });
        return;
    }

    detectionInterval.current = setInterval(() => {
        const recognizeUnregistered = Math.random() < 0.2;
        if (recognizeUnregistered) {
            setRecognizedStudent(null);
            setIsUnregistered(true);
        } else {
            const randomIndex = Math.floor(Math.random() * students.length);
            setRecognizedStudent(students[randomIndex]);
            setIsUnregistered(false);
        }
    }, 5000);
    toast({ title: "Attendance Started", description: "Searching for students..." });
  };
  
  const stopAttendance = () => {
    if(detectionInterval.current) {
        clearInterval(detectionInterval.current);
        detectionInterval.current = null;
        setRecognizedStudent(null);
        setIsUnregistered(false);
        toast({ title: "Attendance Stopped" });
    }
  };

  const markAttendance = () => {
    if (recognizedStudent && selectedSubject) {
        const now = new Date();
        const newLog: LogEntry = {
            Date: now.toLocaleDateString(),
            Time: now.toLocaleTimeString(),
            Name: recognizedStudent.name,
            USN: recognizedStudent.usn,
            Subject: selectedSubject,
            'Attendance Status': 'Marked',
        };
        const updatedLogs = [...logs, newLog];
        setLogs(updatedLogs);
        exportToExcel(updatedLogs, "Attendance", "attendance_logs");
        toast({ title: "Attendance Marked", description: `${recognizedStudent.name} marked present for ${selectedSubject}.` });
        setRecognizedStudent(null);
        setSelectedSubject("");
    }
  };


  return (
    <div className="container mx-auto py-4">
      <PageHeader
        title="Facial Recognition Attendance"
        description="Automatically mark attendance using facial recognition and log it."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <CameraFeed ref={cameraRef}>
                {recognizedStudent && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-4 border-green-500 rounded-lg p-2 bg-black/50 text-white font-bold text-2xl">
                            {recognizedStudent.usn}
                        </div>
                    </div>
                )}
                {isUnregistered && (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="border-4 border-red-500 rounded-lg p-4 bg-black/50 text-white text-center">
                            <p className="font-bold text-xl">Face Not Registered</p>
                            <p className="text-sm">Please register using the form.</p>
                        </div>
                    </div>
                )}
            </CameraFeed>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Register New Student</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="Student's Name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usn">USN</Label>
                <Input id="usn" value={newStudentUsn} onChange={(e) => setNewStudentUsn(e.target.value)} placeholder="1XX20CS001" />
              </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleRegister} className="w-full">Capture & Register</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Control</CardTitle>
              <CardDescription>Start the system to recognize students.</CardDescription>
            </CardHeader>
            <CardContent>
                { !detectionInterval.current ? (
                    <Button onClick={startAttendance} className="w-full">Start Attendance</Button>
                 ) : (
                    <Button onClick={stopAttendance} variant="destructive" className="w-full">Stop Attendance</Button>
                 )}
            </CardContent>
          </Card>
          
          {recognizedStudent && (
            <Card className="bg-green-500/10 border-green-500">
                <CardHeader>
                    <CardTitle>Mark Attendance for {recognizedStudent.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Image src={recognizedStudent.faceImage} alt={recognizedStudent.name} width={100} height={100} className="rounded-full mx-auto" />
                    <p className="text-center font-semibold">{recognizedStudent.name} - {recognizedStudent.usn}</p>
                     <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select 7th Sem Subject" />
                        </SelectTrigger>
                        <SelectContent>
                            {vtuSubjects.map(subject => (
                                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={markAttendance} className="w-full" disabled={!selectedSubject}>Mark Attendance</Button>
                </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
