import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/cuenta", error } = await searchParams;
  return <LoginForm next={next} errorParam={error} />;
}
