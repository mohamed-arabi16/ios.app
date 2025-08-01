import * as React from 'react';
import 'victory';

declare module 'victory' {
  interface VictoryChartProps {
    children?: React.ReactNode;
  }
  interface VictoryGroupProps {
    children?: React.ReactNode;
  }
}
