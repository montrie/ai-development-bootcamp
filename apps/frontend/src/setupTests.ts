import '@testing-library/jest-dom';

vi.mock('react-datepicker', async () => {
  const { MockDatePicker } = await import('./__tests__/mockDatepicker');
  return { default: MockDatePicker };
});

if (typeof DragEvent === 'undefined') {
  class DragEvent extends MouseEvent {
    dataTransfer: DataTransfer | null;
    constructor(type: string, init?: DragEventInit) {
      super(type, init);
      this.dataTransfer = init?.dataTransfer ?? null;
    }
  }
  (globalThis as unknown as Record<string, unknown>).DragEvent = DragEvent;
}
