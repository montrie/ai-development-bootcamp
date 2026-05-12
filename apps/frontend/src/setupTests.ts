import '@testing-library/jest-dom';

vi.mock('react-datepicker', async () => {
  const { MockDatePicker } = await import('./__tests__/mockDatepicker');
  return { default: MockDatePicker };
});
