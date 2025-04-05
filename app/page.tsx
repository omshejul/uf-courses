"use client";

import { useState, useMemo, useEffect } from "react";
import { CourseCard, generateAcronym } from "@/components/ui/course-card";
import { CourseFilters } from "@/components/ui/course-filters";
import { Footer } from "@/components/ui/footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Masonry from "react-masonry-css";
import { List, LayoutGrid } from "lucide-react";
import Cookies from "js-cookie";
import { useCourseStore } from "@/lib/store/course-store";
import { coursesData, ECE_COURSES, COURSE_INSIGHTS } from "../lib/data";
import type { Course } from "@/lib/types";

// Course categories mapping
const COURSE_CATEGORIES = {
  ALL: ["*"],
  AI_ML: ["CAI", "CAP6617", "COT5615", "CIS6261"],
  SYSTEMS: ["CDA", "COP5615", "CNT"],
  THEORY: ["COT", "COP5536"],
  SECURITY: ["CNT5410", "CIS6261"],
  HCI: ["CEN5728", "CIS6930"],
  SPECIAL_TOPICS: ["CIS6930"],
  RESEARCH: ["CIS6905", "CIS6910", "CIS7979", "CIS7980", "EGN6913"],
} as const;

type CategoryKey = keyof typeof COURSE_CATEGORIES;

export default function Home() {
  // Use useState with a default value to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("ALL");
  const [isGridView, setIsGridView] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [areAllCardsExpanded, setAreAllCardsExpanded] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<"CS" | "ECE">(
    "CS"
  );
  const fetchAllData = useCourseStore((state) => state.fetchAllData);

  // Handle cookie after mount to avoid hydration mismatch
  useEffect(() => {
    const savedDepartment = Cookies.get("selectedDepartment") as "CS" | "ECE";
    if (savedDepartment) {
      setSelectedDepartment(savedDepartment);
    }
    setMounted(true);
  }, []);

  // Save department selection to cookie
  useEffect(() => {
    if (mounted) {
      Cookies.set("selectedDepartment", selectedDepartment);
    }
  }, [selectedDepartment, mounted]);

  // Use the appropriate course data based on department
  const courses = useMemo(() => {
    const data = selectedDepartment === "CS" ? coursesData[0] : ECE_COURSES[0];
    return data.COURSES as unknown as Course[];
  }, [selectedDepartment]);

  // Fetch all course data at once when department changes
  useEffect(() => {
    if (mounted) {
      const courseCodes = courses.map((course) => course.code);
      fetchAllData(courseCodes);
    }
  }, [courses, fetchAllData, mounted]);

  const toggleAllCards = () => {
    if (areAllCardsExpanded) {
      setExpandedCards(new Set());
    } else {
      setExpandedCards(new Set(filteredCourses.map((course) => course.code)));
    }
    setAreAllCardsExpanded(!areAllCardsExpanded);
  };

  const toggleCard = (courseCode: string) => {
    const newExpandedCards = new Set(expandedCards);
    if (newExpandedCards.has(courseCode)) {
      newExpandedCards.delete(courseCode);
    } else {
      newExpandedCards.add(courseCode);
    }
    setExpandedCards(newExpandedCards);
    setAreAllCardsExpanded(newExpandedCards.size === filteredCourses.length);
  };

  const filteredCourses = useMemo(() => {
    if (!mounted) return [];

    return courses.filter((course) => {
      // Category filtering
      if (selectedCategory !== "ALL") {
        if (selectedCategory in COURSE_CATEGORIES) {
          const categoryMatches = COURSE_CATEGORIES[
            selectedCategory as CategoryKey
          ]?.some((prefix) => course.code.startsWith(prefix));
          if (!categoryMatches) return false;
        } else {
          const courseCategories = localStorage.getItem(
            `course_categories_${course.code}`
          );
          if (
            !courseCategories ||
            !JSON.parse(courseCategories).includes(selectedCategory)
          ) {
            return false;
          }
        }
      }

      // Search query filtering
      const searchTerms = searchQuery.toLowerCase().split(" ");
      const acronym = generateAcronym(course.name);
      return searchTerms.every(
        (term) =>
          course.name.toLowerCase().includes(term) ||
          course.code.toLowerCase().includes(term) ||
          course.description.toLowerCase().includes(term) ||
          course.prerequisites.toLowerCase().includes(term) ||
          acronym.toLowerCase().includes(term) ||
          course.sections.some((section) =>
            section.instructors.some((instructor) =>
              instructor.name.toLowerCase().includes(term)
            )
          )
      );
    });
  }, [courses, searchQuery, selectedCategory, mounted]);

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  const breakpointColumnsObj = {
    default: 3,
    1536: 2,
    1024: 2,
    768: 1,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CourseFilters
        onSearch={setSearchQuery}
        onCategoryChange={(category: string) =>
          setSelectedCategory(category as CategoryKey)
        }
        selectedCategory={selectedCategory}
        onViewChange={setIsGridView}
        isGridView={isGridView}
        onDepartmentChange={setSelectedDepartment}
        selectedDepartment={selectedDepartment}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-muted-foreground">
            Found {filteredCourses.length} courses
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="px-2 lg:px-3"
              onClick={() => setIsGridView(!isGridView)}
            >
              {isGridView ? (
                <List className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle view</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllCards}
              className="flex items-center gap-2"
            >
              {areAllCardsExpanded ? "Collapse All" : "Expand All"}
            </Button>
          </div>
        </div>

        {isGridView ? (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="flex -ml-6 w-auto"
            columnClassName="pl-6 bg-clip-padding"
          >
            {filteredCourses.map((course) => (
              <div
                key={`${course.code}-${Math.random().toString(16).slice(2)}`}
                className="mb-6 relative"
              >
                <CourseCard
                  code={course.code}
                  name={course.name}
                  description={course.description}
                  prerequisites={
                    course.prerequisites
                      ? course.prerequisites
                          .replace(/Prereq:\s*/gi, "")
                          .split(/[.,;]/)
                          .filter(Boolean)
                          .map((p) => p.trim())
                      : []
                  }
                  sections={course.sections}
                  insights={
                    COURSE_INSIGHTS[course.code as keyof typeof COURSE_INSIGHTS]
                  }
                  isExpanded={expandedCards.has(course.code)}
                  onToggleExpand={() => toggleCard(course.code)}
                />
              </div>
            ))}
          </Masonry>
        ) : (
          <motion.div
            className="flex flex-col gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {filteredCourses.map((course) => (
              <div
                key={`${course.code}-${Math.random().toString(16).slice(2)}`}
                className="relative"
              >
                <CourseCard
                  code={course.code}
                  name={course.name}
                  description={course.description}
                  prerequisites={
                    course.prerequisites
                      ? course.prerequisites
                          .replace(/Prereq:\s*/gi, "")
                          .split(/[.,;]/)
                          .filter(Boolean)
                          .map((p) => p.trim())
                      : []
                  }
                  sections={course.sections}
                  insights={
                    COURSE_INSIGHTS[course.code as keyof typeof COURSE_INSIGHTS]
                  }
                  isExpanded={expandedCards.has(course.code)}
                  onToggleExpand={() => toggleCard(course.code)}
                />
              </div>
            ))}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
