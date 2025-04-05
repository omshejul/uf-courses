"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useCategoryStore, useInsightStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { InsightWithUser } from "@/lib/models/insight";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const dayCodeToName = (code: string): string => {
  const days: Record<string, string> = {
    M: "Monday",
    T: "Tuesday",
    W: "Wednesday",
    R: "Thursday",
    F: "Friday",
    S: "Saturday",
    U: "Sunday",
  };
  return days[code] || code;
};

export const generateAcronym = (name: string): string => {
  // Split by spaces and get first letter of each word, excluding common words
  const commonWords = ["of", "the", "in", "and", "for", "to", "a", "an"];
  return name
    .split(" ")
    .filter((word) => !commonWords.includes(word.toLowerCase()))
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

interface CourseCardProps {
  code: string;
  name: string;
  description: string;
  prerequisites?: string[];
  sections: Array<{
    instructors: Array<{ name: string }>;
    meetTimes: Array<{
      meetDays: string[];
      meetTimeBegin: string;
      meetTimeEnd: string;
      meetBuilding: string;
      meetRoom: string | number;
    }>;
    credits: number | string;
    finalExam?: string;
  }>;
  insights?: {
    insight: string;
    difficulty: string;
    track?: string;
  };
}

export function CourseCard({
  code,
  name,
  description,
  prerequisites,
  sections,
  insights,
}: CourseCardProps) {
  const { categories } = useCategoryStore();
  const {
    insights: userInsights,
    addInsight,
    removeInsight,
    fetchInsights,
  } = useInsightStore();
  const [courseCategories, setCourseCategories] = useState<string[]>([]);
  const { data: session } = useSession();
  const [isAddingInsight, setIsAddingInsight] = useState(false);
  const [insightText, setInsightText] = useState("");
  const [difficulty, setDifficulty] = useState(5);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    fetchInsights(code);
    const storedCourseCategories = localStorage.getItem(
      `course_categories_${code}`
    );
    if (storedCourseCategories) {
      try {
        setCourseCategories(JSON.parse(storedCourseCategories));
      } catch (e) {
        console.error("Failed to parse course categories:", e);
        setCourseCategories([]);
      }
    }
  }, [code, fetchInsights]);

  const courseInsights = userInsights[code] || [];

  const toggleCategory = (categoryName: string) => {
    const newCategories = courseCategories.includes(categoryName)
      ? courseCategories.filter((c) => c !== categoryName)
      : [...courseCategories, categoryName];

    localStorage.setItem(
      `course_categories_${code}`,
      JSON.stringify(newCategories)
    );
    setCourseCategories(newCategories);
  };

  const handleSubmitInsight = async () => {
    if (!session) return;
    if (!insightText.trim()) return;

    try {
      await addInsight(code, insightText.trim(), difficulty, isAnonymous);
      setInsightText("");
      setDifficulty(5);
      setIsAnonymous(false);
      setIsAddingInsight(false);
    } catch (error) {
      console.error("Failed to add insight:", error);
    }
  };

  const handleDeleteInsight = async (insightId: string) => {
    try {
      await removeInsight(code, insightId);
    } catch (error) {
      console.error("Failed to remove insight:", error);
    }
  };

  return (
    <Card className="w-full">
      <CardContent>
        <div className="flex justify-between items-start">
          <div>
            <h2
              className="text-2xl font-bold"
              data-course-acronym={generateAcronym(name)}
            >
              <span className="sr-only">
                {code} {generateAcronym(name)} {name}
              </span>
              <span aria-hidden="true">
                {code}
                {name && (
                  <span className="ml-2 text-muted-foreground">
                    - {generateAcronym(name)}
                  </span>
                )}
              </span>
            </h2>
            <h3 className="text-xl text-muted-foreground">{name}</h3>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-sm font-medium">
              {typeof sections[0]?.credits === "number"
                ? `${sections[0].credits} credits`
                : sections[0]?.credits}
            </div>
            {insights && (
              <div
                className="px-2 py-1 rounded text-sm font-medium"
                style={{
                  backgroundColor:
                    insights.difficulty === "Easy"
                      ? "rgb(34 197 94 / 0.1)"
                      : insights.difficulty === "Easy-Moderate"
                      ? "rgb(34 197 94 / 0.2)"
                      : insights.difficulty === "Moderate"
                      ? "rgb(234 179 8 / 0.1)"
                      : insights.difficulty === "Moderate-Hard"
                      ? "rgb(234 179 8 / 0.2)"
                      : insights.difficulty === "Hard"
                      ? "rgb(239 68 68 / 0.1)"
                      : "rgb(148 163 184 / 0.1)",
                  color:
                    insights.difficulty === "Easy" ||
                    insights.difficulty === "Easy-Moderate"
                      ? "rgb(34 197 94)"
                      : insights.difficulty === "Moderate" ||
                        insights.difficulty === "Moderate-Hard"
                      ? "rgb(234 179 8)"
                      : insights.difficulty === "Hard"
                      ? "rgb(239 68 68)"
                      : "rgb(148 163 184)",
                }}
              >
                {insights.difficulty}
              </div>
            )}
          </div>
        </div>

        {insights?.track && (
          <div className="text-sm my-2 font-medium text-blue-500 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 px-2 py-1 rounded inline-block">
            {insights.track}
          </div>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Course Insights</h3>
            {session && (
              <Dialog open={isAddingInsight} onOpenChange={setIsAddingInsight}>
                <DialogTrigger asChild>
                  <Button variant="outline">Add Insight</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Add Course Insight
                      <div className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 ml-2">
                        Public
                      </div>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-4 space-y-4">
                    <Textarea
                      placeholder="Share your experience with this course..."
                      value={insightText}
                      onChange={(e) => setInsightText(e.target.value)}
                    />
                    <div className="space-y-2">
                      <Label>Difficulty (1-10)</Label>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[difficulty]}
                        onValueChange={(value) => setDifficulty(value[0])}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="anonymous"
                        checked={isAnonymous}
                        onCheckedChange={(checked: boolean) =>
                          setIsAnonymous(checked)
                        }
                      />
                      <Label htmlFor="anonymous">Post anonymously</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingInsight(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSubmitInsight}>Submit</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Static Insight */}
          {insights && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border-2 border-primary/10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm mb-1">{insights.insight}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>Difficulty: {insights.difficulty}</span>
                    <span>•</span>
                    <span>Provided by a Senior</span>
                    <span>•</span>
                    <span>Credit Kaushik</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Insights */}
          {courseInsights.length > 0 ? (
            <div className="space-y-3">
              {courseInsights.map((insight: InsightWithUser) => {
                const insightId = insight._id?.toString();
                return (
                  <div
                    key={insightId || insight.createdAt.toString()}
                    className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm mb-1">{insight.text}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>Difficulty: {insight.difficulty}/10</span>
                          <span>•</span>
                          <span>{insight.user?.name || "Anonymous"}</span>
                        </div>
                      </div>
                      {session?.user?.id === insight.userId && insightId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInsight(insightId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            !insights && (
              <p className="text-center text-gray-500 py-4">
                No insights yet. Be the first to share!
              </p>
            )
          )}
        </div>

        {prerequisites && prerequisites.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Prerequisites:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
              {prerequisites.map((prereq) => (
                <li key={prereq}>{prereq}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          {sections.map((section, idx) => (
            <div key={idx} className="text-sm space-y-1 border-t mt-2 pt-2">
              <div className="font-semibold">
                Instructor: {section.instructors.map((i) => i.name).join(", ")}
              </div>
              {section.meetTimes.map((time, timeIdx) => (
                <div key={timeIdx} className="flex items-center gap-2">
                  <span className="font-medium">
                    {time.meetDays.map((day) => dayCodeToName(day)).join(", ")}
                  </span>
                  <span>
                    {time.meetTimeBegin} - {time.meetTimeEnd}
                  </span>
                  {time.meetBuilding && (
                    <span>
                      {time.meetBuilding} {time.meetRoom}
                    </span>
                  )}
                </div>
              ))}
              {section.finalExam && (
                <div className="text-muted-foreground">
                  Final Exam: {section.finalExam}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">Add to Category</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => toggleCategory(category)}
                >
                  <span className="mr-2">
                    {courseCategories.includes(category) ? "✓" : ""}
                  </span>
                  {category}
                </DropdownMenuItem>
              ))}
              {categories.length === 0 && (
                <DropdownMenuItem disabled>
                  Create a category first
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
