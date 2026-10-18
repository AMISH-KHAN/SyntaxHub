import { LANGUAGE_VERSIONS } from '../Constant';
import { useEffect, useState } from "react";
import { CODE_SNIPPETS } from "../Constant";
import { Socket } from 'socket.io-client';

interface ChildProp {
    onData: (data: string, value?: string) => void;
    socket: Socket | null;
    roomId: string | undefined;
    language?: string;
}

const LanguagesSupp: React.FC<ChildProp> = ({ onData, socket, roomId, language = 'javascript' }) => {
    const [selectedLanguage, setSelectedLanguage] = useState(language);

    useEffect(() => {
        setSelectedLanguage(language);
    }, [language]);

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = e.target.value;
        const defaultValue = CODE_SNIPPETS[selected as keyof typeof CODE_SNIPPETS];
        setSelectedLanguage(selected);
        onData(selected, defaultValue);
        socket?.emit("change_lang", { selected, defaultValue, roomId });
    };

    useEffect(() => {
        if (!socket) return;

        const handleLangChange = ({ selected }: { selected: string }) => {
            setSelectedLanguage(selected);
            onData(selected);
        };

        socket.on("change_lang", handleLangChange);

        return () => {
            socket.off("change_lang", handleLangChange);
        };
    }, [socket, onData]);

    return (
        <select
            className="h-fit p-3 z-10 w-36 rounded-xl top-[4rem] left-0 flex flex-col bg-slate-950 text-slate-50 text-xl text-center md:mx-8 my-2 cursor-pointer"
            value={selectedLanguage}
            onChange={handleLanguageChange}
        >
            {Object.keys(LANGUAGE_VERSIONS).map((lang, key) => (
                <option
                    key={key}
                    value={lang}
                    className="text-left cursor-pointer hover:bg-slate-900 py-4 px-5 rounded-xl"
                >
                    {lang}
                </option>
            ))}
        </select>
    );
};

export default LanguagesSupp;