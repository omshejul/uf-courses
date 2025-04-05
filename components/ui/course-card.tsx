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
import { signIn } from "next-auth/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function CourseCard({
  code,
  name,
  description,
  prerequisites,
  sections,
  insights,
  isExpanded = false,
  onToggleExpand,
}: CourseCardProps) {
  const {
    categories,
    courseCategoryMap,
    addCourseToCategory,
    removeCourseFromCategory,
    fetchCourseCategories,
  } = useCategoryStore();
  const {
    insights: userInsights,
    addInsight,
    removeInsight,
    fetchInsights,
  } = useInsightStore();
  const { data: session } = useSession();
  const [isAddingInsight, setIsAddingInsight] = useState(false);
  const [insightText, setInsightText] = useState("");
  const [difficulty, setDifficulty] = useState(5);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.id) {
        // Batch fetch both insights and categories in parallel
        await Promise.all([fetchInsights(code), fetchCourseCategories(code)]);
      }
    };

    // Only fetch if we don't already have the data
    if (
      session?.user?.id &&
      (!userInsights[code] || !courseCategoryMap[code])
    ) {
      fetchData();
    }
  }, [
    code,
    fetchInsights,
    fetchCourseCategories,
    session?.user?.id,
    userInsights,
    courseCategoryMap,
  ]);

  const courseInsights = userInsights[code] || [];
  const courseCategories = courseCategoryMap[code] || [];

  const toggleCategory = async (categoryId: string) => {
    if (!session) {
      signIn("google");
      return;
    }

    try {
      if (courseCategories.includes(categoryId)) {
        await removeCourseFromCategory(code, categoryId);
      } else {
        await addCourseToCategory(code, categoryId);
      }
    } catch (error) {
      console.error("Failed to toggle category:", error);
    }
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
    <Card
      className={cn(
        "w-full relative transition-all duration-300",
        !isExpanded && "h-[300px] overflow-hidden"
      )}
    >
      <CardContent className="relative">
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
            <Dialog open={isAddingInsight} onOpenChange={setIsAddingInsight}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!session) {
                      signIn("google");
                      return;
                    }
                  }}
                >
                  Add Insight
                </Button>
              </DialogTrigger>
              {session && (
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
              )}
            </Dialog>
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
          {(() => {
            // Group sections by instructor
            const instructorSections = new Map<
              string,
              {
                meetTimes: Map<
                  string,
                  {
                    meetDays: string[];
                    meetTimeBegin: string;
                    meetTimeEnd: string;
                    meetBuilding: string;
                    meetRoom: string | number;
                  }
                >;
                finalExam?: string;
              }
            >();

            sections.forEach((section) => {
              const instructorName =
                section.instructors.length > 0
                  ? section.instructors.map((i) => i.name).join(", ")
                  : "Staff";

              if (!instructorSections.has(instructorName)) {
                instructorSections.set(instructorName, {
                  meetTimes: new Map(),
                  finalExam: section.finalExam,
                });
              }

              // Add unique meeting times
              section.meetTimes.forEach((time) => {
                const timeKey = `${time.meetDays.join("")}-${
                  time.meetTimeBegin
                }-${time.meetTimeEnd}-${time.meetBuilding}-${time.meetRoom}`;
                instructorSections
                  .get(instructorName)!
                  .meetTimes.set(timeKey, time);
              });
            });

            return Array.from(instructorSections.entries()).map(
              ([instructorName, data], idx) => (
                <div
                  key={`${instructorName}-${idx}`}
                  className="text-sm space-y-1 border-t mt-2 pt-2"
                >
                  <div className="font-semibold">
                    Instructor: {instructorName}
                  </div>
                  {Array.from(data.meetTimes.values()).map((time, timeIdx) => (
                    <div
                      key={`${time.meetDays.join("")}-${
                        time.meetTimeBegin
                      }-${timeIdx}`}
                      className="flex items-center gap-2"
                    >
                      <span className="font-medium">
                        {time.meetDays
                          .map((day: string) => dayCodeToName(day))
                          .join(", ")}
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
                  {data.finalExam && (
                    <div className="text-muted-foreground">
                      Final Exam: {data.finalExam}
                    </div>
                  )}
                </div>
              )
            );
          })()}
        </div>

        <div className="flex gap-2 pt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* dont remove margin bottom */}
              <Button
                size="sm"
                className="mb-8"
                onClick={() => !session && signIn("google")}
              >
                Add to Category
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category._id?.toString()}
                  onClick={() => toggleCategory(category._id?.toString() || "")}
                >
                  <span className="mr-2">
                    {courseCategories.includes(category._id?.toString() || "")
                      ? "✓"
                      : ""}
                  </span>
                  {category.name}
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

        {!isExpanded && (
          <>
            <div className="absolute top-[190px] left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            {/* <div className="absolute bottom-0 left-0 right-0 h-12 backdrop-blur-sm bg-background/50" /> */}
          </>
        )}
      </CardContent>

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleExpand}
        className={cn(
          "absolute z-10 bg-gradient-radial from-black to-transparent bottom-0 left-0 right-0 w-full rounded-lg  h-12 flex items-center justify-center transition duration-500 ",
          isExpanded && "rotate-180"
        )}
      >
        <ChevronDown className="h-4 w-4" />
        <span className="sr-only">
          {isExpanded ? "Show less" : "Show more"}
        </span>
      </Button>
    </Card>
  );
}
