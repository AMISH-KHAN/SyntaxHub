import React, { useState,CSSProperties } from 'react'
import * as monaco from 'monaco-editor';
import { executeCode } from '../Api';
import SyncLoader from "react-spinners/SyncLoader";


interface ChildProps{

  language: string;
  editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
}

const override: CSSProperties = {
  display: "block",
  margin: "0 auto",
  borderColor: "#252596",
};


export default function RunCode({ editorRef, language }: ChildProps) {

  const [output,setOutput]=useState("")
  const [error, setError] = useState(false)
  const [loading ,setLoading]=useState(false)

  async function runCode() {
    let sourceCode = editorRef.current?.getValue();
    if (!sourceCode) return;
    try {
      setLoading(true)
      const {run: result }  = await executeCode(language, sourceCode)
      if (result.stderr) {
        setError(true)
        console.log(error)
        setOutput(result.stderr)
      }
      else {
        setError(false)
        setOutput(result.stdout)
        
      }
    }
    catch (error) {
      
    }
    finally {
      setLoading(false)
    }
  }
  return (
    <>
      <button className={`boreder-1 border border-[#252596] w-16  py-3 text-center rounded-xl my-2 text-[#252596] ${loading?"":"hover:bg-[#252596]"} hover:text-white`} onClick={runCode}>{loading?
    <SyncLoader
    color="#252596"
    cssOverride={override}
    size={10}
    aria-label="Loading Spinner"
    data-testid="loader"
        /> :
        "run"
 }</button >
    <div className='border-1 border p-8 h-[20rem] md:h-[90dvh] text-white'>
        {output ? output:"Run to execute code"}
    </div>
    </>
  )
}
