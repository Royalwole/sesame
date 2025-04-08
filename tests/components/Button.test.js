// Basic test file example - implement as needed
import { render, screen } from '@testing-library/react';
import Button from '../../components/ui/Button';

describe('Button component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
