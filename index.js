const cTable = require('console.table');
const figlet = require('figlet');
const mysql = require("mysql");
const inquirer = require("inquirer");
require('dotenv').config()

//======= function for displaying the employee tracker
function showFunDisplay() {
    figlet('\n\n\n\nEmployee\n\n\n\n\n\n\n\n\n     Tracker\n\n\n', function (err, data) {
        if (err) {
            console.log('Something went wrong...');
            console.dir(err);
            return;
        }
        console.log(data);
    });
} //=== end of showFunDisplay, need to call this function before everything else
showFunDisplay(); //<< to show fun display

// ** ESTABLISH CONNECTION TO MySQL employee_mgmtDB **
const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: process.env.DB_PASS,
    database: "employee_mgmtDB"
});

connection.connect(function (err) {
    if (err) throw err;
    // console.log("Connected to database as ID:" + connection.threadId + "\n");
    whatToDoFirst();
});

const whatToDoFirst = function () {
    inquirer.prompt({
        type: "list",
        name: "firstPrompt",
        message: "What would you like to do?",
        choices: [
            "View departments, roles, employees, or everything",
            "Add department, roles, or employees",
            "Update Employee Role",
            "Remove a department, role, or employee",
            "Exit"
        ]
    }).then(function (answer) {
        //what to do next
        switch (answer.firstPrompt) {
            case "View departments, roles, employees, or everything":
                // console.log('View something!');
                whatToView();
                break;

            case "Add department, roles, or employees":
                // console.log(`Add something!`);
                whatToAdd();
                break;

            case "Update Employee Role":
                // console.log('Update Employee Role!');
                updateEmployeeRole();
                break;

            case "Remove a department, role, or employee":
                //console.log('Remove!);
                whatToRemove();
                break;

            default:
                connection.end();
        };
    })
} // === end of whatToDoFirst function

const whatToView = function () {
    inquirer.prompt({
        type: "list",
        name: "viewPrompt",
        message: "What would you like to view?",
        choices: [
            "Departments",
            "Roles",
            "Employees",
            "Employee by Department",
            "Employee by Manager",
            "Everything!"]
    }).then(function (answer) {
        switch (answer.viewPrompt) {
            case "Departments":
                // console.log(`View departments!`);
                viewDepts();
                break;

            case "Roles":
                // console.log('View Roles!');
                viewRoles();
                break;

            case "Employees":
                // console.log('View Employees!');
                viewEmployees();
                break;

            case "Employee by Department":
                //console.log('Employee by department!');
                viewEmpByDept();
                break;

            case "Employee by Manager":
                //console.log('Employee by manager!');
                viewEmpByMgr();
                break;

            case "Everything!":
                // console.log("View Everything!");
                viewAll();
                break;
        }
    })
} //=== end of whatWouldYouLikeToView function


function viewDepts() {
    console.log("Selecting all Departments...\n");
    connection.query("SELECT * FROM department", function (err, res) {
        if (err) throw err;
        console.table(res);
        whatToDoFirst();
    });
}

function viewRoles() {
    console.log("Selecting all Roles...\n");
    connection.query("SELECT * FROM role", function (err, res) {
        if (err) throw err;
        console.table(res);
        whatToDoFirst();
    });
}

function viewEmployees() {
    console.log("Selecting all Employees...\n");
    connection.query("SELECT * FROM employee", function (err, res) {
        if (err) throw err;
        console.table(res);
        whatToDoFirst();
    });
}

function viewEmpByDept() {
    connection.query("SELECT dept_name FROM department", function (err, deptData) {
        if (err) throw err;
        const deptArray = deptData.map(({ dept_name }) => dept_name);
        // console.log(deptArray);
        inquirer.prompt({
            type: "list",
            name: "viewDepts",
            message: "Which department would you like to view?",
            choices: deptArray
        }).then(function (answer) {
            console.log("Selecting all Employees by Department...\n");

            connection.query("SELECT department.dept_name AS 'Department', employee.id AS 'ID', CONCAT(employee.first_name, ' ', employee.last_name) AS 'Employee', role.title AS 'Role', role.salary AS 'Salary', CONCAT(manager.first_name, ' ', manager.last_name) AS 'Manager' FROM employee LEFT JOIN employee manager ON manager.id = employee.manager_id INNER JOIN role ON employee.role_id = role.id INNER JOIN department ON department.id = role.department_id WHERE department.dept_name = ? ", [answer.viewDepts], function (err, res) {
                if (err) throw err;
                console.table(res);
                whatToDoFirst();
            });
        });
    })
}


