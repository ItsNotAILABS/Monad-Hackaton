import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useListProjects, useCreateProject, useDeleteProject, useUpdateProject,
  getListProjectsQueryKey, useGetDashboardStats, getGetDashboardStatsQueryKey
} from "@workspace/api-client-react";
import { Plus, LayoutTemplate, MoreVertical, Trash2, Edit2, Play, Zap, Sparkles, Loader2, ExternalLink } from "lucide-react";
import { DailyBrief } from "@/components/home/DailyBrief";
import { HabitTracker } from "@/components/home/HabitTracker";
import { format } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { buildDapp } from "@/lib/ai";
import { toast } from "sonner";
import { useSetAIContext } from "@/lib/aiPageContext";

const BUILD_STEPS = [
  "Understanding your dApp concept…",
  "Choosing the right components…",
  "Configuring Monad network values…",
  "Assembling your canvas…",
  "Almost ready…",
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useListProjects();
  const { data: stats } = useGetDashboardStats();

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const buildInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the build input when ?build=1 is in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("build") === "1") {
      setTimeout(() => buildInputRef.current?.focus(), 300);
    }
  }, []);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  // "Idea to dApp" state
  const [idea, setIdea] = useState("");
  const [building, setBuilding] = useState(false);
  const [buildStep, setBuildStep] = useState(0);
  const [buildError, setBuildError] = useState("");
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Context-aware AI: tell the assistant what projects are on the dashboard
  const projectContext = projects
    ? `Current page: Dashboard — user has ${projects.length} project(s): ${projects.slice(0, 5).map(p => `"${p.name}" (${p.components.length} components, ${p.status})`).join("; ")}. Help them manage their dApps, improve them, or start a new one.`
    : "Current page: Dashboard — loading projects.";
  useSetAIContext(projectContext);

  const startStepCycle = () => {
    let step = 0;
    setBuildStep(0);
    stepTimerRef.current = setInterval(() => {
      step = (step + 1) % BUILD_STEPS.length;
      setBuildStep(step);
    }, 1400);
  };

  const stopStepCycle = () => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
  };

  const handleBuildDapp = async () => {
    const trimmed = idea.trim();
    if (!trimmed || building) return;

    setBuildError("");
    setBuilding(true);
    startStepCycle();

    try {
      const result = await buildDapp(trimmed);
      if (!result) throw new Error("AI could not generate a dApp — try rephrasing.");

      // Surface any type remapping/drop warnings from the AI validator
      if (result.warnings.length > 0) {
        for (const w of result.warnings) {
          toast.warning("AI adjusted a component", { description: w, duration: 6000 });
        }
      }

      const project = await new Promise<any>((resolve, reject) => {
        createProject.mutate(
          { data: { name: result.projectName, description: `Built from: "${trimmed}"` } },
          { onSuccess: resolve, onError: reject }
        );
      });

      await new Promise<void>((resolve, reject) => {
        updateProject.mutate(
          { id: project.id, data: { components: result.components as any } },
          { onSuccess: () => resolve(), onError: reject }
        );
      });

      queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });

      stopStepCycle();
      setBuilding(false);
      setLocation(`/builder/${project.id}`);
    } catch (err: any) {
      stopStepCycle();
      setBuilding(false);
      setBuildError(err?.message ?? "Something went wrong. Please try again.");
    }
  };

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    createProject.mutate({
      data: { name: newProjectName, description: newProjectDesc }
    }, {
      onSuccess: (project) => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        setIsCreateOpen(false);
        setNewProjectName("");
        setNewProjectDesc("");
        setLocation(`/builder/${project.id}`);
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteProject.mutate({ id: deleteTarget.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        setDeleteTarget(null);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
            <p className="text-white/50 mt-1">Manage your Monad dApps and drafts.</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Plus className="w-4 h-4" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start from scratch, or pick a template from the gallery.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Project Name</label>
                  <Input
                    placeholder="e.g. My Monad DEX"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Description <span className="text-white/30">(optional)</span></label>
                  <Input
                    placeholder="Brief description..."
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createProject.isPending || !newProjectName.trim()}>
                  {createProject.isPending ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── "Idea to dApp" input ── */}
        <div className="mb-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-violet-500/30 rounded-xl blur opacity-50 group-hover:opacity-80 transition-opacity" />
            <div className="relative flex items-center bg-black/60 border border-white/10 rounded-xl overflow-hidden">
              <Sparkles className="w-5 h-5 text-primary/50 ml-4 shrink-0" />
              <input
                ref={buildInputRef}
                type="text"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBuildDapp()}
                placeholder="Describe your dApp idea and AI will build it instantly…"
                className="flex-1 bg-transparent text-white placeholder-white/25 px-3 py-3.5 text-sm outline-none"
                disabled={building}
              />
              <button
                onClick={handleBuildDapp}
                disabled={!idea.trim() || building}
                className="m-1.5 px-4 py-2 bg-primary hover:bg-primary/80 disabled:opacity-40 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                {building ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Building…</>
                ) : (
                  <><Zap className="w-3.5 h-3.5" /> Build dApp</>
                )}
              </button>
            </div>
          </div>
          {building && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-xs text-primary/60 font-mono flex items-center gap-1.5 pl-1"
            >
              <Loader2 className="w-3 h-3 animate-spin" /> {BUILD_STEPS[buildStep]}
            </motion.p>
          )}
          {buildError && (
            <p className="mt-2 text-xs text-red-400 pl-1">{buildError}</p>
          )}
        </div>

        {/* Daily Brief + Habit Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
          <DailyBrief />
          <HabitTracker />
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50 font-medium">Total Projects</p>
                <p className="text-3xl font-mono font-bold mt-1">{stats.totalProjects}</p>
              </div>
              <LayoutTemplate className="w-8 h-8 text-white/15" />
            </div>
            <div className="bg-white/5 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50 font-medium">Published</p>
                <p className="text-3xl font-mono font-bold mt-1 text-green-400">{stats.publishedProjects}</p>
              </div>
              <Play className="w-8 h-8 text-green-500/20" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50 font-medium">Drafts</p>
                <p className="text-3xl font-mono font-bold mt-1 text-amber-400">{stats.draftProjects}</p>
              </div>
              <Edit2 className="w-8 h-8 text-white/15" />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Card key={i} className="animate-pulse h-52 bg-white/5" />)}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full flex flex-col border-white/10 hover:border-primary/40 transition-colors group">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="truncate pr-4 text-base">{project.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 border-white/10 bg-black/90 backdrop-blur-xl">
                          <DropdownMenuItem asChild>
                            <Link href={`/builder/${project.id}`} className="flex items-center cursor-pointer">
                              <Edit2 className="h-4 w-4 mr-2" /> Open Builder
                            </Link>
                          </DropdownMenuItem>
                          {project.status === "published" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/preview/${project.id}`} className="flex items-center cursor-pointer">
                                <Play className="h-4 w-4 mr-2" /> View Live
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                            onClick={() => setDeleteTarget({ id: project.id, name: project.name })}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="line-clamp-2 mt-2 h-10">
                      {project.description || "No description."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={project.status === "published" ? "success" : "warning"}>
                        {project.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="font-mono bg-white/5 border-white/10 text-white/50">
                        {project.components.length} components
                      </Badge>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 pb-4 flex flex-col gap-2">
                    {project.status === "published" && (
                      <div className="w-full flex gap-2">
                        <Link href={`/preview/${project.id}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs border-green-500/20 text-green-400 hover:bg-green-500/10">
                            <Play className="w-3 h-3" /> Live Preview
                          </Button>
                        </Link>
                        <a href={`https://monados.medinatechlabs.net/preview/${project.id}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="px-2.5 text-white/30 hover:text-primary" title="Open on production">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-white/30 w-full">
                      <span>Updated {format(new Date(project.updatedAt), "MMM d, yyyy")}</span>
                      <Link href={`/builder/${project.id}`} className="text-primary hover:text-primary/70 font-medium transition-colors">
                        Open Builder →
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white/[0.02] border border-white/10 rounded-2xl border-dashed">
            <Zap className="w-14 h-14 text-white/15 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
            <p className="text-white/50 mb-8 max-w-sm mx-auto leading-relaxed">
              Describe your dApp idea above, or start with a blank canvas.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Blank Project
              </Button>
              <Button variant="outline" asChild>
                <Link href="/templates">Browse Templates</Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This project and all its components will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
