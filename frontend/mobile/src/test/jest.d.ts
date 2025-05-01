import '@types/jest';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveTextContent: (text: string) => R;
      toBeDisabled: () => R;
      toBeEnabled: () => R;
      toBeVisible: () => R;
      toHaveProp: (key: string, value: any) => R;
      toHaveStyle: (style: object) => R;
    }
  }
} 