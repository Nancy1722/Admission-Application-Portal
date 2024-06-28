import bcrypt from "bcryptjs"; // For password hashing
import bodyParser from 'body-parser';
import flash from "connect-flash"; // For displaying flash messages
import { config } from 'dotenv';//environment variable
import ejs from 'ejs'; // Templating engine
import express from 'express'; // Web framework
import session from "express-session";
import { createTransport } from 'nodemailer'; // For sending emails
import puppeteer from 'puppeteer'; // For browser automation
import signupRouter from "./Routes/signup.js"; // Import signup routes
import db from "./db.js";
import db2 from "./db2.js";
import EJSTemplate from "./views/temp.js"; // EJS template
config();
const app = express();


// Define the port number
const PORT = 8800
const transporter = createTransport({
   // Use Gmail service for sending emails
  service: 'gmail',
  auth: {
    user: process.env.SMTP_MAIL, // SMTP email
    pass: process.env.SMTP_PASS  // SMTP password
  }
});
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
// Set the view engine to use EJS
app.set('view engine', 'ejs');
app.set('views', './views');
// Set up session middleware
app.use(session({
  secret: 'PixelPioneers',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 1 week in milliseconds
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.loggedIn = req.session.loggedIn;
  next();
});

// Check for existing session on server start
app.use((req, res, next) => {
  if (req.session && req.session.loggedIn) {
    res.locals.loggedIn = true; // Set loggedIn as true in locals
  }
  next();
});
//  function to handle setting the 'loggedIn' property in response locals
// it calls the 'next()' function to pass control to the next middleware function in the stack.
app.use((req, res, next) => {
  res.locals.loggedIn = req.session.loggedIn;
  next();
});

// this handler renders the login page specified by the view engine


// SUPER ADMIN LOGIN AND OTHER 

app.get("/SuperAdmin/login", (req, res) => {
  res.render("./SuperAdmin/login",)
})

app.post('/SuperAdmin/login', (req, res) => {
  const { username, password } = req.body;

  // Check if the username and password are 'ADMIN'
  if (username !== 'ADMIN' || password !== 'ADMIN') {
    req.flash('error', 'Invalid username or password');
    return res.status(401).render('./SuperAdmin/login.ejs', { error: 'Invalid username or password' });
  }

  // If the username and password are correct, set the loggedIn session variable to true
  req.session.loggedIn = true;
  req.flash('success', 'Login successful');
  return res.redirect("/SuperAdmin/"); // Redirect to the home page
});



// Assuming you have already initialized Express and have your app set up
app.get('/SuperAdmin/course', async (req, res) => {
  try {
    const sql = `
      SELECT course_name 
      FROM course_master 
      LEFT JOIN application_master ON course_master.course_id = application_master.course_id
      WHERE application_master.course_id IS NULL;
    `;
  
    const [courses] = await db2.query(sql);
  
    if (courses.length === 0) {
      return res.status(404).json("No courses found");
    }
  
    const courseNames = courses.map(course => course.course_name);
  
    // Render the 'show_courses' template and pass the 'courses' variable to it
    res.render("./superAdmin/show_courses", { courses: courseNames });
  } catch (error) {
    console.error(error);
    res.status(500).json('Error fetching courses');
  }
});


app.post('/SuperAdmin/course',async (req, res) => {
  // Retrieve form data from the request body
  const { academicYear, courseName, startDate, endDate } = req.body;
  console.log(courseName)

  try {
    const q = "SELECT course_id FROM course_master WHERE course_name=? ";

    const [data] = await db2.query(q, [courseName]); // Use destructuring
    
    if (data.length === 0) {
      return res.status(404).json("Course not found!");
    }
    const course_id = data[0].course_id;
    console.log(course_id)
    const q3='INSERT INTO application_master (academic_year, course_id, start_form_date, end_form_date) VALUES (?, ?, ?, ?)';
    await db2.query(q3,  [academicYear, course_id, startDate, endDate]);
    
    res.status(200).json({ success: true, message: 'Course added successfully.' });
  } catch (error) {
    console.error('Error adding course:', error); // Log error if there's an exception during course addition

    // Send an error response
    res.status(500).json({ success: false, error: 'Failed to add course.' });
  }
});


// This handler executes a SQL query to retrieve applicant information from multiple database tables.
// It selects various fields such as user ID, email, application ID, full name, course applied, course fee,
// payment status, and payment gateway.
// The fetched data is processed and sent as a response.
app.get("/superAdmin/show_applicants", async (req, res) => {
  db.query(`SELECT  
  u.user_id,  
  um.email_id AS email,
  a.user_application_id AS application_id, 
  GROUP_CONCAT(DISTINCT CONCAT(u.first_name, " ", u.last_name)) AS full_name, 
  GROUP_CONCAT(DISTINCT c.course_name) AS course_applied,     
  SUM(a.course_fees) AS course_fee, 
  GROUP_CONCAT(DISTINCT om.payment_status) AS payment_status,
  GROUP_CONCAT(DISTINCT om.payment_gateway) AS payment_gateway
FROM 
  user_profile_master u 
JOIN 
  user_application_master a ON u.user_id = a.user_id 
JOIN 
  course_master c ON a.course_id = c.course_id
JOIN 
  user_master um ON u.user_id = um.user_id 
LEFT JOIN 
  order_master om ON a.order_id = om.order_id
GROUP BY 
  u.user_id,
  um.email_id,
  a.user_application_id`, (error, results, fields) => {
    if (error) {
      console.error('Error fetching data from MySQL:', error);
      return;
    }

    // Render the EJS template and pass the data
    res.render('./SuperAdmin/show_applicants.ejs', { applicants: results });
  });

})
 

app.get("/superadmin", (req, res) => {
  // Retrieve flash messages (if any)
  const successMessage = req.flash('success');
  const errorMessage = req.flash('error');
  // Pass flash messages to the EJS template
  res.render('./SuperAdmin/main.ejs', { successMessage, errorMessage });
});

// this handler renders the login page specified by the view engine.
app.get("/SuperAdmin1/login", (req, res, next) => {
  res.render("./SuperAdmin/login.ejs");
});

app.get("/SuperAdmin/addfaculty", (req, res, next) => {
  // Initialize or retrieve error and success messages from your backend logic
  const errorMessage = req.flash('error');
  const successMessage = req.flash('success');

  // Render the page and pass the messages to the template
  res.render("./SuperAdmin/add_faculty.ejs", { errorMessage: errorMessage, successMessage: successMessage });
});


// Route to handle faculty addition
app.post("/SuperAdmin/addfaculty", async (req, res) => {
  const email = req.body.email;
  const contactNo = req.body.contact_no;
  const password = req.body.password;
  const confirmPassword = req.body.cpassword;
  console.log(email, contactNo, password, confirmPassword)
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert faculty data into the database
    const SQL = "INSERT INTO user_master (password, email_id, contact_no, user_type) VALUES (?, ?, ?, ?)";
    const values = [hashedPassword, email, contactNo, 'admin'];

    db.query(SQL, values, (err, data) => {
      if (err) {
        console.error('Error:', err); // Log error if there's an issue with the database query
        req.flash('error', 'An error occurred while adding the faculty member');
        res.redirect('/SuperAdmin/addfaculty'); // Redirect to the add faculty page
        return;
      }})
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Login Credentials ',
        text: `Your  login credentials  for Fegusson College Admission portal is , email = "${email}" and password = "${password}" `
      };
    
      transporter.sendMail(mailOptions, (err, response) => {
        if (err) {
          req.flash('error', 'An error occurred while adding the faculty member');
          res.redirect('/SuperAdmin/addfaculty');
          
        }

      // Log a success message to the console indicating that a faculty member has been added successfully.
      // Flash a success message to inform the user about the successful addition of the faculty member.
      console.log('Faculty member added successfully');
      req.flash('success', 'Faculty member added successfully');
      res.redirect('/SuperAdmin/addfaculty');
})

    // Log the error to the console for debugging purposes.
// Flash an error message to inform the user about the failure to add a faculty member.
  } catch (error) {
    console.error('Error:', error);
    req.flash('error', 'An error occurred while adding the faculty member');
    res.redirect('/SuperAdmin/addfaculty');
  }
});

