import mysql.connector
import xlsxwriter

# Connection details
mysql_config = {
    'host':  "localhost",
    'user':  "root",
    'password':  "pass",
    'database': "project"
}

# Connect to MySQL
try:
    mydb = mysql.connector.connect(**mysql_config)
except mysql.connector.Error as err:
    print("Error connecting to MySQL:", err)
    exit()

# Get a cursor object
mycursor = mydb.cursor()

# Choose the table to export
table_name = input("Enter the table name to export: ")

# Fetch table data
sql = "SELECT * FROM {}".format(table_name)
mycursor.execute(sql)
result = mycursor.fetchall()

# Create an Excel workbook
workbook = xlsxwriter.Workbook('{}.xlsx'.format(table_name))
worksheet = workbook.add_worksheet()

# Write headers
headers = [desc[0] for desc in mycursor.description]
worksheet.write_row(0, 0, headers)

# Write data rows
row_num = 1
for row in result:
    worksheet.write_row(row_num, 0, row)
    row_num += 1

# Close the workbook
workbook.close()

# Close database connection
mydb.close()

print("Table exported to Excel successfully!")
