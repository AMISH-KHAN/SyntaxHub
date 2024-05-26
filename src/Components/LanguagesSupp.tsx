import { LANGUAGE_VERSIONS } from '../Constant';
import { useEffect, useState } from "react";
import { CODE_SNIPPETS } from "../Constant"

interface ChildProp{
    onData: (data: string,value:string) => void,
    
}

const LanguagesSupp: React.FC<ChildProp> = ({ onData }) => {
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    
    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = e.target.value;
        const defaultValue = CODE_SNIPPETS[selected as keyof typeof CODE_SNIPPETS]
        // console.log(selectedLanguage)
        setSelectedLanguage(selected);
        onData(selected,defaultValue);
        
    };
    
    useEffect(() => {
        const defaultValue = CODE_SNIPPETS["javascript"]
        onData("javascript",defaultValue);
    },[])
    return (
        <select
            className="h-fit p-3 z-10 w-36 rounded-xl top-[4rem] left-0 flex flex-col bg-slate-950 text-slate-50 text-xl text-center mx-8 my-2 cursor-pointer"
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