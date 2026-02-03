import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Tv, 
  Home, 
  Search, 
  Calendar, 
  LogOut, 
  Menu, 
  X,
  UserPlus
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/search', label: 'Search Home', icon: Search },
    { path: '/reports', label: 'Monthly Reports', icon: Calendar },
    { path: '/add-home', label: 'Add Home', icon: UserPlus },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Tv className="w-8 h-8" />
              <span className="font-bold text-xl hidden sm:inline">Cable Bill Manager</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? 'secondary' : 'ghost'}
                    className={isActive(item.path) ? '' : 'text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10'}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-primary-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-primary-foreground/20 py-4">
            <div className="container mx-auto px-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive(item.path) ? 'secondary' : 'ghost'}
                    className={`w-full justify-start ${isActive(item.path) ? '' : 'text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10'}`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
