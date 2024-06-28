import mysql from "mysql2";


 const db = mysql.createConnection({

    host: "localhost",
    user: "root",
    password: "pjs1717",
    database: "project"

})
db.connect(function (err) {
    if (err) {
        console.log('Error connecting to Database',err);
        return;
    }
    console.log('Connection established');
});
export default db;
