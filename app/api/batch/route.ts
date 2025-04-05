import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/config";
import clientPromise from "@/lib/mongodb";
import type { InsightWithUser } from "@/lib/models/insight";

interface CourseCategory {
  _id: string;
  courseCode: string;
  categoryId: string;
  categoryName: string;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const courseCodes = searchParams.get("courseCodes")?.split(",");

  if (!courseCodes?.length) {
    return NextResponse.json({ error: "Course codes are required" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  // Get insights for all courses
  const insights = await db
    .collection("insights")
    .aggregate<InsightWithUser>([
      { $match: { courseCode: { $in: courseCodes } } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $addFields: {
          user: {
            $cond: {
              if: "$isAnonymous",
              then: null,
              else: { $arrayElemAt: ["$userInfo", 0] }
            }
          }
        },
      },
      {
        $project: {
          userInfo: 0,
          "user.email": 0,
          "user.emailVerified": 0,
        },
      },
    ])
    .toArray();

  // Get categories only if user is logged in
  let categories: CourseCategory[] = [];
  if (session?.user?.id) {
    categories = await db.collection("courseCategories")
      .aggregate<CourseCategory>([
        {
          $match: {
            userId: session.user.id,
            courseCode: { $in: courseCodes },
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
            courseCode: 1,
            categoryId: 1,
            categoryName: "$category.name",
          },
        },
      ])
      .toArray();
  }

  // Group data by course code for easier client-side consumption
  const groupedData = courseCodes.reduce((acc, code) => {
    acc[code] = {
      insights: insights.filter(i => i.courseCode === code),
      categories: categories.filter(c => c.courseCode === code),
    };
    return acc;
  }, {} as Record<string, { insights: InsightWithUser[], categories: { _id: string, courseCode: string, categoryId: string, categoryName: string }[] }>);

  return NextResponse.json(groupedData);
} 