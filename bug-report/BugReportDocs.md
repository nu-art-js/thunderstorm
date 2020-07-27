#Bug Report

The bug report library is a logging service that can be installed in any application.


###Frontend:

The bug report is its own library with a self-contained frontend and backend. The frontend is comprised of four main files: two UI files and two modules. The 
BugReport.tsx is responsible for the BugReport UI itself--the button that triggers sending logs to firestore, the
dialogue box that appears, and communicating that information to the corresponding module. The BugReport.tsx also is responsible for implementing React's error 
 boundaries, so that any UI fail in a component wrapped in the <BugReport> will be caught. 
 The BugReportModule in the frontend is responsible for communicating the logs themselves
to the backend via an API call. 

###The Logs Themselves:

The logs are also part of the frontend, located in app-frontend/core/logger. The logger directory contains the log client of the bug report, and relies on 
the logger library located in ts-common. The LogClient_BugReport file creates the logs as part of a string[], accounting for max size so the logs don't get too 
heavy. There are two logs that are created in this file--one "concise" log that only catches specific LogLevels, 
and one log that logs all LogLevels. These logs are communicated to the backend via an api call from BugReportModule in the frontend. 

###Admin View:

The admin page can be optionally implemented in any application that contains the bug report. It is a display page to view 
the logs in a table, with a link to their storage and Jira Ticket. 
The AdminBrModule in the frontend makes an api call to the backend to get a list of logs and to download them. 
The backend of the Admin page is controlled primarily by the ArdminBrModule in the backend, which retrieves the logs for display and download.

###Backend:

The backend BugReport relies on the BugReportModule to save the logs in FireStore, and the JiraModule to connect to Jira to (optionally) create a new
Jira ticket with a link to the logs. 
