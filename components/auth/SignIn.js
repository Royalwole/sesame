// Create based on src/pages/sigin-in/[[...sign-in]]/page.jsx
import { SignIn as ClerkSignIn } from '@clerk/nextjs';

export default function SignIn() {
  return (
    <div className="flex items-center justify-center p-3">
      <ClerkSignIn />
    </div>
  );
}
