// This file provides TypeScript declarations for Vue single-file components
declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare const __APP_VERSION__: string
