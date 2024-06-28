import mysql from 'mysql2/promise';

const db2= mysql.createPool({
    host: "localhost",
    user: "root",
    password: "pjs1717",
    database: "project"
  });

export default db2;