// Route handler for managing faculty members in the SuperAdmin panel
// This handler queries the database to fetch details of faculty members.
  app.get("/SuperAdmin/managefaculty", (req, res) => {
    db.query('SELECT user_id,email_id,contact_no FROM user_master where user_type ="admin" and status="active" ', (err, rows) => {
      if (err) {
          console.error('Error fetching faculty details:', err);
          res.status(500).send('Internal Server Error');
          return;
      }
      
      res.render('./SuperAdmin/manage_faculty', { faculty: rows });
  });})

  app.post('/deleteFaculty/:userId', (req, res) => {
    console.log(1)  // Log a message to indicate that the request has been received
    const userId = req.params.userId;  // Extract the userId from the request parameters
   
    // Execute a database query to update the status of the user to 'inactive' where the user_id matches the provided userId.
    db.query('UPDATE user_master SET status = ? WHERE user_id = ?', ['inactive', userId], (err, result) => {
        if (err) {
            console.error('Error deleting faculty :', err);  // Log error if there's an issue deleting faculty
            res.status(500).send('Internal Server Error');
        } else {
            res.sendStatus(200); 
        }
    });
});

// Route handler for managing departments in the SuperAdmin panel
// This handler queries the database to fetch details of departments.
app.get("/SuperAdmin/manage_department", (req, res) => {
  db.query('SELECT d.dept_id, d.department_name, i.institution_name FROM department_master d JOIN institution_master i ON d.institution_id = i.institution_id WHERE d.status = "active"', (err, rows) => {
      if (err) {
          console.error('Error fetching department details:', err);
          res.status(500).send('Internal Server Error');
          return;
      }

      // Render the 'manage_department' view template with the fetched department details
      res.render('./SuperAdmin/manage_department', { departments: rows });
  });
});





// Route handler for deleting a department
app.post('/deleteDepartment/:dept_id', (req, res) => {
  console.log(1)
  const dept_id = req.params.dept_id;   // Extract the dept_id from the request parameters
 // Execute a database query to update the status of the department
  db.query('UPDATE department_master SET status = ? WHERE dept_id = ?', ['inactive', dept_id], (err, result) => {
      if (err) {
          console.error('Error updating department status:', err);
          res.status(500).send('Internal Server Error');
      } else {
          res.sendStatus(200); 
      }
  });
});

// Route handler for rendering the page to display applicant details in the SuperAdmin panel
app.get("/SuperAdmin/show_applicants", (req, res, next) => {

  res.render("./SuperAdmin/show_applicants")
})




/*Route for adding institute */
app.get("/Superadmin/addinstitute", (req, res, next) => {
  res.render("./SuperAdmin/add_institute")
})

// Route handler for adding a new institute by SuperAdmin
app.post("/Superadmin/addinstitute", (req, res) => {
  const  name = req.body.instituteName;
  const address = req.body.address;
  const location = req.body.location;
  console.log(name, address, location)
  const SQL = "insert into  institution_master (institution_name, address,location) values (?, ?,?)"
  db.query(SQL,[ name,address,location], (err, data) => {
    if (err) {
      console.log('error', err);
      
  }})
   res.redirect('/superadmin'); // Redirect to the reset password page
});



// Route handler for displaying fee payment page
app.get("/fee", (req, res) => {

  const total=req.session.total_amount // Retrieve total amount from session
  res.render("pay.ejs",{total_amount:total});
})

// Route handler for processing fee payment
// This handler listens for POST requests sent to "/fee" route.



app.get("/SuperAdmin/view_courses", (req, res) => {
  db.query(`SELECT course_id,course_name,department_name
  FROM course_master,department_master
  where department_master.dept_id=course_master.dept_id and
   course_name NOT IN ('Arts', 'Commers', 'Science','12th science with maths')`, (err, rows) => {
      if (err) {
          console.error('Error fetching department details:', err);
          res.status(500).send('Internal Server Error');
          return;
      }

      // Render the 'manage_department' view template with the fetched department details
      res.render('./SuperAdmin/view_courses', { departments: rows });
  });
});

