import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CommunityLeaderboard() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Community Research</h1>
        <p className="mt-2 text-muted-foreground">
          Community discovery is research-only and does not provide investment advice or copy-trading
          functionality.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Community rankings are unavailable until participation data is auditable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This screen does not display strategy counts, active-user counts, copies, ratings,
            ranking positions, views, trending labels, or community leaderboards without a verified
            user-generated-data source.
          </p>
          <p>
            Any future community record must provide creator consent, an owner-scoped identity model,
            content provenance, timestamp, freshness, moderation status, rating methodology, and a
            clear distinction between research discovery and execution.
          </p>
          <p className="font-medium text-amber-700 dark:text-amber-400">
            No social proof, community ranking, popularity signal, or copy-trading implication is
            inferred, simulated, or displayed from this screen.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Creator provenance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No consent-backed creator identity and moderation record is available for public
            strategy discovery.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement methodology</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No auditable method defines ratings, copies, views, categorisation, or trending status.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publication status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Community listings remain unavailable until provenance, consent, freshness, and
            moderation safeguards are supplied.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default CommunityLeaderboard;
