import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StrategySharing() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Strategy Sharing Research</h1>
        <p className="mt-2 text-muted-foreground">
          Public strategy discovery is research-only. This application does not execute or copy
          trades.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Public strategy sharing is unavailable until creator data is auditable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This screen does not publish strategy profiles, ratings, views, copies, likes, search
            results, descriptions, tags, or social engagement counters without a consent-backed
            creator record and a verified research-data contract.
          </p>
          <p>
            A future publication workflow must include creator consent, owner-scoped identity,
            moderation status, content provenance, timestamp, freshness, attribution, and an
            explicit boundary between educational research records and trade execution.
          </p>
          <p className="font-medium text-amber-700 dark:text-amber-400">
            No social proof, public strategy quality signal, sharing action, or copying action is
            inferred, simulated, or enabled from this screen.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Creator consent</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No consent-backed creator identity or attribution record is available for public
            strategy publication.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content review</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No moderation and provenance workflow is available to validate public strategy content
            or engagement data.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Availability boundary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Discovery, sharing, likes, ratings, copies, and copying remain unavailable until these
            safeguards are supplied and auditable.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default StrategySharing;
