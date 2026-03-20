import { PrismaClient, type RelationType } from "@prisma/client";

const prisma = new PrismaClient();

type SeedMeaning = {
  gloss: string;
  description?: string;
};

type SeedMorphologyEntry = {
  rowLabel: string;
  columnLabel?: string;
  plainLabel?: string;
  value: string;
};

type SeedMorphologyTable = {
  title: string;
  description?: string;
  isPlainEnglish: boolean;
  entries: SeedMorphologyEntry[];
};

type SeedWord = {
  lemma: string;
  syllabics?: string;
  plainEnglish: string;
  partOfSpeech: string;
  linguisticClass?: string;
  rootStem?: string;
  pronunciation?: string;
  audioUrl?: string;
  beginnerExplanation?: string;
  expertExplanation?: string;
  notes?: string;
  source?: string;
  categorySlugs: string[];
  meanings?: SeedMeaning[];
  morphologyTables?: SeedMorphologyTable[];
  isDemo?: boolean;
};

const categorySeeds = [
  {
    name: "Body Parts",
    slug: "body-parts",
    description: "Body-related demo vocabulary for the prototype seed set.",
    colorToken: "moss"
  },
  {
    name: "Animals",
    slug: "animals",
    description: "Animal vocabulary for basic semantic mapping demos.",
    colorToken: "clay"
  },
  {
    name: "Weather",
    slug: "weather",
    description: "Weather and environmental vocabulary for the MVP prototype.",
    colorToken: "lake"
  },
  {
    name: "Colours",
    slug: "colours",
    description: "Colour and descriptive-state words.",
    colorToken: "clay"
  },
  {
    name: "Movement",
    slug: "movement",
    description: "Reserved for future movement-related entries.",
    colorToken: "moss"
  },
  {
    name: "Food",
    slug: "food",
    description: "Reserved for future food-related entries.",
    colorToken: "clay"
  },
  {
    name: "Kinship",
    slug: "kinship",
    description: "Reserved for future kinship vocabulary.",
    colorToken: "moss"
  },
  {
    name: "Hunting",
    slug: "hunting",
    description: "Reserved for future land-based vocabulary.",
    colorToken: "lake"
  }
] as const;

const commonSource =
  "Prototype demo seed referencing publicly visible ALTLab itwêwina entries consulted on March 19, 2026. Replace with verified source data before production use.";
const commonNotes =
  "Demo content only. Explanations and grammatical labels are intentionally simplified to support prototyping and should be reviewed by ALTLab experts before release.";

