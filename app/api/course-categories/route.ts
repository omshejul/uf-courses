import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import type { CourseCategory } from "../../../lib/models/category";

// Get all course-category assignments for a course
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseCode = searchParams.get("courseCode");

  if (!courseCode) {
    return NextResponse.json({ error: "Course code is required" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  const assignments = await db.collection("courseCategories")
    .aggregate([
      {
        $match: {
          userId: session.user.id,
          courseCode: courseCode,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $project: {
          _id: 1,
          categoryId: 1,
          categoryName: "$category.name",
        },
      },
    ])
    .toArray();

  return NextResponse.json(assignments);
}

// Add a course to a category
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { courseCode, categoryId } = body;

  if (!courseCode || !categoryId) {
    return NextResponse.json({ error: "Course code and category ID are required" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  // Check if the category exists and belongs to the user
  const category = await db.collection("categories").findOne({
    _id: new ObjectId(categoryId),
    userId: session.user.id,
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // Check if the assignment already exists
  const existingAssignment = await db.collection("courseCategories").findOne({
    userId: session.user.id,
    courseCode,
    categoryId: new ObjectId(categoryId),
  });

  if (existingAssignment) {
    return NextResponse.json({ error: "Course already in category" }, { status: 400 });
  }

  const assignment: CourseCategory = {
    userId: session.user.id,
    courseCode,
    categoryId: new ObjectId(categoryId),
    createdAt: new Date(),
  };

  const result = await db.collection("courseCategories").insertOne(assignment);

  return NextResponse.json({
    ...assignment,
    _id: result.insertedId,
    categoryName: category.name,
  });
}

// Remove a course from a category
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseCode = searchParams.get("courseCode");
  const categoryId = searchParams.get("categoryId");

  if (!courseCode || !categoryId) {
    return NextResponse.json({ error: "Course code and category ID are required" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  await db.collection("courseCategories").deleteOne({
    userId: session.user.id,
    courseCode,
    categoryId: new ObjectId(categoryId),
  });

  return NextResponse.json({ success: true });
} 