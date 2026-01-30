import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env");
const examplePath = path.join(process.cwd(), ".env.example");

if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log("Created .env from .env.example");
} else {
  console.log(".env already exists or .env.example missing");
}
