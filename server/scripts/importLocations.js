import mongoose from "mongoose";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";

import env from "../config/env.js";
import LocationMaster from "../models/LocationMaster.js";

const excelPath =
  process.argv[2];

if (!excelPath) {
  console.error(
    "Please provide Excel file path."
  );

  console.error(
    "Example:"
  );

  console.error(
    "node scripts/importLocations.js ./locations.xlsx"
  );

  process.exit(1);
}

const normalize = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

const findColumn = (
  headers,
  candidates
) => {
  const normalized =
    headers.map((h) =>
      String(h)
        .trim()
        .toLowerCase()
    );

  for (
    const candidate of candidates
  ) {
    const index =
      normalized.indexOf(
        candidate
      );

    if (index !== -1) {
      return headers[index];
    }
  }

  return null;
};

const importLocations =
  async () => {
    try {
      if (
        !fs.existsSync(
          excelPath
        )
      ) {
        throw new Error(
          `Excel file not found: ${excelPath}`
        );
      }

      await mongoose.connect(
        env.mongoUri
      );

      console.log(
        "MongoDB connected."
      );

      const workbook =
        XLSX.readFile(
          path.resolve(
            excelPath
          )
        );

      let total = 0;

      for (
        const sheetName of workbook.SheetNames
      ) {
        const sheet =
          workbook.Sheets[
            sheetName
          ];

        const rows =
          XLSX.utils.sheet_to_json(
            sheet,
            {
              defval: "",
            }
          );

        if (!rows.length) {
          continue;
        }

        const headers =
          Object.keys(
            rows[0]
          );

        const stateColumn =
          findColumn(
            headers,
            [
              "state",
              "state name",
              "statename",
            ]
          );

        const districtColumn =
          findColumn(
            headers,
            [
              "district",
              "district name",
              "districtname",
            ]
          );

        if (
          !stateColumn ||
          !districtColumn
        ) {
          console.log(
            `Skipping sheet ${sheetName}: State/District columns not found.`
          );

          continue;
        }

        for (
          const row of rows
        ) {
          const state =
            normalize(
              row[stateColumn]
            );

          const district =
            normalize(
              row[districtColumn]
            );

          if (
            !state ||
            !district
          ) {
            continue;
          }

          await LocationMaster.updateOne(
            {
              state,
              district,
            },
            {
              $set: {
                state,
                district,
              },
            },
            {
              upsert: true,
            }
          );

          total++;
        }
      }

      console.log(
        `Imported/updated ${total} location records.`
      );

      await mongoose.disconnect();

      process.exit(0);
    } catch (error) {
      console.error(
        "Location import failed:",
        error
      );

      await mongoose
        .disconnect()
        .catch(() => {});

      process.exit(1);
    }
  };

importLocations();