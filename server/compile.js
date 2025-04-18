//File: CodePair/server/compile.js
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");

const execPromise = util.promisify(exec);

const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const languageConfigs = {
  javascript: {
    extension: "js",
    executeCommand: (filename) => `node ${filename}`,
  },
  python: {
    extension: "py",
    executeCommand: (filename) => `python3 ${filename}`,
  },
  cpp: {
    extension: "cpp",
    executeCommand: (filename) => {
      const outputFile = filename.replace(".cpp", "");
      return `g++ ${filename} -o ${outputFile} && ${outputFile}`;
    },
  },
  java: {
    extension: "java",
    executeCommand: (filename) => {
      const className = "Main";
      return `javac ${filename} && java ${className}`;
    },
  },
};

async function compileAndExecute(code, language) {
  if (!languageConfigs[language]) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const config = languageConfigs[language];
  const timestamp = Date.now();
  const filename = `${timestamp}.${config.extension}`;
  const filePath = path.join(tempDir, filename);

  try {
    // Write code to file
    await fs.promises.writeFile(filePath, code);

    // Set execution timeout to 10 seconds
    const timeout = 10000;

    // Execute the code with timeout
    const { stdout, stderr } = await Promise.race([
      execPromise(config.executeCommand(filePath), {
        cwd: tempDir,
        timeout: timeout,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Execution timeout")), timeout)
      ),
    ]);

    // Cleanup temporary files
    await cleanupFiles(filePath);

    return {
      success: !stderr,
      output: stderr || stdout,
    };
  } catch (error) {
    // Cleanup temporary files
    await cleanupFiles(filePath);

    return {
      success: false,
      output: error.message,
    };
  }
}

async function cleanupFiles(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    // Clean up compiled files
    const extension = path.extname(filePath);
    if (extension === ".cpp" || extension === ".rs") {
      const executablePath = filePath.replace(extension, "");
      if (fs.existsSync(executablePath)) {
        await fs.promises.unlink(executablePath);
      }
    }
    if (extension === ".java") {
      const classPath = filePath.replace(".java", ".class");
      if (fs.existsSync(classPath)) {
        await fs.promises.unlink(classPath);
      }
    }
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}

module.exports = compileAndExecute;
