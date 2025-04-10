"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
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
import type { Category } from "@/lib/models/category";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { signIn } from "next-auth/react";
import { ChevronDown } from "lucide-react";
import { cn, getColorForString } from "@/lib/utils";
import { useCourseStore } from "@/lib/store/course-store";
import { motion, AnimatePresence } from "framer-motion";

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
  fieldVisibility: {
    code: boolean;
    acronym: boolean;
    name: boolean;
    coreBadge: boolean;
    trackBadge: boolean;
    unavailableBadge: boolean;
    description: boolean;
    prerequisites: boolean;
    instructors: boolean;
    meetTimes: boolean;
    insights: boolean;
    categories: boolean;
    credits: boolean;
    difficulty: boolean;
  };
}

export const CS_CORE_COURSES = new Set([
  "CAP5100",
  "CAP5510",
  "COP5725",
  "CDA5155",
  "CEN5035",
  "CIS5371",
  "CNT5106C",
  "COP5536",
  "COP5556",
  "COP5615",
  "COT5405",
  "COT5615",
]);
export const CS_UNAVAILABLE_COURSES = new Set([
  "CAI6307",
  "CIS6905",
  "CIS6910",
  "CIS6935",
  "CIS6940",
  "CIS7979",
  "CIS7980",
  "EGN5949",
  "EGN6913",
]);

interface RMPRatings {
  overall: number;
  difficulty: number;
  wouldTakeAgain: number;
  totalRatings: number;
}

interface RMPProfessor {
  name: string;
  link: string;
  department: string;
  ratings: RMPRatings;
}

interface RMPSchool {
  name: string;
  id: string;
}

interface RMPResponse {
  school: RMPSchool;
  professor: RMPProfessor;
}

