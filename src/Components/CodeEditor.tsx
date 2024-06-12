import Editor from '@monaco-editor/react';
import  { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import RunCode from './RunCode';
import { CODE_SNIPPETS } from '../Constant';
import LanguagesSupp from './LanguagesSupp';
import Avatar from 'react-avatar';
import {  useLocation, useNavigate, useParams } from 'react-router-dom';
import copy from 'copy-to-clipboard';
import toast, { Toaster } from 'react-hot-toast';
import { initSocket } from '../Sockets';
import { Socket } from 'socket.io-client';




const CodeEditor = () => {
  const location=useLocation()
  const navigate=useNavigate()
  const [language, setLanguage] = useState<string>("javascript")
  const [show,setShow]=useState(false)
  interface userDataType{
    socketId: string,
    userName:string
}

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [value, setValue] = useState<string | undefined>("");
  const [users, setUsers] = useState<userDataType[]>([])

  let { roomId } = useParams(); 

  
  let socketId;
  function focusEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    editorRef.current = editor;
    editor.focus();
  }

  function handleLang(lang: string,value:string) {
    setLanguage(lang)
    setValue(value)
    
  }
  
  function copyId() {
    if (roomId) {
      copy(roomId);
      toast.success("RoomId copied")
    } else {
      toast.error('Room ID is undefined')

    }
  }

 

 function handleChange(code:string|undefined) {
   if (code) {
     setValue(code)
      // socketRef.current = await initSocket()
   
      if (socketRef.current) {
        socketRef.current.emit("change_code", {roomId, code })
      }
    
  }
  }

  useEffect(() => {

    
    socketRef.current?.on("change_code", ( code  ) => {
        setValue(code)
      
    })
   
  }, [socketRef.current,language])
  
  // useEffect(() => {
  //   if (socketRef.current) {
      
  //   }
  // },[])

  let socket :Socket|null;
  useEffect(() => {
    function handleErrors(e:Error) {
        console.log('socket error', e);
        toast.error('Socket connection failed, try again later.');
        navigate("/")
    }
    // console.log("useeffect")
    if (!socket) {
      
  
      const init = async () => {
        socketRef.current = await initSocket()
        socketRef.current.on('connect_error', (err) => handleErrors(err));
        socketRef.current.on('connect_failed', (err) => handleErrors(err));

  
        // console.log('connected to server with id:', socketRef.current?.id);
        socketRef.current.emit("join", {
          roomId,
          userName: location.state?.userName
        });
        socketRef.current?.on("joined", ({clients,userName,socketId}) => {
          // console.log("arg", args)
          socketId=socketId
          if (userName !== location.state?.userName) {
            toast.success(`${userName} joined`)
            }
          setUsers(clients)
          
      socketRef.current?.emit("sync_code", { socketId,code:editorRef.current?.getValue() })
       
        })
       
      
     

        socketRef.current?.on("disconnected", ({ socketId, userName }) => {
          toast.success(`${userName} left`)
          setUsers((prev) => {
            return prev.filter((user)=>user.socketId!==socketId)
          })
        })
      }
      init()
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect_error', handleErrors);
        socketRef.current.off('connect_failed', handleErrors);
        socketRef.current.off('joined');
        socketRef.current.off('disconnected');
        socketRef.current.disconnect();
        console.log('cleanup and disconnected socket');
        socket = null; // Ensure the global socket is reset on cleanup
      }
    };
  },[])
  
  if (!location.state) {
    navigate("/")
  }

  function leave() {
    navigate("/")
  }
  return (
    <>
     
      <div className='flex md:flex-row flex-col bg-[#0b0e14]'>
      <div><Toaster/></div>
        <div className='md:w-[16rem] md:h-screen bg-[#222222] flex md:flex-col item-center h-[4rem] justify-between'>
          <div className='md:mt-[3rem]'>
            <h1 className='text-white  text-lg cursor-pointer rounded p-2 bg-[#2c2c2c] m-2' onClick={()=>setShow(prev=>!prev)}>Users</h1>
            <div className={`p-3 flex-col flex h-[20rem] z-10 w-[12rem] overflow-y-auto ml-2  md:static absolute md:bg-none bg-[#0b0e14]  rounded ${!show?"hidden":""}`}>
              {
                users.map((user, index) => {
                  return (
              <div key={index} className={` hover:bg-[#2c2c2c]  rounded p-3 mb-2 text-white`}>
                      <Avatar name={user.userName} size="40" round="10px" /> <span className='ml-2'>{ user.userName}</span>

              </div>
                    
                  )
                })
              }
            </div>
          </div>
          <div className='flex md:flex-col  justify-center md:w-full md:text-lg text-[11px] md:justify-between w-[14rem] items-center  gap-3 p-2 text-white' >
            <button className='bg-[#1eb51bdb] p-2 w-full rounded-md ' onClick={copyId}>copy Room id</button>
            <button className='bg-[#ff4343db] p-2 w-full rounded-md' onClick={leave}> Leave </button>
          </div>
    </div>
      <div className='w-[95%] md:w-1/2 ml-2'>
          <LanguagesSupp onData={handleLang} socketRef={socketRef} roomId={roomId} socketId={socketId} />
          <div className='flex'>
      <Editor
        height=""
        theme='vs-dark'
        language={language}
        defaultValue={CODE_SNIPPETS[language as  keyof typeof CODE_SNIPPETS ]}
        value={value}
        onChange={handleChange}
            onMount={focusEditor}
            className='h-[20rem] md:h-[90dvh]'
        />
          </div>
          </div>
        <div className='flex flex-col w-full md:w-1/2  '>
      <div className='  w-full overflow-auto '>
          <RunCode editorRef={ editorRef} language={language} />
        </div>
         
        </div>
        </div>
    </>
  );
}

export default CodeEditor;
