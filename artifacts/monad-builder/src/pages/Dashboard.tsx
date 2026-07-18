import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useListProjects, useCreateProject, useDeleteProject,
  getListProjectsQueryKey, useGetDashboardStats, getGetDashboardStatsQueryKey
} from "@workspace/api-client-react";
import { Plus, LayoutTemplate, MoreVertical, Trash2, Edit2, Play, Zap } from "lucide-react";
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
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useListProjects();
  const { data: stats } = useGetDashboardStats();

  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
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

                  <CardFooter className="pt-0 pb-5 flex items-center justify-between text-xs text-white/35">
                    <span>Updated {format(new Date(project.updatedAt), "MMM d, yyyy")}</span>
                    <Link href={`/builder/${project.id}`} className="text-primary hover:text-primary/70 font-medium transition-colors">
                      Open Builder →
                    </Link>
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
              Start with a blank canvas or pick a template to hit the ground running.
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
