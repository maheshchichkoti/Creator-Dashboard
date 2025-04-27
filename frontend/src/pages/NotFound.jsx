import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="text-center py-10">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-6">Oops! Page Not Found.</p>
      <p className="text-gray-500 mb-8">
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
      <Link
        to="/" // Link to the home/dashboard page
        className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-150"
      >
        Go Back Home
      </Link>
    </div>
  );
}

export default NotFound;