app.get("/superAdmin/eligible_courses", (req, res) => {
  db.query(`
  SELECT cm.course_name AS course_name, emc.course_name AS eligible_course_name
 FROM eligibility_master em
 JOIN course_master cm ON cm.course_id = em.course_id
 JOIN course_master emc ON emc.course_id = em.eligibile_course_id`, (err, rows) => {
      if (err) {
          console.error('Error fetching department details:', err);
          res.status(500).send('Internal Server Error');
          return;
      }

      // Render the 'manage_department' view template with the fetched department details
      res.render('./SuperAdmin/eligible_course', { departments: rows });
  });
});


app.get("/superAdmin/add_course", (req,res)=>{
  res.render("./superadmin/add_courses")
})
app.get("/superAdmin/manage_institute", (req, res) => {
  db.query(`
  SELECT institution_id as inst_id , institution_name as inst_name , address as inst_address from institution_master;`, (err, rows) => {
      if (err) {
          console.error('Error fetching department details:', err);
          res.status(500).send('Internal Server Error');
          return;
      }

      // Render the 'manage_department' view template with the fetched department details
      res.render('./SuperAdmin/manage_institute', { departments: rows });
  });
});

app.get("/Superadmin/add_department", async (req, res) => {
  try {
   
    const instituteQuery = 'SELECT institution_name FROM institution_master';
    const [institutes] = await db2.query(instituteQuery);
    // If no institutes found, return 404 with appropriate message
    if (institutes.length === 0) {
      return res.status(404).json("No institutes found starting");
    }
    // Extract institute names from the fetched institutes
    const instituteNames = institutes.map(institute => institute.institution_name);

    res.render("./superadmin/add_department.ejs", { institutes: instituteNames, message:"" });
  } catch (error) {
    // Catch block for error handling
    console.error(error);
    res.status(500).json('Error fetching institutes');
  }
});
app.post("/SuperAdmin/add_department", async (req, res) => {
  const inst_name = req.body.institute_name;
  const dept_name = req.body.department_name;
  try {
      const sql = "SELECT institution_id FROM institution_master WHERE institution_name = ?";
      const [data] = await db2.query(sql, [inst_name]);
      
      if (data.length === 0) {
          return res.status(404).json("Institution not found!");
      }
      
      const ins_id = data[0].institution_id; // Fixed a typo here: institute_id should be institution_id
      
      const insert = "INSERT INTO department_master (institution_id, department_name) VALUES (?, ?)";
      await db2.query(insert, [ins_id, dept_name]);
      
      // Send the success message to the frontend
      res.redirect("/SuperAdmin/add_department?message=Department added successfully.");
    } catch (error) {
        console.error('Error adding department:', error);
        res.redirect("/SuperAdmin/add_department?message=Error adding department.");
    }
});




// APPLICANT 

app.get("/", (req, res) => {
  res.render("Home_main" )});


app.get("/personal_info", async (req, res) => {
  const totalAmount = req.query.total_amount;
  const selectedCoursesJson = req.query.selected_courses;
  const currentDate = new Date();
  console.log(selectedCoursesJson);
  // Parse the JSON string to get the array of selected courses
  const selectedCourses = JSON.parse(selectedCoursesJson);
  // Extract course names
const courseNames = selectedCourses.map(course => course.name);

// Store course names in session variable
req.session.courseNames = selectedCourses;
  
  req.session.total_amount = totalAmount;

  try {
      // Iterate over each selected course
      for (const course of selectedCourses) {
          // Retrieve course_id from course_master table
          const courseIdQuery = "SELECT course_id FROM course_master WHERE course_name = ?";
          const [courseIdData] = await db2.query(courseIdQuery, [course.name]);
          const courseId = courseIdData[0].course_id;
          console.log("Retrieved course_id:", courseId);

          // Retrieve form_id from application_master table
          const formIdQuery = "SELECT form_id FROM application_master WHERE course_id = ?";
          const [formIdData] = await db2.query(formIdQuery, [courseId]);
          const formId = formIdData[0].form_id;
          console.log("Retrieved form_id:", formId);

          // Generate a unique 4-character order ID for each course
          const orderID = generateOrderID();
          console.log("Generated order ID:", orderID);

          // Insert into user_application_master
          const insertQuery = `
              INSERT INTO 
              user_application_master (user_id, course_id, form_id, course_fees, order_id) 
              VALUES 
              (?, ?, ?, ?, ?)
          `;
          await db2.query(insertQuery, [req.session.user_id, courseId, formId, course.amount, orderID]);

          // Insert into order_master
          const insertOrderQuery = "INSERT INTO order_master (order_id) VALUES (?)";
          await db2.query(insertOrderQuery, [orderID]);

          console.log(`Successfully processed course with order ID: ${orderID}`);
      }

      console.log('Successfully processed all selected courses');

      // Proceed with further operations if needed

  } catch (error) {
      console.error('Error processing selected courses:', error);
      return res.status(500).json("Internal Server Error");
  }

  console.log('Total Amount:', totalAmount);
  console.log('Selected Courses:', selectedCourses);

  res.render("personal_info1.ejs");
});
app.post("/pay_course", async function (req, res) { 
  try {
      const total_amount = req.session.total_amount;
      const transactionId = generateTransactionId();
      const user_id = req.session.user_id;
      const selected_courses = req.session.courseNames;
      console.log(selected_courses);

      // Check if selected_courses is an array
      if (!Array.isArray(selected_courses)) {
          console.error('Error: selected_courses is not an array');
          return res.status(500).json({ error: "Internal Server Error" });
      }

      // Iterate over each selected course to process payment
      for (const course of selected_courses) {
          const course_name = course.name;
          const course_idsql = "SELECT course_id FROM course_master WHERE course_name=?";
          const [course_id] = await db2.query(course_idsql, [course_name]);
          const course_fees = course.amount;
          
          console.log(req.session.user_id, course_fees, course_id[0].course_id);

          // Retrieve order_id from user_application_master based on user_id, course_fees, and course_id
          const getOrderIDQuery = "SELECT order_id FROM user_application_master WHERE user_id=? AND course_fees=? AND course_id=?";
          const [orderIDData] = await db2.query(getOrderIDQuery, [req.session.user_id, course_fees, course_id[0].course_id]);
          console.log(orderIDData);
          const order_id = orderIDData[0].order_id;
          
          console.log(order_id);

          // Update transaction_id and payment_status to 'completed'
          const update_payment_status_query = "UPDATE order_master SET transaction_id=?, payment_status='completed' WHERE order_id=?";
          await db2.query(update_payment_status_query, [transactionId, order_id]);

          console.log(`Successfully processed payment for course with order ID: ${order_id}`);
      }

      // Respond with success message and redirect to "/home"                
      return res.render("home.ejs", { loggedIn: req.session.loggedIn, success: "We've received your application and payment. Our admissions team will review it, and you can expect a confirmation email within two to three business days." });

  } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post("/personal_info", (req, res) => {
 
  // Access form data
  const firstName =  req.body.firstname;
  const middleName =  req.body.middlename;
  const lastName =  req.body.lastname;
  const motherName =  req.body.mothername;
  const aadharNumber =  req.body.aadhar;
  const gender =  req.body.gender;
  const phoneNumber =  req.body.phone;
  const dob =  req.body.dob;
  const address1 =  req.body.address1;
  const address2 =  req.body.address2;
  const city =  req.body.city;
  const state =  req.body.state;
  const marks=req.session.marks;
  const caste=req.session.category;
  console.log(firstName,middleName,lastName,motherName,dob,aadharNumber,marks,caste)

  const address = address1 + ' ' + address2 + ' ' + city + ' ' + state 
// Construct SQL query for inserting personal information into user_profile_master table
  const SQL = "insert into  user_profile_master (user_id,first_name,middle_name,last_name,mothers_name,dob,addhar_no,HSC_marks,caste,address) values (?,?,?,?,?,?,?,?, ?,?)"
  db.query(SQL,[req.session.user_id,firstName,middleName,lastName,motherName,dob,aadharNumber,marks,caste,address], (err, data) => {
 
    if (err) {
      console.log('error', err);
      
  }})
  // Redirect the user to the '/fee' route after processing personal information
  res.redirect('/fee'); 
 })
 // Route handler for rendering the contact page
app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});