function viewEmpByMgr() {
    connection.query("SELECT * FROM employee", function (err, empData) {
        if (err) throw err;
        const empArray = empData.map(({ id, first_name, last_name }) =>
            ({
                name: `${first_name} ${last_name}`,
                value: id
            }));
        // console.log(empArray);
        inquirer.prompt({
            type: "list",
            name: "mgrID",
            message: "Which manager's employees would you like to see?",
            choices: empArray
        }).then(function (answer) {
            console.log("Selecting all Employees by Manager...\n");
            // console.log(answer.mgrID);
            connection.query("SELECT employee.id, CONCAT(employee.first_name, ' ', employee.last_name) AS 'Employee', role.title AS 'Role', role.salary AS 'Salary', CONCAT(manager.first_name, ' ', manager.last_name) AS Manager FROM employee LEFT JOIN employee manager ON manager.id = employee.manager_id INNER JOIN role ON employee.role_id = role.id WHERE employee.manager_id = ? ", [answer.mgrID], function (err, res) {
                if (err) throw err;
                // console.log(res)
                if (!res.length) {
                    console.log(`*** SORRY! This individual has no employees they are in charge of! ***\n\n`);
                    viewEmpByMgr();
                } else {
                    console.table(res);
                    whatToDoFirst();
                }
            })
        });
    })
}


function viewAll() {
    console.log("Selecting all info...\n");
    connection.query
        ("SELECT employee.id, CONCAT(employee.first_name, ' ', employee.last_name) AS 'Employee', department.dept_name AS 'Department', role.title AS 'Title', role.salary AS 'Salary', CONCAT(manager.first_name, ' ', manager.last_name) AS 'Manager' FROM employee LEFT JOIN employee manager ON manager.id = employee.manager_id LEFT JOIN role ON employee.role_id = role.id LEFT JOIN department ON department.id = role.department_id ORDER BY employee.id ASC;", function (err, res) {
            if (err) throw err;
            console.table(res);
            whatToDoFirst();
        });
}

function whatToAdd() {
    inquirer.prompt([{
        type: "list",
        name: "addingPrompt",
        message: "What would you like to add?",
        choices: [
            "Department",
            "Role",
            "Employee"
        ]
    }]).then(function (answer) {
        switch (answer.addingPrompt) {
            case "Department":
                // console.log(`Add department!`);
                createDept();
                break;

            case "Role":
                // console.log('Add a Role!');
                createRole();
                break;

            case "Employee":
                // console.log('Add Employee!');
                createEmployee();
                break;

        }
    })
} //=== end of whatWouldYouLikeToAdd function

function createDept() {
    inquirer.prompt({
        type: "input",
        name: "departmentName",
        message: "What department would you like to add?"
    }).then(function (answer) {
        console.log("Inserting a new department...\n");
        connection.query(
            "INSERT INTO department SET ?",
            {
                dept_name: answer.departmentName,
            },
            function (err, res) {
                if (err) throw err;

                console.log(`=============\n`);
                console.log(`\n   ${answer.departmentName} department added!\n`);
                console.log(`=============\n`);

                whatToDoFirst();
            }
        );
    });
} // === end of createDept function

function createRole() {
    connection.query("SELECT role.title, role.salary, role.department_id, department.dept_name, department.id FROM department INNER JOIN role ON role.department_id = department.id", function (err, roleData) {
        if (err) throw err;
        const resArray = roleData.map(({ dept_name }) => dept_name);
        resArray.push('New Department')
        // console.log(resArray)
        const deptChoice = [];
        resArray.forEach((dept) => {
            if (!deptChoice.includes(dept)) {
                deptChoice.push(dept)
            }
        });
        inquirer.prompt([{
            type: "list",
            name: "role_dept",
            message: "What department is this new role in?",
            choices: deptChoice
        }]).then(function (answer) {
            if (answer.role_dept === "New Department") {
                console.log(`!! ** PLEASE ENTER NEW DEPARTMENT FIRST ** !!`);
                createDept();
            } else {
                const deptName = roleData.map(({ dept_name }) => dept_name);
                const newId = deptName.indexOf(answer.role_dept);
                // console.log(newId);
                inquirer.prompt([{
                    type: "input",
                    name: "role_title",
                    message: "What is the title of the new role?"
                }, {
                    type: "input",
                    name: "role_salary",
                    message: "What is salary for this new role?"
                }]).then(function (answer) {
                    console.log("Inserting a new role...\n");
                    connection.query(
                        "INSERT INTO role SET ?",
                        {
                            title: answer.role_title,
                            salary: answer.role_salary,
                            department_id: newId
                        }, function (err, res) {
                            if (err) throw err;

                            console.log(`=============\n`);
                            console.log(`\n   ${answer.role_title} role added!\n`);
                            console.log(`=============\n`);

                            whatToDoFirst();
                        }
                    )
                })
            }
        })
    })
}//=== end function


