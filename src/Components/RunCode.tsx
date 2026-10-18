import React, { useState, useEffect, CSSProperties } from 'react';
import * as monaco from 'monaco-editor';
import { executeCode } from '../Api';
import SyncLoader from "react-spinners/SyncLoader";
import { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface ChildProps {
  language: string;
  editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
  socket: Socket | null;
  roomId?: string;
  userName?: string;
}

const override: CSSProperties = {
  display: "block",
  margin: "0 auto",
  borderColor: "#252596",
};

export default function RunCode({ editorRef, language, socket, roomId, userName }: ChildProps) {
  const [output, setOutput] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ranBy, setRanBy] = useState<string>("");

  useEffect(() => {
    if (!socket) return;

    const handleRunStart = ({ userName: runner }: { userName: string }) => {
      setLoading(true);
      setRanBy(runner);
      toast(`${runner} is running the code...`, { icon: '⚡' });
    };

    const handleRunResult = ({ output: remoteOutput, error: remoteError, ranBy: runner }: { output: string; error: boolean; ranBy: string }) => {
      setLoading(false);
      setOutput(remoteOutput);
      setError(remoteError);
      setRanBy(runner);
      toast.success(`${runner} executed the code`);
    };

    const handleInit = ({ lastOutput }: { lastOutput?: { output: string; error: boolean; ranBy: string } | null }) => {
      if (lastOutput) {
        setOutput(lastOutput.output);
        setError(lastOutput.error);
        setRanBy(lastOutput.ranBy);
      }
    };

    socket.on("code_run_start", handleRunStart);
    socket.on("code_run_result", handleRunResult);
    socket.on("yjs_init", handleInit);

    return () => {
      socket.off("code_run_start", handleRunStart);
      socket.off("code_run_result", handleRunResult);
      socket.off("yjs_init", handleInit);
    };
  }, [socket]);

  async function runCode() {
    const sourceCode = editorRef.current?.getValue();
    if (!sourceCode) return;

    try {
      setLoading(true);
      setRanBy("You");

      if (socket && roomId) {
        socket.emit("code_run_start", {
          roomId,
          userName: userName || "A collaborator",
        });
      }

      const { run: result } = await executeCode(language, sourceCode);
      let finalOutput = "";
      let isError = false;

      if (result.stderr) {
        isError = true;
        finalOutput = result.stderr;
      } else {
        isError = false;
        finalOutput = result.stdout || "Code executed successfully with no output.";
      }

      setError(isError);
      setOutput(finalOutput);

      if (socket && roomId) {
        socket.emit("code_run_result", {
          roomId,
          output: finalOutput,
          error: isError,
          ranBy: userName || "You",
        });
      }
    } catch (err: any) {
      setError(true);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to execute code";
      const finalOutput = `Error: ${errMsg}`;
      setOutput(finalOutput);

      if (socket && roomId) {
        socket.emit("code_run_result", {
          roomId,
          output: finalOutput,
          error: true,
          ranBy: userName || "You",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full p-2">
      <div className="flex items-center justify-between my-2 px-1">
        <button
          className={`border border-[#252596] w-20 py-2.5 text-center rounded-xl font-medium text-[#7c8fff] transition ${
            loading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#252596] hover:text-white"
          }`}
          onClick={runCode}
          disabled={loading}
        >
          {loading ? (
            <SyncLoader
              color="#7c8fff"
              cssOverride={override}
              size={7}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          ) : (
            "Run"
          )}
        </button>

        {ranBy && (
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Last run by:</span>
            <span className="font-semibold text-white">{ranBy}</span>
          </div>
        )}
      </div>

      <div
        className={`border border-[#222222] bg-[#0d1117] rounded-lg p-4 h-[20rem] md:h-[86dvh] font-mono text-sm whitespace-pre-wrap overflow-auto shadow-inner ${
          error ? "text-red-400" : "text-gray-100"
        }`}
      >
        {loading ? (
          <div className="text-gray-400 italic flex items-center gap-2">
            <span>Executing code ({language})...</span>
          </div>
        ) : output ? (
          output
        ) : (
          <span className="text-gray-500 italic">Output will be displayed here for everyone in the room...</span>
        )}
      </div>
    </div>
  );
}

