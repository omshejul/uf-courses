import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useCategoryStore, useInsightStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface CourseCardProps {
  code: string;
  name: string;
  description: string;
  prerequisites: string;
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
  const { userInsights, addInsight, removeInsight, loadInsights } =
    useInsightStore();
  const [courseCategories, setCourseCategories] = useState<string[]>([]);
  const [isInsightDialogOpen, setIsInsightDialogOpen] = useState(false);
  const [newInsight, setNewInsight] = useState({
    text: "",
    difficulty: "Moderate" as const,
  });

  useEffect(() => {
    loadInsights();
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
  }, [code, loadInsights]);

  const handleAddInsight = () => {
    if (newInsight.text.trim()) {
      addInsight(code, newInsight);
      setNewInsight({ text: "", difficulty: "Moderate" });
      setIsInsightDialogOpen(false);
    }
  };

  const courseUserInsights = userInsights[code] || [];

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

  return (
    <motion.div
      className="bg-card/25 text-card-foreground rounded-lg shadow-lg border p-6 space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{code}</h2>
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
        <div className="text-sm font-medium text-blue-500 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 px-2 py-1 rounded inline-block">
          {insights.track}
        </div>
      )}

      <p className="text-sm text-muted-foreground line-clamp-3">
        {description}
      </p>

      {insights?.insight && (
        <div className="text-sm bg-muted/50 p-3 rounded-md">
          <span className="font-medium">Course Insight:</span>{" "}
          {insights.insight}
        </div>
      )}

      {courseUserInsights.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Community Insights:</h4>
          {courseUserInsights.map((insight) => (
            <div
              key={insight.timestamp}
              className="text-sm bg-muted/30 p-3 rounded-md flex justify-between items-start"
            >
              <div>
                <div className="font-medium text-xs mb-1">
                  {new Date(insight.timestamp).toLocaleDateString()}
                </div>
                <div>{insight.text}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => removeInsight(code, insight.timestamp)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}

      {prerequisites && (
        <div className="text-sm">
          <span className="font-semibold">Prerequisites:</span> {prerequisites}
        </div>
      )}

      <div className="space-y-2">
        {sections.map((section, idx) => (
          <div key={idx} className="text-sm space-y-1 border-t pt-2">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsInsightDialogOpen(true)}
        >
          Add Insight
        </Button>
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

      <Dialog open={isInsightDialogOpen} onOpenChange={setIsInsightDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Course Insight</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Experience</label>
              <Textarea
                value={newInsight.text}
                onChange={(e) =>
                  setNewInsight({ ...newInsight, text: e.target.value })
                }
                placeholder="Share your experience with this course..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Select
                value={newInsight.difficulty}
                onValueChange={(value: typeof newInsight.difficulty) =>
                  setNewInsight({ ...newInsight, difficulty: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Easy-Moderate">Easy-Moderate</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Moderate-Hard">Moderate-Hard</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInsightDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddInsight}>Add Insight</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