function createEmployee() {
    connection.query("SELECT employee.id AS 'empID', CONCAT(employee.first_name, ' ', employee.last_name) AS 'Employee', department.dept_name AS 'Department', role.title AS 'Title', role.salary AS 'Salary', CONCAT(manager.first_name, ' ', manager.last_name) AS 'Manager' FROM employee employee LEFT JOIN employee manager ON manager.id = employee.manager_id LEFT JOIN role role ON employee.role_id = role.id LEFT JOIN department department ON department.id = role.department_id ORDER BY employee.id ASC;", function (err, empData) {
        if (err) throw err;
        // console.log(res); //<< returns everything as promised
        const deptArray = empData.map(({ Department }) => Department);
        // console.log(deptArray);
        const deptChoice = [];
        deptArray.forEach((dept) => {
            if (!deptChoice.includes(dept)) {
                deptChoice.push(dept)
            }
        });
        // console.log(deptChoice);
        const roleArray = empData.map(({ Title }) => Title);
        // console.log(roleArray);
        const roleChoice = [];
        roleArray.forEach((role) => {
            if (!roleChoice.includes(role)) {
                roleChoice.push(role)
            }
        });
        const fullNameArray = empData.map(({ Employee }) => Employee)
        // console.log(fullNameArray);

        inquirer.prompt([{
            type: "input",
            name: "first_name",
            message: "What is your new employees's first name?"
        }, {
            type: "input",
            name: "last_name",
            message: "What is your new employees's last name?"
        }, {
            type: "list",
            name: "dept_name",
            message: "Which department is the new employee going to be assigned to?",
            choices: deptChoice
        }, {
            type: "list",
            name: "title",
            message: "What is your new employees's role?",
            choices: roleChoice
        }, {
            type: "rawlist",
            name: "managerName",
            message: "Who is your new employee's manager?",
            choices: fullNameArray
        }]).then(function (answer) {
            console.log("Inserting your new employee...\n");

            connection.query("SELECT * FROM role", function (err, roleData) {
                const roleID = roleData.map(({ id }) => id);
                const roleTitle = roleData.map(({ title }) => title);
                for (var i = 0; i < roleTitle.length; i++)
                    if (answer.title === roleTitle[i]) {
                        const newRoleID = roleID[i];
                        // console.log(newRoleID);

                        connection.query("SELECT employee.id AS 'empID', CONCAT(employee.first_name, ' ', employee.last_name) AS 'Employee' FROM employee employee LEFT JOIN employee manager ON manager.id = employee.manager_id", function (err, empMgrData) {
                            const empID = empMgrData.map(({ empID }) => empID);
                            const mgrFullName = empMgrData.map(({ Employee }) => Employee);
                            for (var i = 0; i < roleTitle.length; i++)
                                if (answer.managerName === mgrFullName[i]) {
                                    const newMgrID = empID[i];
                                    // console.log(newMgrID);

                                    connection.query(
                                        "INSERT INTO employee SET ?",
                                        {
                                            first_name: answer.first_name,
                                            last_name: answer.last_name,
                                            role_id: newRoleID,
                                            manager_id: newMgrID,
                                        }, function (err, res) {
                                            if (err) throw err;

                                            console.log(`=============\n`);
                                            console.log(`\n   ${answer.first_name} ${answer.last_name} in \n   ${answer.dept_name} department as a(n) \n   ${answer.title} has been added!\n`);
                                            console.log(`=============\n`);

                                            whatToDoFirst();
                                        }
                                    )
                                }
                        })
                    }
            })
        });
    });
} // ==== End of createEmployee function

