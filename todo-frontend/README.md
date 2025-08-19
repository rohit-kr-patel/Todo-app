## Todo Frontend

Quick start:

1. Set `VITE_API_URL` to your backend base URL (default `http://localhost:3000`). You can create a `.env` file:

```
VITE_API_URL=http://localhost:3000
```

2. Install and run:

```
npm install
npm run dev
```

Pages:
- `/` Login
- `/register` Create Account
- `/todos` Todo List (create, complete, delete)
- `/profile` Profile (local first/last name store)
- `/forgot` Forgot password placeholder

Expected backend endpoints:
- POST `/create` { fn, ln, email, password }
- POST `/login` { email, password } => { token }
- POST `/logout`
- GET `/items` (auth)
- POST `/items` (auth) { task }
- PUT `/items/:id/complete` (auth)
- DELETE `/items/:id` (auth)
