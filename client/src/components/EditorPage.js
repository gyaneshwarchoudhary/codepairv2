import React, { useEffect, useState, useRef } from "react";
import Client from "./Client.js";
import Editor from "./Editor.js";
import { initSocket } from "../socket.js";
import {
  useNavigate,
  useLocation,
  useParams,
  Navigate,
} from "react-router-dom";
import toast from "react-hot-toast";

function EditorPage() {
  const [clients, setClients] = useState([]);
  const [comments, setComments] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const editorRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const navigate = useNavigate();

  const languages = [
    { id: "javascript", name: "JavaScript" },
    { id: "python", name: "Python" },
    { id: "java", name: "Java" },
    { id: "cpp", name: "C++" },
  ];

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleError(err));
      socketRef.current.on("connect_failed", (err) => handleError(err));

      const handleError = (e) => {
        console.log("socket error=>", e);
        toast.error("Socket connection failed");
        navigate("/");
      };

      socketRef.current.emit("join", {
        roomId,
        username: location.state?.username,
      });

      socketRef.current.on("joined", ({ clients, username, socketId }) => {
        if (username !== location.state?.username) {
          toast.success(`${username} joined`);
        }
        setClients(clients);
        socketRef.current.emit("sync-code", {
          code: codeRef.current,
          socketId,
        });
      });

      socketRef.current.on("disconnected", ({ socketId, username }) => {
        toast.success(`${username} left the room`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });

      socketRef.current.on("add-comment", ({ comment }) => {
        if (comment) {
          const { id, lineNumber, comment: text, user } = comment;
          addComment(text, lineNumber, user, id);
        }
      });

      socketRef.current.on("chat-message", ({ username, message }) => {
        setChatMessages((prev) => [...prev, { username, message }]);
      });

      // Listen for language changes from other users
      socketRef.current.on("language-change", ({ newLanguage }) => {
        setLanguage(newLanguage);
      });

      // Listen for code execution results
      socketRef.current.on("code-execution-result", ({ result }) => {
        setOutput(result);
        setIsRunning(false);
      });
    };

    init();

    return () => {
      socketRef.current.disconnect();
      socketRef.current.off("joined");
      socketRef.current.off("disconnected");
      socketRef.current.off("add-comment");
      socketRef.current.off("chat-message");
      socketRef.current.off("language-change");
      socketRef.current.off("code-execution-result");
    };
  }, []);

  if (!location.state) {
    return <Navigate to="/" />;
  }

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room Id copied");
    } catch (error) {
      toast.error("Unable to copy Room Id");
    }
  };

  const leaveRoom = async () => {
    navigate("/");
  };

  const addComment = (text, lineNumber, user, id) => {
    const exists = comments.some((comment) => comment.id === id);
    if (!exists) {
      const newComment = { id, lineNumber, comment: text, user };
      const updatedComments = [...comments, newComment];
      setComments(updatedComments);

      socketRef.current.emit("add-comment", {
        roomId,
        comment: newComment,
      });
    } else {
      toast.error("Duplicate comment detected, not added.");
    }
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    // Emit language change to other users
    socketRef.current.emit("language-change", {
      roomId,
      newLanguage,
    });
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput("Running...");
    // Emit code execution request
    socketRef.current.emit("execute-code", {
      roomId,
      code: codeRef.current,
      language,
    });
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const messageData = {
        username: location.state?.username,
        message: newMessage.trim(),
      };
      socketRef.current.emit("chat-message", messageData);
      setNewMessage("");
    }
  };

  return (
    <div className="container-fluid vh-100 bg-dark text-light">
      <div className="row h-100">
        <div
          className="col-md-2 bg-dark d-flex flex-column h-100"
          style={{ boxShadow: "2px 0px 4px rgba(0,0,0,0.1)" }}
        >
          <h3 className="mt-3 text-light">CodePair</h3>
          <hr />
          <h5 className="p-1 md-3">Members</h5>
          <div className="d-flex flex-column overflow-auto p-2">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
          <div className="mt-auto">
            <hr />
            <button className="btn btn-success mb-2" onClick={copyRoomId}>
              Copy Room Id
            </button>
            <button
              onClick={leaveRoom}
              className="btn btn-danger mb-2 btn-block"
            >
              Leave Room
            </button>
          </div>
        </div>

        <div className="col-md-7 d-flex flex-column h-100">
          <div className="d-flex justify-content-between align-items-center p-2">
            <select
              className="form-select w-25"
              value={language}
              onChange={handleLanguageChange}
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              onClick={handleRunCode}
              disabled={isRunning}
            >
              {isRunning ? "Running..." : "Run Code"}
            </button>
          </div>

          <Editor
            socketRef={socketRef}
            roomId={roomId}
            language={language}
            onCodeChange={(code) => (codeRef.current = code)}
            onCommentsChange={(updatedComments) => setComments(updatedComments)}
            ref={editorRef}
          />

          {/* Output Console */}
          <div
            className="bg-black text-light p-2 mt-2"
            style={{
              height: "150px",
              overflowY: "auto",
              fontFamily: "monospace",
            }}
          >
            <div className="d-flex justify-content-between mb-2">
              <span>Output:</span>
              <button
                className="btn btn-sm btn-outline-light"
                onClick={() => setOutput("")}
              >
                Clear
              </button>
            </div>
            <pre className="m-0">{output}</pre>
          </div>
        </div>

        <div
          className="col-md-3 p-2 bg-dark d-flex flex-column h-100"
          style={{ boxShadow: "-2px 0px 4px rgba(0,0,0,0.1)" }}
        >
          <h5 className="p-1">Comments</h5>
          <div
            className="comments-section overflow-auto"
            style={{ flex: 1, marginBottom: "10px" }}
          >
            <ul className="list-group">
              {comments.map((comment) => (
                <li
                  key={comment.id}
                  className="list-group-item bg-secondary text-light mb-2"
                >
                  <div>
                    <strong>User:</strong> {comment.user}
                  </div>
                  <div>
                    <strong>Comment:</strong> {comment.comment}
                  </div>
                  <button
                    className="btn btn-sm btn-primary mt-2"
                    onClick={() => {
                      editorRef.current.scrollToLine(comment.lineNumber);
                    }}
                  >
                    Line {comment.lineNumber + 1}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <hr />
          <h5 className="">Chat</h5>
          <div
            className="chat-box overflow-auto"
            style={{ flex: 1, marginBottom: "10px", padding: "10px" }}
          >
            <div className="d-flex flex-column">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`message-bubble p-2 mb-1 ${
                    msg.username === location.state?.username
                      ? "align-self-end bg-primary text-white"
                      : "align-self-start bg-secondary text-white"
                  }`}
                  style={{ borderRadius: "10px", maxWidth: "75%" }}
                >
                  <strong>{msg.username}: </strong> {msg.message}
                </div>
              ))}
            </div>
          </div>
          <div className="d-flex">
            <input
              type="text"
              className="form-control"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message"
            />
            <button
              className="btn btn-sm btn-primary"
              onClick={sendMessage}
              style={{ padding: "10px 20px" }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