const wordSeeds: SeedWord[] = [
  {
    lemma: "miyaw",
    plainEnglish: "body",
    partOfSpeech: "dependent noun",
    linguisticClass: "NDI (demo label)",
    beginnerExplanation: "A broad body-related word used as a starting point for exploring parts of the body.",
    expertExplanation:
      "Prototype dependent noun entry used as a broader semantic anchor for body-part relations in the MVP.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["body-parts"],
    meanings: [{ gloss: "body", description: "Primary gloss" }],
    isDemo: true
  },
  {
    lemma: "mistikwân",
    plainEnglish: "head",
    partOfSpeech: "dependent noun",
    linguisticClass: "NDI (demo label)",
    beginnerExplanation: "A body-part word for the head.",
    expertExplanation:
      "Prototype dependent noun entry linked to narrower concepts such as eye, ear, nose, and tooth.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["body-parts"],
    meanings: [
      { gloss: "head", description: "Primary gloss" },
      { gloss: "head area", description: "Broad physical-region reading" }
    ],
    isDemo: true
  },
  {
    lemma: "miskîsik",
    plainEnglish: "eye",
    partOfSpeech: "dependent noun",
    linguisticClass: "NDI-1 (demo label)",
    pronunciation: "mis-kee-sik",
    beginnerExplanation:
      "A body-part word for the eye. In novice mode the app focuses on plain-English possession labels like 'My eye' and 'Your eye'.",
    expertExplanation:
      "Prototype rich entry used to demonstrate how novice labels and expert morphological paradigms can coexist in the same record.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["body-parts"],
    meanings: [
      { gloss: "eye", description: "Primary gloss" },
      { gloss: "eyesight", description: "Extended semantic reading for demo purposes" }
    ],
    morphologyTables: [
      {
        title: "Plain-English possession forms",
        description: "Learner-facing labels with minimal technical jargon.",
        isPlainEnglish: true,
        entries: [
          { rowLabel: "My eye", value: "niskîsik" },
          { rowLabel: "Your eye", value: "kiskîsik" },
          { rowLabel: "His or her eye", value: "oskîsik" },
          { rowLabel: "One eye", value: "miskîsik" },
          { rowLabel: "Many eyes", value: "miskîsikwa" },
          { rowLabel: "In or on the eye", value: "miskîsikohk" }
        ]
      },
      {
        title: "Expert paradigm snapshot",
        description: "Prototype inflection table for linguist-facing review.",
        isPlainEnglish: false,
        entries: [
          { rowLabel: "1sg possessor", columnLabel: "Form", value: "niskîsik" },
          { rowLabel: "2sg possessor", columnLabel: "Form", value: "kiskîsik" },
          { rowLabel: "3sg possessor", columnLabel: "Form", value: "oskîsik" },
          { rowLabel: "Singular", columnLabel: "Form", value: "miskîsik" },
          { rowLabel: "Plural", columnLabel: "Form", value: "miskîsikwa" },
          { rowLabel: "Locative", columnLabel: "Form", value: "miskîsikohk" }
        ]
      }
    ],
    isDemo: true
  },
  {
    lemma: "micihciy",
    plainEnglish: "hand",
    partOfSpeech: "dependent noun",
    linguisticClass: "NDI (demo label)",
    beginnerExplanation: "A body-part word for the hand.",
    expertExplanation:
      "Prototype entry retained because it works well for relation demos involving elbow, body, and possessed forms.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["body-parts"],
    meanings: [
      { gloss: "hand", description: "Primary gloss" },
      { gloss: "paw", description: "Extended gloss often useful in animal vocabulary contexts" }
    ],
    morphologyTables: [
      {
        title: "Quick possession forms",
        description: "Compact learner table for the MVP prototype.",
        isPlainEnglish: true,
        entries: [
          { rowLabel: "My hand", value: "nicihciy" },
          { rowLabel: "Your hand", value: "kicihciy" },
          { rowLabel: "His or her hand", value: "ocihciy" }
        ]
      }
    ],
    isDemo: true
  },
  {
    lemma: "mihtawakay",
    plainEnglish: "ear",
    partOfSpeech: "dependent noun",
    linguisticClass: "NDI (demo label)",
    beginnerExplanation: "A body-part word for the ear.",
    expertExplanation: "Prototype dependent noun entry used in the head semantic cluster.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["body-parts"],
    meanings: [{ gloss: "ear", description: "Primary gloss" }],
    isDemo: true
  },
  {
    lemma: "mîpit",
    plainEnglish: "tooth",
    partOfSpeech: "dependent noun",
    linguisticClass: "NDI (demo label)",
    beginnerExplanation: "A body-part word for a tooth.",
    expertExplanation: "Prototype dependent noun entry linked to the head semantic region.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["body-parts"],
    meanings: [{ gloss: "tooth", description: "Primary gloss" }],
    isDemo: true
  },
  {
    lemma: "mikot",
    plainEnglish: "nose",
    partOfSpeech: "dependent noun",
    linguisticClass: "NDI (demo label)",
    beginnerExplanation: "A body-part word for the nose.",
    expertExplanation: "Prototype noun entry used to compare human nose and animal snout-like vocabulary.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["body-parts"],
    meanings: [{ gloss: "nose", description: "Primary gloss" }],
    isDemo: true
  },
  {
    lemma: "misicis",
    plainEnglish: "foot",
    partOfSpeech: "dependent noun",
    linguisticClass: "NDI (demo label)",
    beginnerExplanation: "A body-part word for the foot.",
    expertExplanation: "Prototype entry used to demonstrate broader-body relations and lower-body clusters.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["body-parts"],
    meanings: [{ gloss: "foot", description: "Primary gloss" }],
    isDemo: true
  },
  {
    lemma: "miskât",
    plainEnglish: "leg",
    partOfSpeech: "dependent noun",
    linguisticClass: "NDI (demo label)",
    beginnerExplanation: "A body-part word for the leg.",
    expertExplanation: "Prototype lower-body entry linked to foot and body.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["body-parts"],
    meanings: [{ gloss: "leg", description: "Primary gloss" }],
    isDemo: true
  },
  {
    lemma: "mitôskwan",
    plainEnglish: "elbow",
    partOfSpeech: "dependent noun",
    linguisticClass: "NDI (demo label)",
    beginnerExplanation: "A body-part word for the elbow.",
    expertExplanation: "Prototype body-part entry linked to hand as an associated concept.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["body-parts"],
    meanings: [{ gloss: "elbow", description: "Primary gloss" }],
    isDemo: true
  },
  {
    lemma: "mitêh",
    plainEnglish: "heart",
    partOfSpeech: "dependent noun",
    linguisticClass: "NDI (demo label)",
    beginnerExplanation: "A body-part word for the heart.",
    expertExplanation: "Prototype entry connecting concrete body vocabulary with metaphor-ready semantic domains.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["body-parts"],
    meanings: [{ gloss: "heart", description: "Primary gloss" }],
    isDemo: true
  },
  {
    lemma: "miskiwan",
    plainEnglish: "snout or animal nose",
    partOfSpeech: "animate noun",
    linguisticClass: "NA (demo label)",
    beginnerExplanation: "A word useful for comparing animal body vocabulary with human body vocabulary.",
    expertExplanation:
      "Prototype animal-body entry used to demonstrate cross-category relations between body parts and animals.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["body-parts", "animals"],
    meanings: [{ gloss: "snout", description: "Animal-related gloss" }],
    isDemo: true
  },
  {
    lemma: "atim",
    plainEnglish: "dog",
    partOfSpeech: "animate noun",
    linguisticClass: "NA",
    beginnerExplanation: "A basic animal word for dog.",
    expertExplanation: "Prototype animate noun entry for the animals category.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["animals"],
    meanings: [{ gloss: "dog", description: "Primary gloss" }],
    isDemo: true
  },
  {
    lemma: "mistatim",
    plainEnglish: "horse",
    partOfSpeech: "animate noun",
    linguisticClass: "NA",
    beginnerExplanation: "A basic animal word for horse.",
    expertExplanation: "Prototype animate noun entry included to broaden the animals semantic network.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["animals"],
    meanings: [{ gloss: "horse", description: "Primary gloss" }],
    isDemo: true
  },
  {
    lemma: "maskwa",
    plainEnglish: "bear",
    partOfSpeech: "animate noun",
    linguisticClass: "NA",
    beginnerExplanation: "A basic animal word for bear.",
    expertExplanation: "Prototype animate noun entry with simple semantic links to other animal vocabulary.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["animals"],
    meanings: [{ gloss: "bear", description: "Primary gloss" }],
    isDemo: true
  },
  {
    lemma: "mahkêsîs",
    plainEnglish: "fox",
    partOfSpeech: "animate noun",
    linguisticClass: "NA",
    beginnerExplanation: "A basic animal word for fox.",
    expertExplanation: "Prototype animate noun entry used to illustrate animal-to-animal similarity links.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["animals"],
    meanings: [{ gloss: "fox", description: "Primary gloss" }],
    isDemo: true
  },
  {
    lemma: "wâpos",
    plainEnglish: "rabbit",
    partOfSpeech: "animate noun",
    linguisticClass: "NA",
    beginnerExplanation: "A basic animal word for rabbit.",
    expertExplanation: "Prototype animate noun entry linked to other small-animal vocabulary.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["animals"],
    meanings: [{ gloss: "rabbit", description: "Primary gloss" }],
    isDemo: true
  },
  {
    lemma: "kimiwan",
    plainEnglish: "it is raining",
    partOfSpeech: "weather verb",
    linguisticClass: "VII/VI (demo label)",
    beginnerExplanation: "A weather word for rain or rainy conditions.",
    expertExplanation: "Prototype weather predicate entry linked to snow and wind terms.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["weather"],
    meanings: [{ gloss: "rain", description: "Weather event gloss" }],
    isDemo: true
  },
  {
    lemma: "kôna",
    plainEnglish: "snow",
    partOfSpeech: "weather noun",
    linguisticClass: "NI (demo label)",
    beginnerExplanation: "A weather word for snow.",
    expertExplanation: "Prototype seasonal/weather entry connected to rain and cold conditions.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["weather"],
    meanings: [{ gloss: "snow", description: "Primary gloss" }],
    isDemo: true
  },
  {
    lemma: "yôtin",
    plainEnglish: "it is windy",
    partOfSpeech: "weather verb",
    linguisticClass: "VII/VI (demo label)",
    beginnerExplanation: "A weather word for windy conditions.",
    expertExplanation: "Prototype weather predicate entry linked to cold-air vocabulary.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["weather"],
    meanings: [{ gloss: "windy", description: "Weather-state gloss" }],
    isDemo: true
  },
  {
    lemma: "tahkiyowêw",
    plainEnglish: "it is cold outside",
    partOfSpeech: "weather verb",
    linguisticClass: "VII/VI (demo label)",
    beginnerExplanation: "A weather word for cold outdoor conditions.",
    expertExplanation: "Prototype weather predicate entry connected to snow and wind terms.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["weather"],
    meanings: [{ gloss: "cold weather", description: "Weather-state gloss" }],
    isDemo: true
  },
  {
    lemma: "wâpiskâw",
    plainEnglish: "it is white",
    partOfSpeech: "descriptive verb",
    linguisticClass: "VAI/VII (demo label)",
    beginnerExplanation: "A colour-related word meaning white or white-coloured.",
    expertExplanation: "Prototype descriptive-state entry in the colours category.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["colours"],
    meanings: [{ gloss: "white", description: "Colour gloss" }],
    isDemo: true
  },
  {
    lemma: "kaskitêwâw",
    plainEnglish: "it is black",
    partOfSpeech: "descriptive verb",
    linguisticClass: "VAI/VII (demo label)",
    beginnerExplanation: "A colour-related word meaning black or black-coloured.",
    expertExplanation: "Prototype descriptive-state entry used for antonym demos with white.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["colours"],
    meanings: [{ gloss: "black", description: "Colour gloss" }],
    isDemo: true
  },
  {
    lemma: "mihkwâw",
    plainEnglish: "it is red",
    partOfSpeech: "descriptive verb",
    linguisticClass: "VAI/VII (demo label)",
    beginnerExplanation: "A colour-related word meaning red or red-coloured.",
    expertExplanation: "Prototype descriptive-state entry in the colours semantic cluster.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["colours"],
    meanings: [{ gloss: "red", description: "Colour gloss" }],
    isDemo: true
  },
  {
    lemma: "sîpihkosiw",
    plainEnglish: "it is blue",
    partOfSpeech: "descriptive verb",
    linguisticClass: "VAI/VII (demo label)",
    beginnerExplanation: "A colour-related word meaning blue or sky-coloured.",
    expertExplanation: "Prototype descriptive-state entry used to round out the colours category.",
    notes: commonNotes,
    source: commonSource,
    categorySlugs: ["colours"],
    meanings: [{ gloss: "blue", description: "Colour gloss" }],
    isDemo: true
  }
];

