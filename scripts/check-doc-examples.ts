import { Project, type SourceFile } from "ts-morph";

const codeFencePattern =
  /```(?:ts|typescript)(?:[ \t]+[^\n]*)?\n([\s\S]*?)```/g;

interface Example {
  readonly file: SourceFile;
  readonly sourcePath: string;
  readonly sourceLine: number;
}

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
  compilerOptions: {
    noUnusedLocals: false,
    noUnusedParameters: false,
  },
});

const examples: Array<Example> = [];

for (const sourceFile of project.getSourceFiles("src/**/*.ts")) {
  const sourcePath = sourceFile.getFilePath();
  if (
    sourcePath.includes("/scratchpad/") ||
    sourcePath.endsWith(".test.ts") ||
    sourcePath.endsWith("test.spec.ts")
  ) {
    continue;
  }

  const source = sourceFile.getFullText();
  let index = 0;
  while (true) {
    const match = codeFencePattern.exec(source);
    if (match === null) {
      break;
    }
    const code = match[1]
      .split("\n")
      .map((line) => line.replace(/^\s*\* ?/, ""))
      .join("\n");
    const sourceLine = source.slice(0, match.index).split("\n").length;
    const name = sourceFile
      .getFilePath()
      .replace(`${process.cwd()}/`, "")
      .replace(/[^a-zA-Z0-9]+/g, "-");
    const file = project.createSourceFile(
      `.doc-examples/${name}-${index}.ts`,
      `${code}\nexport {};\n`,
      { overwrite: true },
    );

    examples.push({ file, sourcePath, sourceLine });
    index += 1;
  }
}

let failed = false;

for (const example of examples) {
  const diagnostics = example.file.getPreEmitDiagnostics();
  if (diagnostics.length === 0) {
    continue;
  }

  failed = true;
  const relativePath = example.sourcePath.replace(`${process.cwd()}/`, "");
  console.error(`\n${relativePath}:${example.sourceLine}`);
  console.error(project.formatDiagnosticsWithColorAndContext(diagnostics));
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log(`Checked ${examples.length} TypeScript documentation examples.`);
}
