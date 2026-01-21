import { Link } from 'react-router-dom';
import { Video, Menu, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Header() {
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-background-subtle/95 backdrop-blur-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-accent-hover transition-colors"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="flex items-center space-x-3 group">
              <div className="p-1.5 rounded-lg bg-primary/10 ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold tracking-tight">Thales Video Indexing</span>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md hover:bg-accent-hover transition-colors"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-accent-yellow" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background-card border-b border-border-subtle">
          <div className="p-4 space-y-1">
            <Link
              to="/"
              className="block py-2.5 px-4 rounded-md text-sm font-medium hover:bg-accent-hover transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/videos"
              className="block py-2.5 px-4 rounded-md text-sm font-medium hover:bg-accent-hover transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Videos
            </Link>
            <Link
              to="/upload"
              className="block py-2.5 px-4 rounded-md text-sm font-medium hover:bg-accent-hover transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Upload
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
