import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import type { Category, CourseCategory } from "../../../lib/models/category";

// Get all categories for the current user
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db();

  const categories = await db.collection("categories")
    .find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(categories);
}

// Create a new category
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  const category: Category = {
    userId: session.user.id,
    name,
    createdAt: new Date(),
  };

  const result = await db.collection("categories").insertOne(category);

  return NextResponse.json({
    ...category,
    _id: result.insertedId,
  });
}

// Delete a category
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("id");

  if (!categoryId) {
    return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  // Delete the category
  await db.collection("categories").deleteOne({
    _id: new ObjectId(categoryId),
    userId: session.user.id,
  });

  // Delete all course assignments for this category
  await db.collection("courseCategories").deleteMany({
    categoryId: new ObjectId(categoryId),
    userId: session.user.id,
  });

  return NextResponse.json({ success: true });
} 