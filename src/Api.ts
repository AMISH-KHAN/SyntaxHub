import axios from "axios";
import { LANGUAGE_VERSIONS } from "./Constant";

const API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
});

export const executeCode = async (language:string, sourceCode:string) => {
  const response = await API.post("/execute", {
    language: language,
    version: LANGUAGE_VERSIONS[language as keyof typeof LANGUAGE_VERSIONS],
    files: [
      {
        content: sourceCode,
      },
    ],
  });
  return response.data;
};