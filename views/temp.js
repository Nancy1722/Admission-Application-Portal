const EJSTemplate = `
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Admit Card</title>
    <style>
    .container {
        width: 80%;
        margin: auto;
    }
    
    .admit-card {
        border: 1px solid #ccc;
        padding: 20px;
        margin-bottom: 20px;
    }
    
    .fc-logo {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        width: 100px;
        padding: 20px;
    }
    
    .fc-logo img {
        width: 100px;
        margin-right: 10px;
    }
    
    h5 {
        margin: 0;
    }
    
    table {
        width: 100%;
    }
    
    td, th {
        padding: 10px;
        border: 1px solid #ccc;
        text-align: left;
    }
    
    th {
        background-color: #f2f2f2;
    }
    </style>
</head>
<body>
    <div class="container">
        <div class="admit-card">
           <center> <div class="fc-logo">
            <img src="https://th.bing.com/th/id/OIP.F-uTJAuL87ZkdGD-Y1gAyAAAAA?rs=1&pid=ImgDetMain" alt="Logo">

                <h5>Fergusson College</h5>
            </div> <center>
            <table>
                <tbody>
                    <tr>
                        <td><b>APPLICATION ID:</b> <%= userData.user_application_id %></td>
                        <td><b>Course APPLIED:</b> <%= userData.course_name %></td>
                        <td><b>Course Fees:</b> <%= userData.course_fees %></td>
                    </tr>
                    <tr>
                        <td><b>Student Name:</b> <%= userData.first_name %> <%= userData.middle_name %> <%= userData.last_name %></td>
                        <td><b>Category:</b> <%= userData.caste %></td> 
                    </tr>
                    <tr>
                        <td><b>Mother's Name:</b> <%= userData.mothers_name %></td>
                        <td><b>DOB:</b> <%= userData.dob %></td>
                    </tr>
                    <tr>
                        <td colspan="3"><b>Address:</b> <%= userData.address %></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
`;


export default EJSTemplate;
