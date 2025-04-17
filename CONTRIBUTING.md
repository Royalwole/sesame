# Contributing to TopDial

## File Structure Guidelines

### Component Files

- Use `.jsx` extension for React components 
- Use `.js` extension for utility files, configuration, and non-component code
- Never create both `.js` and `.jsx` versions of the same component

### Component Export Pattern

For components, use this pattern:

```jsx
// Component implementation in ComponentName.jsx
import React from 'react';

function ComponentName(props) {
  // Implementation...
}

export default ComponentName;
```

Then create a .js file as a clean re-export:

```js
// ComponentName.js - simple re-export
export { default } from './ComponentName.jsx';
export * from './ComponentName.jsx'; // If named exports are needed
```

This pattern makes importing cleaner for consumers of your component.
