import { LANGUAGE_VERSIONS } from '../Constant';
import { useEffect, useState } from "react";
import { CODE_SNIPPETS } from "../Constant"
import { Socket } from 'socket.io-client';
interface ChildProp{
    onData: (data: string,value:string) => void,
    socketRef: React.RefObject<Socket>,
    roomId: string | undefined,
    socketId:string | undefined
}

const LanguagesSupp: React.FC<ChildProp> = ({ onData ,socketRef,roomId,socketId}) => {
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    
    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = e.target.value;
        const defaultValue = CODE_SNIPPETS[selected as keyof typeof CODE_SNIPPETS]
        // console.log(selectedLanguage)
        setSelectedLanguage(selected);
        onData(selected, defaultValue);
        socketRef.current?.emit("change_lang",{selected,defaultValue,roomId})
       
    };

  
    useEffect(() => {
        socketRef.current?.on("change_lang", ({ selected, defaultValue }) => {
            setSelectedLanguage(selected);
            onData(selected, defaultValue);
            socketRef.current?.emit("sync_lang", { socketId, code: defaultValue, language: selected });
        });

        socketRef.current?.on("sync_lang", ({ language, code }) => {
            setSelectedLanguage(language);
            onData(language, code);
        });

        return () => {
            socketRef.current?.off("change_lang");
            socketRef.current?.off("sync_lang");
        };
    }, [socketRef, onData]);

    
    useEffect(() => {
        const defaultValue = CODE_SNIPPETS["javascript"]
        onData("javascript",defaultValue);
    },[])
    return (
        <select
            className="h-fit p-3 z-10 w-36 rounded-xl top-[4rem] left-0 flex flex-col bg-slate-950 text-slate-50 text-xl text-center md:mx-8 my-2 cursor-pointer"
            value={selectedLanguage}
            onChange={handleLanguageChange}
        >
            {Object.keys(LANGUAGE_VERSIONS).map((language, key) => (
                <option
                    key={key}
                    value={language}
                    className="text-left cursor-pointer hover:bg-slate-900 py-4 px-5 rounded-xl"
                >
                    {language}
                </option>
            ))}
        </select>
    );
};

export default LanguagesSupp;