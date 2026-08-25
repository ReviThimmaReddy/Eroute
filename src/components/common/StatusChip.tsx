import React from 'react';
import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small' }) => {
  let color: ChipProps['color'] = 'default';
  const variant: ChipProps['variant'] = 'filled';

  switch (status?.toLowerCase()) {
    case 'active':
    case 'issued':
    case 'approved':
    case 'present':
    case 'in service':
    case 'completed':
    case 'resolved':
      color = 'success';
      break;
    case 'pending':
    case 'scheduled':
    case 'in progress':
    case 'under review':
    case 'investigating':
      color = 'warning';
      break;
    case 'rejected':
    case 'suspended':
    case 'expired':
    case 'out of service':
    case 'flagged':
    case 'cancelled':
      color = 'error';
      break;
    case 'maintenance':
    case 'open':
      color = 'info';
      break;
    default:
      color = 'default';
  }

  return (
    <Chip
      label={status}
      color={color}
      size={size}
      variant={variant}
      sx={{
        fontWeight: 700,
        fontSize: '0.75rem',
        textTransform: 'capitalize',
        borderRadius: '6px'
      }}
    />
  );
};
export default StatusChip;
