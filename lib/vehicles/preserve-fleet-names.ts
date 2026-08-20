type NamedDraft = {
  frontend_vehicle_id: string;
  brand: string;
  model: string;
  wizard_brand?: string | null;
  wizard_model?: string | null;
};

function customized(value: string, wizard: string | null | undefined): boolean {
  return value.trim() !== (wizard ?? "").trim();
}

/** Keep admin brand/model edits across a Wizard resync that reloads the form. */
export function preserveWebsiteBrandModel<T extends NamedDraft>(previous: T[], incoming: T[]): T[] {
  const prevById = new Map(previous.map((row) => [row.frontend_vehicle_id, row]));
  return incoming.map((next) => {
    const local = prevById.get(next.frontend_vehicle_id);
    if (!local) return next;
    const keepBrand = customized(local.brand, local.wizard_brand);
    const keepModel = customized(local.model, local.wizard_model);
    if (!keepBrand && !keepModel) return next;
    return {
      ...next,
      brand: keepBrand ? local.brand : next.brand,
      model: keepModel ? local.model : next.model,
    };
  });
}
