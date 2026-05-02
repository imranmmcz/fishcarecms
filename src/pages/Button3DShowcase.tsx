import { Button3D } from "@/components/ui/button-3d";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Calculator, Heart, Trash2, AlertTriangle, Sparkles, Star } from "lucide-react";

const variants = ["primary", "success", "danger", "warning", "purple", "pink"] as const;
const sizes = ["sm", "md", "lg", "xl"] as const;
const states = ["default", "hover", "active", "disabled"] as const;

const iconFor = (v: string) => {
  switch (v) {
    case "primary": return Calculator;
    case "success": return Sparkles;
    case "danger": return Trash2;
    case "warning": return AlertTriangle;
    case "purple": return Star;
    case "pink": return Heart;
    default: return Calculator;
  }
};

const Button3DShowcase = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-10 space-y-12">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Button3D Showcase</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Visual verification that hover, active and disabled states do not change padding,
            border width, or line-height. Each row places states side-by-side; baselines should align.
          </p>
        </div>

        {/* States × Variants */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">States × Variants (size md)</h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Variant</th>
                  {states.map((s) => (
                    <th key={s} className="text-left px-4 py-3 font-semibold capitalize">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => {
                  const Icon = iconFor(v);
                  return (
                    <tr key={v} className="border-t border-border align-middle">
                      <td className="px-4 py-4 font-medium capitalize text-muted-foreground">{v}</td>
                      {states.map((s) => (
                        <td key={s} className="px-4 py-4">
                          <div className="inline-flex items-center">
                            <Button3D
                              variant={v}
                              size="md"
                              disabled={s === "disabled"}
                              data-state={s}
                              className={
                                s === "hover"
                                  ? "ring-2 ring-ring/40"
                                  : s === "active"
                                  ? "translate-y-[4px] border-b-[2px] !shadow-[0_0_0_0_transparent,0_2px_8px_-2px_rgba(0,0,0,0.2)] brightness-110"
                                  : ""
                              }
                            >
                              <Icon className="h-4 w-4" />
                              {s === "default" ? "Button" : s.charAt(0).toUpperCase() + s.slice(1)}
                            </Button3D>
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Note: <em>Hover</em> and <em>Active</em> columns simulate those states with classes so you can
            inspect them statically. Hover real buttons too — the box size must remain identical.
          </p>
        </section>

        {/* Sizes × States */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Sizes × States (variant primary)</h2>
          <div className="grid gap-6">
            {sizes.map((sz) => (
              <div key={sz} className="rounded-xl border border-border bg-card p-4">
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-3">size: {sz}</div>
                <div className="flex flex-wrap items-end gap-4">
                  <Button3D variant="primary" size={sz}>
                    <Calculator />
                    Default
                  </Button3D>
                  <Button3D variant="primary" size={sz} className="ring-2 ring-ring/40 brightness-110">
                    <Calculator />
                    Hover
                  </Button3D>
                  <Button3D
                    variant="primary"
                    size={sz}
                    className="translate-y-[4px] border-b-[2px] brightness-110"
                  >
                    <Calculator />
                    Active
                  </Button3D>
                  <Button3D variant="primary" size={sz} disabled>
                    <Calculator />
                    Disabled
                  </Button3D>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Baseline check */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Baseline Alignment Check</h2>
          <p className="text-sm text-muted-foreground">
            All buttons below sit on a shared baseline grid. Hover any of them — none should grow,
            shrink or shift the row.
          </p>
          <div className="relative rounded-xl border border-dashed border-border p-6">
            <div className="absolute inset-x-0 top-1/2 h-px bg-primary/30" />
            <div className="relative flex flex-wrap items-center gap-3">
              {variants.map((v) => {
                const Icon = iconFor(v);
                return (
                  <Button3D key={v} variant={v} size="md">
                    <Icon />
                    {v}
                  </Button3D>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Button3DShowcase;