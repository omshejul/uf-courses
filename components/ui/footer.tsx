// TODO: Update to GitHub when the new version of lucide-react is released
import { FiGithub } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import pkg from "../../package.json";

export function Footer() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <p className="text-sm text-muted-foreground">Made by Om</p>
            <div className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} • Not affiliated with the University
              of Florida • v{pkg.version}
            </div>
          </div>

          <div className="flex flex-warp items-center gap-4">
            <a
              href="https://wa.me/+917775977750"
              className="flex items-center px-3 py-2 gap-2 text-muted-foreground hover:text-primary rounded-lg"
            >
              <FaWhatsapp className="h-4 w-4" />
              <span className="text-sm text-">Whatsapp Me</span>
            </a>

            <a
              href="https://github.com/omshejul/uf-courses"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-2 gap-2 text-muted-foreground hover:text-primary rounded-lg"
            >
              <FiGithub className="h-4 w-4" />
              <span className="text-sm">OpenSourced</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
