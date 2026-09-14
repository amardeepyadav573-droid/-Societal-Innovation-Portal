import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import LocationMaster from "../models/LocationMaster.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const files = [
  path.resolve(__dirname, "../data/india_districts.xlsx"),
  path.resolve(__dirname, "../data/india_blocks.xlsx"),
];

const clean = (v) =>
  String(v ?? "")
    .trim()
    .replace(/\s+/g, " ");
const find = (row, regexes) => {
  const key = Object.keys(row).find((k) => regexes.some((r) => r.test(k)));
  return key ? row[key] : "";
};
const rowsFrom = (file) => {
  if (!fs.existsSync(file)) return [];
  const wb = XLSX.readFile(file);
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
    header: 1,
    defval: "",
  });
  const hi = raw.findIndex((r) =>
    r.some((c) =>
      /state name|district name|development block name/i.test(String(c)),
    ),
  );
  if (hi < 0) return [];
  const headers = raw[hi].map(clean);
  return raw
    .slice(hi + 1)
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
};

export async function seedDefaultLocations() {
  const stateCount = (
    await LocationMaster.distinct("state", { isActive: true })
  ).length;
  const blockCount = await LocationMaster.countDocuments({
    isActive: true,
    block: { $nin: ["", null] },
  });
  if (stateCount >= 30 && blockCount >= 7000) return;

  const ops = [];
  for (const row of rowsFrom(files[0])) {
    const state = clean(find(row, [/state name.*english/i]));
    const district = clean(find(row, [/district name.*english/i]));
    if (!state || !district) continue;
    ops.push({
      updateOne: {
        filter: { state, district, block: "" },
        update: { $set: { state, district, block: "", isActive: true } },
        upsert: true,
      },
    });
  }
  for (const row of rowsFrom(files[1])) {
    const state = clean(find(row, [/state name.*english/i]));
    const district = clean(find(row, [/district name.*english/i]));
    const block = clean(find(row, [/development block name.*english/i]));
    if (!state || !district || !block) continue;
    ops.push({
      updateOne: {
        filter: { state, district, block },
        update: { $set: { state, district, block, isActive: true } },
        upsert: true,
      },
    });
  }
  for (let i = 0; i < ops.length; i += 500)
    await LocationMaster.bulkWrite(ops.slice(i, i + 500), { ordered: false });
  console.log(
    `India location master ready: ${ops.length} imported/updated records.`,
  );
}
