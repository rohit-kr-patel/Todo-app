import { useState, useRef, useEffect } from "react";
import { apiPost } from "../api.js";
import { useUser } from "../contexts/UserContext.jsx";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { user } = useUser();
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if ("webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        addMessage("bot", "🎤 Listening... Speak now!");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        addMessage("user", transcript);
        processMessage(transcript);
      };

      recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
        addMessage("bot", "⚠️ Speech recognition error. Please try again.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    // Initialize speech synthesis
    if ("speechSynthesis" in window) {
      speechRef.current = window.speechSynthesis;
    }

    // Add welcome message
    addMessage("bot", "👋 Hi! I'm your Jarvis-like Todo Assistant. How can I help you today?");
  }, []);

  const speak = (text) => {
    if (!speechRef.current) return;
    
    // Stop any current speech
    speechRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechRef.current.speak(utterance);
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      addMessage("bot", "⚠️ Speech recognition not supported in this browser.");
      return;
    }
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
      addMessage("bot", "⚠️ Failed to start voice recognition.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const addMessage = (sender, text) => {
    setMessages((prev) => [...prev, { sender, text, timestamp: new Date() }]);
    setTimeout(scrollToBottom, 100);
  };

  const scrollToBottom = () => {
    scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight);
  };

  // Enhanced message processing with better NLP
  const processMessage = async (msgText) => {
    if (!msgText?.trim()) return;

    try {
      // Show typing indicator
      addMessage("bot", "🤔 Processing...");
      
      // Call NLP endpoint for intent recognition
      const nlpRes = await apiPost("/api/nlp", { message: msgText });
      const { intent, params } = nlpRes;

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.text !== "🤔 Processing..."));

      let reply = "";
      let actionTaken = false;

      // Handle different intents
      switch (intent) {
        case "list_pending":
          const pendingRes = await apiPost("/api/chat", { message: "pending todo" });
          reply = pendingRes.reply;
          actionTaken = true;
          break;

        case "add_todo":
          if (params.task) {
            await apiPost("/items", { task: params.task });
            reply = `✅ Added new todo: "${params.task}"`;
            actionTaken = true;
          } else {
            reply = "Please specify what task you'd like me to add.";
          }
          break;

        case "complete_todo":
          if (params.taskTitle) {
            const res = await apiPost("/api/chat", { message: `complete ${params.taskTitle}` });
            reply = res.reply;
            actionTaken = true;
          } else {
            reply = "Please specify which todo you'd like me to mark as complete.";
          }
          break;

        case "delete_todo":
          if (params.taskTitle) {
            reply = "I can help you delete todos. Please use the delete button in the main interface for safety.";
          } else {
            reply = "Please specify which todo you'd like me to delete.";
          }
          break;

        case "list_all":
          const allRes = await apiPost("/api/chat", { message: "all todos" });
          reply = allRes.reply;
          actionTaken = true;
          break;

        default:
          // Fallback to general chat
          const chatRes = await apiPost("/api/chat", { message: msgText });
          reply = chatRes.reply;
          break;
      }

      addMessage("bot", reply);
      
      // Speak the response if it's an action or important message
      if (actionTaken || reply.includes("✅") || reply.includes("⚠️")) {
        speak(reply);
      }

    } catch (err) {
      console.error("Error processing message:", err);
      const errorMsg = "⚠️ Sorry, I encountered an error. Please try again.";
      addMessage("bot", errorMsg);
      speak(errorMsg);
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      processMessage(input.trim());
      setInput("");
    }
  };

  const handleQuick = (command) => {
    processMessage(command);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      {/* Floating circular launcher */}
      <button
        aria-label="Open voice assistant"
        onClick={() => setOpen((s) => !s)}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: isListening 
            ? "linear-gradient(135deg, #ef4444, #dc2626)" 
            : "linear-gradient(135deg, #4f46e5, #06b6d4)",
          color: "white",
          border: "none",
          boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
          cursor: "pointer",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
          transform: isListening ? "scale(1.1)" : "scale(1)",
        }}
        title={isListening ? "Listening..." : "Open Voice Assistant"}
      >
        {isListening ? (
          <div className="pulse-animation">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" fill="white"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" fill="white"/>
            </svg>
          </div>
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="white" />
            <path d="M2 21c0-3.866 3.582-7 8-7h4c4.418 0 8 3.134 8 7v1H2v-1z" fill="rgba(255,255,255,0.85)" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Voice Assistant"
          style={{
            position: "fixed",
            right: 100,
            bottom: 20,
            width: 380,
            maxWidth: "calc(100vw - 140px)",
            height: 500,
            borderRadius: 16,
            backgroundColor: "#fff",
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Header */}
          <div style={{ 
            background: "linear-gradient(135deg, #4f46e5, #06b6d4)", 
            color: "white", 
            padding: "16px 20px", 
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ 
                width: 8, 
                height: 8, 
                borderRadius: "50%", 
                background: isListening ? "#ef4444" : "#10b981",
                animation: isListening ? "pulse 1.5s infinite" : "none"
              }}></div>
              Jarvis Assistant
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ 
                background: "transparent", 
                border: "none", 
                color: "white", 
                cursor: "pointer",
                fontSize: "18px",
                padding: "4px",
                borderRadius: "4px",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.target.style.background = "transparent"}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ 
            padding: "16px 20px", 
            flex: 1, 
            overflowY: "auto",
            background: "#fafafa"
          }}>
            {messages.length === 0 && (
              <div style={{ 
                color: "#6b7280", 
                fontSize: 14, 
                textAlign: "center",
                marginTop: "20px"
              }}>
                Start a conversation or use voice commands!
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ 
                marginBottom: 12, 
                display: "flex", 
                flexDirection: "column", 
                alignItems: msg.sender === "user" ? "flex-end" : "flex-start" 
              }}>
                <div style={{
                  background: msg.sender === "user" ? "#eef2ff" : "#ffffff",
                  padding: "12px 16px",
                  borderRadius: 18,
                  maxWidth: "85%",
                  textAlign: "left",
                  border: msg.sender === "user" ? "1px solid #c7d2fe" : "1px solid #e5e7eb",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
                  <div style={{ 
                    fontSize: 12, 
                    color: "#374151", 
                    marginBottom: 4, 
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {msg.sender === "user" ? "You" : "Jarvis"}
                  </div>
                  <div style={{ 
                    fontSize: 14, 
                    color: "#111827",
                    lineHeight: "1.4"
                  }}>
                    {msg.text}
                  </div>
                  {msg.timestamp && (
                    <div style={{ 
                      fontSize: 10, 
                      color: "#9ca3af", 
                      marginTop: 4,
                      textAlign: "right"
                    }}>
                      {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Commands */}
          <div style={{ 
            padding: "12px 20px", 
            borderTop: "1px solid #e5e7eb",
            background: "#f9fafb"
          }}>
            <div style={{ 
              marginBottom: 12, 
              display: "flex", 
              gap: 8, 
              flexWrap: "wrap" 
            }}>
              <button 
                onClick={() => handleQuick("Show pending todos")} 
                style={{ 
                  fontSize: 12, 
                  padding: "8px 12px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              >
                📋 Pending
              </button>
              <button 
                onClick={() => handleQuick("Show all todos")} 
                style={{ 
                  fontSize: 12, 
                  padding: "8px 12px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              >
                📝 All
              </button>
              <button 
                onClick={() => handleQuick("Add a new todo")} 
                style={{ 
                  fontSize: 12, 
                  padding: "8px 12px",
                  background: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              >
                ➕ Add
              </button>
            </div>

            {/* Input and Voice Controls */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message or use voice..."
                style={{ 
                  flex: 1, 
                  padding: "12px 16px", 
                  borderRadius: "25px", 
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#4f46e5"}
                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
              />
              <button 
                onClick={handleSend} 
                style={{ 
                  padding: "12px 16px", 
                  borderRadius: "25px", 
                  background: "#4f46e5", 
                  color: "white", 
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.background = "#4338ca"}
                onMouseLeave={(e) => e.target.style.background = "#4f46e5"}
              >
                Send
              </button>
              <button 
                onClick={isListening ? stopListening : startListening}
                style={{ 
                  padding: "12px", 
                  borderRadius: "50%", 
                  background: isListening ? "#ef4444" : "#10b981", 
                  color: "white", 
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  width: "48px",
                  height: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? "⏹️" : "🎤"}
              </button>
            </div>

            {/* Voice Status */}
            {(isListening || isSpeaking) && (
              <div style={{ 
                marginTop: 8, 
                textAlign: "center", 
                fontSize: 12, 
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}>
                {isListening && (
                  <>
                    <div style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: "50%", 
                      background: "#ef4444",
                      animation: "pulse 1.5s infinite"
                    }}></div>
                    Listening...
                  </>
                )}
                {isSpeaking && (
                  <>
                    <div style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: "50%", 
                      background: "#10b981",
                      animation: "pulse 1.5s infinite"
                    }}></div>
                    Speaking...
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .pulse-animation {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
