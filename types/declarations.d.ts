// TypeScript declarations for modules without type definitions

// React declarations
declare module 'react' {
  export * from 'react';
}

// External libraries
declare module 'formidable' {
  export * from 'formidable';
}

declare module 'uuid' {
  export * from 'uuid';
}

// Add global types if needed
declare global {
  interface Window {
    // Add any window-specific types here
  }
}
