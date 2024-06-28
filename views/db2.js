import mysql from 'mysql2/promise';

const db2= mysql.createPool({
    host: "localhost",
    user: "root",
    password: "pass",
    database: "project"
  });

export default db2;