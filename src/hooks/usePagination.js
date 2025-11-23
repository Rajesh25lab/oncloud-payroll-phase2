import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for pagination logic
 * @param {Array} items - Array of items to paginate
 * @param {number} itemsPerPage - Number of items per page (default: 50)
 * @returns {Object} Pagination state and controls
 */
export const usePagination = (items, itemsPerPage = 50) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Reset to page 1 if items change significantly
  useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [items.length, totalPages, currentPage]);

  // Get paginated items (memoized for performance)
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  // Navigation functions
  const goToPage = useCallback((page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  return {
    // Data
    paginatedItems,
    currentPage,
    totalPages,
    totalItems: items.length,
    itemsPerPage,
    
    // Computed
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    startIndex: (currentPage - 1) * itemsPerPage,
    endIndex: Math.min(currentPage * itemsPerPage, items.length),
    
    // Actions
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    setCurrentPage
  };
};

/**
 * Custom hook for pagination with server-side support
 * @param {number} totalItems - Total number of items (from server)
 * @param {number} itemsPerPage - Items per page
 * @returns {Object} Pagination state
 */
export const useServerPagination = (totalItems, itemsPerPage = 50) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const goToPage = useCallback((page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage: () => goToPage(currentPage + 1),
    prevPage: () => goToPage(currentPage - 1)
  };
};
