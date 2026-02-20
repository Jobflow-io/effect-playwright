import * as fs from "fs";
import * as path from "path";
import { type JSDocableNode, Project } from "ts-morph";

const MAPPINGS = [
  { pw: "Browser", ep: "PlaywrightBrowserService", type: "interface" },
  {
    pw: "BrowserContext",
    ep: "PlaywrightBrowserContextService",
    type: "interface",
  },
  { pw: "Page", ep: "PlaywrightPageService", type: "interface" },
  { pw: "Frame", ep: "PlaywrightFrameService", type: "interface" },
  { pw: "Locator", ep: "PlaywrightLocatorService", type: "interface" },
  { pw: "Request", ep: "PlaywrightRequest", type: "class" },
  { pw: "Response", ep: "PlaywrightResponse", type: "class" },
  { pw: "Worker", ep: "PlaywrightWorker", type: "class" },
  { pw: "Dialog", ep: "PlaywrightDialog", type: "class" },
  { pw: "FileChooser", ep: "PlaywrightFileChooser", type: "class" },
  { pw: "Download", ep: "PlaywrightDownload", type: "class" },
];

const EXCLUDED_METHODS = new Set([
  "on",
  "once",
  "off",
  "addListener",
  "removeListener",
  "prependListener",
  "prependOnceListener",
  "removeAllListeners",
  "setMaxListeners",
  "getMaxListeners",
  "listeners",
  "rawListeners",
  "emit",
  "eventNames",
  "listenerCount",
  "_",
  "$",
  "$$",
  "$eval",
  "$$eval",
  "[Symbol.asyncDispose]",
]);

const CUSTOM_MAPPINGS: Record<string, string> = {
  createReadStream: "stream",
};

function isRelevantProperty(name: string) {
  if (name.startsWith("_")) return false;
  if (EXCLUDED_METHODS.has(name)) return false;
  return true;
}

function isDeprecated(node: JSDocableNode): boolean {
  return node
    .getJsDocs()
    .some((doc) =>
      doc.getTags().some((tag) => tag.getTagName() === "deprecated"),
    );
}

async function main() {
  const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), "tsconfig.json"),
  });

  const pwTypesPath = path.join(
    process.cwd(),
    "node_modules/playwright-core/types/types.d.ts",
  );
  if (!fs.existsSync(pwTypesPath)) {
    console.error(`Could not find playwright-core types at ${pwTypesPath}`);
    process.exit(1);
  }

  const pwSourceFile = project.addSourceFileAtPath(pwTypesPath);
  const epSourceFiles = project.getSourceFiles("src/**/*.ts");

  console.log("=== Playwright API Coverage ===\n");

  let totalPwStable = 0;
  let totalEpStable = 0;
  let totalPwDeprecated = 0;
  let totalEpDeprecated = 0;

  for (const { pw, ep, type } of MAPPINGS) {
    const pwInterface = pwSourceFile.getInterface(pw);
    if (!pwInterface) continue;

    const pwMethods = new Map<string, boolean>(); // name -> isDeprecated

    for (const prop of pwInterface.getProperties()) {
      if (isRelevantProperty(prop.getName())) {
        pwMethods.set(prop.getName(), isDeprecated(prop));
      }
    }
    for (const method of pwInterface.getMethods()) {
      if (isRelevantProperty(method.getName())) {
        // Since methods can be overloaded, we check if any of the signatures are NOT deprecated
        // If all are deprecated, then the method is deprecated. If there's no JSDoc or at least one isn't, it's stable.
        // Actually, interface methods in playwright-core types are usually not overloaded in a way where one is deprecated and one is not.
        // Let's just check the method itself.
        const methodIsDeprecated = isDeprecated(method);
        // If it was already added (e.g., from property), we could OR the deprecation. But map handles it.
        if (
          !pwMethods.has(method.getName()) ||
          !pwMethods.get(method.getName())
        ) {
          pwMethods.set(method.getName(), methodIsDeprecated);
        }
      }
    }

    const epMembers = new Set<string>();
    let foundEp = false;

    for (const sf of epSourceFiles) {
      if (type === "interface") {
        const epInterface = sf.getInterface(ep);
        if (epInterface) {
          foundEp = true;
          for (const prop of epInterface.getProperties())
            epMembers.add(prop.getName());
          for (const method of epInterface.getMethods())
            epMembers.add(method.getName());
          break;
        }
      } else {
        const epClass = sf.getClass(ep);
        if (epClass) {
          foundEp = true;
          for (const prop of epClass.getProperties())
            epMembers.add(prop.getName());
          for (const method of epClass.getMethods())
            epMembers.add(method.getName());

          const extendsClause = epClass.getExtends();
          if (extendsClause) {
            const typeArgs = extendsClause.getTypeArguments();
            if (typeArgs.length > 0) {
              const typeArg = typeArgs[0];
              const props = typeArg.getType().getProperties();
              for (const p of props) epMembers.add(p.getName());
            }
          }
          break;
        }
      }
    }

    if (!foundEp) continue;

    let implementedStable = 0;
    let implementedDeprecated = 0;
    let pwStableCount = 0;
    let pwDeprecatedCount = 0;

    const missingStable: string[] = [];
    const missingDeprecated: string[] = [];

    for (const [m, deprecated] of pwMethods.entries()) {
      const mappedEpName = CUSTOM_MAPPINGS[m];
      const isImplemented =
        epMembers.has(m) ||
        epMembers.has(m + "Stream") ||
        (mappedEpName && epMembers.has(mappedEpName));

      if (deprecated) {
        pwDeprecatedCount++;
        if (isImplemented) implementedDeprecated++;
        else missingDeprecated.push(m);
      } else {
        pwStableCount++;
        if (isImplemented) implementedStable++;
        else missingStable.push(m);
      }
    }

    totalPwStable += pwStableCount;
    totalEpStable += implementedStable;
    totalPwDeprecated += pwDeprecatedCount;
    totalEpDeprecated += implementedDeprecated;

    const coverageStable =
      pwStableCount === 0
        ? "100.0"
        : ((implementedStable / pwStableCount) * 100).toFixed(1);
    const coverageDeprecated =
      pwDeprecatedCount === 0
        ? "100.0"
        : ((implementedDeprecated / pwDeprecatedCount) * 100).toFixed(1);

    console.log(`--- ${pw} ---`);
    console.log(
      `Stable Coverage:     ${coverageStable}% (${implementedStable}/${pwStableCount})`,
    );
    if (pwDeprecatedCount > 0) {
      console.log(
        `Deprecated Coverage: ${coverageDeprecated}% (${implementedDeprecated}/${pwDeprecatedCount})`,
      );
    }

    if (missingStable.length > 0) {
      console.log(`Missing stable methods:`);
      for (let i = 0; i < missingStable.length; i += 5) {
        console.log(`  ${missingStable.slice(i, i + 5).join(", ")}`);
      }
    }
    if (missingDeprecated.length > 0) {
      console.log(`Missing deprecated methods:`);
      for (let i = 0; i < missingDeprecated.length; i += 5) {
        console.log(`  ${missingDeprecated.slice(i, i + 5).join(", ")}`);
      }
    }
    console.log();
  }

  console.log("=============================");
  console.log(
    `Total Stable Coverage:     ${((totalEpStable / totalPwStable) * 100).toFixed(1)}% (${totalEpStable}/${totalPwStable})`,
  );
  console.log(
    `Total Deprecated Coverage: ${((totalEpDeprecated / totalPwDeprecated) * 100).toFixed(1)}% (${totalEpDeprecated}/${totalPwDeprecated})`,
  );
  console.log("=============================\n");
}

main().catch(console.error);
