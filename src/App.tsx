
import { useState } from "react"
import CodeEditor from "./Components/CodeEditor"
import LanguagesSupp from "./Components/LanguagesSupp"


function App() {
const [language,setLanguage]=useState<string>("")
const [defaultvalue,setDefaultvalue]=useState<string>("")
  function handleLang(data: string,value:string) {
    
    console.log("language", data)
    setLanguage(data)
    console.log("value",value)
    setDefaultvalue(value)
  }
  return (
    <>
      <div className=" w-screen flex bg-slate-900">
        <div className="w-1/2">
          <LanguagesSupp  onData={handleLang}/>
        <CodeEditor language={language} defaultValue={defaultvalue} />
        </div>
      </div>
    </>
  )
}

export default App
