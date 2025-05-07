import React, { useState } from "react";
import { v4 as uuid } from "uuid";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUserName] = useState("");
  const navigate = useNavigate();

  const generateRoomid = (e) => {
    e.preventDefault();
    const id = uuid();
    setRoomId(id);
    toast.success("Room ID is generated");
  };
  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("Both fields are required");
      return;
    }
    navigate(`/editor/${roomId}`, {
      state: { username },
    });
    toast.success("Room is created");
  };

  return (
    <div className="container-fluid">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm p-2 mb-5 bg-secondary rounded">
            <div className="card-body text-center bg-dark p-4">
              <h2 className="text-white mb-3">Welcome to CodePair</h2>
              <p className="text-light">
                A Platform for Pair Programmers, collaborate in real time, leave
                inline comments
              </p>
              <h5 className="text-light mb-4">Enter the Room ID</h5>

              <div className="form-group">
                <input
                  value={username}
                  onChange={(e) => setUserName(e.target.value)}
                  type="text"
                  placeholder="Username"
                  className="mb-2 form-control"
                ></input>
              </div>
              <div className="form-group">
                <input
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  type="text"
                  placeholder="Room ID"
                  className="mb-4 form-control"
                ></input>
              </div>
              <button
                onClick={joinRoom}
                style={{ backgroundColor: "#1E90FF", color: "white" }}
                className="btn btn-md mb-3 btn-block"
              >
                JOIN
              </button>
              <p className="mt-3 text-light">
                {" "}
                Don't have a room Id?
                <span
                  style={{ color: "#1E90FF", cursor: "pointer" }}
                  onClick={generateRoomid}
                >
                  New Room
                </span>
              </p>
              <p className="mt-2 text-light">
                <a
                  href="https://github.com/gyaneshwarchoudhary/codepairv2"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#1E90FF",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Visit GitHub Repository
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
