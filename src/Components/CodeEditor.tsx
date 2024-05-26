import Editor from '@monaco-editor/react';
import React, { useRef, useState, useEffect } from 'react';
import * as monaco from 'monaco-editor';


interface ChildProps {
  language: string;
  defaultValue: string;
}

const CodeEditor: React.FC<ChildProps> = (props) => {
  const [language, setLanguage] = useState<string>(props.language);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [value, setValue] = useState<string|undefined>(props.defaultValue);
 
  // setValue(defaultValue)
  // console.log("vale",props.defaultValue)
  useEffect(() => {
    setLanguage(props.language);
    setValue(props.defaultValue);
  }, [props.language,props.defaultValue]);

  function focusEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    editorRef.current = editor;
    editor.focus();
  }

  return (
    <>
      <Editor
        height="85vh"
        theme='vs-dark'
        language={language}
        // defaultValue={`${props.defaultValue}`}
        value={value}
        onChange={(value) => setValue(value)}
        className='h-[88.5vh]'
        onMount={focusEditor}
      />
    </>
  );
}

export default CodeEditor;
