# Functional
## Must have
| ID | As a/an | I want to ... | So that ... |
|-|-|-|-|
|UF.1| user | use the product from a user interface | I don't have to remeber any commands and I see the result of my actions|
|UF.2| teacher | create a new course with a name an course code | I can teach my course|
|UF.3| teacher | create a new edition inside a course | I can teach my course this year and it is seperated from last year's edition|
|UF.4| user | import a CSV file from brightspace | I don't have to manually create the groups and assign students to them|
|UF.5| user | add new students to groups | extra students who signed up after the deadline are still able to get a group|
|UF.6| user | remove a student from a group | students who no longer follow the course don't have access to their old group|
|UF.7| user | delete groups | I can delete redundant groups|
|UF.8| user | add new groups | students can sign up after the deadline |
|UF.9| user | change the names of all group such that they follow a pattern | I can easily find groups in GitLab by searching for them|
|UF.10| user | override the default name of a group | exceptional groups can have their own name|
|UF.11| user | assign a set of TAs to all groups | my TAs can assist in grading and providing help to students|
|UF.12| user | assign a TA to a specific group | that TA can help the students in that group|
|UF.13| user | automatically create GitLab accounts for all students in the course that don't have a GitLab account yet | I don't have to manually create accouts for each of them |
|UF.14| user | can specify additional subgrouping | my TAs only have to look through their assigned groups|
|UF.15| user | close the current page and upon reopening it, my created courses, editions groups and repositories are still present | I don't have to lose my pro   gress when (accidentally) closing the page|
|UF.16| user | specify a URL to clone all repositories from when creating said repositories | neither I nor any students have to clone a repo to get their initial setup|
|UF.17| user | transfer all created groups with their members to GitLab, each member with their correct priviliges | students can start working on their assignment or project|
|-|-|-|-|
|UF.18| user | login before being able to use the product | only authorized users can make changes to my courses and groups |
|UF.19| user | input my own GitLab API token | I only have access to group which I already have acces to on GitLab |
|UF.20| user | be able to create empty repositories in groups | students have no unnecessary files in their repository.
|UF.21| user | be able to initialize the repositories as forks | students can make merge-request to the original repo |
|UF.22| user | be able to initialize the repositories as forks but unlink the original | the inital setup of the repos is faster then a standard clone |
|-|-|-|-|
|UF.23| user | login before being able to use the product | only authorized users can make changes to my courses and groups |
|UF.24| user | input my own GitLab API token | I only have access to group which I already have acces to on GitLab |
|UF.25| user | be able to create empty repositories in groups | students have no unnecessary files in their repository.
|UF.26| user | be able to initialize the repositories as forks | students can make merge-request to the original repo |
|UF.27| user | be able to initialize the repositories as forks but unlink the original | the inital setup of the repos is faster then a standard clone |
|UF.28| user | be able to specify that no repositories are created | students can create their own repositories when needed |
|UF.29| user | have default settings for group and repo creation that are used most often | I have to change the minimal amount of settings|
|UF.30| user | see what settings are only changeable through the GitLab frontend, and where to find them | I know which extra settings are available and where to change them|
|UF.31| user | see a pop-up box when I hover over a settings `(I)` icon with additional info of what that settings does | I can make an informed decission when I am presented with a setting I don't know|
|UF.32| teacher | asign one or more head TAs to a course edition | the Head TAs can help me with creating the GitLab setup|
|UF.33| user | see confurmation dialogs before I do any destructive actions | I don't accidentally delete groups or students|
|UF.34| user | specify the right that students and TAs have in their groups | it is possible for students or TAs to have other rights then the default|
|UF.35| user | search for a specific group | I don't have to scroll through all grups to find the group |
|UF.36| user | get a list of attributes I need to export out of brightspace | all needed data is in the export, and nothing extra |
|UF.37| user | get an error message when the import doesn't contain the necessary data | all data is present when creating the groups and accounts on gitlab |
|UF.38| user | specify multiple columns to use for the group import | I can create all groups at once|
|UF.39| user | import TAs from a file | I don't have to manually add all TAs |
|UF.40| user | get warning when account creation failed for certain students | I know which students I have to manually add |
|UF.41| TA | diable notifications by default | I don't receive emails for every update to any repo |
|UF.42| user | receive a popup when my API token is not valid anymore | I can update it with a new one |
|UF.43| user | be able to initialize the repositories from an zip file | I don't have to upload this project somewhere else |
|UF.44| user | click save and have my dataa saved on the server | I know excactly where I was in the process of editing|



# Non-Functional
## Must have
| ID | As a/an | I want to ... | So that ... |
|-|-|-|-|
|UN.1| user | be able to read all text in English | as a non Dutch speaker I can still use the product|
|UN.2| Customer | be able run your product on a Debian server with a MySQL database | I can use my default infrastructure for running your product |
|UN.3| Maintainer | the site to edit GitLab users, groups and repositories through their Rest API | I don't have to rewrite the functionalities whenever GitLab changes their frontend |
|-|-|-|
|UN.4| user | have the server perform any GitLab API calls | I don't have to keep the product page open while creating the groups on GitLab |
|UN.5| student | have my name with special characters like umlauts and accents show up in GitLab with them | I can see my name as it is given to me, and not some weird mess  |
