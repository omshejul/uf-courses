import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useCategoryStore } from "@/lib/store";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const DEFAULT_CATEGORIES = {
  ALL: ["*"],
  AI_ML: ["CAI", "CAP6617", "COT5615", "CIS6261"],
  SYSTEMS: ["CDA", "COP5615", "CNT"],
  THEORY: ["COT", "COP5536"],
  SECURITY: ["CNT5410", "CIS6261"],
  HCI: ["CEN5728", "CIS6930"],
  SPECIAL_TOPICS: ["CIS6930"],
  RESEARCH: ["CIS6905", "CIS6910", "CIS7979", "CIS7980", "EGN6913"],
} as const;

interface CourseFiltersProps {
  onSearch: (query: string) => void;
  onCategoryChange: (
    category:
      | "ALL"
      | "AI_ML"
      | "SYSTEMS"
      | "THEORY"
      | "SECURITY"
      | "HCI"
      | "SPECIAL_TOPICS"
      | "RESEARCH"
  ) => void;
  selectedCategory:
    | "ALL"
    | "AI_ML"
    | "SYSTEMS"
    | "THEORY"
    | "SECURITY"
    | "HCI"
    | "SPECIAL_TOPICS"
    | "RESEARCH";
}

export function CourseFilters({
  onSearch,
  onCategoryChange,
  selectedCategory,
}: CourseFiltersProps) {
  const { categories, setCategories, addCategory, removeCategory } =
    useCategoryStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Load categories from localStorage on client-side only
  useEffect(() => {
    const stored = localStorage.getItem("custom_categories");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCategories(parsed);
      } catch (e) {
        console.error("Failed to parse stored categories:", e);
        setCategories([]);
      }
    }
  }, [setCategories]);

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      try {
        addCategory(newCategoryName.trim());
        localStorage.setItem(
          "custom_categories",
          JSON.stringify([...categories, newCategoryName.trim()])
        );
        setNewCategoryName("");
        setIsDialogOpen(false);
      } catch (e) {
        console.error("Failed to save category:", e);
      }
    }
  };

  const handleRemoveCategory = (categoryName: string) => {
    try {
      removeCategory(categoryName);
      localStorage.setItem(
        "custom_categories",
        JSON.stringify(categories.filter((c) => c !== categoryName))
      );

      if (selectedCategory === categoryName) {
        onCategoryChange("ALL");
      }
    } catch (e) {
      console.error("Failed to remove category:", e);
    }
  };

  return (
    <motion.div
      className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-4 border-b"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex gap-4 items-center">
          <Input
            type="search"
            placeholder="Search by course name, code, description, prerequisites, or instructor..."
            className="max-w-2xl"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSearch(e.target.value)
            }
          />
          <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
            Create Category
          </Button>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Category</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Category Name
              </label>
              <Input
                value={newCategoryName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewCategoryName(e.target.value)
                }
                placeholder="e.g., Favorites, Spring 2024"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory}>Add Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex gap-2 flex-wrap">
          {/* Default Categories */}
          {Object.entries(DEFAULT_CATEGORIES).map(([key, _]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "secondary" : "ghost"}
              size="sm"
              onClick={() =>
                onCategoryChange(
                  key as
                    | "ALL"
                    | "AI_ML"
                    | "SYSTEMS"
                    | "THEORY"
                    | "SECURITY"
                    | "HCI"
                    | "SPECIAL_TOPICS"
                    | "RESEARCH"
                )
              }
            >
              {key.replace(/_/g, " ")}
            </Button>
          ))}

          {/* Custom Categories */}
          {categories.map((categoryName) => (
            <div key={categoryName} className="flex items-center gap-1">
              <Button
                variant={
                  selectedCategory === categoryName ? "secondary" : "ghost"
                }
                size="sm"
                onClick={() =>
                  onCategoryChange(
                    categoryName as
                      | "ALL"
                      | "AI_ML"
                      | "SYSTEMS"
                      | "THEORY"
                      | "SECURITY"
                      | "HCI"
                      | "SPECIAL_TOPICS"
                      | "RESEARCH"
                  )
                }
              >
                {categoryName}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto"
                onClick={() => handleRemoveCategory(categoryName)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