// Route handler for rendering the signup page
app.get("/signup", (req, res) => {
  res.render("signup.ejs",)});



  // Route handler for rendering the previous undergraduate page
app.get("/previous_ug", (req, res) => {
  res.render("previous_ug.ejs");
});



app.get("/previous_pg", async (req, res) => {
  try {
    // SQL query to select courses starting with letter 'B'
    const courseQuery = 'SELECT course_name FROM course_master WHERE course_name LIKE "B%"';
    const [courses] = await db2.query(courseQuery);
// If no courses found, return 404 with appropriate message
    if (courses.length === 0) {
      return res.status(404).json("No courses found starting with 'M'");
    }
  // Extract course names from the fetched courses
    const courseNames = courses.map(course => course.course_name);

    res.render("previous_pg.ejs", { courses: courseNames });
  } catch (error) {
    // Catch block for error handling
    console.error(error);
    res.status(500).json('Error fetching courses');
  }
});


  
app.use("/signup",signupRouter)

// Route for authenticating user login credentials
app.post('/login/auth', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    req.flash('error', 'Username and password are required');
    return res.status(400).json({ error: 'Username and password are required' });
  }
// Query to fetch user details based on email
  const q = "SELECT * FROM user_master WHERE email_id = ?";
  db.query(q, [username], (err, data) => {
    if (err) {
      // Error handling for database query failure
      req.flash('error', 'Error fetching user details');
      return res.status(500).json({ error: 'Error fetching user details' });
    }
    if (data.length === 0) {
      // If user not found, flash an error message and render the login page with the error message
      req.flash('error', 'User not found!');
      return res.render('login.ejs', { error: 'User not found!' });
    }

    const isPasswordCorrect = bcrypt.compareSync(password, data[0].password);
// Check if the password is incorrect
    if (!isPasswordCorrect) {
      req.flash('error', 'Wrong password!');
      return res.render('login.ejs', { error: 'Wrong username or password!' });
    } else {
      console.log("Login successful");
      console.log(data[0].email_id);
      req.session.loggedIn = true;
      req.flash('success', 'Login successful');
      // Render home.ejs with loggedIn and success variables
      const user_id=data[0].user_id
      req.session.user_id=user_id;
      return res.render("home.ejs", { loggedIn: req.session.loggedIn, success: 'Login successful' });
    }
   
  });
});



// Route to handle previous education details submission
app.post('/previous_edu_pg', async (req, res) => {
  try {
    const percentage = req.body.percentage;
    const category = req.body.category;
    const pg_percentage = req.body.percentage; // Assuming this is a separate percentage for PG
    const university = req.body.University;
    const course_name = req.body.course_name;
    console.log(course_name)

    // Fetch end date for all active courses from application_master table
    const endDateQuery = "SELECT Distinct course_master.course_name, DATE_FORMAT(application_master.end_form_date, '%Y-%m-%d') AS end_form_date FROM course_master INNER JOIN application_master ON course_master.course_id = application_master.course_id WHERE application_master.status = 'active'";
    const [endDateRows] = await db2.query(endDateQuery);
    console.log('endDateRows:', endDateRows);
  
    const endDatesMap = {};
    endDateRows.forEach(row => {
      endDatesMap[row.course_name] = row.end_form_date;
    });

    req.session.marks = pg_percentage; // Storing PG percentage in session
    req.session.category = category;

    const courseQuery =
      "SELECT course_name FROM course_master WHERE course_id IN (SELECT eligibile_course_id FROM eligibility_master WHERE eligibility_master.course_id=(SELECT course_id FROM course_master WHERE course_name=?))";

    const [courses] = await db2.query(courseQuery, [course_name]);
    console.log('endDateRows:', courses);
  
    if (courses.length === 0) {
      return res.status(404).json("Course not found!");
    }

   // Categorize courses into Art and Science
const artCourses = courses.filter(course => course.course_name.startsWith("M.A."));
const scienceCourses = courses.filter(course => course.course_name.startsWith("M.Sc."));

// Filter out only the active courses
const currentDate = new Date().toISOString().split('T')[0];
const activeArtCourses = artCourses.filter(course => endDatesMap[course.course_name] >= currentDate);
const activeScienceCourses = scienceCourses.filter(course => endDatesMap[course.course_name] >= currentDate);

// Check if both art and science courses are empty
if (activeArtCourses.length === 0 && activeScienceCourses.length === 0) {
 console.log("a") // Render a view indicating no courses are available
}

const selectedCourses = req.body.eligible_courses || [];
const totalAmount = selectedCourses.length * 1000; // Assuming a fixed amount for PG courses
 // Assuming a fixed amount for PG courses

    res.render("previous_edu_pg.ejs", { activeArtCourses, activeScienceCourses, totalAmount, category, endDatesMap, currentDate });
  } catch (error) {
    console.error(error);
    res.status(500).json('Error fetching eligible courses');
  }
});


