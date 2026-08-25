import { useState, useMemo } from 'react';

export function usePagination<T>(
  data: T[],
  initialPageSize: number = 10,
  filterFn?: (item: T, search: string) => boolean
) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialPageSize);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<keyof T | ''>('');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('asc');

  const filteredData = useMemo(() => {
    let list = [...data];
    if (searchQuery.trim() && filterFn) {
      list = list.filter(item => filterFn(item, searchQuery.trim()));
    }
    if (orderBy) {
      list.sort((a, b) => {
        const aVal = a[orderBy];
        const bVal = b[orderBy];
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (aVal < bVal) return orderDirection === 'asc' ? -1 : 1;
        return orderDirection === 'asc' ? 1 : -1;
      });
    }
    return list;
  }, [data, searchQuery, filterFn, orderBy, orderDirection]);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field: keyof T) => {
    if (orderBy === field) {
      setOrderDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(field);
      setOrderDirection('asc');
    }
  };

  return {
    page,
    rowsPerPage,
    searchQuery,
    setSearchQuery,
    totalCount: filteredData.length,
    paginatedData,
    filteredData,
    orderBy,
    orderDirection,
    handlePageChange,
    handleRowsPerPageChange,
    handleSort
  };
}