const relationSeeds: Array<{
  from: string;
  to: string;
  type: RelationType;
  label?: string;
  isBidirectional?: boolean;
}> = [
  { from: "mistikwân", to: "miyaw", type: "broader", isBidirectional: true },
  { from: "miskîsik", to: "mistikwân", type: "broader", isBidirectional: true },
  { from: "miskîsik", to: "miyaw", type: "broader", isBidirectional: true },
  { from: "micihciy", to: "miyaw", type: "broader", isBidirectional: true },
  { from: "mihtawakay", to: "mistikwân", type: "broader", isBidirectional: true },
  { from: "mîpit", to: "mistikwân", type: "broader", isBidirectional: true },
  { from: "mikot", to: "mistikwân", type: "broader", isBidirectional: true },
  { from: "misicis", to: "miskât", type: "broader", isBidirectional: true },
  { from: "miskât", to: "miyaw", type: "broader", isBidirectional: true },
  { from: "mitêh", to: "miyaw", type: "broader", isBidirectional: true },
  { from: "mitôskwan", to: "micihciy", type: "associated", isBidirectional: true },
  { from: "miskiwan", to: "mikot", type: "similar", label: "animal and human nose terms", isBidirectional: true },
  { from: "atim", to: "mistatim", type: "associated", label: "domestic animal vocabulary", isBidirectional: true },
  { from: "maskwa", to: "mahkêsîs", type: "similar", label: "wild animal vocabulary", isBidirectional: true },
  { from: "wâpos", to: "mahkêsîs", type: "associated", label: "small animal cluster", isBidirectional: true },
  { from: "kimiwan", to: "kôna", type: "associated", isBidirectional: true },
  { from: "yôtin", to: "tahkiyowêw", type: "associated", isBidirectional: true },
  { from: "kôna", to: "tahkiyowêw", type: "associated", isBidirectional: true },
  { from: "wâpiskâw", to: "kaskitêwâw", type: "antonym", isBidirectional: true },
  { from: "mihkwâw", to: "sîpihkosiw", type: "similar", label: "colour cluster", isBidirectional: true },
  { from: "wâpiskâw", to: "mihkwâw", type: "associated", label: "colour cluster", isBidirectional: true }
];

