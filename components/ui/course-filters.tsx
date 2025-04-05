import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useCategoryStore } from "@/lib/store";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession, signIn, signOut } from "next-auth/react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FiTrash2 } from "react-icons/fi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const DEFAULT_CATEGORIES = {
  ALL: ["*"],
  CORE: [
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
  ],
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
  onCategoryChange: (category: string) => void;
  selectedCategory: string;
  onViewChange: (isGrid: boolean) => void;
  isGridView: boolean;
  onDepartmentChange: (department: "CS" | "ECE") => void;
  selectedDepartment: "CS" | "ECE";
}

export function CourseFilters({
  onSearch,
  onCategoryChange,
  selectedCategory,
  onDepartmentChange,
  selectedDepartment,
}: CourseFiltersProps) {
  const { categories, addCategory, removeCategory, fetchCategories } =
    useCategoryStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      fetchCategories();
    }
  }, [fetchCategories, session?.user?.id]);

  const handleAddCategory = async () => {
    if (!session) {
      signIn("google");
      return;
    }

    if (newCategoryName.trim()) {
      try {
        await addCategory(newCategoryName.trim());
        setNewCategoryName("");
        setIsDialogOpen(false);
      } catch (error) {
        console.error("Failed to add category:", error);
      }
    }
  };

  const handleRemoveCategory = async (categoryId: string) => {
    if (!session) {
      signIn("google");
      return;
    }

    try {
      await removeCategory(categoryId);
      if (selectedCategory === categoryId) {
        onCategoryChange("ALL");
      }
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Failed to remove category:", error);
    }
  };

  return (
    <motion.div
      className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-2 py-3 px-4 sm:py-4 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 mr-2">
              <Button
                variant={selectedDepartment === "CS" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onDepartmentChange("CS")}
              >
                CS
              </Button>
              <Button
                variant={selectedDepartment === "ECE" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onDepartmentChange("ECE")}
              >
                ECE
              </Button>
            </div>
            <Input
              type="search"
              placeholder="Search courses..."
              className="h-9 flex-1 sm:flex-none sm:w-[250px] lg:w-[300px]"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onSearch(e.target.value)
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={session.user?.image || ""}
                        alt={session.user?.name || ""}
                      />
                      <AvatarFallback>
                        {session.user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => signOut()}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => signIn("google")}
              >
                Sign in
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              if (!session) {
                signIn("google");
                return;
              }
              setIsDialogOpen(true);
            }}
          >
            Create Category
          </Button>

          <div className="flex flex-wrap gap-2">
            {Object.keys(DEFAULT_CATEGORIES).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onCategoryChange(category)}
              >
                {category.replace(/_/g, " ")}
              </Button>
            ))}

            {categories.map((category) => {
              const categoryId = category._id?.toString() || "";
              return (
                <div
                  key={categoryId}
                  className="relative group flex items-center"
                >
                  <Button
                    variant={
                      selectedCategory === categoryId ? "secondary" : "ghost"
                    }
                    size="sm"
                    onClick={() => onCategoryChange(categoryId)}
                    className="pr-8"
                  >
                    {category.name}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 opacity-50 group-hover:opacity-100 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategoryToDelete(categoryId);
                    }}
                  >
                    <FiTrash2 className="h-4 w-4 text-red-500" />
                    <span className="sr-only">Delete category</span>
                  </Button>
                </div>
              );
            })}
          </div>
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

      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open: boolean) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot
              be undone. The category will be removed from all courses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                categoryToDelete && handleRemoveCategory(categoryToDelete)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
