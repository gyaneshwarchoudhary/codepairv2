import React, { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUserName] = useState("");
  const [isServerHealthy, setIsServerHealthy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  console.log(process.env.REACT_APP_BACKEND_URL);
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/health`
        );
        console.log(process.env.REACT_APP_BACKEND_URL);
        if (response.status === 200) {
          setIsServerHealthy(true);
        } else {
          toast.error("Server is not responding properly");
        }
      } catch (error) {
        console.error("Health check failed:", error);
        toast.error("Cannot connect to server. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    checkServerHealth();
  }, []);

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

  // Show spinner while checking server health
  if (isLoading) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-12 text-center">
            <div
              className="spinner-border text-primary"
              role="status"
              style={{ width: "3rem", height: "3rem" }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-light">
              Server is hosted on Free-Tier it takes time to spin up{" "}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error message if server is not healthy
  if (!isServerHealthy) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-12 col-md-6 text-center">
            <div className="card shadow-sm p-4 bg-light">
              <div className="card-body">
                <h3 className="text-danger mb-3">Server Unavailable</h3>
                <p className="text-muted mb-4">
                  Unable to connect to the server. Please check your connection
                  and try again.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
