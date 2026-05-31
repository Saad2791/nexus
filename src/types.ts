export type Subject = {
  id: string;
  name: string;
  code: string;
  color: string;
  progress: number;
};

export type Exam = {
  id: string;
  subject: string;
  date: string;
  type: string;
};

export type WeakTopic = {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  accuracy: number;
};
