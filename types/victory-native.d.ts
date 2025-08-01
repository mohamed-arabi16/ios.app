// types/victory-native.d.ts
declare module 'victory-native' {
  import * as React from 'react';
  import type { VictoryThemeDefinition } from 'victory';

  export * from 'victory';

  export interface VictoryAxisProps { [k: string]: any }
  export class VictoryAxis extends React.Component<VictoryAxisProps> {}

  export const VictoryTheme: {
    material: VictoryThemeDefinition;
    grayscale: VictoryThemeDefinition;
  };

  export interface VictoryChartProps { children?: React.ReactNode }
  export interface VictoryGroupProps { children?: React.ReactNode }
}