function generateOrderID() {
  // Generate a random 4-digit integer
  const randomInt = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999

  // Concatenate with the prefix
  const orderID = "ORD" + randomInt;

  return orderID;
}


app.post('/previous_edu_ug', async (req, res) => {
  try {
    const percentage = req.body.percentage;
    const category = req.body.category;
    const ug_percentage = req.body.percentage;
    const university = req.body.University;
    const course_name = req.body.stream;

    // Fetch end date for all active courses from application_master table
    const endDateQuery = "SELECT course_master.course_name, DATE_FORMAT(application_master.end_form_date, '%Y-%m-%d') AS end_form_date FROM course_master INNER JOIN application_master ON course_master.course_id = application_master.course_id WHERE application_master.status = 'active'";
    const [endDateRows] = await db2.query(endDateQuery);

    const endDatesMap = {};
    endDateRows.forEach(row => {
      endDatesMap[row.course_name] = row.end_form_date;
    });

    req.session.marks = ug_percentage;
    req.session.category = category;

    const courseQuery =
      "SELECT course_name FROM course_master WHERE course_id IN (SELECT eligibile_course_id FROM eligibility_master WHERE eligibility_master.course_id=(SELECT course_id FROM course_master WHERE course_name=?))";

    const [courses] = await db2.query(courseQuery, [course_name]);

    if (courses.length === 0) {
      return res.status(404).json("Course not found!");
    }

    // Categorize courses into Art and Science
    const artCourses = courses.filter(course => course.course_name.startsWith("B.A."));
    const scienceCourses = courses.filter(course => course.course_name.startsWith("B.Sc."));

    // Filter out only the active courses
    const currentDate = new Date().toISOString().split('T')[0];
    const activeArtCourses = artCourses.filter(course => endDatesMap[course.course_name] >= currentDate);
    const activeScienceCourses = scienceCourses.filter(course => endDatesMap[course.course_name] >= currentDate);

    const selectedCourses = req.body.eligible_courses || [];
    const totalAmount = selectedCourses.length * 1000;

    res.render("previous_edu_ug.ejs", { activeArtCourses, activeScienceCourses, totalAmount, category ,endDatesMap,currentDate});
  } catch (error) {
    console.error(error);
    res.status(500).json('Error fetching eligible courses');
  }
});


// Route to render the login page
app.get("/login", (req, res) => {
  res.render("login.ejs", { title: "Login" });
})
// Route to render the signup page
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
// Route to handle forget password form submission
// Handle POST request for forget password

app.post('/forget', (req, res) => {
  const { email } = req.body;
  req.session.email = email;

  const q = "SELECT * FROM user_master WHERE email_id = ?";
db.query(q, email, (err, data) => {
  if (err) {
   
    return res.render('./auth/forgetpass', { error: 'Internal server error. Please try again later.' });
  }
  if (data.length === 0) {
    
    return res.render('./auth/forgetpass', { error: 'User not found. Please enter a valid email.' });
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
        res.render('./auth/forgetpassforget', { message: 'Error sending OTP. Please try again.' }); // Pass flash message to the rendered view
        return;
      }
      req.flash('success', 'OTP sent successfully. Check your email.');
      
      const q2 = "INSERT INTO otp_master (email_id, otp, timestamp) VALUES (?, ?, NOW())";
    db.query(q2, [email, otp], (err, data) => {
        if (err) {
          console.log('Error inserting OTP into database:', err);
          res.render('./auth/forgetpass', {message: 'Error inserting OTP into database. Please try again.' }); // Pass flash message to the rendered view
          return;
        }
        res.render('./auth/resetpass',{error:""}); // Render the reset password view
      });
    });
  });
});

