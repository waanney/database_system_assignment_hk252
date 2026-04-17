Assignment 2
[x] Requirement: There are 2 options for using DBMS: MS SQL Server or MySQL. (Using MySQL)
[x] 1. Create tables and sample data (3 points):
[x] 1.1. (2 points) Write SQL statements to implement ALL designed tables, including primary key constraints, foreign key constraints, data constraints, and semantic constraints specified in Assignment 1 (use CHECK constraints or TRIGGERs where appropriate).
[x] Note: Constraints that can be enforced directly within table creation statements should not be implemented using triggers.
[x] 1.2. (1 point) Create meaningful sample data for all tables, with at least 5 rows per table (data can be inserted via an interface or by writing SQL statements).
[x] 2. Write triggers, procedures, and functions (4 points):
[x] 2.1. (1 point) Write stored procedures to insert, update, and delete data for ONE table. Requirements:
[x] - Must perform data validation to ensure all table constraints are satisfied. Provide meaningful error messages that clearly indicate the specific issue (avoid generic messages like "Data input error!").
[x] Example: validate that employee age is over 18, phone number and email formats are correct, employee salary is lower than the director's salary, etc.
[x] - For the DELETE procedure, clearly define when deletion is allowed and when it is not. Explain the purpose of deletion and why it is necessary.
[x] 2.2. (1 point) Write TRIGGERS:
[x] 2.2.1 Specify one business constraint of the application that requires a trigger for validation:
[x] - Identify which DML operations (INSERT, UPDATE, DELETE) may lead to violations of this constraint.
[x] - Write the trigger(s) to enforce the constraint.
[x] - Note: Constraints that can be enforced directly in table creation statements should not be implemented using triggers.
[x] 2.2.2 Choose one derived attribute and write trigger(s) to compute its value:
[x] - Identify which DML operations affect the value of this derived attribute.
[x] - Write the trigger(s) to calculate/update this attribute.
[x] - Note: If the trigger that computes attribute A depends on another derived attribute B, then B must be computed first.
[x] Example: A trigger that automatically updates a store's total revenue based on the total value of its orders must first compute the total value of each order. Do not assume that the order total is already available.
[x] GENERAL REQUIREMENT: Prepare SQL statements and sample data to demonstrate and test the triggers
[x] 2.3. (1 point) Write 2 stored procedures that only contain query statements for data retrieval. The input parameters should correspond to values used in the WHERE and/or HAVING clauses (if applicable), including:
[x] - One query involving two or more tables with WHERE and ORDER BY clauses.
[x] - One query that includes aggregate functions, GROUP BY, HAVING, WHERE, and ORDER BY, and involves joins from two or more tables.
[x] - At least one procedure must involve retrieving data from the table used in section 2.1.
[x] - Prepare SQL statements and sample data to demonstrate calling these procedures during the presentation.
[x] 2.4. (1 point) Write 2 functions that satisfy the following requirements:
[x] - Include IF statements and/or LOOPs to perform computations on stored data.
[x] - Use a cursor.
[x] - Contain query statements to retrieve data, and use the query results for validation and computation.
[x] - Have input parameters and perform input validation.
[x] - Prepare SQL statements and sample data to demonstrate function calls during the presentation.
---
[ ] 3. Application Implementation (3 points):
[ ] Develop an application (web, mobile, or desktop) to demonstrate connecting the application to the database. Specifically:
[ ] 3.1. (1 point) Implement one interface/screen that supports insert, update, and delete operations on the table mentioned in section 2.1.
[ ] 3.2. (1 point) Create one interface that displays a list of data retrieved by calling the procedure in section 2.3, and is related to the table in section 2.1. The interface should allow updating and deleting data directly from the list, and also include:
[ ] - Features such as searching, sorting, input validation, and logical error handling when updating or deleting data
[ ] - Clear and specific error messages
[ ] - Appropriate use of UI controls and a user-friendly design
[ ] Example: An interface displaying a list of products with search, filter, and sorting features; the ability to create a new product (reusing the interface in part 3.1); and options to select a row to delete or update product information.
[ ] 3.3. (1 point) Create one interface demonstrating at least one additional procedure (from 2.3) or a function (from 2.4)(you may reuse the interface in section 3.2 if it involves the same table).
[ ] General Note:
[ ] - All group members MUST write at least one item in section 2 (trigger, function, or procedure). Anyone who does not contribute will receive no score for Assignment 2.
[ ] Regarding SQL statements (Section 2):
[ ] - Scores for each part (triggers, functions, procedures) will be evaluated based on complexity, completeness, and relevance to the application's business logic.
[ ] Regarding the application (Section 3):
[ ] - The function that displays data lists (via stored procedures) must accept input parameters corresponding to WHERE or HAVING clauses, entered by users through textboxes, combo boxes, calendar pickers, etc. (similar to common search features in applications or websites).
[ ] - All insert, update, and delete operations must be performed by calling the procedures defined in section 2.1.
[ ] - The application MUST actually connect to the database created in section 1. Otherwise, no points will be awarded for the application part.
[ ] Penalties:
[ ] - Functions, procedures, or triggers with very similar logic (e.g., one procedure lists employees by name, another lists employees by ID, etc.).
[ ] - Insufficient or meaningless sample data prepared for the presentation.
