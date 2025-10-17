#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const categoriesData = [
  {
    name: "Garden Planning",
    slug: "garden-planning",
    description:
      "Layout ideas, succession planting charts, and soil prep routines for productive beds all year long.",
    color: "#65a30d",
  },
  {
    name: "Food Preservation",
    slug: "food-preservation",
    description:
      "Canning marathons, dehydrator experiments, and root cellar checklists to keep the pantry full.",
    color: "#f97316",
  },
  {
    name: "Livestock Care",
    slug: "livestock-care",
    description:
      "Stories from the coop, barn, and pasture with practical tips to keep animals healthy through the seasons.",
    color: "#a16207",
  },
  {
    name: "DIY & Off-Grid",
    slug: "diy-off-grid",
    description:
      "Weekend projects that make the homestead more resilient—solar, water catchment, and low-tech hacks.",
    color: "#0ea5e9",
  },
  {
    name: "Family Traditions",
    slug: "family-traditions",
    description:
      "Meals, gatherings, and rituals that keep generations connected on the homestead.",
    color: "#ec4899",
  },
  {
    name: "Kruiden & Foraging",
    slug: "kruiden-foraging",
    description:
      "Natuurlijke remedies, boswandelingen en veldnotities over eetbare planten dichtbij huis.",
    color: "#22c55e",
  },
  {
    name: "Seizoenswerk",
    slug: "seizoenswerk",
    description:
      "Taken per seizoen: wat er nu in de tuin, stal en voorraadkast moet gebeuren.",
    color: "#6366f1",
  },
];

