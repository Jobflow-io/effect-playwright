import { Command } from "@effect/cli";
import { FileSystem, Path } from "@effect/platform";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Console, Effect } from "effect";
import { type JSDocableNode, Project } from "ts-morph";

const MAPPINGS = [
  { pw: "Browser", ep: "PlaywrightBrowserService", type: "interface" as const },
  {
    pw: "BrowserContext",
    ep: "PlaywrightBrowserContextService",
    type: "interface" as const,
  },
  { pw: "Page", ep: "PlaywrightPageService", type: "interface" as const },
  { pw: "Frame", ep: "PlaywrightFrameService", type: "interface" as const },
  { pw: "Locator", ep: "PlaywrightLocatorService", type: "interface" as const },
  { pw: "Request", ep: "PlaywrightRequest", type: "class" as const },
  { pw: "Response", ep: "PlaywrightResponse", type: "class" as const },
  { pw: "Worker", ep: "PlaywrightWorker", type: "class" as const },
  { pw: "Dialog", ep: "PlaywrightDialog", type: "class" as const },
  { pw: "FileChooser", ep: "PlaywrightFileChooser", type: "class" as const },
  { pw: "Download", ep: "PlaywrightDownload", type: "class" as const },
];

const EXCLUDED_METHODS = new Set([
  // EventEmitter methods
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
  // Deprecated or internal
  "_",
  "$",
  "$$",
  "$eval",
  "$$eval",
  // Utility symbols
  "[Symbol.asyncDispose]",
]);

const CUSTOM_MAPPINGS: Record<string, string> = {
  // Playwright -> Effect-Playwright
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

const runCoverage = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const pathService = yield* Path.Path;

  const cwd = process.cwd();
  const tsConfigFilePath = pathService.join(cwd, "tsconfig.json");
  const pwTypesPath = pathService.join(
    cwd,
    "node_modules",
    "playwright-core",
    "types",
    "types.d.ts",
  );

  const exists = yield* fs.exists(pwTypesPath);
  if (!exists) {
    return yield* Effect.fail(
      new Error(`Could not find playwright-core types at ${pwTypesPath}`),
    );
  }

  yield* Console.log("Initializing ts-morph project...");

  const project = new Project({
    tsConfigFilePath,
  });

  const pwSourceFile = project.addSourceFileAtPath(pwTypesPath);
  const epSourceFiles = project.getSourceFiles("src/**/*.ts");

  yield* Console.log("\n=== Playwright API Coverage ===\n");

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
        const methodIsDeprecated = isDeprecated(method);
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

    if (!foundEp) {
      yield* Console.warn(`[!] Could not find ${type} ${ep} in src/.`);
      continue;
    }

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
        epMembers.has(`${m}Stream`) ||
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

    yield* Console.log(`--- ${pw} ---`);
    yield* Console.log(
      `Stable Coverage:     ${coverageStable}% (${implementedStable}/${pwStableCount})`,
    );
    if (pwDeprecatedCount > 0) {
      yield* Console.log(
        `Deprecated Coverage: ${coverageDeprecated}% (${implementedDeprecated}/${pwDeprecatedCount})`,
      );
    }

    if (missingStable.length > 0) {
      yield* Console.log(`Missing stable methods:`);
      for (let i = 0; i < missingStable.length; i += 5) {
        yield* Console.log(`  ${missingStable.slice(i, i + 5).join(", ")}`);
      }
    }
    if (missingDeprecated.length > 0) {
      yield* Console.log(`Missing deprecated methods:`);
      for (let i = 0; i < missingDeprecated.length; i += 5) {
        yield* Console.log(`  ${missingDeprecated.slice(i, i + 5).join(", ")}`);
      }
    }
    yield* Console.log("");
  }

  yield* Console.log("=============================");
  yield* Console.log(
    `Total Stable Coverage:     ${((totalEpStable / totalPwStable) * 100).toFixed(1)}% (${totalEpStable}/${totalPwStable})`,
  );
  yield* Console.log(
    `Total Deprecated Coverage: ${((totalEpDeprecated / totalPwDeprecated) * 100).toFixed(1)}% (${totalEpDeprecated}/${totalPwDeprecated})`,
  );
  yield* Console.log("=============================\n");
});

const command = Command.make("coverage", {}, () => runCoverage);

const run = Command.run(command, {
  name: "effect-playwright-coverage",
  version: "0.1.0",
});

run(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain);
