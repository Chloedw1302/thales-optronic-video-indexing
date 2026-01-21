import { Link } from 'react-router-dom';
import { Video, Menu } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden p-2 rounded-sm hover:bg-accent-hover transition-colors"
              onClick={toggleMobileMenu}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>

            <Link to="/" className="flex items-center space-x-2">
              <div className="p-1 bg-primary text-white rounded-sm">
                <Video className="h-4 w-4" />
              </div>
              <span className="text-lg font-semibold text-foreground">Thales Video Indexing</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-border">
          <div className="p-3 space-y-1">
            <Link
              to="/"
              className="block py-2 px-3 text-sm font-medium text-foreground hover:bg-accent-hover transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/videos"
              className="block py-2 px-3 text-sm font-medium text-foreground hover:bg-accent-hover transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Videos
            </Link>
            <Link
              to="/upload"
              className="block py-2 px-3 text-sm font-medium text-foreground hover:bg-accent-hover transition-colors"
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
