import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-gray-600">Page not found</p>
      <Link href="/" className="mt-4 text-blue-600 hover:underline">
        Go back home
      </Link>
    </div>
  );
}
