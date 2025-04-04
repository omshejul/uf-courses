// TODO: Update to GitHub when the new version of lucide-react is released
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Button } from "./button";
import pkg from "../../package.json";

export function Footer() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <p className="text-sm text-muted-foreground">Made by Om</p>
            <div className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} · Not affiliated with the University
              of Florida · v{pkg.version}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://github.com/omshejul/uf-courses"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <GitHubLogoIcon className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
