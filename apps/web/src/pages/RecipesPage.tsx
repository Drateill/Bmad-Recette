import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function RecipesPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">BMad Recette</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.firstName || 'User'}!
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Recipes Page
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Coming in Epic 2 - Recipe Management Features
          </p>
          <div className="bg-white shadow rounded-lg p-8 max-w-2xl mx-auto">
            <div className="space-y-4 text-left">
              <h3 className="text-xl font-semibold text-gray-800">
                What's coming next:
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Create and manage your recipes</li>
                <li>Upload recipe photos</li>
                <li>OCR scanning from recipe cards</li>
                <li>Organize with tags and categories</li>
                <li>Generate shopping lists</li>
                <li>Sync across devices</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