function updateEmployeeRole() {
    connection.query("SELECT employee.id AS 'empID', CONCAT(employee.first_name, ' ', employee.last_name) AS 'Employee', employee.role_id AS 'role_ID', role.id, role.title AS 'Title', role.salary FROM employee LEFT JOIN role ON employee.role_id = role.id", function (err, empRoleData) {
        if (err) throw err;
        const empNames = empRoleData.map(({ Employee }) => Employee);
        // console.log(empNames)
        const empRoles = empRoleData.map(({ Title }) => Title);
        // console.log(empRoles)
        const empRoleChoice = [];
        empRoles.forEach((role) => {
            if (!empRoleChoice.includes(role)) {
                empRoleChoice.push(role)
            }
        });

        inquirer.prompt([{
            type: "rawlist",
            name: "empChoice",
            message: "Which employee would you like to update?",
            choices: empNames
        }, {
            type: "list",
            name: "roleUpdate",
            message: "What role would you like to update it to?",
            choices: empRoleChoice
        }]).then(function (answer) {
            const roleID = empRoleData.map(({ role_ID }) => role_ID);
            for (var i = 0; i < empRoleChoice.length; i++)
                if (answer.roleUpdate === empRoleChoice[i]) {
                    const newRoleID = roleID[i];
                    // console.log(newRoleID)
                    const empID = empRoleData.map(({ empID }) => empID);
                    for (var i = 0; i < empNames.length; i++)
                        if (answer.empChoice === empNames[i]) {
                            const newEmpID = empID[i];
                            // console.log(newEmpID)

                            connection.query("UPDATE employee SET ? WHERE ?",
                                [
                                    {
                                        role_ID: newRoleID
                                    },
                                    {
                                        id: newEmpID
                                    }
                                ],
                                function (err, res) {
                                    if (err) throw err;

                                    console.log(`=============\n`);
                                    console.log(`\n   ${answer.empChoice}'s role has been changed to ${answer.roleUpdate}\n`);
                                    console.log(`=============\n`);

                                    whatToDoFirst();
                                }
                            );
                        }
                }
        })
    })
}//===== End of Update Employee Role..

function whatToRemove() {
    inquirer.prompt([{
        type: "list",
        name: "delete",
        message: "What would you like to remove?",
        choices: [
            "Department",
            "Role",
            "Employee"
        ]
    }]).then(function (answer) {
        switch (answer.delete) {
            case "Department":
                removeDept();
                break;

            case "Role":
                removeRole();
                break;

            case "Employee":
                removeEmployee();
                break;

        }
    })
}

function removeDept() {
    connection.query("SELECT id, dept_name FROM department", function (err, deptData) {
        if (err) throw err;

        const newDeptArr = [];
        deptData.map(({ id, dept_name }) => {
            newDeptArr.push({
                name: dept_name,
                value: id
            });
        });
        // console.log(newDeptArr)

        inquirer.prompt({
            type: "list",
            name: "deptNames",
            message: "Which department would you like to remove?",
            choices: newDeptArr
        }).then(function (answer) {
            connection.query("DELETE FROM department WHERE id = ?", [answer.deptNames], function (err, res) {
                if (err) throw err;

                let newPosted = "";
                for (var i = 0; i < newDeptArr.length; i++) {
                    if (answer.deptNames === newDeptArr[i].value) {
                        newPosted = newDeptArr[i].name
                    }
                }
                // console.log(newPosted);

                console.log(`=============\n`);
                console.log(`\n   ${newPosted} has been deleted from the database!\n`)
                console.log(`=============\n`);

                whatToDoFirst();
            })
        })
    });
}

function removeRole() {
    connection.query("SELECT id, title FROM role", function (err, roleData) {
        if (err) throw err;
        const newRoleArr = [];
        roleData.map(({ id, title }) => {
            newRoleArr.push({
                name: title,
                value: id
            });
        });

        inquirer.prompt({
            type: "rawlist",
            name: "roleNames",
            message: "Which role would you like to remove?",
            choices: newRoleArr
        }).then(function (answer) {
            connection.query("DELETE FROM role WHERE id = ?", [answer.roleNames], function (err, res) {
                if (err) throw err;

                let removedRole = "";
                for (var i = 0; i < newRoleArr.length; i++) {
                    if (answer.roleNames === newRoleArr[i].value) {
                        removedRole = newRoleArr[i].name
                    }
                }
                console.log(`=============\n`);
                console.log(`\n   ${removedRole} has been deleted from the database!\n`)
                console.log(`=============\n`);

                whatToDoFirst();
            })
        })

    });
}

function removeEmployee() {
    connection.query("SELECT id, first_name, last_name FROM employee", function (err, empData) {
        if (err) throw err;
        const newEmpNames = [];
        empData.map(({ id, first_name, last_name }) => {
            newEmpNames.push({
                name: `${first_name} ${last_name}`,
                value: id
            })
        })
        // console.log(newEmpNames);
        inquirer.prompt({
            type: "rawlist",
            name: "empNames",
            message: "Which employee would you like to remove?",
            choices: newEmpNames
        }).then(function (answer) {
            connection.query("DELETE FROM employee WHERE id = ?", [answer.empNames], function (err, res) {
                if (err) throw err;

                let removedEmp = "";
                for (var i = 0; i < newEmpNames.length; i++) {
                    if (answer.empNames === newEmpNames[i].value) {
                        removedEmp = newEmpNames[i].name
                    }
                }

                console.log(`=============\n`);
                console.log(`\n   ${removedEmp} has been deleted from the database!\n`)
                console.log(`=============\n`);

                whatToDoFirst();
            })
        })
    });
}

