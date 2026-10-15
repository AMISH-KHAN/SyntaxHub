import axios from "axios";

// Judge0 CE language IDs
export const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  javascript: 93, // Node.js 18.15.0
  typescript: 94, // TypeScript 5.0.3
  python: 92,     // Python 3.11.2
  java: 91,       // Java JDK 17.0.6
  csharp: 51,     // C# Mono 6.6.0.161
  php: 98,        // PHP 8.3.11
};

const API = axios.create({
  baseURL: "https://ce.judge0.com",
});

export interface ExecuteResult {
  run: {
    stdout: string;
    stderr: string;
    output: string;
    code?: number;
  };
}

export const executeCode = async (language: string, sourceCode: string): Promise<ExecuteResult> => {
  const langKey = language.toLowerCase();
  const languageId = JUDGE0_LANGUAGE_IDS[langKey];

  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  // Judge0 compiles Java inside Main.java; adjust public class name if needed
  let processedCode = sourceCode;
  if (langKey === "java" && /public\s+class\s+\w+/.test(processedCode)) {
    processedCode = processedCode.replace(/public\s+class\s+\w+/, "public class Main");
  }

  const response = await API.post(
    "/submissions?base64_encoded=false&wait=true",
    {
      language_id: languageId,
      source_code: processedCode,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = response.data;
  const stderr = data.stderr || data.compile_output || data.message || "";
  const stdout = data.stdout || "";

  return {
    run: {
      stdout,
      stderr,
      output: stdout || stderr,
    },
  };
};