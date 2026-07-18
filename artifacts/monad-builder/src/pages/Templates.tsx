import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useListTemplates, useCreateProject, getListProjectsQueryKey, TemplateCategory } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const CATEGORIES = [
  { id: "all",       label: "All Templates" },
  { id: "defi",      label: "DeFi" },
  { id: "nft",       label: "NFTs" },
  { id: "dao",       label: "DAOs" },
  { id: "token",     label: "Tokens" },
  { id: "portfolio", label: "Portfolios" },
];

// Visually distinct thumbnail styles per category
const THUMBNAIL_STYLES: Record<string, { gradient: string; accent: string; label: string; icon: string }> = {
  defi: {
    gradient: "from-emerald-950/80 to-teal-900/40",
    accent: "border-emerald-500/30",
    label: "DeFi",
    icon: "⇌",
  },
  nft: {
    gradient: "from-violet-950/80 to-purple-900/40",
    accent: "border-violet-500/30",
    label: "NFT",
    icon: "◈",
  },
  dao: {
    gradient: "from-blue-950/80 to-indigo-900/40",
    accent: "border-blue-500/30",
    label: "DAO",
    icon: "⊡",
  },
  token: {
    gradient: "from-amber-950/80 to-orange-900/40",
    accent: "border-amber-500/30",
    label: "TOKEN",
    icon: "◎",
  },
  portfolio: {
    gradient: "from-cyan-950/80 to-sky-900/40",
    accent: "border-cyan-500/30",
    label: "PORTFOLIO",
    icon: "▦",
  },
};

function TemplateThumbnail({ category }: { category: string }) {
  const style = THUMBNAIL_STYLES[category] ?? {
    gradient: "from-[#0A0A0F] to-primary/20",
    accent: "border-primary/20",
    label: category.toUpperCase(),
    icon: "◆",
  };

  return (
    <div className={`h-44 w-full bg-gradient-to-br ${style.gradient} relative border-b ${style.accent} overflow-hidden flex items-end`}>
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      />
      {/* Large icon */}
      <div className="absolute top-6 right-6 text-6xl text-white/10 font-mono select-none">{style.icon}</div>
      {/* Mock UI skeleton */}
      <div className="relative z-10 p-4 w-full space-y-2">
        <div className="h-2 bg-white/10 rounded-full w-3/4" />
        <div className="h-2 bg-white/10 rounded-full w-1/2" />
        <div className="flex gap-1.5 mt-3">
          <div className="h-6 bg-white/10 rounded w-16" />
          <div className="h-6 bg-white/15 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

export default function Templates() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { data: templates, isLoading } = useListTemplates(
    activeCategory !== "all" ? { category: activeCategory as TemplateCategory } : undefined
  );

  const createProject = useCreateProject();
  const [creatingId, setCreatingId] = useState<number | null>(null);

  const handleUseTemplate = (templateId: number, templateName: string) => {
    setCreatingId(templateId);
    createProject.mutate({
      data: {
        name: `${templateName} (Copy)`,
        description: `Created from template: ${templateName}`,
        templateId,
      }
    }, {
      onSuccess: (project) => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setLocation(`/builder/${project.id}`);
      },
      onSettled: () => setCreatingId(null),
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-16 mb-8 border-b border-white/10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Template Gallery</h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Kickstart your Monad dApp with a production-ready template. Every component is pre-wired to Monad Mainnet (Chain ID 143).
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-white shadow-[0_0_15px_rgba(131,110,249,0.4)]"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse h-[380px] bg-white/5" />
            ))}
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template, i) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card className="h-full flex flex-col border-white/10 hover:border-white/25 transition-all overflow-hidden bg-black/40 group">
                  <TemplateThumbnail category={template.category} />

                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg leading-tight">{template.name}</CardTitle>
                      <Badge variant="secondary" className="uppercase text-[10px] tracking-wider px-2 shrink-0">
                        {template.category}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 mt-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 py-2">
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span className="font-mono bg-white/5 px-2 py-1 rounded border border-white/10">
                        {template.components.length} components
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
                        Chain 143
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4 pb-6">
                    <Button
                      className="w-full font-bold"
                      onClick={() => handleUseTemplate(template.id, template.name)}
                      disabled={creatingId !== null}
                    >
                      {creatingId === template.id ? "Creating..." : "Use Template →"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-white mb-2">No templates found</h3>
            <p className="text-white/60">There are no templates matching this category.</p>
          </div>
        )}
      </main>
    </div>
  );
}
