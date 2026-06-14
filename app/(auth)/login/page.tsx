import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/cuenta" } = await searchParams;
  return <LoginForm next={next} />;
}
