import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Layout() {
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header/Navbar */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            Creator Dashboard
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    isActive
                      ? "text-indigo-600 font-semibold"
                      : "text-gray-600 hover:text-gray-800"
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/feed"
                  className={({ isActive }) =>
                    isActive
                      ? "text-indigo-600 font-semibold"
                      : "text-gray-600 hover:text-gray-800"
                  }
                >
                  Feed
                </NavLink>
                <NavLink
                  to="/spend-credits"
                  className={({ isActive }) =>
                    isActive
                      ? "text-indigo-600 font-semibold"
                      : "text-gray-600 hover:text-gray-800"
                  }
                >
                  Spend Credits
                </NavLink>

                {isAdmin && (
                  <>
                    <NavLink
                      to="/admin/users"
                      className={({ isActive }) =>
                        isActive
                          ? "text-purple-600 font-semibold"
                          : "text-purple-500 hover:text-purple-700"
                      }
                    >
                      Admin Users
                    </NavLink>
                    <NavLink
                      to="/admin/analytics"
                      className={({ isActive }) =>
                        isActive
                          ? "text-purple-600 font-semibold"
                          : "text-purple-500 hover:text-purple-700"
                      }
                    >
                      Admin Analytics
                    </NavLink>
                    <NavLink
                      to="/admin/reports"
                      className={({ isActive }) =>
                        isActive
                          ? "text-purple-600 font-semibold"
                          : "text-purple-500 hover:text-purple-700"
                      }
                    >
                      Admin Reports
                    </NavLink>
                  </>
                )}

                <span className="text-gray-700 font-medium">
                  Hi, {user?.name} ({user?.credits} credits)
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    isActive
                      ? "text-indigo-600 font-semibold"
                      : "text-gray-600 hover:text-gray-800"
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    isActive
                      ? "text-indigo-600 font-semibold"
                      : "text-gray-600 hover:text-gray-800"
                  }
                >
                  Register
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              ☰
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white shadow-md">
            <div className="flex flex-col items-center space-y-4 py-4">
              {isAuthenticated ? (
                <>
                  <NavLink to="/dashboard" onClick={toggleMenu}>Dashboard</NavLink>
                  <NavLink to="/feed" onClick={toggleMenu}>Feed</NavLink>
                  <NavLink to="/spend-credits" onClick={toggleMenu}>Spend Credits</NavLink>
                  {isAdmin && (
                    <>
                      <NavLink to="/admin/users" onClick={toggleMenu}>Admin Users</NavLink>
                      <NavLink to="/admin/analytics" onClick={toggleMenu}>Admin Analytics</NavLink>
                      <NavLink to="/admin/reports" onClick={toggleMenu}>Admin Reports</NavLink>
                    </>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" onClick={toggleMenu}>Login</NavLink>
                  <NavLink to="/register" onClick={toggleMenu}>Register</NavLink>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm bg-white border-t">
        © {new Date().getFullYear()} VertxAI Creator Dashboard. Built with ❤️ by Mahesh Chitakoti.
      </footer>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default Layout;