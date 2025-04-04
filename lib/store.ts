import { create } from 'zustand';

interface CategoryStore {
  categories: string[];
  setCategories: (categories: string[]) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
}

interface UserInsight {
  text: string;
  difficulty: "Easy" | "Easy-Moderate" | "Moderate" | "Moderate-Hard" | "Hard";
  timestamp: number;
}

interface InsightStore {
  userInsights: Record<string, UserInsight[]>;
  addInsight: (courseCode: string, insight: Omit<UserInsight, "timestamp">) => void;
  removeInsight: (courseCode: string, timestamp: number) => void;
  loadInsights: () => void;
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
  addCategory: (category) => set((state) => ({ 
    categories: [...state.categories, category] 
  })),
  removeCategory: (category) => set((state) => ({ 
    categories: state.categories.filter(c => c !== category) 
  })),
}));

export const useInsightStore = create<InsightStore>((set) => ({
  userInsights: {},
  addInsight: (courseCode, insight) => {
    set((state) => {
      const newInsight = { ...insight, timestamp: Date.now() };
      const courseInsights = state.userInsights[courseCode] || [];
      const newInsights = {
        ...state.userInsights,
        [courseCode]: [...courseInsights, newInsight],
      };
      localStorage.setItem("user_insights", JSON.stringify(newInsights));
      return { userInsights: newInsights };
    });
  },
  removeInsight: (courseCode, timestamp) => {
    set((state) => {
      const courseInsights = state.userInsights[courseCode] || [];
      const newCourseInsights = courseInsights.filter(
        (insight) => insight.timestamp !== timestamp
      );
      const newInsights = {
        ...state.userInsights,
        [courseCode]: newCourseInsights,
      };
      localStorage.setItem("user_insights", JSON.stringify(newInsights));
      return { userInsights: newInsights };
    });
  },
  loadInsights: () => {
    const stored = localStorage.getItem("user_insights");
    if (stored) {
      try {
        set({ userInsights: JSON.parse(stored) });
      } catch (e) {
        console.error("Failed to load user insights:", e);
      }
    }
  },
})); 