function slugifySeed(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function main() {
  await prisma.mediaAsset.deleteMany();
  await prisma.savedWord.deleteMany();
  await prisma.relation.deleteMany();
  await prisma.morphologyEntry.deleteMany();
  await prisma.morphologyTable.deleteMany();
  await prisma.wordMeaning.deleteMany();
  await prisma.wordCategory.deleteMany();
  await prisma.word.deleteMany();
  await prisma.category.deleteMany();

  const categories = await Promise.all(
    categorySeeds.map((category) =>
      prisma.category.create({
        data: category
      })
    )
  );

  const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));
  const wordByLemma = new Map<string, { id: string; slug: string }>();

  for (const word of wordSeeds) {
    const created = await prisma.word.create({
      data: {
        lemma: word.lemma,
        syllabics: word.syllabics,
        slug: slugifySeed(word.lemma),
        plainEnglish: word.plainEnglish,
        partOfSpeech: word.partOfSpeech,
        linguisticClass: word.linguisticClass,
        rootStem: word.rootStem,
        pronunciation: word.pronunciation,
        audioUrl: word.audioUrl,
        beginnerExplanation: word.beginnerExplanation,
        expertExplanation: word.expertExplanation,
        notes: word.notes,
        source: word.source,
        isDemo: word.isDemo ?? true,
        meanings: {
          create: (word.meanings ?? [{ gloss: word.plainEnglish, description: "Primary gloss" }]).map(
            (meaning, index) => ({
              gloss: meaning.gloss,
              description: meaning.description,
              sortOrder: index
            })
          )
        },
        categories: {
          create: word.categorySlugs
            .map((slug, index) => {
              const categoryId = categoryBySlug.get(slug);
              if (!categoryId) {
                return null;
              }

              return {
                categoryId,
                sortOrder: index
              };
            })
            .filter((item): item is { categoryId: string; sortOrder: number } => Boolean(item))
        },
        morphologyTables: {
          create: (word.morphologyTables ?? []).map((table, tableIndex) => ({
            title: table.title,
            description: table.description,
            isPlainEnglish: table.isPlainEnglish,
            sortOrder: tableIndex,
            entries: {
              create: table.entries.map((entry, entryIndex) => ({
                rowLabel: entry.rowLabel,
                columnLabel: entry.columnLabel,
                plainLabel: entry.plainLabel,
                value: entry.value,
                sortOrder: entryIndex
              }))
            }
          }))
        }
      }
    });

    wordByLemma.set(word.lemma, { id: created.id, slug: created.slug });
  }

  const relationData = relationSeeds
    .map((relation) => {
      const fromWord = wordByLemma.get(relation.from);
      const toWord = wordByLemma.get(relation.to);

      if (!fromWord || !toWord) {
        return null;
      }

      return {
        fromWordId: fromWord.id,
        toWordId: toWord.id,
        relationType: relation.type,
        label: relation.label,
        isBidirectional: relation.isBidirectional ?? false
      };
    })
    .filter(
      (
        relation
      ): relation is {
        fromWordId: string;
        toWordId: string;
        relationType: RelationType;
        label: string | undefined;
        isBidirectional: boolean;
      } => Boolean(relation)
    );

  await prisma.relation.createMany({
    data: relationData
  });

  console.log(`Seeded ${categories.length} categories, ${wordSeeds.length} words, and ${relationSeeds.length} relations.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
