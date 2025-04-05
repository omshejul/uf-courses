import { ObjectId } from "mongodb";

export interface Category {
  _id?: ObjectId;
  userId: string;
  name: string;
  createdAt: Date;
}

export interface CourseCategory {
  _id?: ObjectId;
  userId: string;
  courseCode: string;
  categoryId: ObjectId;
  createdAt: Date;
} 