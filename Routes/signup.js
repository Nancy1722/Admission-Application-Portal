import bcrypt from "bcryptjs";
import express from "express";
import db from "../db.js";

const router = express.Router();


router.post('/auth', (req, res) => {
    
    const password =req.body.password;
    const email=req.body.email;
    const phone=req.body.pno;
    const address=req.body.address;
    const userCheck = "Select * from user_master where  email_id=?"
    db.query(userCheck, [email], (err, data) => {
      if (err) return res.status(500).json(err);
      if (data.length > 0) return res.status(404).json("User already exists!");
    });
    //Hashing Password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    
    console.log( password,email,phone,address);
    const q = "INSERT INTO user_master (password, email_id,contact_no) VALUES (?,?,?)";
    db.query(q, [hash,email,phone], (err, data) => {
      if (err) return res.status(500).json(err);
      res.redirect('/login');
    });
  
  
  
  })

  export default router