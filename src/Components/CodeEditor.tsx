import Editor from '@monaco-editor/react';
import  { useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import RunCode from './RunCode';
import { CODE_SNIPPETS } from '../Constant';
import LanguagesSupp from './LanguagesSupp';


const CodeEditor= () => {
  const [language,setLanguage]=useState<string>("javascript")
  // const [language, setLanguage] = useState<string>(props.language);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [value, setValue] = useState<string|undefined>("");
 
  // setValue(defaultValue)
  // console.log("vale",props.defaultValue)
  // useEffect(() => {
  //   setLanguage("javascript");
  //   // setValue(props.defaultValue);
  // }, []);

  function focusEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    editorRef.current = editor;
    editor.focus();
  }

  function handleLang(data: string,value:string) {
    // console.log("language", data)
    setLanguage(data)
    // console.log("value",value)
    setValue(value)
  }
  // useEffect(() => {
  //   if (editorRef.current) {
  //     console.log("Current editor value:", editorRef.current.getValue());
  //   }
  // }, [value]);
  return (
    <>
      <div className='flex md:flex-row flex-col '>

      <div className=' w-full md:w-1/2'>
          <LanguagesSupp onData={handleLang} />
      <Editor
        height=""
        theme='vs-dark'
        language={language}
        defaultValue={CODE_SNIPPETS[language as  keyof typeof CODE_SNIPPETS ]}
        value={value}
        onChange={(value) => setValue(value)}
            onMount={focusEditor}
            className='h-[20rem] md:h-[90dvh]'
        />
      </div>
      <div className='  w-full md:w-1/2  '>
          <RunCode editorRef={ editorRef} language={language} />
        </div>
        </div>
    </>
  );
}

export default CodeEditor;
