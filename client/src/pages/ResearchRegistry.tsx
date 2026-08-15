import { useState } from "react";
import { Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

type ResearchStatus = "draft" | "preregistered" | "validated" | "rejected" | "inconclusive";
type SampleAdequacy = "not_assessed" | "insufficient" | "adequate";

export default function ResearchRegistry() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ResearchStatus>("all");
  const [sampleAdequacy, setSampleAdequacy] = useState<"all" | SampleAdequacy>("all");
  const [title, setTitle] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [falsificationCriteria, setFalsificationCriteria] = useState("");
  const utils = trpc.useUtils();
  const list = trpc.researchRegistry.list.useQuery({ query, ...(status === "all" ? {} : { status }), ...(sampleAdequacy === "all" ? {} : { sampleAdequacy }) });
  const summary = trpc.researchRegistry.summary.useQuery();
  const outcomes = trpc.researchRegistry.compareOutcomes.useQuery();
  const refresh = async () => Promise.all([utils.researchRegistry.list.invalidate(), utils.researchRegistry.summary.invalidate(), utils.researchRegistry.compareOutcomes.invalidate()]);
  const create = trpc.researchRegistry.create.useMutation({ onSuccess: async () => { setTitle(""); setHypothesis(""); setFalsificationCriteria(""); await refresh(); } });
  const update = trpc.researchRegistry.update.useMutation({ onSuccess: refresh });

  return <DashboardLayout><main className="space-y-6 p-6">
    <header><h1 className="text-2xl font-semibold">Research registry</h1><p className="text-sm text-muted-foreground">Owner-entered, research-only hypotheses. No registry status authorizes live trading.</p></header>
    <Card><CardHeader><CardTitle>New hypothesis</CardTitle><CardDescription>Create a draft with an explicit falsification criterion. This cannot change monitor signals or virtual execution.</CardDescription></CardHeader><CardContent>
      <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); create.mutate({ title, hypothesis, falsificationCriteria }); }}>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Hypothesis title" minLength={5} required />
        <textarea className="min-h-24 rounded-md border bg-background p-3 text-sm" value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} placeholder="Research hypothesis (minimum 20 characters)" minLength={20} required />
        <textarea className="min-h-24 rounded-md border bg-background p-3 text-sm" value={falsificationCriteria} onChange={(event) => setFalsificationCriteria(event.target.value)} placeholder="Pre-registered falsification criterion (minimum 20 characters)" minLength={20} required />
        <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving draft…" : "Create research draft"}</Button>
      </form>
    </CardContent></Card>
    <section className="grid gap-4 md:grid-cols-4"><Metric title="Total records" value={summary.data?.total ?? 0} /><Metric title="Preregistered" value={summary.data?.byStatus.preregistered ?? 0} /><Metric title="Validated" value={summary.data?.byStatus.validated ?? 0} /><Metric title="Incomplete evidence" value={summary.data?.incompleteEvidence ?? 0} /></section>
    <section className="grid gap-4 md:grid-cols-2">
      <Card><CardHeader><CardTitle>Evidence coverage</CardTitle><CardDescription>Protocol and result references recorded for registry hypotheses.</CardDescription></CardHeader><CardContent className="space-y-1 text-sm"><p>Protocol references: {summary.data?.coverage.protocolReferences ?? 0}/{summary.data?.coverage.total ?? 0}</p><p>Result references: {summary.data?.coverage.resultReferences ?? 0}/{summary.data?.coverage.total ?? 0}</p><p className="text-muted-foreground">{summary.data?.methodologyDisclosure}</p></CardContent></Card>
      <Card><CardHeader><CardTitle>Consistency checks</CardTitle><CardDescription>{summary.data?.consistency.valid ? "No registry consistency issues detected." : "Resolve the following evidence gaps before interpreting a status."}</CardDescription></CardHeader><CardContent>{summary.data?.consistency.issues.length ? <ul className="list-disc space-y-1 pl-4 text-sm">{summary.data.consistency.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : <p className="text-sm text-muted-foreground">Consistency checks are clear.</p>}</CardContent></Card>
    </section>
    <Card><CardHeader><CardTitle>Outcome comparison</CardTitle><CardDescription>Read-only comparison of validated, rejected, and inconclusive studies. It is evidence tracking, not a performance forecast.</CardDescription></CardHeader><CardContent className="space-y-2">{outcomes.data?.length ? outcomes.data.map((record) => <div key={record.id} className="flex flex-wrap justify-between gap-2 border-b pb-2 text-sm last:border-0"><span>{record.title}</span><span className="text-muted-foreground">{record.status} · {record.sampleAdequacy} · {record.evidenceComplete ? "evidence complete" : "evidence incomplete"}</span></div>) : <p className="text-sm text-muted-foreground">No completed study outcomes are recorded yet.</p>}</CardContent></Card>
    <div className="flex flex-wrap gap-2"><div className="relative min-w-52 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hypotheses" /></div><StatusSelect value={status} onChange={setStatus} includeAll /><SampleSelect value={sampleAdequacy} onChange={setSampleAdequacy} includeAll /></div>
    <Card><CardHeader><CardTitle>Hypotheses</CardTitle><CardDescription>Lifecycle and evidence fields are owner-editable. Validation safeguards remain server-enforced.</CardDescription></CardHeader><CardContent className="space-y-3">{list.data?.length ? list.data.map((record) => <div key={record.id} className="space-y-2 border-b pb-3 last:border-0"><div className="flex flex-wrap justify-between gap-4"><p className="font-medium">{record.title}</p><span className="text-xs text-muted-foreground">{record.status} · {record.sampleAdequacy} · {record.evidenceComplete ? "evidence complete" : "evidence incomplete"}</span></div><p className="text-sm text-muted-foreground">{record.hypothesis}</p><p className="text-xs text-muted-foreground">Falsification: {record.falsificationCriteria}</p><div className="grid gap-2 md:grid-cols-4"><StatusSelect value={record.status as ResearchStatus} onChange={(nextStatus) => update.mutate({ id: record.id, status: nextStatus as ResearchStatus })} /><SampleSelect value={record.sampleAdequacy as SampleAdequacy} onChange={(nextSample) => update.mutate({ id: record.id, sampleAdequacy: nextSample as SampleAdequacy })} /><Input defaultValue={record.protocolPath ?? ""} placeholder="Protocol reference" onBlur={(event) => update.mutate({ id: record.id, protocolPath: event.target.value || null })} /><Input defaultValue={record.resultPath ?? ""} placeholder="Result reference" onBlur={(event) => update.mutate({ id: record.id, resultPath: event.target.value || null })} /></div></div>) : <p className="text-sm text-muted-foreground">No research hypotheses match this view.</p>}</CardContent></Card>
  </main></DashboardLayout>;
}

function Metric({ title, value }: { title: string; value: number }) { return <Card><CardHeader className="pb-2"><CardDescription>{title}</CardDescription><CardTitle>{value}</CardTitle></CardHeader></Card>; }
function StatusSelect({ value, onChange, includeAll = false }: { value: ResearchStatus | "all"; onChange: (value: ResearchStatus | "all") => void; includeAll?: boolean }) { return <Select value={value} onValueChange={onChange}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>{includeAll && <SelectItem value="all">All statuses</SelectItem>}<SelectItem value="draft">Draft</SelectItem><SelectItem value="preregistered">Preregistered</SelectItem><SelectItem value="validated">Validated</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="inconclusive">Inconclusive</SelectItem></SelectContent></Select>; }
function SampleSelect({ value, onChange, includeAll = false }: { value: SampleAdequacy | "all"; onChange: (value: SampleAdequacy | "all") => void; includeAll?: boolean }) { return <Select value={value} onValueChange={onChange}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>{includeAll && <SelectItem value="all">All samples</SelectItem>}<SelectItem value="adequate">Adequate sample</SelectItem><SelectItem value="insufficient">Insufficient sample</SelectItem><SelectItem value="not_assessed">Not assessed</SelectItem></SelectContent></Select>; }
