import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, TextField, InputAdornment, Box, Typography,
  TableSortLabel, CircularProgress, Card, CardContent, Divider, useTheme, useMediaQuery
} from '@mui/material';
import { Search as SearchIcon, Inbox as EmptyIcon } from '@mui/icons-material';

export interface Column<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  onSort?: (columnId: any) => void;
  actions?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  loading = false,
  searchPlaceholder = 'Search records...',
  searchQuery = '',
  onSearchChange,
  page = 0,
  rowsPerPage = 10,
  totalCount = 0,
  onPageChange,
  onRowsPerPageChange,
  orderBy = '',
  orderDirection = 'asc',
  onSort,
  actions
}: DataTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const actionColumn = columns.find(c => String(c.id).toLowerCase().includes('action') || c.label.toLowerCase().includes('action'));
  const dataColumns = columns.filter(c => c !== actionColumn);

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      {(onSearchChange || actions) && (
        <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' } }}>
          {onSearchChange && (
            <TextField
              size="small"
              fullWidth={isMobile}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }
              }}
              sx={{ minWidth: { xs: '100%', sm: 300 } }}
            />
          )}
          {actions && <Box sx={{ display: 'flex', gap: 1, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-start' : 'flex-end', flexWrap: 'wrap' }}>{actions}</Box>}
        </Box>
      )}

      {isMobile ? (
        <Box sx={{ p: 1.5, bgcolor: 'background.default' }}>
          {loading ? (
            <Box sx={{ py: 6, textCenter: 'center', textAlign: 'center' }}>
              <CircularProgress size={36} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Loading data...
              </Typography>
            </Box>
          ) : rows.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <EmptyIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No matching records found.
              </Typography>
            </Box>
          ) : (
            rows.map((row, rowIndex) => (
              <Card 
                key={row.id || rowIndex} 
                variant="outlined"
                sx={{ 
                  mb: 1.5, 
                  borderRadius: 2.5, 
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'divider',
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {dataColumns.map((column, colIndex) => {
                      const value = column.render ? column.render(row) : row[column.id];
                      return (
                        <Box 
                          key={String(column.id)} 
                          sx={{ 
                            display: 'flex', 
                            justify: colIndex === 0 ? 'space-between' : 'space-between',
                            alignItems: colIndex === 0 ? 'flex-start' : 'center',
                            flexDirection: colIndex === 0 ? 'column' : 'row',
                            pb: colIndex === 0 ? 1 : 0,
                            borderBottom: colIndex === 0 ? '1px solid' : 'none',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: colIndex === 0 ? 'primary.main' : 'text.secondary', 
                              fontWeight: colIndex === 0 ? 700 : 600,
                              fontSize: colIndex === 0 ? 11 : 12.5,
                              textTransform: 'uppercase',
                              letterSpacing: 0.5
                            }}
                          >
                            {column.label}
                          </Typography>
                          <Box sx={{ textAlign: colIndex === 0 ? 'left' : 'right', mt: colIndex === 0 ? 0.5 : 0 }}>
                            {typeof value === 'string' || typeof value === 'number' ? (
                              <Typography variant={colIndex === 0 ? 'subtitle1' : 'body2'} sx={{ fontWeight: colIndex === 0 ? 800 : 500 }}>
                                {value}
                              </Typography>
                            ) : (
                              value
                            )}
                          </Box>
                        </Box>
                      );
                    })}

                    {actionColumn && (
                      <Box sx={{ pt: 1, mt: 0.5, borderTop: '1px dashed', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
                        {actionColumn.render ? actionColumn.render(row) : row[actionColumn.id]}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={String(column.id)}
                    align={column.align || 'left'}
                    style={{ minWidth: column.minWidth, fontWeight: 700 }}
                  >
                    {column.sortable && onSort ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? orderDirection : 'asc'}
                        onClick={() => onSort(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={36} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                    <EmptyIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No matching records found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow hover key={row.id || index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    {columns.map((column) => {
                      return (
                        <TableCell key={String(column.id)} align={column.align || 'left'}>
                          {column.render ? column.render(row) : row[column.id]}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {onPageChange && onRowsPerPageChange && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          sx={{
            '.MuiTablePagination-toolbar': {
              flexWrap: 'wrap',
              px: 1,
              justify: 'center'
            }
          }}
        />
      )}
    </Paper>
  );
}
export default DataTable;

