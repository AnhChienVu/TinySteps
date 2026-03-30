export type FeedingType = 'breast' | 'bottle' | 'solid';
export type HealthType = 'symptom' | 'medication' | 'doctor' | 'vaccination';
export type DiaperType = 'wet' | 'dry' | 'both';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'parent' | 'caregiver' | 'admin';
}

export interface Child {
  id: string;
  name: string;
  birthDate: string;
  photo?: string;
  notes?: string;
  caregivers: string[]; // List of user UIDs
  ownerId: string;
}

export interface Feeding {
  id: string;
  childId: string;
  timestamp: string;
  type: FeedingType;
  amount?: number;
  unit?: string;
  notes?: string;
  loggedBy: string;
}

export interface Sleep {
  id: string;
  childId: string;
  startTime: string;
  endTime?: string;
  notes?: string;
  loggedBy: string;
}

export interface Health {
  id: string;
  childId: string;
  timestamp: string;
  type: HealthType;
  title: string;
  notes?: string;
  loggedBy: string;
}

export interface Diaper {
  id: string;
  childId: string;
  timestamp: string;
  type: DiaperType;
  notes?: string;
  loggedBy: string;
}

export interface Growth {
  id: string;
  childId: string;
  timestamp: string;
  weight?: number; // in kg
  height?: number; // in cm
  headCircumference?: number; // in cm
  notes?: string;
  loggedBy: string;
}

export interface Milestone {
  id: string;
  childId: string;
  title: string;
  category: 'physical' | 'cognitive' | 'social' | 'language';
  expectedAgeMonths: number;
  achievedDate?: string;
  isCustom: boolean;
  notes?: string;
  photo?: string;
}

export interface Reminder {
  id: string;
  childId: string;
  type: 'feeding' | 'sleep' | 'medication' | 'vaccination';
  title: string;
  intervalMinutes?: number;
  nextDue: string;
  isEnabled: boolean;
}

export interface Routine {
  id: string;
  childId: string;
  title: string;
  startTime: string; // e.g. "08:00"
  type: 'feeding' | 'sleep' | 'activity';
  notes?: string;
}

export interface Invite {
  id: string;
  childId: string;
  childName: string;
  inviterId: string;
  inviterEmail: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Activity {
  id: string;
  childId: string;
  timestamp: string;
  type: string;
  notes?: string;
  loggedBy: string;
}
