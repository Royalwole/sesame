// Create based on src/pages/sign-up/[[...sign-up]]/page.js
import { SignUp as ClerkSignUp } from '@clerk/nextjs';

export default function SignUp() {
  return (
    <div className="flex items-center justify-center p-3">
      <ClerkSignUp />
    </div>
  );
}
