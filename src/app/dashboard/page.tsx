import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NewAppPrompt } from "@/components/dashboard/new-app-prompt";
import { ProjectCard } from "@/components/dashboard/project-card";
import { TemplateCard } from "@/components/dashboard/template-card";
import { MOCK_PROJECTS, MOCK_TEMPLATES } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container max-w-6xl py-8">
        <NewAppPrompt />

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Seus projetos</h2>
            <span className="text-sm text-muted-foreground">{MOCK_PROJECTS.length} projetos</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_PROJECTS.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Comece com um template</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_TEMPLATES.map((t, i) => (
              <TemplateCard key={t.id} template={t} index={i} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
