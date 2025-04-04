import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/app/api/auth/config";
import type { Insight, InsightWithUser } from "@/lib/models/insight";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseCode = searchParams.get("courseCode");

  if (!courseCode) {
    return NextResponse.json({ error: "Course code is required" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  const insights = await db
    .collection("insights")
    .aggregate<InsightWithUser>([
      { $match: { courseCode } },
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
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(insights);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { courseCode, text, difficulty, isAnonymous } = body;

  if (!courseCode || !text || difficulty === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  const insight: Insight = {
    courseCode,
    userId: session.user.id,
    text,
    difficulty,
    createdAt: new Date(),
    isAnonymous: isAnonymous || false,
  };

  const result = await db.collection("insights").insertOne(insight);

  const userInfo = isAnonymous ? null : {
    _id: session.user.id,
    name: session.user.name,
    image: session.user.image,
  };

  return NextResponse.json({
    ...insight,
    _id: result.insertedId,
    user: userInfo,
  });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Insight ID is required" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  const result = await db.collection("insights").deleteOne({
    _id: new ObjectId(id),
    userId: session.user.id,
  });

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: "Insight not found or unauthorized" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
} 