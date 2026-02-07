"use client"

import Link from "next/link"
import { FileText, Brain, CreditCard, ArrowRight } from "lucide-react"
import { useUsage } from "@/lib/api/subscriptions"
import { useArticles } from "@/lib/api/articles"

export function DashboardOverview() {
  const { data: usage, isLoading: usageLoading } = useUsage()
  const { data: articlesData, isLoading: articlesLoading } = useArticles({ page: 1, limit: 1 })

  const totalArticles = articlesData?.meta?.total ?? 0
  const plan = usage?.plan ?? "basic"
  const summariesUsed = usage?.summaries_used ?? 0
  const summariesLimit = usage?.summaries_limit ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your knowledge library.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Articles */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saved Articles</p>
              <p className="text-2xl font-bold">
                {articlesLoading ? "—" : totalArticles}
              </p>
            </div>
          </div>
        </div>

        {/* Summaries Used */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">AI Summaries</p>
              <p className="text-2xl font-bold">
                {usageLoading ? "—" : `${summariesUsed}/${summariesLimit === -1 ? "∞" : summariesLimit}`}
              </p>
            </div>
          </div>
        </div>

        {/* Current Plan */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-2xl font-bold capitalize">
                {usageLoading ? "—" : plan}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/articles"
          className="group flex items-center justify-between rounded-xl border bg-card p-6 transition-colors hover:bg-accent/50"
        >
          <div>
            <h3 className="font-semibold">View Articles</h3>
            <p className="text-sm text-muted-foreground">
              Browse and search your saved articles.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/settings/billing"
          className="group flex items-center justify-between rounded-xl border bg-card p-6 transition-colors hover:bg-accent/50"
        >
          <div>
            <h3 className="font-semibold">Manage Billing</h3>
            <p className="text-sm text-muted-foreground">
              View your plan and usage details.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}
