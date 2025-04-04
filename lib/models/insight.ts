import { ObjectId } from "mongodb";

export interface Insight {
  _id?: ObjectId;
  courseCode: string;
  userId: string;
  text: string;
  difficulty: number;
  createdAt: Date;
}

export interface InsightWithUser extends Insight {
  user?: {
    _id: string;
    name?: string | null;
    image?: string | null;
  };
} 