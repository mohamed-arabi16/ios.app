// types/victory-native.d.ts
import * as React from 'react';
declare module 'victory-native' {
  export * from 'victory';

  // then declare the extra theme constant so TS stops whining
  import type { VictoryThemeDefinition } from 'victory';
  export const VictoryTheme: {
    material: VictoryThemeDefinition;
    grayscale: VictoryThemeDefinition;
  };

  export interface VictoryChartProps { children?: React.ReactNode }
  export interface VictoryGroupProps { children?: React.ReactNode }
}
