
import { useState } from "react"
import CodeEditor from "./Components/CodeEditor"
import LanguagesSupp from "./Components/LanguagesSupp"

function App() {

 
  return (
    <>
      <div className=" w-screen px-4 flex flex-col bg-[#0b0e14]">
          
        <div >
        <CodeEditor  />
        </div>
      </div>
    </>
  )
}

export default App
