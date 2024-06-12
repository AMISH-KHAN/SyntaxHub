
import CodeEditor from "./Components/CodeEditor"
import LanguagesSupp from "./Components/LanguagesSupp"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import Join from "./Pages/Join"

function App() {

 
  return (
    <>
     
      <BrowserRouter>
        <Routes>
          <Route path={"/"} element={<Join/> } />
          <Route path={"/editor/:roomId"} element={<CodeEditor/> } />
          
        </Routes> 
      
      
      </BrowserRouter>
      </>
  )
}

export default App
