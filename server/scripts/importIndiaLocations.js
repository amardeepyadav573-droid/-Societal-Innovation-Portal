import mongoose from "mongoose";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import env from "../config/env.js";
import LocationMaster from "../models/LocationMaster.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaults = {
  states: path.resolve(__dirname, "../data/india_states.xlsx"),
  districts: path.resolve(__dirname, "../data/india_districts.xlsx"),
  blocks: path.resolve(__dirname, "../data/india_blocks.xlsx"),
};
const args = Object.fromEntries(
  process.argv.slice(2).map((v) => {
    const [k, ...rest] = v.replace(/^--/, "").split("=");
    return [k, rest.join("=")];
  }),
);

const files = {
  states: path.resolve(args.states || defaults.states),
  districts: path.resolve(args.districts || defaults.districts),
  blocks: path.resolve(args.blocks || defaults.blocks),
};

const clean = (v) =>
  String(v ?? "")
    .trim()
    .replace(/\s+/g, " ");
const numberOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function readRows(file) {
  if (!fs.existsSync(file)) throw new Error(`Excel file not found: ${file}`);
  const wb = XLSX.readFile(file);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headerIndex = raw.findIndex((row) =>
    row.some((cell) =>
      /state code|state name|district code|development block code/i.test(
        String(cell),
      ),
    ),
  );
  if (headerIndex < 0)
    throw new Error(`Could not find a header row in ${file}`);
  const headers = raw[headerIndex].map(clean);
  return raw
    .slice(headerIndex + 1)
    .map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""])));
}

const find = (row, patterns) => {
  const key = Object.keys(row).find((k) => patterns.some((p) => p.test(k)));
  return key ? row[key] : "";
};

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected.");
  try {
    await LocationMaster.collection.dropIndex("state_1_district_1");
  } catch {}
  await LocationMaster.syncIndexes();

  const stateRows = readRows(files.states);
  const districtRows = readRows(files.districts);
  const blockRows = readRows(files.blocks);

  const ops = [];
  for (const row of districtRows) {
    const state = clean(find(row, [/state name.*english/i]));
    const district = clean(find(row, [/district name.*english/i]));
    if (!state || !district) continue;
    ops.push({
      updateOne: {
        filter: { state, district, block: "" },
        update: {
          $set: {
            state,
            stateCode: numberOrNull(find(row, [/^state code/i])),
            district,
            districtCode: numberOrNull(find(row, [/^district code/i])),
            block: "",
            blockCode: null,
            isActive: true,
          },
        },
        upsert: true,
      },
    });
  }
  for (const row of blockRows) {
    const state = clean(find(row, [/state name.*english/i]));
    const district = clean(find(row, [/district name.*english/i]));
    const block = clean(find(row, [/development block name.*english/i]));
    if (!state || !district || !block) continue;
    ops.push({
      updateOne: {
        filter: { state, district, block },
        update: {
          $set: {
            state,
            stateCode: numberOrNull(find(row, [/^state code/i])),
            district,
            districtCode: numberOrNull(find(row, [/^district code/i])),
            block,
            blockCode: numberOrNull(find(row, [/development block code/i])),
            isActive: true,
          },
        },
        upsert: true,
      },
    });
  }
  if (ops.length) {
    for (let i = 0; i < ops.length; i += 500)
      await LocationMaster.bulkWrite(ops.slice(i, i + 500), { ordered: false });
  }

  // State workbook is used as a validation/source-of-truth check.
  const states = [
    ...new Set(
      stateRows
        .map((r) => clean(find(r, [/state name.*english/i])))
        .filter(Boolean),
    ),
  ];
  const importedStates = await LocationMaster.distinct("state", {
    isActive: true,
  });
  console.log(
    `Imported ${states.length} states, ${await LocationMaster.countDocuments({ isActive: true })} location records.`,
  );
  console.log(
    `State master coverage: ${states.filter((s) => importedStates.includes(s)).length}/${states.length}`,
  );

  await mongoose.disconnect();
}
run().catch(async (error) => {
  console.error("India location import failed:", error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
