# 🚀 Quick Start - Test Your Voice Assistant

## ⚡ Get Running in 5 Minutes

### 1. Backend Setup
```bash
cd todo-backend

# Create .env file with your database and Hugging Face API key
# Copy the template from README.md

npm start
```

### 2. Frontend Setup
```bash
cd todo-frontend
npm run dev
```

### 3. Test Voice Assistant
1. Open your app in Chrome/Edge
2. Look for the **floating blue button** (bottom-right)
3. Click it to open the voice assistant
4. Click the **microphone button** 🎤
5. Say: **"Show pending todos"**

## 🎯 Test Commands

Try these voice commands:

- **"What can you do?"** - Get help
- **"Add todo: Test voice assistant"** - Create task
- **"Show all todos"** - List everything
- **"Mark test voice assistant as done"** - Complete task

## 🔧 If Something's Not Working

### Voice Recognition Issues
- Use **Chrome or Edge** browser
- Allow **microphone permissions**
- Check browser console for errors

### AI Not Responding
- Verify **HF_API_KEY** in .env file
- Check **internet connection**
- Look at backend console logs

### Database Issues
- Ensure **MySQL is running**
- Check **database credentials** in .env
- Verify **database exists**

## 📱 What You Should See

✅ **Floating blue button** in bottom-right corner
✅ **Voice assistant panel** opens when clicked
✅ **Microphone button** turns red when listening
✅ **AI responses** in chat interface
✅ **Voice feedback** speaks responses back

## 🎉 Success Indicators

- Backend shows: `🚀 Jarvis Todo API running on port 5000`
- Frontend shows: Voice assistant button is visible
- Voice commands work and get AI responses
- Todos are created/completed via voice

---

**Need help?** Check the full `SETUP_GUIDE.md` for detailed troubleshooting!
