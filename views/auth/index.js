import bcrypt from "bcryptjs";
import bodyParser from 'body-parser';
import flash from 'connect-flash';
import { config } from 'dotenv';
import express from 'express';
import session from "express-session";
import { createTransport } from 'nodemailer';
import signupRouter from "./Routes/signup.js";
import db from "./db.js";
import db2 from "./db2.js";

config();
const app = express();
const PORT = 8800
const transporter = createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASS
  }
});
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', './views');
// Set up session middleware
app.use(session({
  secret: 'PixelPioneers', // Change this to a secure secret
  resave: false,
  saveUninitialized: true
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.loggedIn = req.session.loggedIn;
  next();
});

app.get("/", (req, res) => {
  res.render("Home_main.ejs", )});


app.get("/about", (req, res) => {
 res.render("personal_info.ejs");
})

app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});


app.get("/signup", (req, res) => {
  res.render("signup.ejs",)});

app.get("/previous_ug", (req, res) => {
  res.render("previous_ug.ejs");
});
app.get("/previous_pg", async (req, res) => {
  try {
    const courseQuery = 'SELECT course_name FROM course_master WHERE course_name LIKE "B%"';
    const [courses] = await db2.query(courseQuery);

    if (courses.length === 0) {
      return res.status(404).json("No courses found starting with 'M'");
    }

    const courseNames = courses.map(course => course.course_name);

    res.render("previous_pg.ejs", { courses: courseNames });
  } catch (error) {
    console.error(error);
    res.status(500).json('Error fetching courses');
  }
});


  
app.use("/signup",signupRouter)


app.post('/login/auth', (req, res) => {
  const username=req.body.username;
  const password =req.body.password;
  console.log(username, password);
   req.session.email=username
 
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const q = "SELECT * FROM user_master WHERE email_id = ?";
  db.query(q, [username,password], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0) return res.status(404).json("User not found!");
    const isPasswordCorrect = bcrypt.compareSync(
      password,
      data[0].password)
    
      if (!isPasswordCorrect)
      {return res.status(400).json("Wrong username or password!");}
      else{
        console.log("Login successful")
        console.log(data[0].email_id)
        req.session.loggedIn = true;
        res.render("home.ejs", { loggedIn: req.session.loggedIn });

      }
    
  });
})


app.post('/previous_edu_pg', async (req, res) => {
  try {
    const { percentage, ug_percentage, university, course_name } = req.body;
    console.log(course_name)
    // Prepared statement to prevent SQL injection vulnerabilities
    const courseQuery = 
    "select course_name from course_master where course_id in (select eligibile_course_id from eligibility_master where eligibility_master.course_id=(select course_id from course_master where course_name=?))";

    const [courses] = await db2.query(courseQuery, [course_name]); // Use destructuring

    if (courses.length === 0) {
      return res.status(404).json("Course not found!");
    }
    if (courses.length === 0) {
      return res.status(404).json("Course not found!");
    }

    const selectedCourses = req.body.eligible_courses || []; // Handle empty selection gracefully

    const totalAmount = selectedCourses.length * 1000; // Calculate total based on number of checked boxes

    res.render("previous_edu_pg.ejs", { courses, totalAmount }); // Pass courses and totalAmount
  } catch (error) {
    console.error(error);
    res.status(500).json('Error fetching eligible courses');
  }
});


  app.post('/previous_edu_ug',async (req, res) => {
    try{
    const percentage=req.body.percentage;
    const catergory=req.body.category;
    const ug_percentage=req.body.percentage_ug;
    const university =req.body.University
    const course_name =req.body.stream;
    const  category  = req.body.category;
    
    console.log(course_name)
    const q = "select course_name from course_master where course_id in (select eligibile_course_id from eligibility_master where eligibility_master.course_id=(select course_id from course_master where course_name=?))";
    const courseQuery = 
    "select course_name from course_master where course_id in (select eligibile_course_id from eligibility_master where eligibility_master.course_id=(select course_id from course_master where course_name=?))";

    const [courses] = await db2.query(courseQuery, [course_name]); // Use destructuring

   
    if (courses.length === 0) {
      return res.status(404).json("Course not found!");
    }
    // Categorize courses into Art and Science
    const artCourses = courses.filter(course => course.course_name.startsWith("B.A."));
    const scienceCourses = courses.filter(course => course.course_name.startsWith("B.Sc."));

    const selectedCourses = req.body.eligible_courses || [];
    const totalAmount = selectedCourses.length * 1000;

    res.render("previous_edu_ug.ejs", { artCourses, scienceCourses, totalAmount,category });

   
  } catch (error) {
    console.error(error);
    res.status(500).json('Error fetching eligible courses');
  }
});



