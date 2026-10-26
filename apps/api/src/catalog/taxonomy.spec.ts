import {
  matchCategory,
  productCanonicalTaxonomy,
  resolveTopic,
} from "@baobab/shared";
import { buildRuntimeTaxonomy } from "./taxonomy";

describe("Taxonomie canonique", () => {
  it("rattache « Ordinateurs & Informatique » à « Informatique & PC »", () => {
    const match = matchCategory({
      name: "Ordinateurs & Informatique",
      slug: "ordinateurs-informatique",
      universe: "classifieds",
    });
    expect(match?.category.slug).toBe("informatique-pc");
    expect(match?.category.label).toBe("Informatique & PC");
  });

  it("rattache les accessoires téléphone à Téléphones & Tablettes, pas à TV/Audio", () => {
    expect(
      matchCategory({
        name: "Accessoires Téléphone",
        slug: "electronique-accessoires-telephone",
        universe: "classifieds",
      })?.category.slug,
    ).toBe("telephones-tablettes");
  });

  it("résout « ordinateur portable » vers la sous-catégorie PC portables", () => {
    const topic = resolveTopic("ordinateur portable");
    expect(topic?.level).toBe("subcategory");
    expect(topic?.subcategory?.slug).toBe("pc-portables");
  });

  it("résout le synonyme « laptop » vers la sous-catégorie PC portables", () => {
    const topic = resolveTopic("laptop");
    expect(topic?.level).toBe("subcategory");
    expect(topic?.subcategory?.slug).toBe("pc-portables");
  });

  it("ne confond pas « sac à main » avec la climatisation", () => {
    const topic = resolveTopic("sac à main");
    expect(topic?.subcategory?.slug).toBe("sacs-bagages");
  });

  it("résout « clim » vers la sous-catégorie Climatisation & chauffage", () => {
    const topic = resolveTopic("clim");
    expect(topic?.subcategory?.slug).toBe("climatisation-chauffage");
  });

  it("affiche la catégorie canonique d'un produit historique", () => {
    const canonical = productCanonicalTaxonomy({
      name: "Lenovo ThinkPad X1 Carbon",
      category: {
        name: "Ordinateurs & Informatique",
        slug: "ordinateurs-informatique",
        universe: "classifieds",
      },
      subcategory: "Autres",
      subcategories: ["Autres"],
    });
    expect(canonical.category?.label).toBe("Informatique & PC");
    expect(canonical.subcategories).toEqual([]);
  });

  it("préfère la sous-catégorie cohérente avec la catégorie du produit", () => {
    const canonical = productCanonicalTaxonomy({
      name: "Câble USB-C",
      category: {
        name: "Téléphones & Tablettes",
        slug: "telephonie-tablettes",
        universe: "classifieds",
      },
      subcategory: "Câbles & Chargeurs",
      subcategories: ["Câbles & Chargeurs"],
    });
    expect(canonical.category?.slug).toBe("telephones-tablettes");
    expect(canonical.subcategories).toEqual(["Accessoires téléphone"]);
  });

  it("construit une taxonomie d'exécution avec les identifiants réels", () => {
    const runtime = buildRuntimeTaxonomy([
      {
        id: "cat-informatique-pc",
        name: "Informatique & PC",
        slug: "informatique-pc",
        universe: "classifieds",
      },
      {
        id: "legacy-ordinateurs",
        name: "Ordinateurs & Informatique",
        slug: "ordinateurs-informatique",
        universe: "classifieds",
      },
    ]);
    const category = runtime.universes
      .flatMap((universe) => universe.categories)
      .find((item) => item.slug === "informatique-pc");
    expect(category?.categoryId).toBe("cat-informatique-pc");
    expect(category?.categoryIds).toEqual(
      expect.arrayContaining(["cat-informatique-pc", "legacy-ordinateurs"]),
    );
  });
});