export function CourseCard({
  code,
  name,
  description,
  prerequisites,
  sections,
  insights: defaultInsights,
  isExpanded = false,
  onToggleExpand,
  fieldVisibility,
}: CourseCardProps) {
  const { data: session } = useSession();
  const [isAddingInsight, setIsAddingInsight] = useState(false);
  const [insightText, setInsightText] = useState("");
  const [difficulty, setDifficulty] = useState(5);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Initialize ratings from localStorage if available
  const [professorRatings, setProfessorRatings] = useState<
    Record<string, RMPResponse>
  >(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("professorRatings");
        return cached ? JSON.parse(cached) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const [loadingRatings, setLoadingRatings] = useState<Record<string, boolean>>(
    {}
  );
  const fetchedProfessors = useRef<Set<string>>(new Set());
  const isMounted = useRef(false);

  // Update localStorage when ratings change, but only after initial mount
  useEffect(() => {
    if (isMounted.current && Object.keys(professorRatings).length > 0) {
      try {
        localStorage.setItem(
          "professorRatings",
          JSON.stringify(professorRatings)
        );
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    }
  }, [professorRatings]);

  // Set isMounted on initial mount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchProfessorRating = async (professorName: string) => {
    // Skip if any of these conditions are true
    if (
      !professorName ||
      professorName === "Staff" ||
      loadingRatings[professorName] ||
      professorRatings[professorName] || // Check existing ratings
      fetchedProfessors.current.has(professorName) || // Check in-memory cache
      !isMounted.current // Skip if component is unmounting
    )
      return;

    // Mark as fetching before the request
    setLoadingRatings((prev) => ({ ...prev, [professorName]: true }));
    fetchedProfessors.current.add(professorName);

    try {
      const response = await fetch(
        `/api/rmp?school=${encodeURIComponent(
          "University of Florida"
        )}&professor=${encodeURIComponent(professorName)}`
      );
      if (!response.ok) throw new Error("Failed to fetch rating");
      const data = await response.json();

      // Only update state if component is still mounted
      if (isMounted.current) {
        setProfessorRatings((prev) => ({
          ...prev,
          [professorName]: data,
        }));
      }
    } catch (error) {
      console.error("Error fetching professor rating:", error);
      // Remove from cache on error to allow retry
      fetchedProfessors.current.delete(professorName);
    } finally {
      if (isMounted.current) {
        setLoadingRatings((prev) => ({ ...prev, [professorName]: false }));
      }
    }
  };

  // Fetch ratings only once on initial mount or when sections change
  useEffect(() => {
    if (!isMounted.current) return;

    const uniqueProfessors = new Set<string>();
    sections.forEach((section) => {
      section.instructors.forEach((instructor) => {
        const name = instructor.name;
        if (
          name &&
          name !== "Staff" &&
          !professorRatings[name] && // Check if already in state
          !fetchedProfessors.current.has(name) && // Check if already fetching
          !loadingRatings[name] // Check if currently loading
        ) {
          uniqueProfessors.add(name);
        }
      });
    });

    // Fetch ratings for new professors only
    uniqueProfessors.forEach((professorName) => {
      fetchProfessorRating(professorName);
    });
  }, []); // Remove professorRatings dependency

  const {
    courseData,
    allCategories,
    error,
    addInsight,
    removeInsight,
    toggleCategory,
  } = useCourseStore();

  const courseInfo = courseData[code] || { insights: [], categories: [] };

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

  const handleToggleCategory = async (categoryId: string) => {
    if (!session) {
      signIn("google");
      return;
    }

    try {
      await toggleCategory(code, categoryId);
    } catch (error) {
      console.error("Failed to toggle category:", error);
    }
  };

  return (
    <Card
      className={cn(
        "relative",
        isExpanded ? "h-auto" : "max-h-[300px] overflow-hidden",
        CS_UNAVAILABLE_COURSES.has(code) && "order-last"
      )}
    >
      <CardContent className="relative">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="sr-only">
                {code} {generateAcronym(name)} {name}
              </span>
              <span aria-hidden="true" className="flex items-center gap-2">
                {fieldVisibility.code && <span>{code}</span>}
                {fieldVisibility.acronym && name && (
                  <span className="text-muted-foreground">
                    {generateAcronym(name)}
                  </span>
                )}
              </span>
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {fieldVisibility.name && (
                <h3 className="text-xl text-muted-foreground">{name}</h3>
              )}
              {fieldVisibility.coreBadge && CS_CORE_COURSES.has(code) && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                  Core
                </span>
              )}
              {fieldVisibility.unavailableBadge &&
                CS_UNAVAILABLE_COURSES.has(code) && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-full">
                    Unavailable
                  </span>
                )}
              {fieldVisibility.categories &&
                courseInfo.categories.map((categoryId) => {
                  const category = allCategories.find(
                    (c) => c._id?.toString() === categoryId
                  );
                  if (!category) return null;
                  return (
                    <span
                      key={categoryId}
                      className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full",
                        getColorForString(category.name)
                      )}
                    >
                      {category.name}
                    </span>
                  );
                })}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {fieldVisibility.credits && (
              <div className="text-sm min-w-16 text-right font-medium">
                {typeof sections[0]?.credits === "number"
                  ? `${sections[0].credits} credits`
                  : sections[0]?.credits}
              </div>
            )}
            {fieldVisibility.difficulty && defaultInsights?.difficulty && (
              <div
                className="px-2 py-1 text-sm rounded font-medium"
                style={{
                  backgroundColor:
                    defaultInsights.difficulty === "Easy"
                      ? "rgb(34 197 94 / 0.1)"
                      : defaultInsights.difficulty === "Easy-Moderate"
                      ? "rgb(34 197 94 / 0.2)"
                      : defaultInsights.difficulty === "Moderate"
                      ? "rgb(234 179 8 / 0.1)"
                      : defaultInsights.difficulty === "Moderate-Hard"
                      ? "rgb(234 179 8 / 0.2)"
                      : defaultInsights.difficulty === "Hard"
                      ? "rgb(239 68 68 / 0.1)"
                      : "rgb(148 163 184 / 0.1)",
                  color:
                    defaultInsights.difficulty === "Easy" ||
                    defaultInsights.difficulty === "Easy-Moderate"
                      ? "rgb(34 197 94)"
                      : defaultInsights.difficulty === "Moderate" ||
                        defaultInsights.difficulty === "Moderate-Hard"
                      ? "rgb(234 179 8)"
                      : defaultInsights.difficulty === "Hard"
                      ? "rgb(239 68 68)"
                      : "rgb(148 163 184)",
                }}
              >
                {defaultInsights.difficulty}
              </div>
            )}
          </div>
        </div>

        {fieldVisibility.trackBadge && defaultInsights?.track && (
          <div className="text-sm my-2 font-medium text-blue-500 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 px-2 py-1 rounded inline-block">
            {defaultInsights.track}
          </div>
        )}

        {fieldVisibility.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>
        )}

        {/* Show error state */}
        {error && (
          <div className="p-4 text-sm text-red-500">
            Error loading course data: {error}
          </div>
        )}

        {fieldVisibility.insights && (
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
            {defaultInsights && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border-2 border-primary/10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm mb-1">{defaultInsights.insight}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>Difficulty: {defaultInsights.difficulty}</span>
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
            {courseInfo.insights.length > 0 ? (
              <div className="space-y-3">
                {courseInfo.insights.map((insight: InsightWithUser) => {
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
              !defaultInsights && (
                <p className="text-center text-gray-500 py-4">
                  No insights yet. Be the first to share!
                </p>
              )
            )}
          </div>
        )}

        {fieldVisibility.prerequisites &&
          prerequisites &&
          prerequisites.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Prerequisites:</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                {prerequisites.map((prereq) => (
                  <li key={prereq}>{prereq}</li>
                ))}
              </ul>
            </div>
          )}

        {(fieldVisibility.instructors || fieldVisibility.meetTimes) && (
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
                    {fieldVisibility.instructors && (
                      <div className="font-semibold flex flex-col gap-1">
                        <div
                          className={cn(
                            "group relative",
                            isExpanded ? "cursor-default" : "cursor-pointer"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span>Instructor: {instructorName}</span>
                            {instructorName !== "Staff" &&
                              loadingRatings[instructorName] && (
                                <motion.span
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-xs text-gray-500"
                                >
                                  Loading rating...
                                </motion.span>
                              )}
                          </div>
                          <AnimatePresence>
                            {professorRatings[instructorName]?.professor && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 30,
                                }}
                                className={cn(
                                  "text-sm my-2 font-normal bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-primary/10 p-2 space-y-1",
                                  !isExpanded &&
                                    "absolute top-full left-0 right-0 mt-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                                )}
                              >
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.1 }}
                                  className="flex items-center gap-4 flex-wrap"
                                >
                                  <span className="flex items-center gap-1">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Rating:
                                    </span>
                                    <span
                                      className={cn(
                                        "font-medium",
                                        professorRatings[instructorName]
                                          .professor.ratings.overall >= 4
                                          ? "text-green-600 dark:text-green-400"
                                          : professorRatings[instructorName]
                                              .professor.ratings.overall >= 3
                                          ? "text-yellow-600 dark:text-yellow-400"
                                          : "text-red-600 dark:text-red-400"
                                      )}
                                    >
                                      {
                                        professorRatings[instructorName]
                                          .professor.ratings.overall
                                      }
                                      /5
                                    </span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Difficulty:
                                    </span>
                                    <span className="font-medium">
                                      {
                                        professorRatings[instructorName]
                                          .professor.ratings.difficulty
                                      }
                                      /5
                                    </span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      Would take again:
                                    </span>
                                    <span className="font-medium">
                                      {Math.round(
                                        professorRatings[instructorName]
                                          .professor.ratings.wouldTakeAgain
                                      )}
                                      %
                                    </span>
                                  </span>
                                </motion.div>
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.2 }}
                                  className="flex items-center gap-1 text-xs text-gray-500"
                                >
                                  <span>
                                    {
                                      professorRatings[instructorName].professor
                                        .department
                                    }
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {
                                      professorRatings[instructorName].professor
                                        .ratings.totalRatings
                                    }{" "}
                                    ratings
                                  </span>
                                  <span>•</span>
                                  <a
                                    href={
                                      professorRatings[instructorName].professor
                                        .link
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    View on RMP
                                  </a>
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                    {fieldVisibility.meetTimes &&
                      Array.from(data.meetTimes.values()).map(
                        (time, timeIdx) => (
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
                        )
                      )}
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
        )}

        {fieldVisibility.categories && (
          <div className="flex gap-2 pt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" onClick={() => !session && signIn("google")}>
                  Add to Category
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {allCategories.map((category: Category) => {
                  const categoryId = category._id?.toString() || "";
                  const isInCategory =
                    courseInfo.categories.includes(categoryId);
                  return (
                    <DropdownMenuItem
                      key={categoryId}
                      onClick={() => handleToggleCategory(categoryId)}
                    >
                      <span className="mr-2">{isInCategory ? "✓" : ""}</span>
                      {category.name}
                    </DropdownMenuItem>
                  );
                })}
                {allCategories.length === 0 && (
                  <DropdownMenuItem disabled>
                    Create a category first
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {!isExpanded && (
          <>
            <div className="absolute top-[190px] left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          </>
        )}
        {isExpanded && (
          <>
            <div className="mb-8" />
          </>
        )}
      </CardContent>

      <button
        // variant="ghost"
        // size="sm"
        onClick={onToggleExpand}
        className={cn(
          "absolute z-10 cursor-pointer hover:bg-zinc-500/10  bottom-0 left-0 right-0 w-full rounded-lg h-12 flex items-center justify-center transition duration-500",
          isExpanded && "rotate-180"
        )}
      >
        <ChevronDown className="h-4 w-4" />
        <span className="sr-only">
          {isExpanded ? "Show less" : "Show more"}
        </span>
      </button>
    </Card>
  );
}
