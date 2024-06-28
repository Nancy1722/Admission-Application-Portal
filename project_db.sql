drop database project;
create database project;
use project;

/* TABLE FOR USER MASTER*/

create table user_master(
id INT AUTO_INCREMENT primary key,
user_id varchar(50) unique,
password varchar(255), 
email_id varchar(40) unique , 
contact_no varchar(12), 
user_type enum("admin","superAdmin","applicant") default "applicant",
timestamp timestamp default CURRENT_TIMESTAMP, 
status enum('active','inactive')  default "active");


DELIMITER //
CREATE TRIGGER before_insert_user_master
BEFORE INSERT ON user_master
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SET next_id = (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_master');
    SET NEW.user_id = CONCAT('USR', next_id);
END//
DELIMITER ;


/* TABLE FOR INSTITUTE MASTER*/

create table institution_master(
id int AUTO_INCREMENT PRIMARY KEY,
institution_id varchar(50) unique,
institution_name varchar(250),
address varchar(255),
location varchar(250),
timestamp timestamp default CURRENT_TIMESTAMP, 
status enum('active','inactive')  default "active");

/*INSERT INTO institution_master (institution_name, address, location)VALUES ('Fergusson College', 'Fergusson College, F.C. Road, Pune', 'Pune');*/


DELIMITER //
CREATE TRIGGER before_insert_institution_master
BEFORE INSERT ON institution_master 
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SET next_id = (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'institution_master');
    SET NEW.institution_id = CONCAT('INS', next_id);
END//
DELIMITER ;

/* TABLE FOR DEPARTMENT MASTER*/

create table department_master (id int  AUTO_INCREMENT  PRIMARY KEY,
  dept_id VARCHAR(50) unique,
department_name varchar(40),
institution_id varchar(10), foreign key(institution_id) references 
institution_master(institution_id),
timestamp timestamp default CURRENT_TIMESTAMP, 
status enum('active','inactive')  default "active");
DELIMITER //
CREATE TRIGGER before_insert_department_master
BEFORE INSERT ON department_master 
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SET next_id = (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'department_master');
    SET NEW.dept_id = CONCAT('DEPT', next_id);
END//
DELIMITER ;

/* TABLE FOR COURSE MASTER*/

create table course_master(
  id INT AUTO_INCREMENT PRIMARY KEY,
course_id varchar(10) unique,
course_name varchar(250),
dept_id varchar(10), foreign key(dept_id) references department_master(dept_id),
timestamp timestamp default CURRENT_TIMESTAMP,
status enum('active','inactive')  default "active");


DELIMITER //
CREATE TRIGGER before_insert_course_master
BEFORE INSERT ON course_master
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SET next_id = (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course_master');
    SET NEW.course_id = CONCAT('COURSE', next_id);
END//
DELIMITER ;


/* TABLE FOR Application MASTER*/

CREATE TABLE application_master (
    id INT  AUTO_INCREMENT PRIMARY KEY ,
    academic_year VARCHAR(10),
    course_id VARCHAR(10),
    start_form_date DATE,
    end_form_date DATE,
    form_id VARCHAR(10) unique, 
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (course_id) REFERENCES course_master(course_id)
);

DELIMITER //
CREATE TRIGGER before_insert_application_master
BEFORE INSERT ON application_master
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SET next_id = (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'application_master');
    SET NEW.form_id = CONCAT('FID ', next_id);
END//
DELIMITER ;
/*
insert into application_master (academic_year, course_id,start_form_date, end_form_date)values(2024-25,"C1","2024-04-01","2024-06-30");
insert into application_master (academic_year, course_id,start_form_date, end_form_date)values(2024,"C2","2024-04-01","2024-06-30");
 
*/
/* TABLE FOR userApplication MASTER*/

create table user_application_master (id INT PRIMARY KEY  AUTO_INCREMENT ,
user_application_id integer unique,
user_id varchar(10), foreign key(user_id) references user_master(user_id),
course_id varchar(10), foreign key(course_id) references course_master(course_id),
order_id varCHAR(10) unique,
form_id varchar(10), foreign key(form_id) references application_master(form_id),
course_fees double,
timestamp timestamp default CURRENT_TIMESTAMP, 
status enum('active','inactive')  default "active");

DELIMITER //
CREATE TRIGGER before_insert_user_application_master
BEFORE INSERT ON user_application_master
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SET next_id = (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_application_master');
    SET NEW.user_application_id = CONCAT('UAP', next_id);
END//
DELIMITER ;
/*
insert into user_application_master(user_application_id,user_id,course_id,order_id,form_id,course_fees) values (1,2,"C1","O101","F2",1000);
insert into user_application_master(user_application_id,user_id,course_id,order_id,form_id,course_fees) values (2,2,"C2","O102","F3",1000);

*/
/* TABLE FOR userProfile*/

create table user_profile_master(id INT AUTO_INCREMENT primary key ,
  profile_id varchar(200) unique ,
user_id varchar(10), foreign key(user_id) references user_master(user_id),
university enum('sppu','non_sppu'),
first_name varchar(20),
middle_name varchar(20),
last_name varchar(20),
mothers_name varchar(20),
caste varchar(20),
dob date,
addhar_no int,
address varchar(30),
SSC_marks int,
HSC_marks int,
Graduation_marks int,
timestamp timestamp default CURRENT_TIMESTAMP, 
status enum('active','inactive')  default "active",
Last_modified_time time);
/*
insert INTO user_profile_master (user_id,university,first_name,last_name,mothers_name,caste,dob,addhar_no,address,SSC_marks,HSC_marks,Graduation_marks) values(1,"sppu","Prajakta","Jaju","Sunita","General","1999-07-17","123456789","Pune",80,80,80);
*/
DELIMITER //
CREATE TRIGGER before_insert_user_profile_master
BEFORE INSERT ON user_profile_master
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SET next_id = (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profile_master');
    SET NEW.profile_id = CONCAT('PID', next_id);
END//
DELIMITER ;


/* TABLE FOR OTP MASTER*/
CREATE TABLE otp_master (id INT AUTO_INCREMENT primary key ,
otp_id varchar(250) unique ,
email_id varCHAR(250), foreign key(email_id) references user_master(email_id),
otp varchar(10),
timestamp timestamp default CURRENT_TIMESTAMP,
status enum('active','inactive')  default "active");

DELIMITER //
CREATE TRIGGER before_insert_otp_master
BEFORE INSERT ON otp_master
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SET next_id = (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'otp_master');
    SET NEW.otp_id = CONCAT('OTP', next_id);
END//
DELIMITER ;

/* TABLE FOR ELIGIBILITY MASTER*/

create table eligibility_master(id INT PRIMARY KEY  AUTO_INCREMENT  ,
  elig_id varchar(250) unique ,
course_id varchar(10), foreign key(course_id) references course_master(course_id),eligibile_course_id varchar(10),
foreign key(eligibile_course_id)
references course_master(course_id),minimum_percentage double default 40.0,
timestamp timestamp default CURRENT_TIMESTAMP,
status enum('active','inactive')  default "active");

DELIMITER //
CREATE TRIGGER before_insert_eligibility_master
BEFORE INSERT ON eligibility_master
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SET next_id = (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eligibility_master');
    SET NEW.elig_id = CONCAT('ELI', next_id);
END//
DELIMITER ;
/* TABLE FOR FEES MASTER*/

create table fees_master(id INT primary key AUTO_INCREMENT,
  fees_id varchar(200) unique,
course_id varchar(20), foreign key(course_id) references course_master(course_id),
fees_type enum('reserved','general') default 'general',
fees double default 1000,timestamp timestamp default CURRENT_TIMESTAMP, 
status enum('active','inactive')  default "active");

DELIMITER //
CREATE TRIGGER before_insert_fees_master
BEFORE INSERT ON fees_master
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SET next_id = (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fees_master');
    SET NEW.fees_id = CONCAT('FE', next_id);
END//
DELIMITER ;

/*insert into fees_master(fees_id,course_id,fees_type,fee) values(1,"C1","general",1000);
insert into fees_master(fees_id,course_id,fees_type,fee) values(2,"C1","reserved",500);*/


/* TABLE FOR oder MASTER*/

create table order_master(id INT primary key AUTO_INCREMENT  ,
  order_id VARCHAR(10) unique,FOREIGN KEY(order_id) REFERENCES user_application_master(order_id),
transaction_id int,
payment_gateway double,
timestamp timestamp default CURRENT_TIMESTAMP, 
status enum('active','inactive')  default "active");

   DELIMITER //
CREATE TRIGGER before_insert_order_master
BEFORE INSERT ON order_master
FOR EACH ROW
BEGIN
    DECLARE next_id INT;
    SET next_id = (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_master');
    SET NEW.order_id = CONCAT('OID', next_id);
END//
DELIMITER ;  

/* TABLE FOR log MASTER*/
CREATE TABLE log_master (
  `logid` int(11) NOT NULL,
  `tablename` varchar(100) DEFAULT NULL,
  `altered_recordid` int(11) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `operation` varchar(100) NOT NULL,
  `last_modified` varchar(100) NOT NULL,
  `flag` int(11) NOT NULL DEFAULT 1,
  `usertype` varchar(100) NOT NULL,
  `userid` varchar(100) NOT NULL
);

/* QUERIES*/

select * from department_master ORDER BY dept_id ASC;
select * from course_master ORDER BY course_id ASC;

/* COURSE AND THEIR ELIGIBILE COURSES QUERY*/

select course_id , eligibile_course_id ,course_name 
from eligibility_master,course_master where course_master.course_id = eligibility_master.course_id;
 SELECT cm.course_name AS course_name, emc.course_name AS eligible_course_name
FROM eligibility_master em
JOIN course_master cm ON cm.course_id = em.course_id
JOIN course_master emc ON emc.course_id = em.eligibile_course_id;






CREATE or replace VIEW applicant_info_view  AS select 
u.profile_id,u.user_id,
u.first_name,u.middle_name,
u.last_name,u.mothers_name,
u.caste,u.dob,u.addhar_no,
u.address,
u.SSC_marks,u.HSC_marks,
u.Graduation_marks ,
a.user_application_id,
a.course_id,a.order_id,
a.form_id,a.course_fees 
from user_profile_master u 
join user_application_master a  
ON u.user_id=a.user_application_id;



/*show course for faculty or admin dashboard*/

SELECT course_id,course_name,department_name
FROM course_master,department_master
where department_master.dept_id=course_master.dept_id and
 course_name NOT IN ('Arts', 'Commers', 'Science','12th science with maths');
