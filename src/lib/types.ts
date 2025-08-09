export interface Student {
  id: string;
  name: string;
  usn: string;
  semester: string;
  faceImage: string;
}

export type EmergencyType = 'Fall Detected' | 'SOS Hand Sign' | 'Chest Pain';

export type EmergencyLog = {
  Date: string;
  Time: string;
  'Type of Emergency': EmergencyType;
  'Suggested Treatment': string;
};

export type MaskStatus = 'Worn' | 'Not Worn' | 'Unknown';
