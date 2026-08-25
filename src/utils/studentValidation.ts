export interface ValidationResult {
  isValid: boolean;
  error: string | null;
  value: string;
}

/**
 * Validates and normalizes Full Name.
 * Full Name must contain letters and spaces only.
 * Regex: ^[A-Za-z]+(?:\s+[A-Za-z]+)*$
 */
export const validateFullName = (name: string): ValidationResult => {
  const raw = name || '';
  const trimmed = raw.trim().replace(/\s+/g, ' ');

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Full Name is required.',
      value: ''
    };
  }

  const fullNameRegex = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;
  if (!fullNameRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Full Name must contain letters and spaces only.',
      value: trimmed
    };
  }

  return {
    isValid: true,
    error: null,
    value: trimmed
  };
};

/**
 * Sanitizes input string for Full Name field:
 * Keeps only alphabetic letters and spaces.
 */
export const sanitizeFullNameInput = (input: string): string => {
  return input.replace(/[^A-Za-z\s]/g, '');
};

/**
 * Validates Register / Roll Number.
 * Must contain digits 0-9 only.
 * Regex: ^[0-9]+$
 */
export const validateRegisterNumber = (regNo: string): ValidationResult => {
  const raw = regNo || '';
  const trimmed = raw.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Register / Roll Number is required.',
      value: ''
    };
  }

  const regNoRegex = /^[0-9]+$/;
  if (!regNoRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Register / Roll Number must contain numbers only.',
      value: trimmed
    };
  }

  return {
    isValid: true,
    error: null,
    value: trimmed
  };
};

/**
 * Sanitizes input string for Register / Roll Number field:
 * Keeps only numeric digits 0-9.
 */
export const sanitizeRegisterNumberInput = (input: string): string => {
  return input.replace(/[^0-9]/g, '');
};
