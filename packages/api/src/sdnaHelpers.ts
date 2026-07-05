import { Ad4mModel, PerspectiveProxy } from '@coasys/ad4m';

function getModelClassName(m: typeof Ad4mModel): string {
  const anyClass = m as unknown as { className?: string; prototype?: { className?: string }; name: string };
  return anyClass.className || anyClass.prototype?.className || anyClass.name;
}

function getModelTargetClass(m: typeof Ad4mModel): string | undefined {
  const anyClass = m as unknown as { generateSHACL: () => { shape: { targetClass?: string } | null } };
  return anyClass.generateSHACL().shape?.targetClass;
}

/**
 * `ensureSDNASubjectClass`/`ensureSubjectClasses`'s own dedup guard is a JS-process-local
 * cache, not a check against the perspective's actual state — a fresh `PerspectiveProxy`
 * (new app boot, new tab, another peer) starts with that cache empty and will write a full
 * duplicate copy of every shape's SDNA links, even if they're already there. Diffing against
 * `getAllShacl()` first makes registration genuinely idempotent regardless of how many times,
 * or by how many independent processes/peers, it's called on the same perspective.
 *
 * The top-level `shacl://{name}` mapping ad4m-core uses is namespace-blind — it's keyed on
 * the bare `@Model({ name })` string, not the model's namespaced `targetClass` (e.g.
 * `flux://Community` and `some-other-app://Community` both reduce to `"Community"`). On a
 * perspective where another app's SDNA coexists with Flux's (e.g. a WE space that also has
 * Flux's Community installed), a name collision would mean `getAllShacl()` reports that name
 * as already registered even though the installed shape belongs to the other app. Comparing
 * `targetClass`, not just the bare name, means we still correctly detect "this specific model
 * isn't installed" and re-register it rather than silently trusting a same-named foreign shape.
 */
export async function ensureModelsRegistered(p: PerspectiveProxy, models: (typeof Ad4mModel)[]): Promise<void> {
  const existingTargetClassByName = new Map(
    (await p.getAllShacl()).map((s) => [s.name, s.shape.targetClass] as const),
  );
  const missing = models.filter((m) => {
    const existingTargetClass = existingTargetClassByName.get(getModelClassName(m));
    if (existingTargetClass === undefined) return true;
    return existingTargetClass !== getModelTargetClass(m);
  });
  if (missing.length > 0) {
    await Ad4mModel.registerAll(p, missing);
  }
}

/**
 * Read-only check for whether a model's SDNA is already installed on a perspective —
 * does not write anything. Use this to decide whether a perspective is worth querying at
 * all (e.g. "does this perspective have Community SDNA, i.e. is it plausibly a Flux
 * community") without defensively installing SDNA on perspectives that were never a Flux
 * community in the first place (e.g. another app's own perspectives).
 */
export async function isModelRegistered(p: PerspectiveProxy, model: typeof Ad4mModel): Promise<boolean> {
  const existing = (await p.getAllShacl()).find((s) => s.name === getModelClassName(model));
  if (!existing) return false;
  return existing.shape.targetClass === getModelTargetClass(model);
}
