import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout showSkipButton>
      <AuthHeader
        title="Admin Access"
        description="Secure entry to marketplace control plane"
      />
      <AuthCard title="Sign in" description="Enter your credentials to continue">
        <LoginForm />
      </AuthCard>
    </AuthLayout>
  );
}