// Handle POST request for reset password
app.post('/reset-password', (req, res) => {
  const { otp, newPassword, confirmPassword } = req.body;
  const email = req.session.email

  const q = "SELECT otp, timestamp FROM otp_master WHERE email_id = ? AND status = 'active' ORDER BY timestamp DESC LIMIT 1;";
  
  db.query(q, email, (err, data) => {
    if (err) {
      console.error('Error retrieving OTP:', err);
      res.render('./auth/resetpass', { error: 'Error retrieving OTP. Please try again.' }); // Pass flash message to the rendered view
      return;
    }

    if (data.length === 0) {
      res.redirect('/forget');
      return;
    }

    const { otp: oldOTP, timestamp } = data[0];
    const currentTime = new Date().getTime();

    if (currentTime - timestamp > 300000) {
      console.log('The OTP has expired. Please request a new OTP.')
      req.flash('error', 'The OTP has expired. Please request a new OTP.');
      res.render('./auth/resetpass',{error: 'The OTP has expired. Please request a new OTP.'});
      return;
    }

    if (oldOTP !== otp) {
      req.flash('error', 'Invalid OTP.');
      res.render('./auth/resetpass',{error: 'Invalid OTP.'})
      return;
    }

    if (newPassword !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      res.render('./auth/resetpass',{error: 'Passwords do not match.'})
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    db.query("UPDATE user_master SET password = ? WHERE email_id = ?", [hashedPassword, email], (updateErr, updateRes) => {
      if (updateErr) {
        console.error('Error updating password:', updateErr);
        res.render('./auth/resetpass', { error: 'Error updating password. Please try again.' }); // Pass flash message to the rendered view
        return;
      }
      db.query("UPDATE otp_master SET status = 'inactive' WHERE email_id = ?", [email], (otpErr, otpRes) => {
        if (otpErr) {
          console.error('Error invalidating OTP:', otpErr);
        }
        req.flash('success', 'Password reset successfully. You can now login with your new password.');
        res.render('login',{success:"Password reset successfully. You can now login with your new password"});
      });
    });
  });
});

// Handle GET request to resend OTP
app.get('/resend-otp', (req, res) => {
  const email = req.session.email;

  const otp = Math.floor(100000 + Math.random() * 900000);

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'OTP for Password Reset',
    text: `Your OTP for password reset is ${otp}. The OTP is valid for 5 minutes. If you did not request this, please ignore this email and your password will remain unchanged.\n`
  };

  transporter.sendMail(mailOptions, (err, response) => {
    if (err) {
      res.render('forget', { error: 'Error sending OTP. Please try again.' }); // Pass flash message to the rendered view
      return;
    }
    req.flash('success', 'New OTP sent successfully.');
    
    const q = "UPDATE otp_master SET otp = ?, timestamp = NOW() WHERE email_id = ?";
    db.query(q, [otp, email], (err, data) => {
      if (err) {
        console.log('Error updating OTP in database:', err);
        res.render('forget', { error: 'Error updating OTP in database. Please try again.' }); // Pass flash message to the rendered view
        return;
      }
      res.render('./auth/resetpass', {error: 'Email has been sent!'});
    });
  });
});


// Route to render the forget password page
app.get("/forget", (req, res) => {
  
  res.render("./auth/forgetpass.ejs",{error:""});
})
// Route to handle forget password form submission
app.post("/forget", (req, res) => {
    const email=req.body.email;
    console.log(email);
})





function generateTransactionId() {
  // Get current date and time
  const now = new Date();

  // Extract date components
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is zero-based
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // Generate random integer between 1000 and 9999
  const randomInt = Math.floor(Math.random() * 9000) + 1000;

  // Construct transaction ID using date and random integer
  const transactionId = `${year}${month}${day}${hours}${minutes}${seconds}${randomInt}`;

  return transactionId;
}



// Route to handle application submission
app.post('/application', async (req, res) => {
   // Extract user ID from request body
  const userId = req.body.application_id;
  console.log(userId)
  // SQL query to retrieve application details based on user ID
  const sql = `
    SELECT 
      um.email_id, 
      cm.course_name, 
      uam.course_fees, 
      uam.user_application_id, 
      upm.first_name, 
      upm.middle_name, 
      upm.last_name, 
      upm.mothers_name, 
      upm.dob, 
      upm.address, 
      upm.caste, 
      om.payment_gateway, 
      uam.order_id 
    FROM 
      user_master um
    INNER JOIN 
      user_profile_master upm ON um.user_id = upm.user_id
    INNER JOIN 
      user_application_master uam ON um.user_id = uam.user_id
    INNER JOIN 
      course_master cm ON uam.course_id = cm.course_id
    LEFT JOIN 
      order_master om ON uam.order_id = om.order_id
    WHERE 
    uam.user_application_id = ?`;

  try {
      // Execute the SQL query to retrieve application details based on user ID
    const [rows] = await db2.query(sql, userId);

    if (!rows || rows.length === 0) {
      console.error('No data found for user ID:', userId);
      return res.status(404).send('User data not found');
    }
// Extract payment gateway information from the retrieved data
    const paymentGateway = rows[0].payment_gateway;
    console.log(paymentGateway)
    console.log(typeof (paymentGateway))

    // Check if payment_gateway is already set to 'Confirm'
    if (paymentGateway === 'Confirm') {
      console.log('Payment already confirmed. No email sent.');
      return res.status(200).send('Payment already confirmed. No email sent.');
    }

    // Update payment_gateway status to 'Confirm' in the order_master table
    const updateSql = "UPDATE order_master SET payment_gateway = 'Confirm' WHERE order_id = ?";
    await db2.query(updateSql, rows[0].order_id);

    console.log('Payment gateway status updated successfully');

  // Call function to send email and render template
     await sendEmailAndRenderTemplate(rows, res);
  

  } catch (error) {
     // Handle errors and log them
    console.error('Error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

async function sendEmailAndRenderTemplate(result, res) {
  try {
    // Format the date of birth (DOB) to a user-friendly format
    const dob = new Date(result[0].dob);
    const formattedDOB = dob.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });

    // Update the result with the formatted DOB
    result[0].dob = formattedDOB;

    // Render the EJS template
    const html = ejs.render(EJSTemplate, { userData: result[0] });

    // Launch Puppeteer and generate the PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf();
    await browser.close();

    // Send email with attachment
    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: result[0].email_id,
      subject: 'Acknowledgment of Course Application from Fergusson College',
      text: 'Thank you for acknowledging your application for courses at Fergusson College. We appreciate your interest in our institution and look forward to reviewing your application.Please find attached your application details.',
      attachments: [{ filename: 'application_details.pdf', content: pdfBuffer }]
    };

    await transporter.sendMail(mailOptions);

    
    setTimeout(() => {
      // Render the EJS template with the updated data
      res.render('./SuperAdmin/show_applicants.ejs', { applicants: result, showAlert: true });
    }, 3000); 
    return true; // Indicate that email was sent successfully
  } catch (error) {
    console.error('Error sending email:', error);
    return false; // Indicate that email sending failed
  }
}




// Route to handle user logout
app.get('/logout', (req, res) => {
  // Set loggedIn status to false and destroy session
  req.session.loggedIn = false;
  req.session.destroy(err => {
    if (err) {
       // If error occurs during session destruction, redirect to home
      return res.redirect('/home');
    }
    res.clearCookie('sid');
    res.redirect('/login');
  });
});
 
// Route to handle SuperAdmin logout
app.get('/SuperAdmin/logout', (req, res) => {
  // Set loggedIn status to false and destroy session
  req.session.loggedIn = false;
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/home');
    }
    // Clear session cookie and redirect to SuperAdmin login page
    res.clearCookie('sid');
    res.redirect('/SuperAdmin/login');
  });
});
  