const articlesData = [
  {
    title: "Charting a Four-Season Kitchen Garden",
    slug: "four-season-kitchen-garden",
    excerpt:
      "How we mapped out a resilient garden that feeds us from March through snow season.",
    content: `Last January we spread seed packets across the farm table and admitted we were tired of our spring glut + August crash. This plan fixed it.

## What we mapped

1. **Quartering the beds.** One quadrant per season keeps succession sowing straightforward. I love the free templates from [The Creative Vegetable Gardener](https://www.creativevegetablegardener.com/).
2. **Soil tests before snow melt.** A $12 kit from our county extension helped us amend with composted chicken litter early.
3. **Row covers stacked in bins.** Instead of hunting for floating row cover in April winds, we now number and roll them up in fall.

> “Plant peas while you’re still wearing a jacket,” my grandma used to say. The calendar lies; soil temperature tells the truth.

### Our seasonal anchors

- **Spring:** Peas along cattle panels, with lettuce tucked in the shade.
- **Summer:** Pole beans replace the peas, basil slides under the tomatoes.
- **Fall:** Direct sowed spinach in August under shade cloth—game changer.
- **Winter:** Low tunnels over kale + mache keep salads on the table.

If you try this, sketch your layout, then write a one-page “crop biography” for each bed. We tuck ours into a binder next to the seed bank.`,
    publishedAt: new Date("2024-03-18"),
    categories: ["garden-planning", "seizoenswerk"],
  },
  {
    title: "Our 12-Hour Canning Marathon — Lessons Learned",
    slug: "canning-marathon-lessons",
    excerpt:
      "What worked (and what didn’t) from the day we put 128 jars on the pantry shelf.",
    content: `If you’ve ever pulled an accidental all-nighter with a pressure canner, this one’s for you.

### The setup

- Three canners going at once: one pressure, two water bath.
- All jars washed the night before and kept warm in the dishwasher.
- A magnetic whiteboard listing every recipe with headspace + processing time.

### Tips we won’t skip again

1. **Stagger sweet + savory batches.** After peach butter, we ran a bone broth load so the kitchen didn’t become a sugar sauna.
2. **Salt buckets at every station.** We mix our canning salt at a 1:3 ratio with dried herbs to keep the rhythm effortless.
3. **Story hour on the deck.** Around 9 PM the kids read aloud while we waited on the last ping—best morale boost.

Useful reference: [National Center for Home Food Preservation](https://nchfp.uga.edu/) updated their processing chart this spring—print it!`,
    publishedAt: new Date("2024-08-02"),
    categories: ["food-preservation", "family-traditions"],
  },
  {
    title: "Winter Coop Reset for Happy Hens",
    slug: "winter-coop-reset",
    excerpt:
      "Our five-step ritual that keeps eggs coming when the snow drifts pile up.",
    content: `Every November we pick a clear afternoon, bribe the kids with cocoa, and give the hens the spa day they deserve.

1. **Deep clean + lime wash.** Scrub walls, then brush on a lime + water slurry to deter mites.
2. **Ventilation audit.** Cobwebs clog vents—clear the ridge vents and add a scrap of wool felt if drafts feel sharp.
3. **Perch shuffle.** We move lower perches up a notch so hens roost shoulder-to-shoulder. Cozy birds stay warmer.
4. **Protein boost.** We sprout barley in the mudroom. A scoop of fresh fodder every evening keeps feathers glossy.
5. **Light timer reset.** A $9 timer kicking on at 4:30 AM keeps daylight consistent without blasting them overnight.

Bonus: hang a treat wreath (cabbage + apples on twine). Watching them jump for bites brightens the darkest mornings.`,
    publishedAt: new Date("2023-11-12"),
    categories: ["livestock-care", "seizoenswerk"],
  },
  {
    title: "Rainwater Harvesting Starter Build (Weekend Project)",
    slug: "rainwater-harvesting-starter-build",
    excerpt:
      "We cobbled together a 275-gallon catchment in two afternoons—here’s the blueprint.",
    content: `Materials tally:

- Reclaimed IBC tote (food grade) — $80
- Two cinder block stacks + 4x4 scraps
- Leaf eater filter, first-flush kit, and flexible downspout

### Steps in short

1. Level the pad with tamped gravel so the tote sits square.
2. Add a first-flush diverter—worth every penny to keep pollen sludge out.
3. Tie overflow into the swale downhill from the herb spiral.

On Monday morning I was already filling watering cans from the tote’s lower ball valve. Link for the diverter we picked: [RainHarvest Systems](https://www.rainharvest.com/first-flush/).`,
    publishedAt: new Date("2024-05-05"),
    categories: ["diy-off-grid"],
  },
  {
    title: "Teaching Kids to Forage Spring Greens",
    slug: "foraging-with-kids",
    excerpt:
      "A family walk through the lower pasture turned into the best salad we ate all April.",
    content: `We carry three rules: ask before picking, leave plenty for the pollinators, and look twice.

### What we gathered

- **Violets:** petals for muffins, leaves for salads.
- **Garlic mustard:** sautéed with eggs to turn a “weed” into breakfast.
- **Chickweed:** blended with lemon juice + oil for a bright green dressing.

We sketched each plant back at the picnic table and taped the drawings into a field journal. Highly recommend the pocket guide *Forage, Harvest, Feast* by Marie Viljoen—fits in the basket beautifully.`,
    publishedAt: new Date("2024-04-14"),
    categories: ["kruiden-foraging", "family-traditions"],
  },
  {
    title: "Solar-Powered Fencing for Rotational Grazing",
    slug: "solar-powered-rotational-grazing",
    excerpt:
      "How a 12-volt panel and two geared reels help us move the herd in under 20 minutes.",
    content: `Rotational grazing sounded complicated until we invested in a tidy solar setup.

### Hardware

- Premier One solar energizer (0.60 output joules)
- Two geared polybraid reels + step-in posts
- Ground rod driven near the winter paddock

### The rhythm

Day 1: Set posts + primary line.  
Day 2: Leapfrog second line while the cows nap.  
Day 3: Roll up first line, move mineral tub, repeat.

We log grass height and rest days in a shared [Notion](https://www.notion.so/) board so everyone knows which paddock is next.`,
    publishedAt: new Date("2024-06-22"),
    categories: ["diy-off-grid", "livestock-care"],
  },
  {
    title: "Community Barter Day Playbook",
    slug: "community-barter-day",
    excerpt:
      "Hosting a quarterly swap keeps our pantry varied and neighbors close—here’s our checklist.",
    content: `We started with six families; now twenty show up with their trunk lids popped.

### Planning timeline

- **Four weeks out:** Send a Google Form asking what folks plan to bring.
- **Two weeks out:** Publish a “wish list” so people can prep extra sourdough starters or soap bars.
- **Day of:** Set up three zones—pantry goods, garden starts, handmade items.

Pro tip: Assign a “story circle” host. While trades happen, kids interview elders about the old days. We archive the audio in a shared drive for winter listening.`,
    publishedAt: new Date("2024-07-13"),
    categories: ["family-traditions", "food-preservation"],
  },
  {
    title: "Brood bakken met eigen graan",
    slug: "brood-bakken-met-eigen-graan",
    excerpt:
      "Zo malen we onze tarwe en bouwen we spanning op in het deeg voor een knapperige korst.",
    content: `De molen gaat vroeg aan, nog voordat de kinderen wakker zijn.

1. **Graan weken.** Eén kop harde tarwe in lauw water + een scheutje appelazijn, 8 uur lang.
2. **Malen op twee standen.** Eerst grof, dan fijn. Onze Mockmill doet het goed, maar elke molen met keramische stenen volstaat.
3. **Autolyse.** Versmeerd meel + water 40 minuten laten rusten voor je zout en desem toevoegt.

Tip: bak op een stalen plaat en stoom de eerste 12 minuten met een spuitfles. Recept gebaseerd op de methode van [Rutger Bakt](https://www.rutgerbakt.nl/).`,
    publishedAt: new Date("2024-02-18"),
    categories: ["food-preservation", "family-traditions"],
  },
  {
    title: "Notitie uit de moestuin: aardappelen onder stro",
    slug: "aardappelen-onder-stro",
    excerpt:
      "Een proef op het noordperk leverde 18 kilo extra op en nauwelijks onkruid wieden.",
    content: `We wilden de rugpijn verminderen en probeerden de “stro-methode”.

### Zo deden we het

- Pootaardappelen op de grond, 30 cm uit elkaar.
- 20 cm laag vochtig stro erover, vastgezet met een paar boogjes wilgentak.
- Bij elke regenbui wat extra stro toevoegen zodat het bed nooit kaal ligt.

Resultaat: super schone aardappelen, weinig Coloradokevers, en de kippen genoten van het stro vol wormen toen we oogstten.`,
    publishedAt: new Date("2023-09-03"),
    categories: ["garden-planning", "seizoenswerk"],
  },
  {
    title: "Wintervoorraad plannen in de kelder",
    slug: "wintervoorraad-plannen",
    excerpt:
      "Met deze checklist blijft de kelder geventileerd en weten we precies wanneer we moeten aanvullen.",
    content: `Elke eerste maandag van de maand lopen we samen naar de kelder met clipboards.

## Checklist

- **Vochtafvoer checken.** De hygrometer moet onder de 60% blijven.
- **Rekken draaien.** Groenten verplaatsen zodat de oudere partijen vooraan liggen.
- **Voorraad tabellen bijwerken.** We gebruiken een gedeelde spreadsheet met kleurcodes voor 'kritisch laag'.

We markeren met krijt op de trap wat er op moet voordat de volgende snert-avond plaatsvindt.`,
    publishedAt: new Date("2023-12-04"),
    categories: ["food-preservation", "seizoenswerk"],
  },
];

async function main() {
  console.log("🌱 Seeding categories…");
  const categoryRecords = {};
  for (const category of categoriesData) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        color: category.color,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        color: category.color,
      },
    });
    categoryRecords[category.slug] = record;
  }

  console.log("📝 Seeding articles…");
  for (const article of articlesData) {
    const connectedCategories = article.categories
      .map((slug) => categoryRecords[slug])
      .filter(Boolean)
      .map((category) => ({ id: category.id }));

    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        published: true,
        publishedAt: article.publishedAt,
        categories: {
          set: connectedCategories,
        },
      },
      create: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        published: true,
        publishedAt: article.publishedAt,
        categories: {
          connect: connectedCategories,
        },
      },
    });
  }

  console.log("✅ Seed data applied.");
}

main()
  .catch((error) => {
    console.error("Failed to seed database", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
