import express from 'express';
const router = express.Router();

// Example user data (replace this with your actual user authentication logic)
router.get("/actual", (req, res) => {
    console.log("hii");
    res.send("Response from /actual route");
});


const users = [
  { username: 'admin', password: 'password' },
  { username: 'user', password: '123456' }
];

// POST request handler for the '/login' route
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Check if the user exists in the user data array
  const user = users.find((user) => user.username === username && user.password === password);

  if (user) {
    // Successful login
    return res.status(200).json({ message: 'Login successful', user });
  } else {
    // Invalid credentials
    return res.status(401).json({ error: 'Invalid username or password' });
  }
});


export default router;