import { Ad4mModel, LinkQuery, PerspectiveProxy } from '@coasys/ad4m';

function getModelTargetClass(m: typeof Ad4mModel): string | undefined {
  const anyClass = m as unknown as { generateSHACL: () => { shape: { targetClass?: string } | null } };
  return anyClass.generateSHACL().shape?.targetClass;
}

/**
 * Checks for the exact `targetClass —rdf://type→ ad4m://SubjectClass` link that ad4m-core's
 * query engine (`load_shape`) requires to run a model query — not `getAllShacl()`'s
 * `has_shacl`/`shacl_shape_uri` chain, which is a separate set of triples written by the same
 * `add_sdna` call but not read by `load_shape`. On a freshly-joined, not-yet-fully-synced
 * neighbourhood those two triple sets can replicate at different times, so `getAllShacl()`
 * can report a model as present (its `has_shacl` chain arrived) while `load_shape` still can't
 * find it (the `rdf://type` marker hasn't). Checking the marker `load_shape` actually reads
 * closes that gap, and — since it's keyed on the full namespaced `targetClass` rather than the
 * bare `@Model({ name })` string — is also immune to cross-app name collisions (e.g.
 * `flux://Community` vs. some other app's own differently-namespaced same-named class).
 */
async function hasSubjectClassLink(p: PerspectiveProxy, targetClass: string | undefined): Promise<boolean> {
  if (!targetClass) return false;
  const links = await p.get(new LinkQuery({ source: targetClass, predicate: 'rdf://type', target: 'ad4m://SubjectClass' }));
  return links.length > 0;
}

/**
 * `ensureSDNASubjectClass`/`ensureSubjectClasses`'s own dedup guard is a JS-process-local
 * cache, not a check against the perspective's actual state — a fresh `PerspectiveProxy`
 * (new app boot, new tab, another peer) starts with that cache empty and will write a full
 * duplicate copy of every shape's SDNA links, even if they're already there. Diffing against
 * the perspective's actual state first makes registration genuinely idempotent regardless of
 * how many times, or by how many independent processes/peers, it's called on the same
 * perspective.
 */
export async function ensureModelsRegistered(p: PerspectiveProxy, models: (typeof Ad4mModel)[]): Promise<void> {
  const present = await Promise.all(models.map((m) => hasSubjectClassLink(p, getModelTargetClass(m))));
  const missing = models.filter((_, i) => !present[i]);
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
  return hasSubjectClassLink(p, getModelTargetClass(model));
}
