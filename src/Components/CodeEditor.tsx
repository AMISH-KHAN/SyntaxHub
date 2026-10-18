import Editor from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
  removeAwarenessStates
} from 'y-protocols/awareness';
import RunCode from './RunCode';
import LanguagesSupp from './LanguagesSupp';
import Avatar from 'react-avatar';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import copy from 'copy-to-clipboard';
import toast, { Toaster } from 'react-hot-toast';
import { initSocket } from '../Sockets';
import { Socket } from 'socket.io-client';

const USER_COLORS = [
  '#f87171', // red
  '#fb923c', // orange
  '#fbbf24', // amber
  '#34d399', // emerald
  '#22d3ee', // cyan
  '#60a5fa', // blue
  '#818cf8', // indigo
  '#a78bfa', // purple
  '#f472b6', // pink
];

function getUserColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

interface userDataType {
  socketId: string;
  userName: string;
  clientId?: number;
}

const CodeEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [language, setLanguage] = useState<string>("javascript");
  const [show, setShow] = useState(false);
  const [users, setUsers] = useState<userDataType[]>([]);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const { roomId } = useParams<{ roomId: string }>();

  function updateCursorStyles(awareness: Awareness, localClientId: number) {
    let styles = '';
    awareness.getStates().forEach((state, clientID) => {
      if (clientID !== localClientId && state.user) {
        const color = state.user.color || '#3b82f6';
        const name = state.user.name || 'Anonymous';
        styles += `
          .yRemoteSelection-${clientID} {
            background-color: ${color}33 !important;
          }
          .yRemoteSelectionHead-${clientID} {
            position: absolute;
            border-left: 2px solid ${color} !important;
            border-top: 2px solid ${color} !important;
            border-bottom: 2px solid ${color} !important;
            height: 100%;
            box-sizing: border-box;
          }
          .yRemoteSelectionHead-${clientID}::after {
            position: absolute;
            content: ' ';
            border: 3px solid ${color} !important;
            border-radius: 4px;
            left: -4px;
            top: -5px;
          }
          .yRemoteSelectionHead-${clientID}::before {
            content: '${name.replace(/'/g, "\\'")}';
            position: absolute;
            top: -1.45em;
            left: -2px;
            font-size: 11px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-weight: 600;
            line-height: 1;
            background-color: ${color};
            color: #ffffff;
            padding: 2px 5px;
            border-radius: 3px;
            white-space: nowrap;
            pointer-events: none;
            z-index: 50;
            box-shadow: 0 1px 3px rgba(0,0,0,0.4);
          }
        `;
      }
    });

    let styleEl = document.getElementById('yjs-cursor-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'yjs-cursor-styles';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = styles;
  }

  function focusEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    editorRef.current = editor;
    editor.focus();

    if (ydocRef.current && awarenessRef.current) {
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
      const ytext = ydocRef.current.getText('monaco');
      const model = editor.getModel();
      if (model) {
        bindingRef.current = new MonacoBinding(
          ytext,
          model,
          new Set([editor]),
          awarenessRef.current
        );
      }
    }
  }

  function handleLang(lang: string, newSnippet?: string) {
    setLanguage(lang);
    if (newSnippet && ydocRef.current) {
      const ytext = ydocRef.current.getText('monaco');
      if (ytext.length === 0) {
        ydocRef.current.transact(() => {
          ytext.insert(0, newSnippet);
        });
      }
    }
  }

  function copyId() {
    if (roomId) {
      copy(roomId);
      toast.success("Room ID copied to clipboard");
    } else {
      toast.error('Room ID is undefined');
    }
  }

  useEffect(() => {
    if (!location.state?.userName) {
      navigate("/");
      return;
    }

    const userName = location.state.userName;
    const userColor = getUserColor(userName);

    // Initialize Yjs Document and Awareness
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const awareness = new Awareness(ydoc);
    awarenessRef.current = awareness;

    awareness.setLocalStateField('user', {
      name: userName,
      color: userColor,
    });

    const handleAwarenessChange = () => {
      updateCursorStyles(awareness, ydoc.clientID);
    };
    awareness.on('change', handleAwarenessChange);

    function handleErrors(e: Error) {
      console.log('Socket error:', e);
      toast.error('Socket connection failed, try again later.');
      navigate("/");
    }

    const init = async () => {
      const socket = await initSocket();
      socketRef.current = socket;

      socket.on('connect_error', (err) => handleErrors(err));
      socket.on('connect_failed', (err) => handleErrors(err));

      // Local document updates -> broadcast to peers via Socket.io
      ydoc.on('update', (update: Uint8Array, origin: any) => {
        if (origin !== 'server' && socketRef.current) {
          socketRef.current.emit("yjs_update", {
            roomId,
            update: Array.from(update),
          });
        }
      });

      // Local awareness / cursor changes -> broadcast to peers
      awareness.on('update', ({ added, updated, removed }: { added: number[], updated: number[], removed: number[] }, origin: any) => {
        if (origin !== 'remote' && socketRef.current) {
          const changed = added.concat(updated, removed);
          const update = encodeAwarenessUpdate(awareness, changed);
          socketRef.current.emit("yjs_awareness_update", {
            roomId,
            update: Array.from(update),
          });
        }
      });

      // Join room with username and Yjs clientID
      socket.emit("join", {
        roomId,
        userName,
        clientId: ydoc.clientID,
      });

      // Receive initial document state from server
      socket.on("yjs_init", ({ update, language: initLang }: { update: ArrayBuffer | number[], language?: string }) => {
        try {
          Y.applyUpdate(ydoc, new Uint8Array(update), 'server');
        } catch (err) {
          console.error("Failed to apply initial Yjs update:", err);
        }
        if (initLang) {
          setLanguage(initLang);
        }
      });

      // Receive incremental Yjs CRDT updates from peers
      socket.on("yjs_update", (update: ArrayBuffer | number[]) => {
        try {
          Y.applyUpdate(ydoc, new Uint8Array(update), 'server');
        } catch (err) {
          console.error("Failed to apply remote Yjs update:", err);
        }
      });

      // Receive awareness / remote cursor updates from peers
      socket.on("yjs_awareness_update", (update: ArrayBuffer | number[]) => {
        try {
          applyAwarenessUpdate(awareness, new Uint8Array(update), 'remote');
        } catch (err) {
          console.error("Failed to apply remote awareness update:", err);
        }
      });

      socket.on("joined", ({ clients, userName: joinedUser }) => {
        if (joinedUser !== userName) {
          toast.success(`${joinedUser} joined`);
        }
        setUsers(clients);

        // Share local awareness with the newly joined user
        const currentAwareness = encodeAwarenessUpdate(awareness, [ydoc.clientID]);
        socket.emit("yjs_awareness_update", {
          roomId,
          update: Array.from(currentAwareness),
        });
      });

      socket.on("disconnected", ({ socketId: leftSocketId, userName: leftUser, clientId }) => {
        toast.success(`${leftUser || 'A user'} left`);
        setUsers((prev) => prev.filter((user) => user.socketId !== leftSocketId));
        if (clientId) {
          removeAwarenessStates(awareness, [clientId], 'remote');
          updateCursorStyles(awareness, ydoc.clientID);
        }
      });

      socket.on("change_lang", ({ selected }: { selected: string }) => {
        setLanguage(selected);
      });
    };

    init();

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      awareness.off('change', handleAwarenessChange);
      awareness.destroy();
      ydoc.destroy();

      const styleEl = document.getElementById('yjs-cursor-styles');
      if (styleEl) {
        styleEl.remove();
      }

      if (socketRef.current) {
        socketRef.current.off('connect_error');
        socketRef.current.off('connect_failed');
        socketRef.current.off('yjs_init');
        socketRef.current.off('yjs_update');
        socketRef.current.off('yjs_awareness_update');
        socketRef.current.off('joined');
        socketRef.current.off('disconnected');
        socketRef.current.off('change_lang');
        socketRef.current.disconnect();
      }
    };
  }, [location.state, navigate, roomId]);

  function leave() {
    navigate("/");
  }

  return (
    <>
      <div className="flex md:flex-row flex-col bg-[#0b0e14]">
        <div><Toaster /></div>
        <div className="md:w-[16rem] md:h-screen bg-[#222222] flex md:flex-col item-center h-[4rem] justify-between">
          <div className="md:mt-[3rem]">
            <h1
              className="text-white text-lg cursor-pointer rounded p-2 bg-[#2c2c2c] m-2 flex items-center justify-between"
              onClick={() => setShow(prev => !prev)}
            >
              <span>Users ({users.length})</span>
              <span className="text-xs bg-emerald-600 px-2 py-0.5 rounded-full">Yjs Sync</span>
            </h1>
            <div className={`p-3 flex-col flex h-[20rem] z-10 w-[12rem] overflow-y-auto ml-2 md:static absolute md:bg-none bg-[#0b0e14] rounded ${!show ? "hidden" : ""}`}>
              {users.map((user, index) => {
                const isMe = user.userName === location.state?.userName;
                const userColor = getUserColor(user.userName);
                return (
                  <div
                    key={user.socketId || index}
                    className="hover:bg-[#2c2c2c] rounded p-3 mb-2 text-white flex items-center"
                  >
                    <Avatar
                      name={user.userName}
                      size="36"
                      round="10px"
                      color={userColor}
                    />
                    <div className="ml-2 flex flex-col overflow-hidden">
                      <span className="truncate text-sm font-medium">{user.userName}</span>
                      {isMe && <span className="text-[10px] text-emerald-400 font-semibold">(You)</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex md:flex-col justify-center md:w-full md:text-lg text-[11px] md:justify-between w-[14rem] items-center gap-3 p-2 text-white">
            <button className="bg-[#1eb51bdb] hover:bg-[#199d16] transition p-2 w-full rounded-md font-medium" onClick={copyId}>
              Copy Room ID
            </button>
            <button className="bg-[#ff4343db] hover:bg-[#e03838] transition p-2 w-full rounded-md font-medium" onClick={leave}>
              Leave
            </button>
          </div>
        </div>

        <div className="w-[95%] md:w-1/2 ml-2">
          <LanguagesSupp
            onData={handleLang}
            socketRef={socketRef}
            roomId={roomId}
            language={language}
          />
          <div className="flex">
            <Editor
              height=""
              theme="vs-dark"
              language={language}
              onMount={focusEditor}
              className="h-[20rem] md:h-[90dvh]"
              options={{
                automaticLayout: true,
                wordWrap: 'on',
                minimap: { enabled: true },
                fontSize: 14,
                smoothScrolling: true,
              }}
            />
          </div>
        </div>

        <div className="flex flex-col w-full md:w-1/2">
          <div className="w-full overflow-auto">
            <RunCode editorRef={editorRef} language={language} />
          </div>
        </div>
      </div>
    </>
  );
};

export default CodeEditor;
