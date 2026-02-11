import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  Package, 
  Grid3X3, 
  ShoppingCart, 
  Users, 
  Tag, 
  Star, 
  BarChart3, 
  Menu, 
  LogOut,
  ChevronRight,
  Store
} from 'lucide-react';

const adminNavItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/categories', label: 'Categories', icon: Grid3X3 },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/coupons', label: 'Coupons', icon: Tag },
  { path: '/admin/reviews', label: 'Reviews', icon: Star },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

function SidebarContent() {
  const location = useLocation();
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Admin Panel</span>
        </Link>
      </div>
      
      <ScrollArea className="flex-1 py-4">
        <nav className="px-4 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <Link 
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Store className="w-5 h-5" />
          Back to Store
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild className="lg:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed top-4 left-4 z-50"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-card border-r z-40">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold lg:ml-0 ml-12">Admin Dashboard</h1>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