// Start the server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

app.get("/SuperAdmin/dashboard", (req, res) => {
  res.render("./SuperAdmin/dashboard")
})

app.get("/superAdmin/user_application_data", async (req, res) => {
  try {
    // Query your database to get the count of active user applications by course
    const userData = await db2.query(`
      SELECT course_name, COUNT(*) AS application_count 
      FROM user_application_master 
      JOIN course_master ON user_application_master.course_id = course_master.course_id 
      WHERE user_application_master.status="active" 
      GROUP BY course_name
    `);
console.log(userData)
    // Prepare data to send to the client
    // Access the first array in userData
const data = userData[0];

const labels = [];
const values = [];

data.forEach(row => {
  labels.push(row.course_name);
  values.push(row.application_count);
});

console.log(labels); // Should log the course names
console.log(labels)
    // Send the data as JSON response
    res.json({ labels, values });
  } catch (error) {
    console.error('Error fetching user application data:', error);
    res.status(500).send('Internal Server Error');
  }
});



// Update the route to fetch data for the modified dashboard
app.get("/superAdmin/dashboard_data", async (req, res) => {
  try {
    // Query to count active BA applications
    const baData = await db2.query(`
      SELECT COUNT(*) AS ba_count 
      FROM user_application_master 
      WHERE course_id IN (SELECT course_id FROM course_master WHERE course_name like 'B.A.%') 
      AND status = 'active'
    `);
    
    // Query to count active BSc applications
    const bscData = await db2.query(`
      SELECT COUNT(*) AS bsc_count 
      FROM user_application_master 
      WHERE course_id IN (SELECT course_id FROM course_master WHERE course_name like 'B.Sc%') 
      AND status = 'active'
    `);

    // Query to count active MA applications
    const maData = await db2.query(`
      SELECT COUNT(*) AS ma_count 
      FROM user_application_master 
      WHERE course_id IN (SELECT course_id FROM course_master WHERE course_name like 'M.A.%') 
      AND status = 'active'
    `);

    // Query to count active MSc applications
    const mscData = await db2.query(`
      SELECT COUNT(*) AS msc_count 
      FROM user_application_master 
      WHERE course_id IN (SELECT course_id FROM course_master WHERE course_name like 'M.Sc%') 
      AND status = 'active'
    `);

    // Query to count total active applications
    const totalActiveData = await db2.query(`
      SELECT COUNT(*) AS total_active_count
      FROM user_application_master 
      WHERE status = 'active'
    `);

    // Extract counts from query results
    const baCount = baData[0][0].ba_count;
    const bscCount = bscData[0][0].bsc_count;
    const maCount = maData[0][0].ma_count;
    const mscCount = mscData[0][0].msc_count;
    const totalActiveCount = totalActiveData[0][0].total_active_count;

    // Prepare data for the chart
    const labels = ['BA Applications', 'BSc Applications', 'MA Applications', 'MSc Applications'];
    const values = [baCount, bscCount, maCount, mscCount];

    res.json({ labels, values });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Route to fetch the count of active applications
app.get("/superAdmin/active_applications", async (req, res) => {
  try {
    const [activeApplicationsCount] = await db2.query("SELECT COUNT(*) AS count FROM user_application_master WHERE status = 'active'");
    console.log(activeApplicationsCount[0].count);
    res.json({ value: activeApplicationsCount[0].count });
  } catch (error) {
    console.error('Error fetching active applications:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to fetch the count of active forms (assuming order with payment_status='paid' represents a form)
app.get("/superAdmin/active_forms", async (req, res) => {
  try {
    const [activeFormsCount] = await db2.query("SELECT COUNT(*) AS count FROM application_master WHERE status = 'active'");
    console.log(activeFormsCount[0].count);
    res.json({ value: activeFormsCount[0].count });
  } catch (error) {
    console.error('Error fetching active forms:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to fetch the total revenue generated (assuming it's the sum of course fees where payment_status='paid')
app.get("/superAdmin/total_revenue", async (req, res) => {
  try {
    const [totalRevenueResult] = await db2.query("SELECT SUM(user_application_master.course_fees) AS total FROM user_application_master JOIN order_master ON user_application_master.order_id = order_master.order_id WHERE order_master.payment_status = 'completed'");
    const totalRevenue = totalRevenueResult[0].total || 0;
    console.log(totalRevenue)
    res.json({ value: totalRevenue });
  } catch (error) {
    console.error('Error fetching total revenue:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/admin",async (req, res) => {
  res.render("./admin/home_main")
})

app.get("/Admin/show_department", (req, res) => {
  db.query('SELECT d.dept_id, d.department_name, i.institution_name FROM department_master d JOIN institution_master i ON d.institution_id = i.institution_id WHERE d.status = "active"', (err, rows) => {
      if (err) {
          console.error('Error fetching department details:', err);
          res.status(200).send('Internal Server Error');
          return;
      }

      // Render the 'manage_department' view template with the fetched department details
      res.render('./Admin/manage_department', { departments: rows });
  });
});
app.get("/Admin/show_applicants", async (req, res) => {
  db.query(`SELECT  
  u.user_id,  
  um.email_id AS email,
  a.user_application_id AS application_id, 
  GROUP_CONCAT(DISTINCT CONCAT(u.first_name, " ", u.last_name)) AS full_name, 
  GROUP_CONCAT(DISTINCT c.course_name) AS course_applied,     
  SUM(a.course_fees) AS course_fee, 
  GROUP_CONCAT(DISTINCT om.payment_status) AS payment_status,
  GROUP_CONCAT(DISTINCT om.payment_gateway) AS payment_gateway
FROM 
  user_profile_master u 
JOIN 
  user_application_master a ON u.user_id = a.user_id 
JOIN 
  course_master c ON a.course_id = c.course_id
JOIN 
  user_master um ON u.user_id = um.user_id 
LEFT JOIN 
  order_master om ON a.order_id = om.order_id
GROUP BY 
  u.user_id,
  um.email_id,
  a.user_application_id
`, (error, results, fields) => {
    if (error) {
      console.error('Error fetching data from MySQL:', error);
      return;
    }

    // Render the EJS template and pass the data
    res.render('./Admin/show_applicants.ejs', { applicants: results });
  });

})
app.get("/admin/login",(req,res)=>{
  res.render("./Admin/login")
})

app.get("/admin/dashboard",(req,res)=>{
  res.render("./Admin/Dashboard")
})

app.post('/admin/login/auth', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    req.flash('error', 'Username and password are required');
    return res.status(400).json({ error: 'Username and password are required' });
  }
// Query to fetch user details based on email
  const q = "SELECT * FROM user_master WHERE email_id = ? and user_type='admin'";
  db.query(q, [username], (err, data) => {
    if (err) {
      // Error handling for database query failure
      req.flash('error', 'Error fetching user details');
      return res.status(500).json({ error: 'Error fetching user details' });
    }
    if (data.length === 0) {
      // If user not found, flash an error message and render the login page with the error message
      req.flash('error', 'User not found!');
      return res.render('./Admin/login.', { error: 'User not found!' });
    }

    const isPasswordCorrect = bcrypt.compareSync(password, data[0].password);
// Check if the password is incorrect
    if (!isPasswordCorrect) {
      req.flash('error', 'Wrong password!');
      return res.render('./Admin/login.ejs', { error: 'Wrong username or password!' });
    } else {
      console.log("Login successful");
      console.log(data[0].email_id);
      req.session.loggedIn = true;
      req.flash('success', 'Login successful');
      // Render home.ejs with loggedIn and success variables
      const user_id=data[0].user_id
      req.session.user_id=user_id;
      return res.render("./Admin/home_main", { loggedIn: req.session.loggedIn, success: 'Login successful' });
    }
   
  });
});

app.get("/Admin/show_course", (req, res) => {
  db.query(`SELECT course_id,course_name,department_name
  FROM course_master,department_master
  where department_master.dept_id=course_master.dept_id and
   course_name NOT IN ('Arts', 'Commers', 'Science','12th science with maths')`, (err, rows) => {
      if (err) {
          console.error('Error fetching department details:', err);
          res.status(500).send('Internal Server Error');
          return;
      }

      // Render the 'manage_department' view template with the fetched department details
      res.render('./Admin/show_course', { departments: rows });
  });
});

app.get("/Admin/eligible_course", (req, res) => {
  db.query(`
  SELECT cm.course_name AS course_name, emc.course_name AS eligible_course_name
 FROM eligibility_master em
 JOIN course_master cm ON cm.course_id = em.course_id
 JOIN course_master emc ON emc.course_id = em.eligibile_course_id`, (err, rows) => {
      if (err) {
          console.error('Error fetching department details:', err);
          res.status(500).send('Internal Server Error');
          return;
      }

      // Render the 'manage_department' view template with the fetched department details
      res.render('./Admin/eligible_course', { departments: rows });
  });
});

// for sending mail

// Assuming you're using Express.js
app.post('/application/send_pending_emails', async (req, res) => {
  try {
      // Query pending applications from the database
      const pendingApplications = await db2.query(`
          SELECT 
              um.email_id,
              a.user_application_id AS application_id,
              GROUP_CONCAT(DISTINCT CONCAT(u.first_name, " ", u.last_name)) AS full_name,
              GROUP_CONCAT(DISTINCT c.course_name) AS course_applied,
              SUM(a.course_fees) AS course_fee,
              GROUP_CONCAT(DISTINCT om.payment_status) AS payment_status,
              GROUP_CONCAT(DISTINCT om.payment_gateway) AS payment_gateway
          FROM
              user_profile_master u
          JOIN
              user_application_master a ON u.user_id = a.user_id
          JOIN
              course_master c ON a.course_id = c.course_id
          JOIN
              user_master um ON u.user_id = um.user_id
          LEFT JOIN
              order_master om ON a.order_id = om.order_id
          WHERE
              om.payment_gateway = 'Pending'
          GROUP BY
              u.user_id,
              um.email_id,
              a.user_application_id
      `);

      // Iterate over pending applications and send emails
      for (const application of pendingApplications) {
          const emailContent = generateEmailContent(application); // You need to implement this function
          await sendEmail(application.email_id, 'Pending Application Reminder', emailContent); // You need to implement this function
      }

      res.sendStatus(200); // Send success response
  } catch (error) {
      console.error('Error sending pending emails:', error);
      res.status(500).send('Internal Server Error');
  }
});

async function sendEmailsAndRenderTemplatesForPendingApplications() {
  try {
      // Fetch all pending application IDs
      const pendingApplications = await db2.query(`
          SELECT user_application_id
          FROM user_application_master
          WHERE payment_gateway = 'Pending'
      `);

      // Iterate over each pending application ID
      for (const application of pendingApplications) {
          const applicationId = application.user_application_id;

          // Retrieve application details based on application ID
          const [rows] = await db2.query(sql, applicationId);

          if (!rows || rows.length === 0) {
              console.error('No data found for application ID:', applicationId);
              continue; // Move to the next application if no data found
          }

          // Extract payment gateway information from the retrieved data
          const paymentGateway = rows[0].payment_gateway;

          // Check if payment_gateway is already set to 'Confirm'
          if (paymentGateway === 'Confirm') {
              console.log('Payment already confirmed for application ID:', applicationId);
              continue; // Move to the next application if payment already confirmed
          }

          // Update payment_gateway status to 'Confirm' in the order_master table
          const updateSql = "UPDATE order_master SET payment_gateway = 'Confirm' WHERE order_id = ?";
          await db2.query(updateSql, rows[0].order_id);

          console.log('Payment gateway status updated successfully for application ID:', applicationId);

          // Send email and render template
          await sendEmailAndRenderTemplate(rows);
      }
  } catch (error) {
      console.error('Error:', error);
  }
}

app.get('/admission',(res,req)=>{
  req.render('home')
})
