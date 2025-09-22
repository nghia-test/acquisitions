export const formatValidationError = errors => {
  if (!errors || !errors.issue) return 'Validation failed';

  if (Array.isArray(errors.issue)) {
    return errors.issue.map(issue => issue.message).join(', ');
  }

  return JSON.stringify(errors);
};
