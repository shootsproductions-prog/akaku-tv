import Link from "next/link";

export default function AdminHome() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 text-zinc-900 dark:text-zinc-100">
      <h1 className="text-3xl font-semibold tracking-tight">Akakū catalog</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Producer tools for the Akakū Community Media archive — uploads land in Mux,
        records flow into the Roku Direct Publisher feed.
      </p>

      <nav className="mt-8 space-y-2">
        <Link
          href="/admin/catalog/new"
          className="block rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm font-medium hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
        >
          New catalog entry →
        </Link>
      </nav>
    </main>
  );
}
