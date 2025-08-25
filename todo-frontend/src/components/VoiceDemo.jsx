import { useState } from 'react';

export default function VoiceDemo() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  useState(() => {
    setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  const startRecording = () => {
    if (!isSupported) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setTranscript('Listening...');
    };

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setTranscript(`Error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const demoCommands = [
    "Show pending todos",
    "Add todo: Buy groceries",
    "Mark buy groceries as done",
    "Show all todos",
    "What can you do?"
  ];

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ color: '#4f46e5', textAlign: 'center', marginBottom: '30px' }}>
        🎤 Voice Assistant Demo
      </h2>

      {!isSupported && (
        <div style={{ 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#dc2626'
        }}>
          ⚠️ Speech recognition is not supported in this browser. 
          Please use Chrome, Edge, or Safari for the full voice experience.
        </div>
      )}

      <div style={{ 
        background: '#f8fafc', 
        padding: '20px', 
        borderRadius: '12px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#374151', marginBottom: '15px' }}>🎯 Try These Voice Commands:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {demoCommands.map((command, index) => (
            <button
              key={index}
              onClick={() => speak(command)}
              style={{
                background: '#e0e7ff',
                color: '#3730a3',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#c7d2fe'}
              onMouseLeave={(e) => e.target.style.background = '#e0e7ff'}
            >
              {command}
            </button>
          ))}
        </div>
      </div>

      <div style={{ 
        background: '#ffffff', 
        padding: '20px', 
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#374151', marginBottom: '15px' }}>🎤 Voice Input Test:</h3>
        
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <button
            onClick={startRecording}
            disabled={!isSupported || isRecording}
            style={{
              background: isRecording ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              cursor: isRecording ? 'not-allowed' : 'pointer',
              fontSize: '20px',
              transition: 'all 0.3s',
              transform: isRecording ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>
          
          <div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>
              {isRecording ? 'Recording...' : 'Click to start recording'}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              {isSupported ? 'Supported' : 'Not supported'}
            </div>
          </div>
        </div>

        {transcript && (
          <div style={{ 
            background: '#f3f4f6', 
            padding: '15px', 
            borderRadius: '8px',
            border: '1px solid '#d1d5db'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>
              Transcript:
            </div>
            <div style={{ fontSize: '16px', color: '#111827' }}>
              "{transcript}"
            </div>
          </div>
        )}
      </div>

      <div style={{ 
        background: '#f0f9ff', 
        padding: '20px', 
        borderRadius: '12px',
        border: '1px solid '#bae6fd'
      }}>
        <h3 style={{ color: '#0369a1', marginBottom: '15px' }}>💡 How It Works:</h3>
        <ul style={{ 
          color: '#0c4a6e', 
          lineHeight: '1.6',
          paddingLeft: '20px'
        }}>
          <li><strong>Voice Recognition:</strong> Uses Web Speech API for real-time speech-to-text</li>
          <li><strong>NLP Processing:</strong> Analyzes your voice commands to understand intent</li>
          <li><strong>AI Integration:</strong> Powered by Hugging Face models for natural conversations</li>
          <li><strong>Voice Feedback:</strong> Speaks responses back to you using text-to-speech</li>
          <li><strong>Smart Actions:</strong> Automatically performs todo operations based on your voice commands</li>
        </ul>
      </div>

      <div style={{ 
        textAlign: 'center', 
        marginTop: '30px',
        padding: '20px',
        background: '#f9fafb',
        borderRadius: '12px'
      }}>
        <p style={{ color: '#6b7280', marginBottom: '10px' }}>
          🚀 This is just a demo! The full voice assistant is integrated into your main app.
        </p>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
          Look for the floating circular button in the bottom-right corner of your main app!
        </p>
      </div>
    </div>
  );
}
