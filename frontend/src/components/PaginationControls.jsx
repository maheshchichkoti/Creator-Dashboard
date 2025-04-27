
// --- Create PaginationControls Component ---
// src/components/PaginationControls.js
function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null; // Don't show controls if only one page

  const pageNumbers = [];
  // Logic to generate page numbers (can be simple or complex with ellipses)
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="mt-6 flex justify-center items-center space-x-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        « Prev
      </button>
      {/* Simple Page Number List - improve with ellipsis for many pages */}
      {pageNumbers.map(number => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`px-3 py-1 border rounded ${currentPage === number
            ? 'bg-blue-500 text-white border-blue-500'
            : 'bg-white hover:bg-gray-100'
            }`}
        >
          {number}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next »
      </button>
    </div>
  );
}

export default PaginationControls;