app.get("/login", (req, res) => {
  res.render("login.ejs", { title: "Login" });
})

app.get("/signup", (req, res) => {
  res, res.render("signup.ejs", { title: "Signup" });
})

  

app.post('/fees', (req, res) => {
  // Retrieve the total amount value from the form data
  const totalAmount = req.body.total_amount;

  // Process the total amount value as needed (e.g., store in a database, perform calculations, etc.)
  // For demonstration purposes, we'll simply send a response back with the total amount
  res.render("fees_pay.ejs");
});


app.post('/forget', (req, res) => {
  const { email } = req.body;
  req.session.email = email;
  const q = "SELECT * FROM user_master WHERE email_id = ?";
  db.query(q, email, (err, data) => {
    if (err) {
      req.flash('error', 'Internal server error. Please try again later.');
      return res.redirect('/forget');
    }
    if (data.length === 0) {
      req.flash('error', 'User not found. Please enter a valid email.');
      return res.redirect('/forget');
    }

    const otp = Math.floor(100000 + Math.random() * 900000); 
    
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'OTP for Password Reset',
      text: `Your OTP for password reset is ${otp}. The OTP is valid for 5 minutes. If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    transporter.sendMail(mailOptions, (err, response) => {
      if (err) {
        req.flash('error', 'Error sending OTP email. Please try again.');
        return res.redirect('/forget');
      }
      res.render('./auth/resetpass');
      console.log('OTP email sent successfully');
      const q2 = "insert into otp_master (email_id,otp) values (?, ?)"
      db.query(q2,[ email, otp], (err, data) => {
        if (err) {
          console.log('error', 'Error sending OTP email. Please try again.');
          
      }})
      req.flash('success', 'OTP sent to your email. Please check your inbox.');
       // Redirect to the reset password page
    });
  });
});
app.post('/reset-password', (req, res) => {
  const { otp, newPassword, confirmPassword } = req.body;
  const email = req.session.email;

  // Query to retrieve the most recent OTP for the given email
  const q = "SELECT otp FROM otp_master WHERE email_id = ? AND status = 'active' ORDER BY timestamp DESC LIMIT 1;";
  
  db.query(q, email, (err, data) => {
    if (err) {
      console.error('Error retrieving OTP:', err);
      req.flash('error', 'Error retrieving OTP. Please try again.');
      return res.redirect('/resetpassword');
    }

    if (data.length === 0) {
      req.flash('error', 'No active OTP found. Please request a new OTP.');
      return res.redirect('/forget');
    }

    const oldOTP = data[0].otp;
    if (oldOTP !== otp) {
      req.flash('error', 'Invalid OTP. Please enter the correct OTP.');
      return res.redirect('/resetpassword');
    }

    if (newPassword !== confirmPassword) {
      req.flash('error', 'New password and confirm password do not match.');
      return res.redirect('/resetpassword');
    }

    const salt = bcrypt.genSaltSync(10);
    const password = bcrypt.hashSync(newPassword, salt);
    // TODO: Update the user's password in your database here
    // Example code:
    db.query("UPDATE user_master SET password = ? WHERE email_id = ?", [password, email], (updateErr, updateRes) => {});

    req.flash('success', 'Password has been updated successfully.');
    return res.redirect('/login'); // Redirect to login page after successful password reset
  });
});


app.get("/forget", (req, res) => {
  
  res.render("./auth/forgetpass.ejs");
})
app.post("/forget", (req, res) => {
    const email=req.body.email;
    console.log(email);
})






app.get('/logout', (req, res) => {
  req.session.loggedIn = false;
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/home');
    }
    res.clearCookie('sid');
    res.redirect('/');
  });
});
  


app.post('/payment', (req, res) => {
  // Access form data from req.body
  const fullName = req.body.firstname + " " + req.body.middlename + " " + req.body.lastname;
  const aadhar = req.body.aadhar;
  const phone = req.body.phone;
  const fatherName = req.body.fathername;
  const motherName = req.body.mothername;
  const dob = req.body.dob;
  const city = req.body.city;
  const state = req.body.state;
  const address = req.body.address1 + ", " + req.body.address2;
   const email=req.session.email;
   console.log(email);
     // Log the form data
  console.log('Form Data:', req.body)
  res.send('Form submitted successfully!');
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});


