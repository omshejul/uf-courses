export interface CourseSection {
  number: string | number;
  classNumber: number;
  gradBasis: string;
  acadCareer: string;
  display: string;
  credits: number | string;
  credits_min: number;
  credits_max: number;
  note: string;
  dNote: string;
  genEd: string[];
  quest: string[];
  sectWeb: string;
  rotateTitle: string;
  deptCode: number;
  deptName: string;
  openSeats: null | number;
  courseFee: number;
  lateFlag: string;
  EEP: string;
  LMS: string;
  instructors: Array<{ name: string }>;
  meetTimes: Array<{
    meetNo: number;
    meetDays: string[];
    meetTimeBegin: string;
    meetTimeEnd: string;
    meetPeriodBegin: string;
    meetPeriodEnd: string;
    meetBuilding: string;
    meetBldgCode: number;
    meetRoom: string | number;
  }>;
  addEligible: string;
  grWriting: string;
  finalExam: string;
  dropaddDeadline: string;
  pastDeadline: boolean;
  startDate: string;
  endDate: string;
  waitList: {
    isEligible: string;
    cap: number;
    total: number;
  };
  isAICourse?: boolean;
}

export interface Course {
  code: string;
  courseId: number;
  name: string;
  openSeats: null | number;
  termInd: string;
  description: string;
  prerequisites: string;
  sections: CourseSection[];
}

export interface CourseData {
  COURSES: Course[];
  LASTCONTROLNUMBER: number;
  RETRIEVEDROWS: number;
  TOTALROWS: number;
}

export interface CourseInsight {
  insight: string;
  difficulty: string;
  track?: string;
} 